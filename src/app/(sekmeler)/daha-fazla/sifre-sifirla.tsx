import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { istekAt } from '@/api/istekAt';
import type { Kullanici } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { Ekran } from '@/bilesenler/Ekran';
import { Girdi } from '@/bilesenler/Girdi';
import { HataKutusu } from '@/bilesenler/HataKutusu';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';

// Şifresini unutan bir arkadaşın şifresini sıfırlama (web'deki "şifremi unuttum" akışının telefondaki karşılığı)
export default function SifreSifirla() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [yeniSifre, setYeniSifre] = useState('');
  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    istekAt<Kullanici[]>('/api/kullanicilar').then(({ veri }) =>
      setKullanici(veri?.find((kayit) => String(kayit.id) === id) ?? null)
    );
  }, [id]);

  const kaydet = async () => {
    if (yeniSifre.length < 6) return setHata('Şifre en az 6 karakter olmalıdır.');

    setHata('');
    setKaydediliyor(true);

    const { hata: istekHatasi } = await istekAt(`/api/kullanicilar/${id}/sifre`, 'PUT', { yeniSifre });

    setKaydediliyor(false);

    if (istekHatasi) {
      setHata(istekHatasi);
      return;
    }

    Alert.alert('Şifre sıfırlandı', 'Yeni şifreyi kişiye kendin ilet.');
    router.back();
  };

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: 'Şifre Sıfırla',
          headerLeft: () => <BaslikDugmesi yazi="Vazgeç" onPress={() => router.back()} />,
        }}
      />

      <Kart style={stiller.form}>
        <Yazi>
          {kullanici ? `${kullanici.adSoyad} (${kullanici.kullaniciAdi})` : 'Hesap'} için yeni bir şifre belirle.
        </Yazi>
        <Girdi
          etiket="Yeni şifre"
          value={yeniSifre}
          onChangeText={setYeniSifre}
          sifre
          autoFocus
          autoCapitalize="none"
          autoComplete="off"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={kaydet}
        />
        <HataKutusu mesaj={hata} />
        <Dugme yazi="Şifreyi sıfırla" onPress={kaydet} yukleniyor={kaydediliyor} />
      </Kart>
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
});
