import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import type { Aday } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Kart } from '@/bilesenler/Kart';
import { AramaKutusu, BasHarf, KararEtiketi, metinIceriyor } from '@/bilesenler/Kucukler';
import { Secim } from '@/bilesenler/Secim';
import { uzunBasmaMenusu } from '@/bilesenler/uzunBasma';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

export default function Adaylar() {
  const { renk } = useTema();
  const { veri: adaylar, hata, yenileniyor, yenile } = useVeri<Aday[]>('/api/adaylar');

  const [arama, setArama] = useState('');
  const [pozisyonId, setPozisyonId] = useState<number | null>(null);

  // Süzgeçte yalnızca adayı olan pozisyonlar, ada göre sıralı ve tekrarsız
  const pozisyonlar = [...new Map((adaylar ?? []).map((aday) => [aday.pozisyon.id, aday.pozisyon])).values()].sort(
    (a, b) => a.ad.localeCompare(b.ad, 'tr')
  );

  const gorunenler = (adaylar ?? []).filter(
    (aday) =>
      [aday.adSoyad, aday.pozisyon.ad, aday.eposta, aday.telefon].some((alan) => metinIceriyor(alan, arama)) &&
      (pozisyonId === null || aday.pozisyon.id === pozisyonId)
  );

  if (!adaylar) {
    return (
      <View style={[stiller.sayfa, { backgroundColor: renk.zemin }]}>
        {hata ? <HataDurumu mesaj={hata} tekrarDene={yenile} /> : <Yukleniyor />}
      </View>
    );
  }

  return (
    <FlatList
      data={gorunenler}
      keyExtractor={(aday) => String(aday.id)}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={{ backgroundColor: renk.zemin }}
      contentContainerStyle={stiller.icerik}
      refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={renk.marka} />}
      ListHeaderComponent={
        adaylar.length > 0 ? (
          <View style={stiller.ust}>
            <AramaKutusu deger={arama} onDegistir={setArama} yerTutucu="Ad, pozisyon, e-posta ya da telefon ara" />

            {pozisyonlar.length > 1 && (
              <Secim
                kaydirilabilir
                secenekler={[{ deger: null, etiket: 'Tümü' }, ...pozisyonlar.map((p) => ({ deger: p.id, etiket: p.ad }))]}
                secili={pozisyonId}
                onSec={setPozisyonId}
              />
            )}

            {gorunenler.length !== adaylar.length && (
              <Yazi tur="kucuk" renk="yaziIkincil">
                {adaylar.length} adaydan {gorunenler.length} tanesi gösteriliyor
              </Yazi>
            )}
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        adaylar.length === 0 ? (
          <BosDurum baslik="Henüz aday yok" aciklama="Sağ üstteki Ekle ile ilk adayı ekleyebilirsin." />
        ) : (
          <BosDurum baslik="Aramaya uyan aday yok" />
        )
      }
      renderItem={({ item: aday }) => (
        <Kart
          onPress={() => router.push(`/adaylar/${aday.id}`)}
          onLongPress={() =>
            uzunBasmaMenusu({
              baslik: aday.adSoyad,
              duzenle: () => router.push({ pathname: '/adaylar/form', params: { id: aday.id } }),
              sil: {
                baslik: 'Aday silinsin mi?',
                mesaj: `${aday.adSoyad} ve bütün mülakat kayıtları silinecek. Bu geri alınamaz.`,
                yol: `/api/adaylar/${aday.id}`,
                sonra: yenile,
              },
            })
          }
          erisimEtiketi={`${aday.adSoyad}, ${aday.pozisyon.ad}`}
          style={stiller.satir}
        >
          <BasHarf adSoyad={aday.adSoyad} />

          <View style={stiller.bilgi}>
            <Yazi tur="govdeKalin" numberOfLines={1}>
              {aday.adSoyad}
            </Yazi>
            <Yazi tur="kucuk" renk="yaziIkincil" numberOfLines={1}>
              {aday.pozisyon.ad}
              {aday.cv ? '  ·  CV var' : ''}
            </Yazi>
            {aday.karar !== 'Değerlendiriliyor' && <KararEtiketi karar={aday.karar} />}
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
  ust: { gap: bosluk.m, marginBottom: bosluk.s },
  satir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  bilgi: { flex: 1, gap: 3 },
});
