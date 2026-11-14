import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import type { Konu } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Teknik soru havuzu: konular ve her konudaki soru sayısı. Konuya dokununca soruları açılır.
export default function SoruHavuzu() {
  const { renk } = useTema();
  const { veri: konular, hata, yenileniyor, yenile } = useVeri<Konu[]>('/api/konular');

  if (!konular) {
    return (
      <View style={[stiller.sayfa, { backgroundColor: renk.zemin }]}>
        {hata ? <HataDurumu mesaj={hata} tekrarDene={yenile} /> : <Yukleniyor />}
      </View>
    );
  }

  const toplam = konular.reduce((sayi, konu) => sayi + konu.sorular.length, 0);

  return (
    <FlatList
      data={konular}
      keyExtractor={(konu) => String(konu.id)}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: renk.zemin }}
      contentContainerStyle={stiller.icerik}
      refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={renk.marka} />}
      ListHeaderComponent={
        konular.length > 0 ? (
          <Yazi tur="kucuk" renk="yaziIkincil" style={stiller.ozet}>
            {konular.length} konu · {toplam} soru
          </Yazi>
        ) : undefined
      }
      ListEmptyComponent={
        <BosDurum baslik="Henüz konu yok" aciklama="Sağ üstteki Ekle ile ilk konuyu ekleyebilirsin (ör. JavaScript, SQL)." />
      }
      renderItem={({ item: konu }) => (
        <Kart
          onPress={() => router.push({ pathname: '/daha-fazla/konu/[id]', params: { id: konu.id } })}
          erisimEtiketi={`${konu.ad}, ${konu.sorular.length} soru`}
          style={stiller.satir}
        >
          <View style={stiller.bilgi}>
            <Yazi tur="govdeKalin">{konu.ad}</Yazi>
            <Yazi tur="kucuk" renk={konu.sorular.length === 0 ? 'uyari' : 'yaziIkincil'}>
              {konu.sorular.length === 0 ? 'Soru yok' : `${konu.sorular.length} soru`}
            </Yazi>
          </View>
          <Yazi renk="yaziSoluk">›</Yazi>
        </Kart>
      )}
    />
  );
}

const stiller = StyleSheet.create({
  sayfa: { flex: 1, padding: bosluk.l },
  icerik: { padding: bosluk.l, gap: bosluk.s, paddingBottom: bosluk.xxl },
  ozet: { marginBottom: bosluk.xs },
  satir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  bilgi: { flex: 1, gap: 3 },
});
