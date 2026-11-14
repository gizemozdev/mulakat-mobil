import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { istekAt } from '@/api/istekAt';
import type { Konu } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Girdi } from '@/bilesenler/Girdi';
import { HataKutusu } from '@/bilesenler/HataKutusu';
import { Kart } from '@/bilesenler/Kart';
import { bosluk } from '@/tema/olculer';

// Konu ekleme; "?id=3" ile açılırsa ad düzenleme ve silme
export default function KonuFormu() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const duzenleme = Boolean(id);

  const [ad, setAd] = useState('');
  const [hazir, setHazir] = useState(!duzenleme);
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');
  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);

  useEffect(() => {
    if (!id) return;

    istekAt<Konu[]>('/api/konular').then(({ veri, hata: istekHatasi }) => {
      const konu = veri?.find((kayit) => String(kayit.id) === id);

      if (konu) {
        setAd(konu.ad);
        setHazir(true);
      } else {
        setYuklemeHatasi(istekHatasi || 'Konu bulunamadı. Silinmiş olabilir.');
      }
    });
  }, [id]);

  const kaydet = async () => {
    if (!ad.trim()) {
      setHata('Konu adı boş bırakılamaz.');
      return;
    }

    setHata('');
    setKaydediliyor(true);

    const { hata: istekHatasi } = await istekAt(duzenleme ? `/api/konular/${id}` : '/api/konular', duzenleme ? 'PUT' : 'POST', {
      ad: ad.trim(),
    });

    setKaydediliyor(false);

    if (istekHatasi) setHata(istekHatasi);
    else router.back();
  };

  const sil = () =>
    Alert.alert('Konu silinsin mi?', `"${ad}" konusu silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setSiliniyor(true);
          // Konuda soru varsa sunucu silmeyi reddeder ve kaç soru olduğunu söyler
          const { hata: istekHatasi } = await istekAt(`/api/konular/${id}`, 'DELETE');
          setSiliniyor(false);

          if (istekHatasi) Alert.alert('Konu silinemedi', istekHatasi);
          // Konunun sayfası artık boş kalacağı için doğrudan konu listesine dönülür
          else router.dismissTo('/daha-fazla/soru-havuzu');
        },
      },
    ]);

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: duzenleme ? 'Konuyu Düzenle' : 'Yeni Konu',
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
              etiket="Konu adı"
              value={ad}
              onChangeText={setAd}
              placeholder="Ör. JavaScript"
              autoFocus={!duzenleme}
              returnKeyType="done"
              onSubmitEditing={kaydet}
            />
            <HataKutusu mesaj={hata} />
            <Dugme yazi={duzenleme ? 'Kaydet' : 'Konuyu Ekle'} onPress={kaydet} yukleniyor={kaydediliyor} />
          </Kart>

          {duzenleme && <Dugme yazi="Konuyu sil" tur="tehlike" onPress={sil} yukleniyor={siliniyor} disabled={kaydediliyor} />}
        </>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
});
