import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { konularaGoreGrupla, teknikTamamlandi, yuzdeHesapla } from '@/api/teknikPuan';
import { durumlar, kararlar, type Aday, type Alan, type Mulakat } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { Dugme } from '@/bilesenler/Dugme';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Kart } from '@/bilesenler/Kart';
import { DurumEtiketi, KararEtiketi } from '@/bilesenler/Kucukler';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

const ortalama = (sayilar: number[]) =>
  sayilar.length ? Math.round(sayilar.reduce((a, b) => a + b, 0) / sayilar.length) : null;

// Çubuk: oran kadar dolu; değer yazıyla da yazıldığı için yalnızca uzunluğa / renge dayanmaz
function Cubuk({ oran }: { oran: number }) {
  const { renk } = useTema();

  return (
    <View style={[stiller.cubuk, { backgroundColor: renk.yuzeyIkincil }]}>
      <View
        style={[
          stiller.cubukDolu,
          // Sıfırdan büyük ama çok küçük değerler de görünsün diye en az %2
          { width: `${Math.max(oran * 100, oran > 0 ? 2 : 0)}%`, backgroundColor: renk.marka },
        ]}
      />
    </View>
  );
}

// Web'deki İstatistikler sayfasının telefondaki karşılığı. Yeni API yok: adaylar + mülakat kayıtları.
export default function Istatistikler() {
  const { renk } = useTema();
  const adayVerisi = useVeri<Aday[]>('/api/adaylar');
  const mulakatVerisi = useVeri<Mulakat[]>('/api/mulakatlar');

  const adaylar = adayVerisi.veri;
  const kayitlar = mulakatVerisi.veri;
  const hata = adayVerisi.hata || mulakatVerisi.hata;
  const yenile = async () => {
    await Promise.all([adayVerisi.yenile(), mulakatVerisi.yenile()]);
  };

  if (!adaylar || !kayitlar) {
    return <Ekran>{hata ? <HataDurumu mesaj={hata} tekrarDene={yenile} /> : <Yukleniyor />}</Ekran>;
  }

  if (adaylar.length === 0) {
    return (
      <Ekran>
        <BosDurum baslik="Henüz aday yok" aciklama="İstatistikler aday ve mülakat kayıtlarından hesaplanır." />
      </Ekran>
    );
  }

  const kayitBul = (adayId: number, tur: Alan) => kayitlar.find((kayit) => kayit.adayId === adayId && kayit.tur === tur);
  // Kaydı olmayan mülakat "Planlanmadı" sayılır (web'deki kural)
  const durumu = (adayId: number, tur: Alan) => kayitBul(adayId, tur)?.durum ?? 'Planlanmadı';
  // Puanı anlamlı olan (tamamlanmış ve hepsi değerlendirilmiş) teknik mülakatın yüzdesi
  const teknikYuzdesi = (adayId: number) => {
    const kayit = kayitBul(adayId, 'teknik');
    return kayit && teknikTamamlandi(kayit.durum, kayit.teknikCevaplar) ? yuzdeHesapla(kayit.teknikCevaplar) : null;
  };
  const yuzdeler = (liste: Aday[]) =>
    liste.map((aday) => teknikYuzdesi(aday.id)).filter((yuzde): yuzde is number => yuzde !== null);
  const olumlu = (liste: Aday[]) =>
    liste.filter((aday) => aday.karar === 'Teklif verildi' || aday.karar === 'İşe alındı').length;

  const genelOrtalama = ortalama(yuzdeler(adaylar));
  const ozetler = [
    { ad: 'Toplam aday', deger: String(adaylar.length) },
    { ad: 'Tamamlanan mülakat', deger: String(kayitlar.filter((kayit) => kayit.durum === 'Tamamlandı').length) },
    { ad: 'Ortalama teknik puan', deger: genelOrtalama === null ? '-' : `%${genelOrtalama}` },
    { ad: 'Teklif / işe alım', deger: String(olumlu(adaylar)) },
  ];

  const kararSayilari = kararlar.map((karar) => ({ karar, sayi: adaylar.filter((aday) => aday.karar === karar).length }));
  const enCokKarar = Math.max(...kararSayilari.map((satir) => satir.sayi), 1);

  // Pozisyonlar adaylardan çıkarılır (adayı olmayan pozisyon istatistikte anlamsız)
  const pozisyonlar = [...new Map(adaylar.map((aday) => [aday.pozisyon.id, aday.pozisyon])).values()].sort((a, b) =>
    a.ad.localeCompare(b.ad, 'tr')
  );

  // Bütün değerlendirilmiş teknik cevaplar konu konu; en çok zorlanılan konu en üstte
  const konuSonuclari = konularaGoreGrupla(
    kayitlar.flatMap((kayit) => kayit.teknikCevaplar.filter((cevap) => cevap.degerlendirme))
  )
    .map(([konu, cevaplar]) => ({ konu, soru: cevaplar.length, yuzde: yuzdeHesapla(cevaplar) }))
    .sort((a, b) => a.yuzde - b.yuzde || a.konu.localeCompare(b.konu, 'tr'));

  return (
    <Ekran yenile={yenile} yenileniyor={adayVerisi.yenileniyor || mulakatVerisi.yenileniyor}>
      <Yazi renk="yaziIkincil">
        Teknik puanlar yalnızca tamamlanmış mülakatlardan hesaplanır ve karar değil, fikir verir.
      </Yazi>

      <View style={stiller.ozetler}>
        {ozetler.map((ozet) => (
          <Kart key={ozet.ad} style={stiller.ozet}>
            <Yazi style={stiller.ozetSayi}>{ozet.deger}</Yazi>
            <Yazi tur="kucuk" renk="yaziIkincil">
              {ozet.ad}
            </Yazi>
          </Kart>
        ))}
      </View>

      <Yazi tur="etiket" renk="yaziIkincil" style={stiller.baslik}>
        KARAR DAĞILIMI
      </Yazi>
      <Kart style={stiller.liste}>
        {kararSayilari.map(({ karar, sayi }) => (
          <View key={karar} style={stiller.cubukSatiri} accessibilityLabel={`${karar}: ${sayi} aday`}>
            <View style={stiller.etiketKutusu}>
              <KararEtiketi karar={karar} />
            </View>
            <Cubuk oran={sayi / enCokKarar} />
            <Yazi tur="govdeKalin" style={stiller.deger}>
              {sayi}
            </Yazi>
          </View>
        ))}
      </Kart>

      <Yazi tur="etiket" renk="yaziIkincil" style={stiller.baslik}>
        MÜLAKAT DURUMLARI
      </Yazi>
      <Kart style={stiller.tablo}>
        <View style={[stiller.tabloSatiri, { borderBottomColor: renk.kenar }]}>
          <Yazi tur="etiket" renk="yaziIkincil" style={stiller.esnek}>
            DURUM
          </Yazi>
          <Yazi tur="etiket" renk="yaziIkincil" style={stiller.sayiSutunu}>
            İK
          </Yazi>
          <Yazi tur="etiket" renk="yaziIkincil" style={stiller.sayiSutunu}>
            TEKNİK
          </Yazi>
        </View>
        {durumlar.map((durum) => (
          <View key={durum} style={[stiller.tabloSatiri, { borderBottomColor: renk.kenar }]}>
            <View style={stiller.esnek}>
              <DurumEtiketi durum={durum} />
            </View>
            {(['ik', 'teknik'] as const).map((tur) => (
              <Yazi key={tur} tur="govdeKalin" style={stiller.sayiSutunu}>
                {adaylar.filter((aday) => durumu(aday.id, tur) === durum).length}
              </Yazi>
            ))}
          </View>
        ))}
      </Kart>

      <Yazi tur="etiket" renk="yaziIkincil" style={stiller.baslik}>
        POZİSYONLARA GÖRE
      </Yazi>
      {pozisyonlar.map((pozisyon) => {
        const pozisyonAdaylari = adaylar.filter((aday) => aday.pozisyon.id === pozisyon.id);
        const ortalamaPuan = ortalama(yuzdeler(pozisyonAdaylari));
        const satirlar = [
          { ad: 'Aday', deger: String(pozisyonAdaylari.length) },
          { ad: 'İK tamam', deger: String(pozisyonAdaylari.filter((aday) => durumu(aday.id, 'ik') === 'Tamamlandı').length) },
          { ad: 'Teknik tamam', deger: String(pozisyonAdaylari.filter((aday) => durumu(aday.id, 'teknik') === 'Tamamlandı').length) },
          { ad: 'Ort. teknik', deger: ortalamaPuan === null ? '-' : `%${ortalamaPuan}` },
          { ad: 'Teklif / işe alım', deger: String(olumlu(pozisyonAdaylari)) },
        ];

        return (
          <Kart key={pozisyon.id} style={stiller.pozisyon}>
            <Yazi tur="govdeKalin">{pozisyon.ad}</Yazi>
            <View style={stiller.pozisyonSayilari}>
              {satirlar.map((satir) => (
                <View key={satir.ad} style={stiller.pozisyonSayisi}>
                  <Yazi tur="govdeKalin">{satir.deger}</Yazi>
                  <Yazi tur="kucuk" renk="yaziIkincil">
                    {satir.ad}
                  </Yazi>
                </View>
              ))}
            </View>
            <Dugme
              yazi="Adayları karşılaştır"
              tur="metin"
              onPress={() => router.push({ pathname: '/daha-fazla/karsilastirma', params: { pozisyon: pozisyon.id } })}
            />
          </Kart>
        );
      })}

      <Yazi tur="etiket" renk="yaziIkincil" style={stiller.baslik}>
        TEKNİK KONULARA GÖRE BAŞARI
      </Yazi>
      <Kart style={stiller.liste}>
        <Yazi tur="kucuk" renk="yaziIkincil">
          Bütün mülakatlarda o konuda verilen değerlendirmelerin ortalaması. En çok zorlanılan konular en üstte.
        </Yazi>
        {konuSonuclari.length === 0 ? (
          <Yazi renk="yaziSoluk">Henüz değerlendirilmiş teknik soru yok.</Yazi>
        ) : (
          konuSonuclari.map((satir) => (
            <View key={satir.konu} style={stiller.konu} accessibilityLabel={`${satir.konu}: yüzde ${satir.yuzde}, ${satir.soru} soru`}>
              <View style={stiller.satir}>
                <Yazi style={stiller.esnek} numberOfLines={1}>
                  {satir.konu}{' '}
                  <Yazi tur="kucuk" renk="yaziSoluk">
                    ({satir.soru} soru)
                  </Yazi>
                </Yazi>
                <Yazi tur="govdeKalin">%{satir.yuzde}</Yazi>
              </View>
              <Cubuk oran={satir.yuzde / 100} />
            </View>
          ))
        )}
      </Kart>
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  esnek: { flex: 1 },
  baslik: { marginTop: bosluk.s },
  ozetler: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.m },
  // İki sütunlu ızgara: her kart satırın yarısından biraz az
  ozet: { flexBasis: '47%', flexGrow: 1, gap: 2 },
  ozetSayi: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  liste: { gap: bosluk.m },
  cubukSatiri: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  etiketKutusu: { width: 118 },
  cubuk: { flex: 1, height: 10, borderRadius: kose.tam, overflow: 'hidden' },
  cubukDolu: { height: 10, borderRadius: kose.tam },
  deger: { width: 28, textAlign: 'right' },
  tablo: { paddingVertical: bosluk.xs },
  tabloSatiri: { flexDirection: 'row', alignItems: 'center', paddingVertical: bosluk.s, borderBottomWidth: StyleSheet.hairlineWidth },
  sayiSutunu: { width: 56, textAlign: 'right' },
  pozisyon: { gap: bosluk.s },
  pozisyonSayilari: { flexDirection: 'row', flexWrap: 'wrap', rowGap: bosluk.s },
  pozisyonSayisi: { width: '33%' },
  konu: { gap: bosluk.xs },
  satir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
});
