import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import type { Aday, Pozisyon } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Kart } from '@/bilesenler/Kart';
import { uzunBasmaMenusu } from '@/bilesenler/uzunBasma';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Pozisyon listesi: her pozisyonun yanında kaç aday başvurduğu görünür
export default function Pozisyonlar() {
  const { renk } = useTema();
  const pozisyonVerisi = useVeri<Pozisyon[]>('/api/pozisyonlar');
  // Pozisyon API'si aday sayısını döndürmediği için sayılar aday listesinden hesaplanır
  const adayVerisi = useVeri<Aday[]>('/api/adaylar');

  const pozisyonlar = pozisyonVerisi.veri;
  const hata = pozisyonVerisi.hata || adayVerisi.hata;

  const yenile = async () => {
    await Promise.all([pozisyonVerisi.yenile(), adayVerisi.yenile()]);
  };

  // pozisyonId -> aday sayısı
  const adaySayilari = new Map<number, number>();
  for (const aday of adayVerisi.veri ?? []) {
    adaySayilari.set(aday.pozisyonId, (adaySayilari.get(aday.pozisyonId) ?? 0) + 1);
  }

  if (!pozisyonlar) {
    return (
      <View style={[stiller.sayfa, { backgroundColor: renk.zemin }]}>
        {hata ? <HataDurumu mesaj={hata} tekrarDene={yenile} /> : <Yukleniyor />}
      </View>
    );
  }

  return (
    <FlatList
      data={pozisyonlar}
      keyExtractor={(pozisyon) => String(pozisyon.id)}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: renk.zemin }}
      contentContainerStyle={stiller.icerik}
      refreshControl={
        <RefreshControl
          refreshing={pozisyonVerisi.yenileniyor || adayVerisi.yenileniyor}
          onRefresh={yenile}
          tintColor={renk.marka}
        />
      }
      ListEmptyComponent={
        <BosDurum baslik="Henüz pozisyon yok" aciklama="Sağ üstteki Ekle ile ilk pozisyonu ekleyebilirsin." />
      }
      renderItem={({ item: pozisyon }) => {
        const sayi = adaySayilari.get(pozisyon.id) ?? 0;

        return (
          <Kart
            onPress={() => router.push({ pathname: '/daha-fazla/pozisyon-form', params: { id: pozisyon.id } })}
            onLongPress={() =>
              uzunBasmaMenusu({
                baslik: pozisyon.ad,
                duzenle: () => router.push({ pathname: '/daha-fazla/pozisyon-form', params: { id: pozisyon.id } }),
                sil: {
                  baslik: 'Pozisyon silinsin mi?',
                  mesaj: `"${pozisyon.ad}" pozisyonu silinecek.`,
                  yol: `/api/pozisyonlar/${pozisyon.id}`,
                  sonra: yenile,
                },
              })
            }
            erisimEtiketi={`${pozisyon.ad}, ${sayi} aday`}
            style={stiller.satir}
          >
            <View style={stiller.bilgi}>
              <Yazi tur="govdeKalin">{pozisyon.ad}</Yazi>
              {/* Aday listesi henüz gelmediyse sayı yerine boşluk bırakılır, yanlış "0 aday" gösterilmez */}
              <Yazi tur="kucuk" renk="yaziIkincil">
                {adayVerisi.veri ? (sayi === 0 ? 'Başvuran yok' : `${sayi} aday`) : ' '}
              </Yazi>
            </View>

            <Yazi renk="yaziSoluk">›</Yazi>
          </Kart>
        );
      }}
    />
  );
}

const stiller = StyleSheet.create({
  sayfa: { flex: 1, padding: bosluk.l },
  icerik: { padding: bosluk.l, gap: bosluk.s, paddingBottom: bosluk.xxl },
  satir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  bilgi: { flex: 1, gap: 3 },
});
