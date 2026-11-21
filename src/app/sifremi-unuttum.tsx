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

type Adim = 'eposta' | 'kod';

// Giriş yapmadan açılan iki adımlı ekran:
// 1) e-postaya kod istenir (şifremi unuttum)  2) kod + yeni şifre yazılır.
// Davet e-postası alan yeni kullanıcı kodu zaten bildiği için doğrudan 2. adıma geçer.
export default function SifremiUnuttum() {
  const [adim, setAdim] = useState<Adim>('eposta');
  const [eposta, setEposta] = useState('');
  const [kod, setKod] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [tekrar, setTekrar] = useState('');
  const [bilgi, setBilgi] = useState('');
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const sifreAlani = useRef<TextInputInstance>(null);
  const tekrarAlani = useRef<TextInputInstance>(null);

  const epostaGecerli = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta.trim());

  const kodIste = async () => {
    if (!epostaGecerli) return setHata('Geçerli bir e-posta adresi yazın.');

    setHata('');
    setGonderiliyor(true);

    // Sunucu, hesap olsun olmasın aynı cevabı verir (kimin hesabı olduğu buradan öğrenilemesin)
    const { veri, hata: istekHatasi } = await istekAt<{ mesaj: string }>('/api/sifre-kodu', 'POST', {
      eposta: eposta.trim(),
    });

    setGonderiliyor(false);

    if (!veri) return setHata(istekHatasi);

    setBilgi(veri.mesaj);
    setAdim('kod');
  };

  const sifreBelirle = async () => {
    if (!epostaGecerli) return setHata('Geçerli bir e-posta adresi yazın.');
    if (!/^\d{6}$/.test(kod.trim())) return setHata('Kod 6 haneli bir sayıdır.');
    if (yeniSifre.length < 6) return setHata('Şifre en az 6 karakter olmalıdır.');
    if (yeniSifre !== tekrar) return setHata('Yeni şifre ile tekrarı aynı değil.');

    setHata('');
    setGonderiliyor(true);

    const { hata: istekHatasi } = await istekAt('/api/sifre-belirle', 'POST', {
      eposta: eposta.trim(),
      kod: kod.trim(),
      yeniSifre,
    });

    setGonderiliyor(false);

    if (istekHatasi) return setHata(istekHatasi);

    Alert.alert('Şifren belirlendi', 'Artık kullanıcı adın ve yeni şifrenle giriş yapabilirsin.');
    router.back();
  };

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: adim === 'eposta' ? 'Şifremi Unuttum' : 'Yeni Şifre',
          headerLeft: () => <BaslikDugmesi yazi="Vazgeç" onPress={() => router.back()} />,
        }}
      />

      {adim === 'eposta' ? (
        <Kart style={stiller.form}>
          <Yazi>Hesabındaki e-posta adresini yaz; 6 haneli bir kod gönderelim.</Yazi>
          <Girdi
            etiket="E-posta"
            value={eposta}
            onChangeText={setEposta}
            autoFocus
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={kodIste}
          />
          <HataKutusu mesaj={hata} />
          <Dugme yazi="Kod gönder" onPress={kodIste} yukleniyor={gonderiliyor} />
          <Dugme
            yazi="Kodum zaten var (davet)"
            tur="metin"
            onPress={() => {
              setHata('');
              setAdim('kod');
            }}
          />
          <Yazi tur="kucuk" renk="yaziIkincil">
            Hesabında e-posta yoksa, uygulamayı kullanan başka biri Kullanıcılar bölümünden şifreni sıfırlayabilir.
          </Yazi>
        </Kart>
      ) : (
        <Kart style={stiller.form}>
          {bilgi ? <Yazi tur="kucuk">{bilgi}</Yazi> : null}
          <Girdi
            etiket="E-posta"
            value={eposta}
            onChangeText={setEposta}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Girdi
            etiket="Kod"
            value={kod}
            onChangeText={(metin) => setKod(metin.replace(/\D/g, '').slice(0, 6))}
            placeholder="6 haneli kod"
            autoFocus={Boolean(eposta)}
            keyboardType="number-pad"
            // iOS, e-postadan gelen kodu klavyenin üstünde önerebilir
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            returnKeyType="next"
            onSubmitEditing={() => sifreAlani.current?.focus()}
          />
          <Girdi
            ref={sifreAlani}
            etiket="Yeni şifre"
            value={yeniSifre}
            onChangeText={setYeniSifre}
            sifre
            autoCapitalize="none"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => tekrarAlani.current?.focus()}
          />
          <Girdi
            ref={tekrarAlani}
            etiket="Yeni şifre (tekrar)"
            value={tekrar}
            onChangeText={setTekrar}
            sifre
            autoCapitalize="none"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={sifreBelirle}
          />
          <HataKutusu mesaj={hata} />
          <Dugme yazi="Şifreyi belirle" onPress={sifreBelirle} yukleniyor={gonderiliyor} />
          <Dugme
            yazi="Yeni kod iste"
            tur="metin"
            onPress={() => {
              setHata('');
              setAdim('eposta');
            }}
          />
        </Kart>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
});
