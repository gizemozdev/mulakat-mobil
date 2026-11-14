import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { istekAt } from '@/api/istekAt';
import type { IkAkis, Pozisyon } from '@/api/tipler';
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

// Akış ekleme; "?id=4" ile açılırsa ad / pozisyon düzenleme ve silme.
// Genel akış pozisyona bağlanamaz ve silinemez (her mülakatta sorulduğu için).
export default function AkisFormu() {
  const { renk } = useTema();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const duzenleme = Boolean(id);

  const [pozisyonlar, setPozisyonlar] = useState<Pozisyon[] | null>(null);
  const [genel, setGenel] = useState(false);
  const [ad, setAd] = useState('');
  // Çoklu seçim: bir akış birden fazla pozisyona bağlanabilir (çoka çok)
  const [seciliPozisyonlar, setSeciliPozisyonlar] = useState<number[]>([]);
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');
  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);

  useEffect(() => {
    Promise.all([
      istekAt<Pozisyon[]>('/api/pozisyonlar'),
      id ? istekAt<IkAkis[]>('/api/ik-akislar') : Promise.resolve(null),
    ]).then(([pozisyonSonucu, akisSonucu]) => {
      if (!pozisyonSonucu.veri) {
        setYuklemeHatasi(pozisyonSonucu.hata);
        return;
      }

      if (id) {
        const akis = akisSonucu?.veri?.find((kayit) => String(kayit.id) === id);

        if (!akis) {
          setYuklemeHatasi(akisSonucu?.hata || 'Akış bulunamadı. Silinmiş olabilir.');
          return;
        }

        setAd(akis.ad);
        setGenel(akis.genel);
        setSeciliPozisyonlar(akis.pozisyonlar.map((pozisyon) => pozisyon.id));
      }

      setPozisyonlar(pozisyonSonucu.veri);
    });
  }, [id]);

  const pozisyonDegistir = (pozisyonId: number) =>
    setSeciliPozisyonlar((onceki) =>
      onceki.includes(pozisyonId) ? onceki.filter((kayit) => kayit !== pozisyonId) : [...onceki, pozisyonId]
    );

  const kaydet = async () => {
    if (!ad.trim()) return setHata('Akış adı boş bırakılamaz.');

    setHata('');
    setKaydediliyor(true);

    // Genel akışa pozisyon listesi gönderilmez; sunucu bunu reddeder
    const govde = genel ? { ad: ad.trim() } : { ad: ad.trim(), pozisyonIdleri: seciliPozisyonlar };
    const { veri, hata: istekHatasi } = await istekAt<IkAkis>(
      duzenleme ? `/api/ik-akislar/${id}` : '/api/ik-akislar',
      duzenleme ? 'PUT' : 'POST',
      govde
    );

    setKaydediliyor(false);

    if (!veri) setHata(istekHatasi);
    // Yeni akış eklendiyse doğrudan o akışın düzenleme ekranına geçilir (soru eklemek için)
    else if (duzenleme) router.back();
    else router.replace({ pathname: '/daha-fazla/ik-akis/[id]', params: { id: veri.id } });
  };

  const sil = () =>
    Alert.alert('Akış silinsin mi?', `"${ad}" akışı, bütün soruları ve seçenekleriyle silinecek. Yapılmış mülakatların cevapları korunur.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setSiliniyor(true);
          const { hata: istekHatasi } = await istekAt(`/api/ik-akislar/${id}`, 'DELETE');
          setSiliniyor(false);

          if (istekHatasi) Alert.alert('Akış silinemedi', istekHatasi);
          else router.dismissTo('/daha-fazla/ik-akislari');
        },
      },
    ]);

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: duzenleme ? 'Akışı Düzenle' : 'Yeni Akış',
          headerLeft: () => <BaslikDugmesi yazi="Vazgeç" onPress={() => router.back()} />,
        }}
      />

      {yuklemeHatasi ? (
        <HataDurumu mesaj={yuklemeHatasi} />
      ) : !pozisyonlar ? (
        <Yukleniyor />
      ) : (
        <>
          <Kart style={stiller.form}>
            <Girdi
              etiket="Akış adı"
              value={ad}
              onChangeText={setAd}
              placeholder="Ör. Takım Lideri"
              autoFocus={!duzenleme}
              returnKeyType="done"
            />

            {genel ? (
              <Yazi tur="kucuk" renk="yaziIkincil">
                Genel Sorular her mülakatta sorulduğu için pozisyonlara bağlanmaz.
              </Yazi>
            ) : (
              <View style={stiller.pozisyonlar}>
                <Yazi tur="etiket" renk="yaziIkincil">
                  POZİSYONLAR (BİRDEN FAZLA SEÇİLEBİLİR)
                </Yazi>
                {pozisyonlar.length === 0 && <Yazi renk="yaziSoluk">Henüz pozisyon yok.</Yazi>}
                <View style={stiller.kutucuklar}>
                  {pozisyonlar.map((pozisyon) => {
                    const secili = seciliPozisyonlar.includes(pozisyon.id);

                    return (
                      <Pressable
                        key={pozisyon.id}
                        onPress={() => pozisyonDegistir(pozisyon.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: secili }}
                        style={[
                          stiller.kutucuk,
                          {
                            backgroundColor: secili ? renk.marka : renk.yuzey,
                            borderColor: secili ? renk.marka : renk.kenar,
                          },
                        ]}
                      >
                        <Yazi tur="kucuk" style={{ color: secili ? renk.markaUstuYazi : renk.yazi }}>
                          {secili ? '✓ ' : ''}
                          {pozisyon.ad}
                        </Yazi>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <HataKutusu mesaj={hata} />
            <Dugme yazi={duzenleme ? 'Kaydet' : 'Akışı Ekle'} onPress={kaydet} yukleniyor={kaydediliyor} />
          </Kart>

          {duzenleme && !genel && (
            <Dugme yazi="Akışı sil" tur="tehlike" onPress={sil} yukleniyor={siliniyor} disabled={kaydediliyor} />
          )}
        </>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
  pozisyonlar: { gap: bosluk.s },
  kutucuklar: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.s },
  kutucuk: { paddingHorizontal: bosluk.m, paddingVertical: bosluk.s, borderRadius: kose.tam, borderWidth: 1 },
});
