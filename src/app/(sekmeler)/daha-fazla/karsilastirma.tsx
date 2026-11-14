import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { konularaGoreGrupla, teknikTamamlandi, yuzdeHesapla } from '@/api/teknikPuan';
import type { Aday, Alan, Mulakat } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { Dugme } from '@/bilesenler/Dugme';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Kart } from '@/bilesenler/Kart';
import { DurumEtiketi, KararEtiketi } from '@/bilesenler/Kucukler';
import { Secim } from '@/bilesenler/Secim';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

const SATIR_YUKSEKLIGI = 52;
const BASLIK_SUTUNU = 112;
const ADAY_SUTUNU = 140;

type Satir = { baslik: string; hucre: (aday: Aday) => ReactNode };

// Aynı pozisyondaki adayların sonuçları yan yana. Sol sütun (satır başlıkları) sabit durur,
// aday sütunları yana kaydırılır: telefon ekranına iki üç adaydan fazlası sığmadığı için.
export default function Karsilastirma() {
  const { renk } = useTema();
  // İstatistiklerden "?pozisyon=3" ile gelinirse o pozisyon seçili açılır
  const { pozisyon } = useLocalSearchParams<{ pozisyon?: string }>();
  const [pozisyonId, setPozisyonId] = useState<number | null>(pozisyon ? Number(pozisyon) : null);

  const adayVerisi = useVeri<Aday[]>('/api/adaylar');
  const mulakatVerisi = useVeri<Mulakat[]>('/api/mulakatlar');
  const adaylar = adayVerisi.veri;
  const kayitlar = mulakatVerisi.veri;
  const hata = adayVerisi.hata || mulakatVerisi.hata;

  if (!adaylar || !kayitlar) {
    return <Ekran>{hata ? <HataDurumu mesaj={hata} /> : <Yukleniyor />}</Ekran>;
  }

  const pozisyonlar = [...new Map(adaylar.map((aday) => [aday.pozisyon.id, aday.pozisyon])).values()].sort((a, b) =>
    a.ad.localeCompare(b.ad, 'tr')
  );

  const pozisyonAdaylari = adaylar
    .filter((aday) => aday.pozisyon.id === pozisyonId)
    .sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, 'tr'));

  const kayitBul = (adayId: number, tur: Alan) => kayitlar.find((kayit) => kayit.adayId === adayId && kayit.tur === tur);

  // Puanlar yalnızca tamamlanmış teknik mülakatlardan
  const tamamTeknik = (adayId: number) => {
    const kayit = kayitBul(adayId, 'teknik');
    return kayit && teknikTamamlandi(kayit.durum, kayit.teknikCevaplar) ? kayit.teknikCevaplar : null;
  };

  // Adaylardan herhangi birine sorulmuş bütün konular (birleşim), ilk görüldükleri sırayla
  const konular = konularaGoreGrupla(pozisyonAdaylari.flatMap((aday) => tamamTeknik(aday.id) ?? [])).map(([konu]) => konu);

  // Sayısal satır: en yüksek değer kalın ve ★ ile (renge tek başına güvenmeden). Tek değer varsa vurgu yok.
  const puanSatiri = (baslik: string, oku: (adayId: number) => number | null): Satir => {
    const sayilar = pozisyonAdaylari.map((aday) => oku(aday.id)).filter((deger): deger is number => deger !== null);
    const enYuksek = sayilar.length > 1 ? Math.max(...sayilar) : null;

    return {
      baslik,
      hucre: (aday) => {
        const deger = oku(aday.id);
        if (deger === null) return <Yazi renk="yaziSoluk">-</Yazi>;
        const vurgu = deger === enYuksek;
        return (
          <Yazi tur={vurgu ? 'govdeKalin' : 'govde'} renk={vurgu ? 'marka' : 'yazi'}>
            %{deger}
            {vurgu ? ' ★' : ''}
          </Yazi>
        );
      },
    };
  };

  const satirlar: Satir[] = [
    { baslik: 'Karar', hucre: (aday) => <KararEtiketi karar={aday.karar} /> },
    { baslik: 'İK', hucre: (aday) => <DurumEtiketi durum={kayitBul(aday.id, 'ik')?.durum ?? 'Planlanmadı'} /> },
    { baslik: 'Teknik', hucre: (aday) => <DurumEtiketi durum={kayitBul(aday.id, 'teknik')?.durum ?? 'Planlanmadı'} /> },
    puanSatiri('Teknik puan', (adayId) => {
      const cevaplar = tamamTeknik(adayId);
      return cevaplar ? yuzdeHesapla(cevaplar) : null;
    }),
    ...konular.map((konu) =>
      puanSatiri(konu, (adayId) => {
        const cevaplar = (tamamTeknik(adayId) ?? []).filter((cevap) => cevap.konuAdi === konu);
        return cevaplar.length ? yuzdeHesapla(cevaplar) : null;
      })
    ),
    {
      baslik: 'Soru sayısı',
      hucre: (aday) => <Yazi>{kayitBul(aday.id, 'teknik')?.teknikCevaplar.length ?? 0}</Yazi>,
    },
  ];

  const cizgi = { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: renk.kenar };

  return (
    <Ekran>
      <Yazi renk="yaziIkincil">Aynı pozisyondaki adayların mülakat sonuçları yan yana. Puan karar değil, fikir verir.</Yazi>

      <Secim
        kaydirilabilir
        secenekler={pozisyonlar.map((kayit) => ({ deger: kayit.id as number | null, etiket: kayit.ad }))}
        secili={pozisyonId}
        onSec={setPozisyonId}
      />

      {pozisyonId === null ? (
        <BosDurum baslik="Bir pozisyon seç" aciklama="Karşılaştırma aynı pozisyona başvuran adaylar arasında yapılır." />
      ) : pozisyonAdaylari.length === 0 ? (
        <BosDurum baslik="Bu pozisyonda aday yok" />
      ) : (
        <Kart style={stiller.tablo}>
          <View style={stiller.tabloIci}>
            {/* Sabit sol sütun: satır başlıkları */}
            <View style={{ width: BASLIK_SUTUNU }}>
              <View style={[stiller.hucre, stiller.baslikHucresi, cizgi]} />
              {satirlar.map((satir) => (
                <View key={satir.baslik} style={[stiller.hucre, cizgi]}>
                  <Yazi tur="kucuk" renk="yaziIkincil" numberOfLines={2}>
                    {satir.baslik}
                  </Yazi>
                </View>
              ))}
            </View>

            {/* Yana kayan aday sütunları */}
            <ScrollView horizontal showsHorizontalScrollIndicator>
              {pozisyonAdaylari.map((aday) => (
                <View key={aday.id} style={{ width: ADAY_SUTUNU }}>
                  <View style={[stiller.hucre, stiller.baslikHucresi, cizgi]}>
                    <Yazi tur="govdeKalin" numberOfLines={2}>
                      {aday.adSoyad}
                    </Yazi>
                    <Dugme
                      yazi="Rapor"
                      tur="metin"
                      onPress={() => router.push({ pathname: '/rapor/[adayId]', params: { adayId: aday.id } })}
                      style={stiller.raporDugmesi}
                    />
                  </View>
                  {satirlar.map((satir) => (
                    <View key={satir.baslik} style={[stiller.hucre, cizgi]}>
                      {satir.hucre(aday)}
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </Kart>
      )}

      {pozisyonAdaylari.length > 0 && (
        <Yazi tur="kucuk" renk="yaziSoluk">
          &quot;-&quot; o adaya bu konunun sorulmadığını ya da teknik mülakatın bitmediğini gösterir. ★ satırdaki en yüksek puan.
        </Yazi>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  tablo: { padding: 0, overflow: 'hidden' },
  tabloIci: { flexDirection: 'row' },
  hucre: { height: SATIR_YUKSEKLIGI, justifyContent: 'center', paddingHorizontal: bosluk.m },
  baslikHucresi: { height: SATIR_YUKSEKLIGI + 28, alignItems: 'flex-start' },
  raporDugmesi: { minHeight: 28, paddingHorizontal: 0 },
});
