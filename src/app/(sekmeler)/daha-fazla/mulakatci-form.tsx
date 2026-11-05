import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { istekAt } from '@/api/istekAt';
import type { Alan, Kullanici, Mulakatci } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Girdi } from '@/bilesenler/Girdi';
import { Kart } from '@/bilesenler/Kart';
import { Secim } from '@/bilesenler/Secim';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

type Hatalar = Partial<Record<'adSoyad' | 'alan', string>>;

// Mülakatçı ekleme; "?id=4" ile açılırsa düzenleme ve silme.
// Hesap bağlantısı, mülakatçı "Bugün" ekranında kendisine atanan mülakatları görsün diye seçilir.
export default function MulakatciFormu() {
  const { renk } = useTema();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const duzenleme = Boolean(id);

  const [kullanicilar, setKullanicilar] = useState<Kullanici[] | null>(null);
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');

  const [adSoyad, setAdSoyad] = useState('');
  const [alan, setAlan] = useState<Alan | null>(null);
  const [kullaniciId, setKullaniciId] = useState<number | null>(null);
  // Hesap değişmediyse kaydederken ikinci istek atılmaz
  const [ilkKullaniciId, setIlkKullaniciId] = useState<number | null>(null);

  const [hatalar, setHatalar] = useState<Hatalar>({});
  const [sunucuHatasi, setSunucuHatasi] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);

  useEffect(() => {
    Promise.all([
      istekAt<Kullanici[]>('/api/kullanicilar'),
      id ? istekAt<Mulakatci[]>('/api/mulakatcilar') : Promise.resolve(null),
    ]).then(([kullaniciSonucu, mulakatciSonucu]) => {
      if (!kullaniciSonucu.veri) {
        setYuklemeHatasi(kullaniciSonucu.hata);
        return;
      }

      if (id) {
        const mulakatci = mulakatciSonucu?.veri?.find((kayit) => String(kayit.id) === id);

        if (!mulakatci) {
          setYuklemeHatasi(mulakatciSonucu?.hata || 'Mülakatçı bulunamadı. Silinmiş olabilir.');
          return;
        }

        setAdSoyad(mulakatci.adSoyad);
        setAlan(mulakatci.alan);
        setKullaniciId(mulakatci.kullaniciId);
        setIlkKullaniciId(mulakatci.kullaniciId);
      }

      setKullanicilar(kullaniciSonucu.veri);
    });
  }, [id]);

  const kaydet = async () => {
    const yeniHatalar: Hatalar = {};

    if (!adSoyad.trim()) yeniHatalar.adSoyad = 'Ad soyad boş bırakılamaz.';
    if (!alan) yeniHatalar.alan = 'Bir alan seçin.';

    setHatalar(yeniHatalar);
    setSunucuHatasi('');

    if (Object.keys(yeniHatalar).length > 0) return;

    setKaydediliyor(true);

    // 1) Mülakatçının kendisi: ad ve alan
    const { veri, hata } = await istekAt<Mulakatci>(
      duzenleme ? `/api/mulakatcilar/${id}` : '/api/mulakatcilar',
      duzenleme ? 'PUT' : 'POST',
      { adSoyad: adSoyad.trim(), alan }
    );

    if (!veri) {
      setKaydediliyor(false);
      setSunucuHatasi(hata);
      return;
    }

    // 2) Hesap bağlantısı ayrı bir uçta tutuluyor; yalnızca değiştiyse gönderilir
    if (kullaniciId !== ilkKullaniciId) {
      const hesapSonucu = await istekAt(`/api/mulakatcilar/${veri.id}/hesap`, 'PUT', { kullaniciId });

      if (hesapSonucu.hata) {
        setKaydediliyor(false);
        // Mülakatçı kaydedildi ama hesap bağlanamadı: ikisini karıştırmamak için açıkça söylenir
        Alert.alert('Hesap bağlanamadı', `Mülakatçı kaydedildi ama hesap bağlantısı yapılamadı: ${hesapSonucu.hata}`);
        router.back();
        return;
      }
    }

    setKaydediliyor(false);
    router.back();
  };

  const sil = () =>
    Alert.alert(
      'Mülakatçı silinsin mi?',
      `${adSoyad} silinecek. Atandığı mülakatlar silinmez, yalnızca mülakatçı alanı boş kalır.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setSiliniyor(true);
            const { hata } = await istekAt(`/api/mulakatcilar/${id}`, 'DELETE');
            setSiliniyor(false);

            if (hata) Alert.alert('Mülakatçı silinemedi', hata);
            else router.back();
          },
        },
      ]
    );

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: duzenleme ? 'Mülakatçıyı Düzenle' : 'Yeni Mülakatçı',
          headerLeft: () => <BaslikDugmesi yazi="Vazgeç" onPress={() => router.back()} />,
        }}
      />

      {yuklemeHatasi ? (
        <HataDurumu mesaj={yuklemeHatasi} />
      ) : !kullanicilar ? (
        <Yukleniyor />
      ) : (
        <>
          <Kart style={stiller.form}>
            <Girdi
              etiket="Ad Soyad"
              value={adSoyad}
              onChangeText={setAdSoyad}
              hata={hatalar.adSoyad}
              autoFocus={!duzenleme}
              autoComplete="off"
              autoCapitalize="words"
              returnKeyType="done"
            />

            <Secim
              etiket="Alan"
              secenekler={[
                { deger: 'ik' as Alan | null, etiket: 'İK' },
                { deger: 'teknik', etiket: 'Teknik' },
              ]}
              secili={alan}
              onSec={setAlan}
              hata={hatalar.alan}
            />

            <View style={stiller.hesap}>
              <Secim
                etiket="Uygulama hesabı"
                kaydirilabilir
                secenekler={[
                  { deger: null as number | null, etiket: 'Bağlı değil' },
                  ...kullanicilar.map((kullanici) => ({
                    deger: kullanici.id as number | null,
                    etiket: kullanici.ben ? `${kullanici.adSoyad} (sen)` : kullanici.adSoyad,
                  })),
                ]}
                secili={kullaniciId}
                onSec={setKullaniciId}
              />
              <Yazi tur="kucuk" renk="yaziIkincil">
                Bağlanan hesap, kendisine atanan mülakatları Bugün ekranında görür.
              </Yazi>
            </View>

            {sunucuHatasi ? (
              <View style={[stiller.hata, { backgroundColor: renk.hataAcik }]} accessibilityLiveRegion="polite">
                <Yazi tur="kucuk" renk="hata">
                  {sunucuHatasi}
                </Yazi>
              </View>
            ) : null}

            <Dugme yazi={duzenleme ? 'Kaydet' : 'Mülakatçıyı Ekle'} onPress={kaydet} yukleniyor={kaydediliyor} />
          </Kart>

          {duzenleme && (
            <Dugme yazi="Mülakatçıyı sil" tur="tehlike" onPress={sil} yukleniyor={siliniyor} disabled={kaydediliyor} />
          )}
        </>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
  hesap: { gap: bosluk.s },
  hata: { borderRadius: kose.s, padding: bosluk.m },
});
