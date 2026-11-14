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
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';

// Teknik soru ekleme ("?konuId=2") ya da düzenleme / silme ("?id=7&konuId=2").
// Yapılmış mülakatlar etkilenmez: cevap kayıtlarında soru metninin kopyası tutuluyor.
export default function SoruFormu() {
  const { id, konuId } = useLocalSearchParams<{ id?: string; konuId: string }>();
  const duzenleme = Boolean(id);

  const [konuAdi, setKonuAdi] = useState('');
  const [metin, setMetin] = useState('');
  const [hazir, setHazir] = useState(false);
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');
  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);

  useEffect(() => {
    istekAt<Konu[]>('/api/konular').then(({ veri, hata: istekHatasi }) => {
      const konu = veri?.find((kayit) => String(kayit.id) === konuId);
      const soru = konu?.sorular.find((kayit) => String(kayit.id) === id);

      if (!konu || (id && !soru)) {
        setYuklemeHatasi(istekHatasi || 'Soru bulunamadı. Silinmiş olabilir.');
        return;
      }

      setKonuAdi(konu.ad);
      if (soru) setMetin(soru.metin);
      setHazir(true);
    });
  }, [id, konuId]);

  const kaydet = async () => {
    if (!metin.trim()) {
      setHata('Soru metni boş bırakılamaz.');
      return;
    }

    setHata('');
    setKaydediliyor(true);

    const { hata: istekHatasi } = await istekAt(
      duzenleme ? `/api/sorular/${id}` : '/api/sorular',
      duzenleme ? 'PUT' : 'POST',
      duzenleme ? { metin: metin.trim() } : { konuId: Number(konuId), metin: metin.trim() }
    );

    setKaydediliyor(false);

    if (istekHatasi) setHata(istekHatasi);
    else router.back();
  };

  const sil = () =>
    Alert.alert('Soru silinsin mi?', 'Soru havuzdan kaldırılır. Daha önce yapılmış mülakatların sonuçları etkilenmez.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setSiliniyor(true);
          const { hata: istekHatasi } = await istekAt(`/api/sorular/${id}`, 'DELETE');
          setSiliniyor(false);

          if (istekHatasi) Alert.alert('Soru silinemedi', istekHatasi);
          else router.back();
        },
      },
    ]);

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
              Konu: {konuAdi}
            </Yazi>
            <Girdi
              etiket="Soru"
              value={metin}
              onChangeText={setMetin}
              placeholder="Ör. let ve const arasındaki fark nedir?"
              autoFocus={!duzenleme}
              multiline
              style={stiller.cokSatir}
            />
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
  cokSatir: { minHeight: 110, paddingTop: bosluk.m, textAlignVertical: 'top' },
});
