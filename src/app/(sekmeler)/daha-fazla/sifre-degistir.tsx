import { Stack, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, type TextInputInstance } from 'react-native';

import { istekAt } from '@/api/istekAt';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { Ekran } from '@/bilesenler/Ekran';
import { Girdi } from '@/bilesenler/Girdi';
import { HataKutusu } from '@/bilesenler/HataKutusu';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';

// Kendi şifreni değiştirme. Sunucu bu telefondaki oturumu açık bırakır, diğer cihazlardaki oturumları kapatır.
export default function SifreDegistir() {
  const [mevcutSifre, setMevcutSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [tekrar, setTekrar] = useState('');
  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const yeniAlan = useRef<TextInputInstance>(null);
  const tekrarAlan = useRef<TextInputInstance>(null);

  const kaydet = async () => {
    if (!mevcutSifre) return setHata('Mevcut şifreni yaz.');
    if (yeniSifre.length < 6) return setHata('Yeni şifre en az 6 karakter olmalıdır.');
    // Tekrar alanı yalnızca telefonda denetlenir: sunucuya tek şifre gider
    if (yeniSifre !== tekrar) return setHata('Yeni şifre ile tekrarı aynı değil.');

    setHata('');
    setKaydediliyor(true);

    const { hata: istekHatasi } = await istekAt('/api/sifre', 'PUT', { mevcutSifre, yeniSifre });

    setKaydediliyor(false);

    if (istekHatasi) {
      setHata(istekHatasi);
      return;
    }

    Alert.alert('Şifren değişti', 'Başka cihazlardaki oturumların kapatıldı; bu telefonda açık kalır.');
    router.back();
  };

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: 'Şifremi Değiştir',
          headerLeft: () => <BaslikDugmesi yazi="Vazgeç" onPress={() => router.back()} />,
        }}
      />

      <Kart style={stiller.form}>
        <Girdi
          etiket="Mevcut şifre"
          value={mevcutSifre}
          onChangeText={setMevcutSifre}
          sifre
          autoFocus
          autoCapitalize="none"
          textContentType="password"
          returnKeyType="next"
          onSubmitEditing={() => yeniAlan.current?.focus()}
        />
        <Girdi
          ref={yeniAlan}
          etiket="Yeni şifre"
          value={yeniSifre}
          onChangeText={setYeniSifre}
          sifre
          autoCapitalize="none"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => tekrarAlan.current?.focus()}
        />
        <Girdi
          ref={tekrarAlan}
          etiket="Yeni şifre (tekrar)"
          value={tekrar}
          onChangeText={setTekrar}
          sifre
          autoCapitalize="none"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={kaydet}
        />
        <Yazi tur="kucuk" renk="yaziIkincil">
          En az 6 karakter.
        </Yazi>
        <HataKutusu mesaj={hata} />
        <Dugme yazi="Şifreyi değiştir" onPress={kaydet} yukleniyor={kaydediliyor} />
      </Kart>
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
});
