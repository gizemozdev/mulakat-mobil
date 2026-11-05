import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { istekAt } from '@/api/istekAt';
import type { Pozisyon } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Girdi } from '@/bilesenler/Girdi';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Pozisyon ekleme; "?id=3" ile açılırsa düzenleme ve silme
export default function PozisyonFormu() {
  const { renk } = useTema();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const duzenleme = Boolean(id);

  const [ad, setAd] = useState('');
  const [hazir, setHazir] = useState(!duzenleme);
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');

  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);

  // Tek pozisyonu getiren uç olmadığı için liste alınıp içinden bulunur
  useEffect(() => {
    if (!id) return;

    istekAt<Pozisyon[]>('/api/pozisyonlar').then(({ veri, hata: istekHatasi }) => {
      const pozisyon = veri?.find((kayit) => String(kayit.id) === id);

      if (pozisyon) {
        setAd(pozisyon.ad);
        setHazir(true);
      } else {
        setYuklemeHatasi(istekHatasi || 'Pozisyon bulunamadı. Silinmiş olabilir.');
      }
    });
  }, [id]);

  const kaydet = async () => {
    if (!ad.trim()) {
      setHata('Pozisyon adı boş bırakılamaz.');
      return;
    }

    setHata('');
    setKaydediliyor(true);

    // Aynı adda pozisyon varsa sunucu 409 ile "Bu pozisyon zaten tanımlı." der
    const { hata: istekHatasi } = await istekAt(
      duzenleme ? `/api/pozisyonlar/${id}` : '/api/pozisyonlar',
      duzenleme ? 'PUT' : 'POST',
      { ad: ad.trim() }
    );

    setKaydediliyor(false);

    if (istekHatasi) setHata(istekHatasi);
    else router.back();
  };

  const sil = () =>
    Alert.alert('Pozisyon silinsin mi?', `"${ad}" pozisyonu silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setSiliniyor(true);
          // Başvuran aday varsa sunucu silmeyi reddeder ve sebebini söyler
          const { hata: istekHatasi } = await istekAt(`/api/pozisyonlar/${id}`, 'DELETE');
          setSiliniyor(false);

          if (istekHatasi) Alert.alert('Pozisyon silinemedi', istekHatasi);
          else router.back();
        },
      },
    ]);

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: duzenleme ? 'Pozisyonu Düzenle' : 'Yeni Pozisyon',
          headerLeft: () => <BaslikDugmesi yazi="Vazgeç" onPress={() => router.back()} />,
        }}
      />

      {yuklemeHatasi ? (
        <HataDurumu mesaj={yuklemeHatasi} />
      ) : !hazir ? (
        <Yukleniyor />
      ) : (
        <>
          <Kart style={stiller.form}>
            <Girdi
              etiket="Pozisyon adı"
              value={ad}
              onChangeText={setAd}
              placeholder="Ör. Frontend Geliştirici"
              autoFocus={!duzenleme}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={kaydet}
            />

            {hata ? (
              <View style={[stiller.hata, { backgroundColor: renk.hataAcik }]} accessibilityLiveRegion="polite">
                <Yazi tur="kucuk" renk="hata">
                  {hata}
                </Yazi>
              </View>
            ) : null}

            <Dugme yazi={duzenleme ? 'Kaydet' : 'Pozisyonu Ekle'} onPress={kaydet} yukleniyor={kaydediliyor} />
          </Kart>

          {duzenleme && (
            <Dugme yazi="Pozisyonu sil" tur="tehlike" onPress={sil} yukleniyor={siliniyor} disabled={kaydediliyor} />
          )}
        </>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
  hata: { borderRadius: kose.s, padding: bosluk.m },
});
