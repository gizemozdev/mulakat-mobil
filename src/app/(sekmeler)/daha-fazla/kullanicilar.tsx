import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Platform, RefreshControl, StyleSheet, View } from 'react-native';

import { istekAt } from '@/api/istekAt';
import type { Kullanici } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { Dugme } from '@/bilesenler/Dugme';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Kart } from '@/bilesenler/Kart';
import { BasHarf, Etiket } from '@/bilesenler/Kucukler';
import { titret } from '@/bilesenler/uzunBasma';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Uygulama hesapları. Rol yok (kullanıcı kararı): her kullanıcı hesap ekleyip silebilir,
// başkasının şifresini sıfırlayabilir. Kendi hesabı silinemez, kendi şifresi ayrı ekrandan değişir.
export default function Kullanicilar() {
  const { renk } = useTema();
  const { veri: kullanicilar, hata, yenileniyor, yenile, setVeri } = useVeri<Kullanici[]>('/api/kullanicilar');
  const [islenen, setIslenen] = useState<number | null>(null);

  if (!kullanicilar) {
    return (
      <View style={[stiller.sayfa, { backgroundColor: renk.zemin }]}>
        {hata ? <HataDurumu mesaj={hata} tekrarDene={yenile} /> : <Yukleniyor />}
      </View>
    );
  }

  const sil = (kullanici: Kullanici) =>
    Alert.alert(
      'Hesap silinsin mi?',
      `${kullanici.adSoyad} (${kullanici.kullaniciAdi}) artık uygulamaya giremez. Bu geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setIslenen(kullanici.id);
            const { hata: istekHatasi } = await istekAt(`/api/kullanicilar/${kullanici.id}`, 'DELETE');
            setIslenen(null);

            if (istekHatasi) Alert.alert('Hesap silinemedi', istekHatasi);
            else setVeri(kullanicilar.filter((kayit) => kayit.id !== kullanici.id));
          },
        },
      ]
    );

  const epostaDegistir = (kullanici: Kullanici) =>
    router.push({ pathname: '/daha-fazla/eposta-form', params: { id: kullanici.id } });

  const sifreSifirla = (kullanici: Kullanici) =>
    router.push({ pathname: '/daha-fazla/sifre-sifirla', params: { id: kullanici.id } });

  // Bir hesaba dokununca telefonun seçenek penceresi.
  // Kendi hesabı: e-posta ve şifre (silinemez). Başkasının hesabı: e-posta, şifre sıfırla, sil.
  //
  // Android'deki pencere en fazla 3 düğme gösterir (fazlası görünmez). Başkasının hesabında 4 seçenek
  // olduğu için Android'de e-posta ve şifre ikinci bir pencereye alınır; iPhone'da hepsi tek pencerede.
  const secenekler = (kullanici: Kullanici) => {
    const baslik = kullanici.adSoyad;
    const aciklama = kullanici.eposta ?? 'E-posta eklenmemiş';

    if (kullanici.ben) {
      Alert.alert(baslik, aciklama, [
        { text: 'E-postamı değiştir', onPress: () => epostaDegistir(kullanici) },
        { text: 'Şifremi değiştir', onPress: () => router.push('/daha-fazla/sifre-degistir') },
        { text: 'Vazgeç', style: 'cancel' },
      ]);
      return;
    }

    if (Platform.OS === 'android') {
      Alert.alert(baslik, aciklama, [
        {
          text: 'E-posta / şifre…',
          onPress: () =>
            Alert.alert(baslik, undefined, [
              { text: 'E-postasını değiştir', onPress: () => epostaDegistir(kullanici) },
              { text: 'Şifresini sıfırla', onPress: () => sifreSifirla(kullanici) },
              { text: 'Vazgeç', style: 'cancel' },
            ]),
        },
        { text: 'Hesabı sil', style: 'destructive', onPress: () => sil(kullanici) },
        { text: 'Vazgeç', style: 'cancel' },
      ]);
      return;
    }

    Alert.alert(baslik, aciklama, [
      { text: 'E-postasını değiştir', onPress: () => epostaDegistir(kullanici) },
      { text: 'Şifresini sıfırla', onPress: () => sifreSifirla(kullanici) },
      { text: 'Hesabı sil', style: 'destructive', onPress: () => sil(kullanici) },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  };

  return (
    <FlatList
      data={kullanicilar}
      keyExtractor={(kullanici) => String(kullanici.id)}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: renk.zemin }}
      contentContainerStyle={stiller.icerik}
      refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={renk.marka} />}
      ListHeaderComponent={
        <Dugme
          yazi="Şifremi değiştir"
          tur="ikincil"
          onPress={() => router.push('/daha-fazla/sifre-degistir')}
          style={stiller.ust}
        />
      }
      renderItem={({ item: kullanici }) => (
        <Kart
          // Kendi hesabında seçenek yok: silinemez, şifresi yukarıdaki düğmeyle değişir
          onPress={islenen !== null ? undefined : () => secenekler(kullanici)}
          onLongPress={
            islenen !== null
              ? undefined
              : () => {
                  titret();
                  secenekler(kullanici);
                }
          }
          erisimEtiketi={`${kullanici.adSoyad}, ${kullanici.kullaniciAdi}${kullanici.ben ? ', senin hesabın' : ''}`}
          style={stiller.satir}
        >
          <BasHarf adSoyad={kullanici.adSoyad} />
          <View style={stiller.bilgi}>
            <Yazi tur="govdeKalin" numberOfLines={1}>
              {kullanici.adSoyad}
            </Yazi>
            <Yazi tur="kucuk" renk="yaziIkincil" numberOfLines={1}>
              {kullanici.kullaniciAdi}
            </Yazi>
            {/* Kullanıcı adı zaten e-postaysa ikinci kez yazılmaz */}
            {kullanici.eposta && kullanici.eposta !== kullanici.kullaniciAdi.toLowerCase() ? (
              <Yazi tur="kucuk" renk="yaziSoluk" numberOfLines={1}>
                {kullanici.eposta}
              </Yazi>
            ) : null}
          </View>
          {kullanici.ben ? (
            <Etiket yazi="Sen" on={renk.marka} zemin={renk.markaAcik} />
          ) : (
            <Yazi renk="yaziSoluk">{islenen === kullanici.id ? '…' : '›'}</Yazi>
          )}
        </Kart>
      )}
    />
  );
}

const stiller = StyleSheet.create({
  sayfa: { flex: 1, padding: bosluk.l },
  icerik: { padding: bosluk.l, gap: bosluk.s, paddingBottom: bosluk.xxl },
  ust: { marginBottom: bosluk.s },
  satir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  bilgi: { flex: 1, gap: 2 },
});
