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
import { Secim } from '@/bilesenler/Secim';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';

type Yontem = 'davet' | 'sifre';

const epostaGecerli = (eposta: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta);

// Yeni hesap. İki yol var:
// - Davet (varsayılan): kişiye e-postayla kod gider, şifresini kendisi belirler; şifreyi kimse başkasına söylemez
// - Geçici şifre: e-posta gönderilemeyen durumlar için eski yol (e-posta isteğe bağlı)
// Kurallar web'dekiyle aynı (lib/kullaniciDogrula.ts); burada önceden denetlenir, son söz sunucunun.
export default function KullaniciFormu() {
  const [yontem, setYontem] = useState<Yontem>('davet');
  const [adSoyad, setAdSoyad] = useState('');
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const kullaniciAdiAlani = useRef<TextInputInstance>(null);
  const epostaAlani = useRef<TextInputInstance>(null);
  const sifreAlani = useRef<TextInputInstance>(null);

  const davet = yontem === 'davet';

  const kaydet = async () => {
    const ad = kullaniciAdi.trim();
    const adres = eposta.trim();

    if (!adSoyad.trim() || !ad) return setHata('Ad soyad ve kullanıcı adı boş bırakılamaz.');
    if (ad.length < 3 || /\s/.test(ad)) return setHata('Kullanıcı adı en az 3 karakter olmalı ve boşluk içermemelidir.');
    if (davet && !adres) return setHata('Davet için e-posta adresi gerekli.');
    if (adres && !epostaGecerli(adres)) return setHata('Geçerli bir e-posta adresi yazın.');
    if (!davet && sifre.length < 6) return setHata('Şifre en az 6 karakter olmalıdır.');

    setHata('');
    setKaydediliyor(true);

    const { hata: istekHatasi } = await istekAt(
      '/api/kullanicilar',
      'POST',
      davet
        ? { adSoyad: adSoyad.trim(), kullaniciAdi: ad, eposta: adres, davet: true }
        : { adSoyad: adSoyad.trim(), kullaniciAdi: ad, eposta: adres, sifre }
    );

    setKaydediliyor(false);

    if (istekHatasi) {
      setHata(istekHatasi);
      return;
    }

    if (davet) Alert.alert('Davet gönderildi', `${adres} adresine bir kod gönderildi. Kişi bu kodla kendi şifresini belirleyecek.`);
    router.back();
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
          onSubmitEditing={() => epostaAlani.current?.focus()}
        />
        <Girdi
          ref={epostaAlani}
          etiket={davet ? 'E-posta' : 'E-posta (isteğe bağlı)'}
          value={eposta}
          onChangeText={setEposta}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          returnKeyType={davet ? 'done' : 'next'}
          onSubmitEditing={() => (davet ? kaydet() : sifreAlani.current?.focus())}
        />

        <Secim
          etiket="Şifre"
          secenekler={[
            { deger: 'davet' as Yontem, etiket: 'Kendisi belirlesin' },
            { deger: 'sifre', etiket: 'Geçici şifre ver' },
          ]}
          secili={yontem}
          onSec={setYontem}
        />

        {davet ? (
          <Yazi tur="kucuk" renk="yaziIkincil">
            Kişiye e-postayla 6 haneli bir davet kodu gider. Giriş ekranındaki &quot;Şifremi unuttum / davet kodum
            var&quot; bölümünden bu kodla kendi şifresini belirler. Kod 72 saat geçerlidir.
          </Yazi>
        ) : (
          <>
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
          </>
        )}

        <HataKutusu mesaj={hata} />
        <Dugme yazi={davet ? 'Davet gönder' : 'Hesabı Ekle'} onPress={kaydet} yukleniyor={kaydediliyor} />
      </Kart>
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
});
