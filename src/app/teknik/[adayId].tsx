import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { istekAt } from '@/api/istekAt';
import {
  degerlendirmeAdi,
  degerlendirmeRenkleri,
  izlenim,
  izlenimRengi,
  konularaGoreGrupla,
  yuzdeHesapla,
} from '@/api/teknikPuan';
import type { Aday, Degerlendirme, Konu, TeknikCevap, TeknikOturum } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Kart } from '@/bilesenler/Kart';
import { Etiket } from '@/bilesenler/Kucukler';
import { Yazi } from '@/bilesenler/Yazi';
import { DOKUNMA_YUKSEKLIGI, bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

const secenekler: Degerlendirme[] = ['yeterli', 'orta', 'yetersiz'];

// Teknik mülakat oturumu. Hangi görünümün açılacağı ayrıca tutulmaz, verilerden çıkarılır (web'deki gibi):
// hiç soru yoksa kurulum, sorular varsa ve mülakat bitmediyse sorular, bittiyse sonuç.
export default function TeknikMulakat() {
  const { adayId } = useLocalSearchParams<{ adayId: string }>();

  const [aday, setAday] = useState<Aday | null>(null);
  const [oturum, setOturum] = useState<TeknikOturum | null>(null);
  const [konular, setKonular] = useState<Konu[]>([]);
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');

  useEffect(() => {
    Promise.all([
      istekAt<TeknikOturum>(`/api/teknik-mulakat/${adayId}`),
      istekAt<Konu[]>('/api/konular'),
      istekAt<Aday[]>('/api/adaylar'),
    ]).then(([oturumSonucu, konuSonucu, adaySonucu]) => {
      if (!oturumSonucu.veri || !konuSonucu.veri) {
        setYuklemeHatasi(oturumSonucu.hata || konuSonucu.hata);
        return;
      }

      setAday(adaySonucu.veri?.find((kayit) => String(kayit.id) === adayId) ?? null);
      setKonular(konuSonucu.veri);
      setOturum(oturumSonucu.veri);
    });
  }, [adayId]);

  const ustBilgi = (
    <Stack.Screen
      options={{
        title: aday ? aday.adSoyad : 'Teknik Mülakat',
        headerLeft: () => <BaslikDugmesi yazi="Kapat" onPress={() => router.back()} />,
      }}
    />
  );

  if (!oturum) {
    return (
      <Ekran>
        {ustBilgi}
        {yuklemeHatasi ? <HataDurumu mesaj={yuklemeHatasi} /> : <Yukleniyor />}
      </Ekran>
    );
  }

  return (
    <Ekran>
      {ustBilgi}

      {oturum.cevaplar.length === 0 ? (
        <Kurulum adayId={adayId} konular={konular} onBasladi={setOturum} />
      ) : oturum.durum !== 'Tamamlandı' ? (
        <Sorular adayId={adayId} oturum={oturum} setOturum={setOturum} />
      ) : (
        <Sonuc adayId={adayId} cevaplar={oturum.cevaplar} onSifirlandi={setOturum} />
      )}
    </Ekran>
  );
}

// ---------- Kurulum: konular ve her konudan kaç soru ----------

function Kurulum({
  adayId,
  konular,
  onBasladi,
}: {
  adayId: string;
  konular: Konu[];
  onBasladi: (oturum: TeknikOturum) => void;
}) {
  const { renk } = useTema();
  // konuId -> soru sayısı
  const [adetler, setAdetler] = useState<Record<number, number>>({});
  const [hata, setHata] = useState('');
  const [basliyor, setBasliyor] = useState(false);

  const toplam = Object.values(adetler).reduce((a, b) => a + b, 0);

  const adetDegistir = (konu: Konu, fark: number) =>
    setAdetler((onceki) => ({
      ...onceki,
      [konu.id]: Math.min(konu.sorular.length, Math.max(0, (onceki[konu.id] ?? 0) + fark)),
    }));

  const baslat = async () => {
    setHata('');
    setBasliyor(true);

    const secimler = Object.entries(adetler)
      .filter(([, adet]) => adet > 0)
      .map(([konuId, adet]) => ({ konuId: Number(konuId), adet }));

    // Sorular sunucuda seçilip karıştırılır ve kaydedilir; sayfa yenilense de sıra değişmez
    const { veri, hata: istekHatasi } = await istekAt<TeknikOturum>(`/api/teknik-mulakat/${adayId}`, 'POST', {
      secimler,
    });

    setBasliyor(false);

    if (veri) onBasladi(veri);
    else setHata(istekHatasi);
  };

  if (konular.length === 0) {
    return (
      <BosDurum
        baslik="Soru havuzu boş"
        aciklama="Teknik mülakat için önce soru havuzuna konu ve soru eklenmeli. Bunu şimdilik web uygulamasından yapabilirsin."
      />
    );
  }

  return (
    <>
      <View style={stiller.giris}>
        <Yazi tur="baslik">Mülakatı hazırla</Yazi>
        <Yazi renk="yaziIkincil">
          Sorulacak konuları ve her konudan kaç soru sorulacağını seç. Sorular her konunun havuzundan rastgele seçilip
          karıştırılır.
        </Yazi>
      </View>

      <Kart style={stiller.liste}>
        {konular.map((konu, sira) => {
          const adet = adetler[konu.id] ?? 0;
          const soruYok = konu.sorular.length === 0;

          return (
            <View
              key={konu.id}
              style={[stiller.konu, sira > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: renk.kenar }]}
            >
              <View style={stiller.esnek}>
                <Yazi tur="govdeKalin" renk={soruYok ? 'yaziSoluk' : 'yazi'}>
                  {konu.ad}
                </Yazi>
                <Yazi tur="kucuk" renk="yaziIkincil">
                  {soruYok ? 'Bu konuda soru yok' : `Havuzda ${konu.sorular.length} soru`}
                </Yazi>
              </View>

              {!soruYok && (
                <View style={stiller.sayac} accessibilityLabel={`${konu.ad}: ${adet} soru`}>
                  <SayacDugmesi yazi="−" etiket={`${konu.ad} bir azalt`} pasif={adet === 0} onPress={() => adetDegistir(konu, -1)} />
                  <Yazi tur="govdeKalin" style={stiller.adet}>
                    {adet}
                  </Yazi>
                  <SayacDugmesi
                    yazi="+"
                    etiket={`${konu.ad} bir artır`}
                    pasif={adet === konu.sorular.length}
                    onPress={() => adetDegistir(konu, 1)}
                  />
                </View>
              )}
            </View>
          );
        })}
      </Kart>

      {hata ? (
        <Yazi tur="kucuk" renk="hata" accessibilityLiveRegion="polite">
          {hata}
        </Yazi>
      ) : null}

      <Dugme
        yazi={toplam === 0 ? 'Soru seçilmedi' : `Mülakatı başlat (${toplam} soru)`}
        onPress={baslat}
        disabled={toplam === 0}
        yukleniyor={basliyor}
      />
    </>
  );
}

function SayacDugmesi({ yazi, etiket, pasif, onPress }: { yazi: string; etiket: string; pasif: boolean; onPress: () => void }) {
  const { renk } = useTema();

  return (
    <Pressable
      onPress={onPress}
      disabled={pasif}
      accessibilityRole="button"
      accessibilityLabel={etiket}
      hitSlop={6}
      style={({ pressed }) => [
        stiller.sayacDugmesi,
        { backgroundColor: renk.yuzeyIkincil, opacity: pasif ? 0.35 : pressed ? 0.6 : 1 },
      ]}
    >
      <Yazi tur="altBaslik" renk="marka">
        {yazi}
      </Yazi>
    </Pressable>
  );
}

// ---------- Sorular: tek tek, her biri için Yeterli / Orta / Yetersiz ----------

function Sorular({
  adayId,
  oturum,
  setOturum,
}: {
  adayId: string;
  oturum: TeknikOturum;
  setOturum: (oturum: TeknikOturum | ((onceki: TeknikOturum | null) => TeknikOturum | null)) => void;
}) {
  const { renk } = useTema();
  const cevaplar = oturum.cevaplar;

  // Açılışta ilk değerlendirilmemiş soru (yarıda kalmış mülakata dönülünce kaldığı yerden)
  const [aktif, setAktif] = useState(() => Math.max(0, cevaplar.findIndex((cevap) => !cevap.degerlendirme)));
  const [bitiyor, setBitiyor] = useState(false);

  // Aynı soruya hızlı art arda basılırsa yalnızca son isteğin cevabı dikkate alınır
  const istekNo = useRef(new Map<number, number>());

  const cevap = cevaplar[aktif];
  const degerlendirilen = cevaplar.filter((kayit) => kayit.degerlendirme).length;
  const kalan = cevaplar.length - degerlendirilen;

  const cevabiYerineKoy = (id: number, degerlendirme: Degerlendirme | null) =>
    setOturum((onceki) =>
      onceki
        ? { ...onceki, cevaplar: onceki.cevaplar.map((kayit) => (kayit.id === id ? { ...kayit, degerlendirme } : kayit)) }
        : onceki
    );

  const degerlendir = async (secilen: TeknikCevap, degerlendirme: Degerlendirme) => {
    const onceki = secilen.degerlendirme;
    const no = (istekNo.current.get(secilen.id) ?? 0) + 1;
    istekNo.current.set(secilen.id, no);

    // Ekran beklemeden güncellenir; ilk kez değerlendirilen sorudan sonra bir sonrakine geçilir
    cevabiYerineKoy(secilen.id, degerlendirme);
    if (!onceki && aktif < cevaplar.length - 1) setAktif(aktif + 1);

    const { hata } = await istekAt(`/api/teknik-cevaplar/${secilen.id}`, 'PUT', { degerlendirme });

    if (hata && istekNo.current.get(secilen.id) === no) {
      cevabiYerineKoy(secilen.id, onceki);
      Alert.alert('Değerlendirme kaydedilemedi', hata);
    }
  };

  const bitir = () =>
    Alert.alert('Mülakat bitirilsin mi?', 'Mülakatın durumu Tamamlandı olur ve sonuç oluşur.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Bitir',
        onPress: async () => {
          setBitiyor(true);
          const { hata } = await istekAt(`/api/teknik-mulakat/${adayId}/bitir`, 'POST');
          setBitiyor(false);

          if (hata) Alert.alert('Mülakat bitirilemedi', hata);
          else setOturum({ ...oturum, durum: 'Tamamlandı' });
        },
      },
    ]);

  return (
    <>
      <View style={stiller.ilerleme}>
        <Yazi tur="kucuk" renk="yaziIkincil">
          Soru {aktif + 1} / {cevaplar.length}
        </Yazi>
        <Yazi tur="kucuk" renk="yaziIkincil">
          {degerlendirilen} değerlendirildi
        </Yazi>
      </View>

      {/* Her soru için bir nokta: değerlendirilen dolu, şu anki çerçeveli; dokununca o soruya gider */}
      <View style={stiller.noktalar}>
        {cevaplar.map((kayit, sira) => (
          <Pressable
            key={kayit.id}
            onPress={() => setAktif(sira)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Soru ${sira + 1}${kayit.degerlendirme ? `, ${degerlendirmeAdi[kayit.degerlendirme]}` : ''}`}
            style={[
              stiller.nokta,
              {
                backgroundColor: kayit.degerlendirme ? degerlendirmeRenkleri(kayit.degerlendirme, renk).on : renk.kenar,
                borderColor: sira === aktif ? renk.yazi : 'transparent',
              },
            ]}
          />
        ))}
      </View>

      <Kart style={stiller.soruKarti}>
        <Etiket yazi={cevap.konuAdi} on={renk.teknik} zemin={renk.teknikAcik} />
        <Yazi tur="altBaslik" style={stiller.soruMetni}>
          {cevap.soruMetni}
        </Yazi>
      </Kart>

      <View style={stiller.secenekler}>
        {secenekler.map((secenek) => {
          const secili = cevap.degerlendirme === secenek;
          const { on, zemin } = degerlendirmeRenkleri(secenek, renk);

          return (
            <Pressable
              key={secenek}
              onPress={() => degerlendir(cevap, secenek)}
              accessibilityRole="radio"
              accessibilityState={{ selected: secili }}
              style={({ pressed }) => [
                stiller.secenek,
                {
                  backgroundColor: secili ? on : zemin,
                  borderColor: on,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Yazi tur="govdeKalin" style={{ color: secili ? renk.markaUstuYazi : on }}>
                {degerlendirmeAdi[secenek]}
              </Yazi>
            </Pressable>
          );
        })}
      </View>

      <View style={stiller.gezinme}>
        <Dugme yazi="‹ Önceki" tur="ikincil" onPress={() => setAktif(aktif - 1)} disabled={aktif === 0} style={stiller.esnek} />
        <Dugme
          yazi="Sonraki ›"
          tur="ikincil"
          onPress={() => setAktif(aktif + 1)}
          disabled={aktif === cevaplar.length - 1}
          style={stiller.esnek}
        />
      </View>

      <Dugme
        yazi={kalan > 0 ? `${kalan} soru değerlendirilmedi` : 'Mülakatı bitir'}
        onPress={bitir}
        disabled={kalan > 0}
        yukleniyor={bitiyor}
        style={stiller.bitir}
      />
    </>
  );
}

// ---------- Sonuç: puan, konulara göre dağılım, sorular ----------

function Sonuc({
  adayId,
  cevaplar,
  onSifirlandi,
}: {
  adayId: string;
  cevaplar: TeknikCevap[];
  onSifirlandi: (oturum: TeknikOturum) => void;
}) {
  const { renk } = useTema();
  const [sifirlaniyor, setSifirlaniyor] = useState(false);

  const yuzde = yuzdeHesapla(cevaplar);

  const sifirla = () =>
    Alert.alert(
      'Teknik mülakat sıfırlansın mı?',
      'Sorulan sorular ve değerlendirmeler silinir, mülakat yeniden başlatılabilir. Mülakatçı ve tarih korunur.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            setSifirlaniyor(true);
            const { veri, hata } = await istekAt<TeknikOturum>(`/api/teknik-mulakat/${adayId}`, 'DELETE');
            setSifirlaniyor(false);

            if (veri) onSifirlandi(veri);
            else Alert.alert('Sıfırlanamadı', hata);
          },
        },
      ]
    );

  return (
    <>
      <Kart style={stiller.puanKarti}>
        <Yazi tur="etiket" renk="yaziIkincil">
          TEKNİK PUAN
        </Yazi>
        <Yazi style={[stiller.puan, { color: izlenimRengi(yuzde, renk) }]}>%{yuzde}</Yazi>
        <Yazi tur="govdeKalin">{izlenim(yuzde)}</Yazi>
        <Yazi tur="kucuk" renk="yaziIkincil" style={stiller.ortala}>
          Bu puan bir karar değil; adayın teknik sorulardaki genel durumu hakkında fikir verir.
        </Yazi>
      </Kart>

      <Yazi tur="etiket" renk="yaziIkincil" style={stiller.bolum}>
        KONULARA GÖRE
      </Yazi>

      <Kart style={stiller.konular}>
        {konularaGoreGrupla(cevaplar).map(([konuAdi, liste]) => {
          const konuYuzdesi = yuzdeHesapla(liste);
          const say = (deger: Degerlendirme) => liste.filter((kayit) => kayit.degerlendirme === deger).length;

          return (
            <View key={konuAdi} style={stiller.konuSatiri}>
              <View style={stiller.konuUst}>
                <Yazi tur="govdeKalin" style={stiller.esnek}>
                  {konuAdi}
                </Yazi>
                <Yazi tur="govdeKalin">%{konuYuzdesi}</Yazi>
              </View>

              <View style={[stiller.cubuk, { backgroundColor: renk.yuzeyIkincil }]}>
                <View
                  style={[stiller.cubukDolu, { width: `${konuYuzdesi}%`, backgroundColor: izlenimRengi(konuYuzdesi, renk) }]}
                />
              </View>

              <Yazi tur="kucuk" renk="yaziIkincil">
                {liste.length} soru · {say('yeterli')} yeterli · {say('orta')} orta · {say('yetersiz')} yetersiz
              </Yazi>
            </View>
          );
        })}
      </Kart>

      <Yazi tur="etiket" renk="yaziIkincil" style={stiller.bolum}>
        SORULAR
      </Yazi>

      {cevaplar.map((kayit) => (
        <Kart key={kayit.id} style={stiller.sonucSorusu}>
          <View style={stiller.konuUst}>
            <Yazi tur="kucuk" renk="yaziIkincil" style={stiller.esnek}>
              {kayit.sira}. soru · {kayit.konuAdi}
            </Yazi>
            {kayit.degerlendirme && (
              <Etiket yazi={degerlendirmeAdi[kayit.degerlendirme]} {...degerlendirmeRenkleri(kayit.degerlendirme, renk)} />
            )}
          </View>
          <Yazi>{kayit.soruMetni}</Yazi>
        </Kart>
      ))}

      <Dugme yazi="Mülakatı sıfırla" tur="tehlike" onPress={sifirla} yukleniyor={sifirlaniyor} style={stiller.bitir} />
    </>
  );
}

const stiller = StyleSheet.create({
  esnek: { flex: 1 },
  ortala: { textAlign: 'center' },
  bolum: { marginTop: bosluk.s },
  giris: { gap: bosluk.xs, marginBottom: bosluk.xs },
  liste: { padding: 0, gap: 0 },
  konu: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m, paddingHorizontal: bosluk.l, paddingVertical: bosluk.m },
  sayac: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  sayacDugmesi: { width: 40, height: 40, borderRadius: kose.tam, alignItems: 'center', justifyContent: 'center' },
  adet: { minWidth: 24, textAlign: 'center' },
  ilerleme: { flexDirection: 'row', justifyContent: 'space-between' },
  noktalar: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.s - 2 },
  nokta: { width: 14, height: 14, borderRadius: kose.tam, borderWidth: 2 },
  soruKarti: { gap: bosluk.m, padding: bosluk.xl, minHeight: 160 },
  soruMetni: { lineHeight: 28 },
  secenekler: { gap: bosluk.s },
  secenek: {
    minHeight: DOKUNMA_YUKSEKLIGI + 8,
    borderRadius: kose.m,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gezinme: { flexDirection: 'row', gap: bosluk.m },
  bitir: { marginTop: bosluk.m },
  puanKarti: { alignItems: 'center', gap: bosluk.xs, paddingVertical: bosluk.xl },
  puan: { fontSize: 56, lineHeight: 64, fontWeight: '800' },
  konular: { gap: bosluk.l },
  konuSatiri: { gap: bosluk.xs + 2 },
  konuUst: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  cubuk: { height: 8, borderRadius: kose.tam, overflow: 'hidden' },
  cubukDolu: { height: 8, borderRadius: kose.tam },
  sonucSorusu: { gap: bosluk.xs + 2 },
});
