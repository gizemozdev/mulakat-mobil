import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { istekAt } from '@/api/istekAt';
import { teknikTamamlandi, yuzdeHesapla } from '@/api/teknikPuan';
import { alanAdi, durumlar, type Aday, type Alan, type Durum, type Mulakat, type Mulakatci } from '@/api/tipler';
import { Dugme } from '@/bilesenler/Dugme';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Kart } from '@/bilesenler/Kart';
import { BasHarf, DurumEtiketi } from '@/bilesenler/Kucukler';
import { Secim } from '@/bilesenler/Secim';
import { TarihSaatAlani } from '@/bilesenler/TarihSaatAlani';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';

// Bir mülakatın planlama bilgileri (sunucuya gönderilen kısım)
type Plan = { mulakatciId: number | null; tarih: string; saat: string; durum: Durum };

type KayitDurumu = '' | 'kaydediliyor' | 'kaydedildi' | 'hata';

const bosPlan: Plan = { mulakatciId: null, tarih: '', saat: '', durum: 'Planlanmadı' };

const turler: Alan[] = ['ik', 'teknik'];

const plandanAl = (mulakat: Mulakat | undefined): Plan =>
  mulakat
    ? { mulakatciId: mulakat.mulakatciId, tarih: mulakat.tarih, saat: mulakat.saat, durum: mulakat.durum }
    : bosPlan;

// Adayın İK ve teknik mülakatlarının planlanması. Web'deki gibi her değişiklik hemen kaydedilir,
// ayrıca bir "Kaydet" düğmesi yoktur. Hem Adaylar hem Mülakatlar sekmesinden açılır.
export function AdayMulakatlari() {
  const { adayId } = useLocalSearchParams<{ adayId: string }>();

  const [aday, setAday] = useState<Aday | null>(null);
  const [mulakatcilar, setMulakatcilar] = useState<Mulakatci[]>([]);
  const [planlar, setPlanlar] = useState<Record<Alan, Plan>>({ ik: bosPlan, teknik: bosPlan });
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');
  const [yuklendi, setYuklendi] = useState(false);
  // Teknik mülakat düğmesinin yazısı için: sorular ve değerlendirmeleri
  const [teknikKaydi, setTeknikKaydi] = useState<Mulakat | undefined>(undefined);
  const [ikKaydi, setIkKaydi] = useState<Mulakat | undefined>(undefined);

  const [kayit, setKayit] = useState<Record<Alan, KayitDurumu>>({ ik: '', teknik: '' });
  const [kayitHatasi, setKayitHatasi] = useState<Record<Alan, string>>({ ik: '', teknik: '' });

  // Sunucuda en son başarıyla kaydedilmiş hal: kayıt başarısız olursa ekran buna geri döner
  const kaydedilen = useRef<Record<Alan, Plan>>({ ik: bosPlan, teknik: bosPlan });
  // Hızlı art arda değişikliklerde (saat çarkını çevirmek gibi) cevaplar sırasız gelebilir;
  // yalnızca en son gönderilen isteğin cevabı dikkate alınır
  const istekNo = useRef<Record<Alan, number>>({ ik: 0, teknik: 0 });

  // Ekran her öne geldiğinde güncel kayıtlar alınır (ör. ileride teknik mülakat bitince durum değişir)
  useFocusEffect(
    useCallback(() => {
      let gecerli = true;

      Promise.all([
        istekAt<Aday[]>('/api/adaylar'),
        istekAt<Mulakat[]>('/api/mulakatlar'),
        istekAt<Mulakatci[]>('/api/mulakatcilar'),
      ]).then(([adaySonucu, mulakatSonucu, mulakatciSonucu]) => {
        if (!gecerli) return;

        if (!adaySonucu.veri || !mulakatSonucu.veri || !mulakatciSonucu.veri) {
          setYuklemeHatasi(adaySonucu.hata || mulakatSonucu.hata || mulakatciSonucu.hata);
          return;
        }

        const kayitlar = mulakatSonucu.veri.filter((mulakat) => String(mulakat.adayId) === adayId);
        const yeniPlanlar = {
          ik: plandanAl(kayitlar.find((mulakat) => mulakat.tur === 'ik')),
          teknik: plandanAl(kayitlar.find((mulakat) => mulakat.tur === 'teknik')),
        };

        kaydedilen.current = yeniPlanlar;
        setTeknikKaydi(kayitlar.find((mulakat) => mulakat.tur === 'teknik'));
        setIkKaydi(kayitlar.find((mulakat) => mulakat.tur === 'ik'));
        setYuklemeHatasi('');
        setAday(adaySonucu.veri.find((kayit) => String(kayit.id) === adayId) ?? null);
        setMulakatcilar(mulakatciSonucu.veri);
        setPlanlar(yeniPlanlar);
        setYuklendi(true);
      });

      return () => {
        gecerli = false;
      };
    }, [adayId])
  );

  const degistir = async (tur: Alan, degisiklik: Partial<Plan>) => {
    const yeni = { ...planlar[tur], ...degisiklik };
    const no = ++istekNo.current[tur];

    // Ekran beklemeden güncellenir (iyimser güncelleme), sonra sunucuya gönderilir
    setPlanlar((onceki) => ({ ...onceki, [tur]: yeni }));
    setKayit((onceki) => ({ ...onceki, [tur]: 'kaydediliyor' }));
    setKayitHatasi((onceki) => ({ ...onceki, [tur]: '' }));

    const { hata } = await istekAt<Mulakat>('/api/mulakatlar', 'PUT', { adayId: Number(adayId), tur, ...yeni });

    if (no !== istekNo.current[tur]) return;

    if (hata) {
      setPlanlar((onceki) => ({ ...onceki, [tur]: kaydedilen.current[tur] }));
      setKayit((onceki) => ({ ...onceki, [tur]: 'hata' }));
      setKayitHatasi((onceki) => ({ ...onceki, [tur]: hata }));
      return;
    }

    kaydedilen.current = { ...kaydedilen.current, [tur]: yeni };
    setKayit((onceki) => ({ ...onceki, [tur]: 'kaydedildi' }));
  };

  if (!yuklendi) {
    return <Ekran>{yuklemeHatasi ? <HataDurumu mesaj={yuklemeHatasi} /> : <Yukleniyor />}</Ekran>;
  }

  if (!aday) {
    return (
      <Ekran>
        <BosDurum baslik="Aday bulunamadı" aciklama="Bu aday silinmiş olabilir." />
      </Ekran>
    );
  }

  return (
    <Ekran>
      <View style={stiller.ust}>
        <BasHarf adSoyad={aday.adSoyad} />
        <View style={stiller.ustBilgi}>
          <Yazi tur="altBaslik">{aday.adSoyad}</Yazi>
          <Yazi tur="kucuk" renk="yaziIkincil">
            {aday.pozisyon.ad}
          </Yazi>
        </View>
      </View>

      {turler.map((tur) => {
        const plan = planlar[tur];
        const uygunlar = mulakatcilar.filter((mulakatci) => mulakatci.alan === tur);

        return (
          <Kart key={tur} style={stiller.kart}>
            <View style={stiller.kartUst}>
              <Yazi tur="altBaslik" style={stiller.kartBaslik}>
                {alanAdi[tur]} Mülakatı
              </Yazi>
              <DurumEtiketi durum={plan.durum} />
            </View>

            {uygunlar.length === 0 ? (
              <View style={stiller.alan}>
                <Yazi tur="kucuk" renk="yaziIkincil">
                  Mülakatçı
                </Yazi>
                <Yazi renk="yaziSoluk">
                  {alanAdi[tur]} alanında mülakatçı yok. Daha Fazla &gt; Mülakatçılar bölümünden ekleyebilirsin.
                </Yazi>
              </View>
            ) : (
              <Secim
                etiket="Mülakatçı"
                kaydirilabilir
                secenekler={[
                  { deger: null as number | null, etiket: 'Seçilmedi' },
                  ...uygunlar.map((mulakatci) => ({ deger: mulakatci.id as number | null, etiket: mulakatci.adSoyad })),
                ]}
                secili={plan.mulakatciId}
                onSec={(mulakatciId) => degistir(tur, { mulakatciId })}
              />
            )}

            <TarihSaatAlani tur="tarih" etiket="Tarih" deger={plan.tarih} onDegistir={(tarih) => degistir(tur, { tarih })} />
            <TarihSaatAlani tur="saat" etiket="Saat (isteğe bağlı)" deger={plan.saat} onDegistir={(saat) => degistir(tur, { saat })} />

            <Secim
              etiket="Durum"
              secenekler={durumlar.map((durum) => ({ deger: durum as Durum, etiket: durum }))}
              secili={plan.durum}
              onSec={(durum) => degistir(tur, { durum })}
            />

            {tur === 'teknik' ? (
              <TeknikDugmesi adayId={aday.id} kayit={teknikKaydi} />
            ) : (
              <IkDugmesi adayId={aday.id} kayit={ikKaydi} />
            )}

            {/* Kaydın sonucu: başarısızsa ekran son kaydedilen hale döner ve sebep yazılır */}
            <Yazi
              tur="kucuk"
              renk={kayit[tur] === 'hata' ? 'hata' : 'yaziSoluk'}
              accessibilityLiveRegion="polite"
            >
              {kayit[tur] === 'kaydediliyor'
                ? 'Kaydediliyor...'
                : kayit[tur] === 'kaydedildi'
                  ? 'Kaydedildi'
                  : kayit[tur] === 'hata'
                    ? `Kaydedilemedi: ${kayitHatasi[tur]}`
                    : 'Değişiklikler otomatik kaydedilir.'}
            </Yazi>
          </Kart>
        );
      })}
    </Ekran>
  );
}

// Mülakatın durumuna göre: başlat / kaldığı yerden devam / sonucu gör
function TeknikDugmesi({ adayId, kayit }: { adayId: number; kayit: Mulakat | undefined }) {
  const cevaplar = kayit?.teknikCevaplar ?? [];
  const degerlendirilen = cevaplar.filter((cevap) => cevap.degerlendirme).length;

  const yazi =
    cevaplar.length === 0
      ? 'Teknik mülakatı başlat'
      : teknikTamamlandi(kayit?.durum, cevaplar)
        ? `Sonucu gör (%${yuzdeHesapla(cevaplar)})`
        : `Mülakata devam et (${degerlendirilen} / ${cevaplar.length})`;

  return (
    <Dugme
      yazi={yazi}
      tur={cevaplar.length === 0 ? 'birincil' : 'ikincil'}
      onPress={() => router.push({ pathname: '/teknik/[adayId]', params: { adayId } })}
    />
  );
}

// İK'da puan yok: başlamadıysa başlat, cevap varsa devam ya da (tamamlandıysa) sonuç
function IkDugmesi({ adayId, kayit }: { adayId: number; kayit: Mulakat | undefined }) {
  const cevapSayisi = kayit?._count.ikCevaplar ?? 0;
  // Web'deki kuralın aynısı: cevap varsa ya da sıradaki soru belirlenmişse başlamıştır
  // ("Yalnızca genel sorular" ile başlatılıp henüz cevap verilmemiş mülakatta akış boştur)
  const basladi = cevapSayisi > 0 || (kayit?.ikGuncelSoruId ?? null) !== null;

  const yazi = !basladi
    ? 'İK mülakatını başlat'
    : kayit?.durum === 'Tamamlandı' && cevapSayisi > 0
      ? `Sonucu gör (${cevapSayisi} cevap)`
      : `Mülakata devam et (${cevapSayisi} cevap)`;

  return (
    <Dugme
      yazi={yazi}
      tur={basladi ? 'ikincil' : 'birincil'}
      onPress={() => router.push({ pathname: '/ik/[adayId]', params: { adayId } })}
    />
  );
}

const stiller = StyleSheet.create({
  ust: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m, marginBottom: bosluk.xs },
  ustBilgi: { flex: 1, gap: 2 },
  kart: { gap: bosluk.l, padding: bosluk.l + 4 },
  kartUst: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  kartBaslik: { flex: 1 },
  alan: { gap: bosluk.xs },
});
