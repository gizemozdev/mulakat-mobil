import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { alanAdi, type Alan, type Kullanici, type Mulakatci } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Kart } from '@/bilesenler/Kart';
import { BasHarf, Etiket } from '@/bilesenler/Kucukler';
import { Secim } from '@/bilesenler/Secim';
import { uzunBasmaMenusu } from '@/bilesenler/uzunBasma';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Mülakatçı listesi: alan etiketi ve bağlı olduğu uygulama hesabı
export default function Mulakatcilar() {
  const { renk } = useTema();
  const mulakatciVerisi = useVeri<Mulakatci[]>('/api/mulakatcilar');
  const kullaniciVerisi = useVeri<Kullanici[]>('/api/kullanicilar');

  const [alan, setAlan] = useState<Alan | null>(null);

  const mulakatcilar = mulakatciVerisi.veri;
  const hata = mulakatciVerisi.hata || kullaniciVerisi.hata;

  const yenile = async () => {
    await Promise.all([mulakatciVerisi.yenile(), kullaniciVerisi.yenile()]);
  };

  const kullanicilar = new Map((kullaniciVerisi.veri ?? []).map((kullanici) => [kullanici.id, kullanici]));
  const gorunenler = (mulakatcilar ?? []).filter((mulakatci) => alan === null || mulakatci.alan === alan);

  if (!mulakatcilar) {
    return (
      <View style={[stiller.sayfa, { backgroundColor: renk.zemin }]}>
        {hata ? <HataDurumu mesaj={hata} tekrarDene={yenile} /> : <Yukleniyor />}
      </View>
    );
  }

  return (
    <FlatList
      data={gorunenler}
      keyExtractor={(mulakatci) => String(mulakatci.id)}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: renk.zemin }}
      contentContainerStyle={stiller.icerik}
      refreshControl={
        <RefreshControl
          refreshing={mulakatciVerisi.yenileniyor || kullaniciVerisi.yenileniyor}
          onRefresh={yenile}
          tintColor={renk.marka}
        />
      }
      ListHeaderComponent={
        mulakatcilar.length > 0 ? (
          <View style={stiller.ust}>
            <Secim
              secenekler={[
                { deger: null, etiket: `Tümü (${mulakatcilar.length})` },
                { deger: 'ik', etiket: 'İK' },
                { deger: 'teknik', etiket: 'Teknik' },
              ]}
              secili={alan}
              onSec={setAlan}
            />
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        mulakatcilar.length === 0 ? (
          <BosDurum baslik="Henüz mülakatçı yok" aciklama="Sağ üstteki Ekle ile ilk mülakatçıyı ekleyebilirsin." />
        ) : (
          <BosDurum baslik={`${alan ? alanAdi[alan] : ''} alanında mülakatçı yok`} />
        )
      }
      renderItem={({ item: mulakatci }) => {
        const hesap = mulakatci.kullaniciId ? kullanicilar.get(mulakatci.kullaniciId) : undefined;

        return (
          <Kart
            onPress={() => router.push({ pathname: '/daha-fazla/mulakatci-form', params: { id: mulakatci.id } })}
            onLongPress={() =>
              uzunBasmaMenusu({
                baslik: mulakatci.adSoyad,
                duzenle: () => router.push({ pathname: '/daha-fazla/mulakatci-form', params: { id: mulakatci.id } }),
                sil: {
                  baslik: 'Mülakatçı silinsin mi?',
                  mesaj: `${mulakatci.adSoyad} silinecek. Atandığı mülakatlar silinmez, yalnızca mülakatçı alanı boş kalır.`,
                  yol: `/api/mulakatcilar/${mulakatci.id}`,
                  sonra: yenile,
                },
              })
            }
            erisimEtiketi={`${mulakatci.adSoyad}, ${alanAdi[mulakatci.alan]}`}
            style={stiller.satir}
          >
            <BasHarf adSoyad={mulakatci.adSoyad} />

            <View style={stiller.bilgi}>
              <Yazi tur="govdeKalin" numberOfLines={1}>
                {mulakatci.adSoyad}
              </Yazi>
              <Etiket
                yazi={alanAdi[mulakatci.alan]}
                on={mulakatci.alan === 'ik' ? renk.ik : renk.teknik}
                zemin={mulakatci.alan === 'ik' ? renk.ikAcik : renk.teknikAcik}
              />
              {hesap && (
                <Yazi tur="kucuk" renk="yaziIkincil" numberOfLines={1}>
                  Hesap: {hesap.kullaniciAdi}
                </Yazi>
              )}
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
  ust: { marginBottom: bosluk.s },
  satir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  bilgi: { flex: 1, gap: 4 },
});
