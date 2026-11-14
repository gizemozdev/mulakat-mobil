import { Stack, router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, type TextInputInstance } from 'react-native';

import { istekAt } from '@/api/istekAt';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { Ekran } from '@/bilesenler/Ekran';
import { Girdi } from '@/bilesenler/Girdi';
import { HataKutusu } from '@/bilesenler/HataKutusu';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';

// Yeni hesap. Kurallar web'dekiyle aynı (lib/kullaniciDogrula.ts): kullanıcı adı en az 3 karakter
// ve boşluksuz, şifre en az 6 karakter. Burada da önceden denetlenir, son söz sunucunun.
export default function KullaniciFormu() {
  const [adSoyad, setAdSoyad] = useState('');
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const kullaniciAdiAlani = useRef<TextInputInstance>(null);
  const sifreAlani = useRef<TextInputInstance>(null);

  const kaydet = async () => {
    const ad = kullaniciAdi.trim();

    if (!adSoyad.trim() || !ad) return setHata('Ad soyad ve kullanıcı adı boş bırakılamaz.');
    if (ad.length < 3 || /\s/.test(ad)) return setHata('Kullanıcı adı en az 3 karakter olmalı ve boşluk içermemelidir.');
    if (sifre.length < 6) return setHata('Şifre en az 6 karakter olmalıdır.');

    setHata('');
    setKaydediliyor(true);

    const { hata: istekHatasi } = await istekAt('/api/kullanicilar', 'POST', {
      adSoyad: adSoyad.trim(),
      kullaniciAdi: ad,
      sifre,
    });

    setKaydediliyor(false);

    if (istekHatasi) setHata(istekHatasi);
    else router.back();
  };

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: 'Yeni Hesap',
          headerLeft: () => <BaslikDugmesi yazi="Vazgeç" onPress={() => router.back()} />,
        }}
      />

      <Kart style={stiller.form}>
        <Girdi
          etiket="Ad Soyad"
          value={adSoyad}
          onChangeText={setAdSoyad}
          autoFocus
          autoCapitalize="words"
          autoComplete="off"
          returnKeyType="next"
          onSubmitEditing={() => kullaniciAdiAlani.current?.focus()}
        />
        <Girdi
          ref={kullaniciAdiAlani}
          etiket="Kullanıcı adı"
          value={kullaniciAdi}
          onChangeText={setKullaniciAdi}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="next"
          onSubmitEditing={() => sifreAlani.current?.focus()}
        />
        <Girdi
          ref={sifreAlani}
          etiket="Geçici şifre"
          value={sifre}
          onChangeText={setSifre}
          sifre
          autoCapitalize="none"
          autoComplete="off"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={kaydet}
        />
        <Yazi tur="kucuk" renk="yaziIkincil">
          Şifreyi kişiye kendin ilet; giriş yaptıktan sonra Kullanıcılar &gt; Şifremi değiştir ile değiştirebilir.
        </Yazi>
        <HataKutusu mesaj={hata} />
        <Dugme yazi="Hesabı Ekle" onPress={kaydet} yukleniyor={kaydediliyor} />
      </Kart>
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
});
