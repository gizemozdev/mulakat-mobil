import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { akisUyarilari } from '@/api/ikAkis';
import type { IkAkis } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Kart } from '@/bilesenler/Kart';
import { Etiket } from '@/bilesenler/Kucukler';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// İK akışları: Genel Sorular (her mülakatta) en üstte, altında pozisyona özel akışlar.
// Uyarısı olan akışın satırında kaç sorun olduğu görünür, ayrıntısı akışın ekranında.
export default function IkAkislari() {
  const { renk } = useTema();
  const { veri: akislar, hata, yenileniyor, yenile } = useVeri<IkAkis[]>('/api/ik-akislar');

  if (!akislar) {
    return (
      <View style={[stiller.sayfa, { backgroundColor: renk.zemin }]}>
        {hata ? <HataDurumu mesaj={hata} tekrarDene={yenile} /> : <Yukleniyor />}
      </View>
    );
  }

  return (
    <FlatList
      data={akislar}
      keyExtractor={(akis) => String(akis.id)}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: renk.zemin }}
      contentContainerStyle={stiller.icerik}
      refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={renk.marka} />}
      renderItem={({ item: akis }) => {
        const uyariSayisi = akisUyarilari(akis).length;

        return (
          <Kart
            onPress={() => router.push({ pathname: '/daha-fazla/ik-akis/[id]', params: { id: akis.id } })}
            erisimEtiketi={`${akis.ad}, ${akis.sorular.length} soru${uyariSayisi ? `, ${uyariSayisi} uyarı` : ''}`}
            style={stiller.satir}
          >
            <View style={stiller.bilgi}>
              <Yazi tur="govdeKalin">{akis.ad}</Yazi>
              <Yazi tur="kucuk" renk="yaziIkincil" numberOfLines={2}>
                {akis.sorular.length} soru ·{' '}
                {akis.genel
                  ? 'Her mülakatta sorulur'
                  : akis.pozisyonlar.length
                    ? akis.pozisyonlar.map((pozisyon) => pozisyon.ad).join(', ')
                    : 'Pozisyona bağlı değil'}
              </Yazi>
              {uyariSayisi > 0 && <Etiket yazi={`${uyariSayisi} uyarı`} on={renk.uyari} zemin={renk.uyariAcik} />}
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
  bilgi: { flex: 1, gap: 4 },
});
