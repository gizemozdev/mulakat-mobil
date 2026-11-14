import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { istekAt } from '@/api/istekAt';
import type { IkAkis } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Girdi } from '@/bilesenler/Girdi';
import { HataKutusu } from '@/bilesenler/HataKutusu';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';

// İK sorusu ekleme ("?akisId=2") ya da düzenleme / silme ("?id=9&akisId=2")
export default function IkSoruFormu() {
  const { id, akisId } = useLocalSearchParams<{ id?: string; akisId: string }>();
  const duzenleme = Boolean(id);

  const [akisAdi, setAkisAdi] = useState('');
  const [metin, setMetin] = useState('');
  const [hazir, setHazir] = useState(false);
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');
  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);

  useEffect(() => {
    istekAt<IkAkis[]>('/api/ik-akislar').then(({ veri, hata: istekHatasi }) => {
      const akis = veri?.find((kayit) => String(kayit.id) === akisId);
      const soru = akis?.sorular.find((kayit) => String(kayit.id) === id);

      if (!akis || (id && !soru)) {
        setYuklemeHatasi(istekHatasi || 'Soru bulunamadı. Silinmiş olabilir.');
        return;
      }

      setAkisAdi(akis.ad);
      if (soru) setMetin(soru.metin);
      setHazir(true);
    });
  }, [id, akisId]);

  const kaydet = async () => {
    if (!metin.trim()) return setHata('Soru metni boş bırakılamaz.');

    setHata('');
    setKaydediliyor(true);

    // Akışın ilk sorusu yoksa sunucu yeni soruyu kendiliğinden ilk soru yapar
    const { hata: istekHatasi } = await istekAt(
      duzenleme ? `/api/ik-sorular/${id}` : '/api/ik-sorular',
      duzenleme ? 'PUT' : 'POST',
      duzenleme ? { metin: metin.trim() } : { akisId: Number(akisId), metin: metin.trim() }
    );

    setKaydediliyor(false);

    if (istekHatasi) setHata(istekHatasi);
    else router.back();
  };

  const sil = () =>
    Alert.alert(
      'Soru silinsin mi?',
      'Sorunun seçenekleri de silinir. Bu soruya giden seçenekler "Mülakat biter" olur; ilk soruysa akışın ilk sorusu boşalır.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setSiliniyor(true);
            const { hata: istekHatasi } = await istekAt(`/api/ik-sorular/${id}`, 'DELETE');
            setSiliniyor(false);

            if (istekHatasi) Alert.alert('Soru silinemedi', istekHatasi);
            else router.back();
          },
        },
      ]
    );

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: duzenleme ? 'Soruyu Düzenle' : 'Yeni Soru',
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
            <Yazi tur="kucuk" renk="yaziIkincil">
              Akış: {akisAdi}
            </Yazi>
            <Girdi
              etiket="Soru"
              value={metin}
              onChangeText={setMetin}
              placeholder="Ör. Daha önce takım lideri olarak çalıştınız mı?"
              autoFocus={!duzenleme}
              multiline
              style={stiller.cokSatir}
            />
            {!duzenleme && (
              <Yazi tur="kucuk" renk="yaziIkincil">
                Soruyu ekledikten sonra akış ekranında seçeneklerini ve her seçeneğin hangi soruya gideceğini belirle.
              </Yazi>
            )}
            <HataKutusu mesaj={hata} />
            <Dugme yazi={duzenleme ? 'Kaydet' : 'Soruyu Ekle'} onPress={kaydet} yukleniyor={kaydediliyor} />
          </Kart>

          {duzenleme && <Dugme yazi="Soruyu sil" tur="tehlike" onPress={sil} yukleniyor={siliniyor} disabled={kaydediliyor} />}
        </>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
  cokSatir: { minHeight: 96, paddingTop: bosluk.m, textAlignVertical: 'top' },
});
