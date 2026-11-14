import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { istekAt } from '@/api/istekAt';
import type { IkAkis, IkSoru } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Girdi } from '@/bilesenler/Girdi';
import { HataKutusu } from '@/bilesenler/HataKutusu';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Seçenek ekleme ("?soruId=9&akisId=2") ya da düzenleme / silme ("?id=14&soruId=9&akisId=2").
// "Sonraki soru" yalnızca aynı akışın soruları arasından seçilir; döngü kuran bağlantıyı sunucu reddeder.
export default function IkSecenekFormu() {
  const { renk } = useTema();
  const { id, soruId, akisId } = useLocalSearchParams<{ id?: string; soruId: string; akisId: string }>();
  const duzenleme = Boolean(id);

  const [soru, setSoru] = useState<IkSoru | null>(null);
  const [digerSorular, setDigerSorular] = useState<IkSoru[]>([]);
  const [metin, setMetin] = useState('');
  const [sonrakiSoruId, setSonrakiSoruId] = useState<number | null>(null);
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');
  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);

  useEffect(() => {
    istekAt<IkAkis[]>('/api/ik-akislar').then(({ veri, hata: istekHatasi }) => {
      const akis = veri?.find((kayit) => String(kayit.id) === akisId);
      const bulunan = akis?.sorular.find((kayit) => String(kayit.id) === soruId);
      const secenek = bulunan?.secenekler.find((kayit) => String(kayit.id) === id);

      if (!akis || !bulunan || (id && !secenek)) {
        setYuklemeHatasi(istekHatasi || 'Seçenek bulunamadı. Silinmiş olabilir.');
        return;
      }

      if (secenek) {
        setMetin(secenek.metin);
        setSonrakiSoruId(secenek.sonrakiSoruId);
      }

      // Bir seçenek kendi sorusuna geri götüremez
      setDigerSorular(akis.sorular.filter((kayit) => kayit.id !== bulunan.id));
      setSoru(bulunan);
    });
  }, [id, soruId, akisId]);

  const kaydet = async () => {
    if (!metin.trim()) return setHata('Seçenek metni boş bırakılamaz.');

    setHata('');
    setKaydediliyor(true);

    const { hata: istekHatasi } = await istekAt(
      duzenleme ? `/api/ik-secenekler/${id}` : '/api/ik-secenekler',
      duzenleme ? 'PUT' : 'POST',
      duzenleme
        ? { metin: metin.trim(), sonrakiSoruId }
        : { soruId: Number(soruId), metin: metin.trim(), sonrakiSoruId }
    );

    setKaydediliyor(false);

    if (istekHatasi) setHata(istekHatasi);
    else router.back();
  };

  const sil = () =>
    Alert.alert('Seçenek silinsin mi?', `"${metin}" seçeneği silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setSiliniyor(true);
          const { hata: istekHatasi } = await istekAt(`/api/ik-secenekler/${id}`, 'DELETE');
          setSiliniyor(false);

          if (istekHatasi) Alert.alert('Seçenek silinemedi', istekHatasi);
          else router.back();
        },
      },
    ]);

  const hedefler = [{ id: null as number | null, metin: 'Mülakat biter' }, ...digerSorular];

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: duzenleme ? 'Seçeneği Düzenle' : 'Yeni Seçenek',
          headerLeft: () => <BaslikDugmesi yazi="Vazgeç" onPress={() => router.back()} />,
        }}
      />

      {yuklemeHatasi ? (
        <HataDurumu mesaj={yuklemeHatasi} />
      ) : !soru ? (
        <Yukleniyor />
      ) : (
        <>
          <Kart style={stiller.form}>
            <Yazi tur="kucuk" renk="yaziIkincil">
              Soru: {soru.metin}
            </Yazi>
            <Girdi
              etiket="Seçenek"
              value={metin}
              onChangeText={setMetin}
              placeholder="Ör. Evet / Hayır / 1–5 kişi"
              autoFocus={!duzenleme}
              returnKeyType="done"
            />

            <View style={stiller.hedefler}>
              <Yazi tur="etiket" renk="yaziIkincil">
                BU SEÇENEKTEN SONRA
              </Yazi>
              {hedefler.map((hedef) => {
                const secili = hedef.id === sonrakiSoruId;

                return (
                  <Pressable
                    key={String(hedef.id)}
                    onPress={() => setSonrakiSoruId(hedef.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: secili }}
                    style={[
                      stiller.hedef,
                      {
                        backgroundColor: secili ? renk.markaAcik : renk.yuzey,
                        borderColor: secili ? renk.marka : renk.kenar,
                      },
                    ]}
                  >
                    <View style={[stiller.daire, { borderColor: secili ? renk.marka : renk.yaziSoluk }]}>
                      {secili && <View style={[stiller.daireIci, { backgroundColor: renk.marka }]} />}
                    </View>
                    <Yazi style={stiller.esnek} renk={hedef.id === null ? 'basari' : 'yazi'}>
                      {hedef.metin}
                    </Yazi>
                  </Pressable>
                );
              })}
            </View>

            <HataKutusu mesaj={hata} />
            <Dugme yazi={duzenleme ? 'Kaydet' : 'Seçeneği Ekle'} onPress={kaydet} yukleniyor={kaydediliyor} />
          </Kart>

          {duzenleme && <Dugme yazi="Seçeneği sil" tur="tehlike" onPress={sil} yukleniyor={siliniyor} disabled={kaydediliyor} />}
        </>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
  hedefler: { gap: bosluk.s },
  hedef: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m, padding: bosluk.m, borderRadius: kose.m, borderWidth: 1.5 },
  daire: { width: 20, height: 20, borderRadius: kose.tam, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  daireIci: { width: 9, height: 9, borderRadius: kose.tam },
  esnek: { flex: 1 },
});
