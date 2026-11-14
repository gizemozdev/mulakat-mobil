import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Konu } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';

// Bir konunun soruları. Soruya dokununca düzenleme formu açılır.
export default function KonuDetayi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Tek konuyu getiren uç yok; liste alınıp içinden bulunur (havuz küçük)
  const { veri: konular, hata, yenileniyor, yenile } = useVeri<Konu[]>('/api/konular');

  const konu = konular?.find((kayit) => String(kayit.id) === id);

  if (!konular) {
    return <Ekran>{hata ? <HataDurumu mesaj={hata} tekrarDene={yenile} /> : <Yukleniyor />}</Ekran>;
  }

  if (!konu) {
    return (
      <Ekran>
        <BosDurum baslik="Konu bulunamadı" aciklama="Bu konu silinmiş olabilir." />
      </Ekran>
    );
  }

  const soruEkle = () => router.push({ pathname: '/daha-fazla/soru-form', params: { konuId: konu.id } });

  return (
    <Ekran yenile={yenile} yenileniyor={yenileniyor}>
      <Stack.Screen
        options={{
          title: konu.ad,
          headerRight: () => (
            <BaslikDugmesi
              yazi="Düzenle"
              onPress={() => router.push({ pathname: '/daha-fazla/konu-form', params: { id: konu.id } })}
            />
          ),
        }}
      />

      {konu.sorular.length === 0 ? (
        <BosDurum
          baslik="Bu konuda soru yok"
          aciklama="Teknik mülakatta bu konudan soru seçebilmek için önce soru eklemelisin."
        />
      ) : (
        konu.sorular.map((soru, sira) => (
          <Kart
            key={soru.id}
            onPress={() =>
              router.push({ pathname: '/daha-fazla/soru-form', params: { id: soru.id, konuId: konu.id } })
            }
            erisimEtiketi={`${sira + 1}. soru: ${soru.metin}`}
            style={stiller.soru}
          >
            <Yazi tur="kucuk" renk="yaziSoluk" style={stiller.sira}>
              {sira + 1}
            </Yazi>
            <View style={stiller.esnek}>
              <Yazi>{soru.metin}</Yazi>
            </View>
          </Kart>
        ))
      )}

      <Dugme yazi="Soru ekle" tur="ikincil" onPress={soruEkle} />
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  soru: { flexDirection: 'row', gap: bosluk.m },
  sira: { width: 20, paddingTop: 2 },
  esnek: { flex: 1 },
});
