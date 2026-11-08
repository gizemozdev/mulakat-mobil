import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { istekAt } from '@/api/istekAt';
import { izlenim, teknikTamamlandi, yuzdeHesapla } from '@/api/teknikPuan';
import { kararlar, type Aday, type Karar, type Mulakat } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Girdi } from '@/bilesenler/Girdi';
import { Kart } from '@/bilesenler/Kart';
import { kararRenkleri } from '@/bilesenler/Kucukler';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Adayın kararı ve gerekçesi. Karar vermeden önce mülakat sonuçları üstte özet olarak görünür.
export default function KararFormu() {
  const { renk } = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [aday, setAday] = useState<Aday | null>(null);
  const [mulakatlar, setMulakatlar] = useState<Mulakat[]>([]);
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');

  const [karar, setKarar] = useState<Karar>('Değerlendiriliyor');
  const [kararNotu, setKararNotu] = useState('');
  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    Promise.all([istekAt<Aday[]>('/api/adaylar'), istekAt<Mulakat[]>('/api/mulakatlar')]).then(
      ([adaySonucu, mulakatSonucu]) => {
        const bulunan = adaySonucu.veri?.find((kayit) => String(kayit.id) === id);

        if (!bulunan) {
          setYuklemeHatasi(adaySonucu.hata || 'Aday bulunamadı. Silinmiş olabilir.');
          return;
        }

        setAday(bulunan);
        setKarar(bulunan.karar);
        setKararNotu(bulunan.kararNotu);
        setMulakatlar((mulakatSonucu.veri ?? []).filter((mulakat) => mulakat.adayId === bulunan.id));
      }
    );
  }, [id]);

  // Hiçbir şey değişmediyse kaydetmeye gerek yok (web'deki "değişmediyse istek yok" kuralı)
  const degisti = aday !== null && (karar !== aday.karar || kararNotu.trim() !== aday.kararNotu);

  const kaydet = async () => {
    setHata('');
    setKaydediliyor(true);

    const { hata: istekHatasi } = await istekAt(`/api/adaylar/${id}/karar`, 'PUT', { karar, kararNotu });

    setKaydediliyor(false);

    if (istekHatasi) setHata(istekHatasi);
    else router.back();
  };

  const teknik = mulakatlar.find((mulakat) => mulakat.tur === 'teknik');
  const ik = mulakatlar.find((mulakat) => mulakat.tur === 'ik');

  const teknikOzeti =
    teknik && teknikTamamlandi(teknik.durum, teknik.teknikCevaplar)
      ? `%${yuzdeHesapla(teknik.teknikCevaplar)} · ${izlenim(yuzdeHesapla(teknik.teknikCevaplar))}`
      : (teknik?.durum ?? 'Planlanmadı');

  const ikOzeti =
    ik?.durum === 'Tamamlandı' && ik._count.ikCevaplar > 0
      ? `Tamamlandı · ${ik._count.ikCevaplar} cevap`
      : (ik?.durum ?? 'Planlanmadı');

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: 'Karar',
          headerLeft: () => <BaslikDugmesi yazi="Vazgeç" onPress={() => router.back()} />,
        }}
      />

      {yuklemeHatasi ? (
        <HataDurumu mesaj={yuklemeHatasi} />
      ) : !aday ? (
        <Yukleniyor />
      ) : (
        <>
          <Yazi tur="altBaslik">{aday.adSoyad}</Yazi>

          <Kart style={stiller.ozet}>
            <Yazi tur="etiket" renk="yaziIkincil">
              MÜLAKAT SONUÇLARI
            </Yazi>
            <View style={stiller.ozetSatiri}>
              <Yazi renk="yaziIkincil">Teknik</Yazi>
              <Yazi tur="govdeKalin">{teknikOzeti}</Yazi>
            </View>
            <View style={stiller.ozetSatiri}>
              <Yazi renk="yaziIkincil">İK</Yazi>
              <Yazi tur="govdeKalin">{ikOzeti}</Yazi>
            </View>
          </Kart>

          <Yazi tur="etiket" renk="yaziIkincil" style={stiller.bolum}>
            KARAR
          </Yazi>

          {kararlar.map((secenek) => {
            const secili = secenek === karar;
            const { on, zemin } = kararRenkleri(secenek, renk);

            return (
              <Pressable
                key={secenek}
                onPress={() => setKarar(secenek)}
                accessibilityRole="radio"
                accessibilityState={{ selected: secili }}
                style={({ pressed }) => [
                  stiller.secenek,
                  {
                    backgroundColor: secili ? zemin : renk.yuzey,
                    borderColor: secili ? on : renk.kenar,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <View style={[stiller.nokta, { backgroundColor: on }]} />
                <Yazi tur={secili ? 'govdeKalin' : 'govde'} style={secili ? { color: on } : undefined}>
                  {secenek}
                </Yazi>
              </Pressable>
            );
          })}

          <Girdi
            etiket="Gerekçe (isteğe bağlı)"
            value={kararNotu}
            onChangeText={setKararNotu}
            placeholder="Kararın kısa gerekçesi"
            multiline
            style={stiller.cokSatir}
          />

          {hata ? (
            <Yazi tur="kucuk" renk="hata" accessibilityLiveRegion="polite">
              {hata}
            </Yazi>
          ) : null}

          <Dugme
            yazi={degisti ? 'Kararı kaydet' : 'Değişiklik yok'}
            onPress={kaydet}
            disabled={!degisti}
            yukleniyor={kaydediliyor}
            style={stiller.kaydet}
          />
        </>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  ozet: { gap: bosluk.s },
  ozetSatiri: { flexDirection: 'row', justifyContent: 'space-between', gap: bosluk.m },
  bolum: { marginTop: bosluk.s },
  secenek: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    padding: bosluk.l,
    borderRadius: kose.m,
    borderWidth: 1.5,
  },
  nokta: { width: 10, height: 10, borderRadius: kose.tam },
  cokSatir: { minHeight: 88, paddingTop: bosluk.m, textAlignVertical: 'top' },
  kaydet: { marginTop: bosluk.m },
});
