import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { istekAt } from '@/api/istekAt';
import type { Kullanici } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Girdi } from '@/bilesenler/Girdi';
import { HataKutusu } from '@/bilesenler/HataKutusu';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';

// Bir hesabın e-postasını ekleme / değiştirme / kaldırma ("?id=5").
// E-postası olmayan eski hesaplar böylece "şifremi unuttum"u kullanabilir.
export default function EpostaFormu() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [eposta, setEposta] = useState('');
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');
  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    istekAt<Kullanici[]>('/api/kullanicilar').then(({ veri, hata: istekHatasi }) => {
      const bulunan = veri?.find((kayit) => String(kayit.id) === id);

      if (!bulunan) {
        setYuklemeHatasi(istekHatasi || 'Hesap bulunamadı. Silinmiş olabilir.');
        return;
      }

      setEposta(bulunan.eposta ?? '');
      setKullanici(bulunan);
    });
  }, [id]);

  const kaydet = async () => {
    const adres = eposta.trim();

    // Boş bırakmak e-postayı kaldırır; doluysa biçimi önceden denetlenir
    if (adres && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adres)) return setHata('Geçerli bir e-posta adresi yazın.');

    setHata('');
    setKaydediliyor(true);

    const { hata: istekHatasi } = await istekAt(`/api/kullanicilar/${id}/eposta`, 'PUT', { eposta: adres });

    setKaydediliyor(false);

    if (istekHatasi) setHata(istekHatasi);
    else router.back();
  };

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: kullanici?.ben ? 'E-postam' : 'E-posta',
          headerLeft: () => <BaslikDugmesi yazi="Vazgeç" onPress={() => router.back()} />,
        }}
      />

      {yuklemeHatasi ? (
        <HataDurumu mesaj={yuklemeHatasi} />
      ) : !kullanici ? (
        <Yukleniyor />
      ) : (
        <Kart style={stiller.form}>
          <Yazi>
            {kullanici.adSoyad} ({kullanici.kullaniciAdi})
          </Yazi>
          <Girdi
            etiket="E-posta"
            value={eposta}
            onChangeText={setEposta}
            placeholder="Boş bırakılırsa e-posta kaldırılır"
            autoFocus
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="done"
            onSubmitEditing={kaydet}
          />
          <Yazi tur="kucuk" renk="yaziIkincil">
            Şifremi unuttum kodu bu adrese gider. Adres değişince eski adrese gönderilmiş kodlar geçersiz olur.
          </Yazi>
          <HataKutusu mesaj={hata} />
          <Dugme yazi="Kaydet" onPress={kaydet} yukleniyor={kaydediliyor} />
        </Kart>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
});
