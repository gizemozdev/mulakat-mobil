import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { istekAt } from '@/api/istekAt';
import type { Kullanici } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { Dugme } from '@/bilesenler/Dugme';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Kart } from '@/bilesenler/Kart';
import { BasHarf, Etiket } from '@/bilesenler/Kucukler';
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

  // Başka bir hesaba dokununca telefonun seçenek penceresi: şifre sıfırla ya da sil
  const secenekler = (kullanici: Kullanici) =>
    Alert.alert(kullanici.adSoyad, kullanici.kullaniciAdi, [
      {
        text: 'Şifresini sıfırla',
        onPress: () => router.push({ pathname: '/daha-fazla/sifre-sifirla', params: { id: kullanici.id } }),
      },
      { text: 'Hesabı sil', style: 'destructive', onPress: () => sil(kullanici) },
      { text: 'Vazgeç', style: 'cancel' },
    ]);

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
          onPress={kullanici.ben || islenen !== null ? undefined : () => secenekler(kullanici)}
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
