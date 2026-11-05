import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import { istekAt } from '@/api/istekAt';
import type { Aday, Pozisyon } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Girdi } from '@/bilesenler/Girdi';
import { Kart } from '@/bilesenler/Kart';
import { Secim } from '@/bilesenler/Secim';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

type Hatalar = Partial<Record<'adSoyad' | 'yas' | 'eposta' | 'telefon' | 'pozisyon', string>>;

// Yeni aday ekleme ve var olanı düzenleme ("?id=5" ile açılırsa düzenleme)
export default function AdayFormu() {
  const { renk } = useTema();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const duzenleme = Boolean(id);

  const [pozisyonlar, setPozisyonlar] = useState<Pozisyon[] | null>(null);
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');

  const [adSoyad, setAdSoyad] = useState('');
  const [yas, setYas] = useState('');
  const [eposta, setEposta] = useState('');
  const [telefon, setTelefon] = useState('');
  const [pozisyonId, setPozisyonId] = useState<number | null>(null);

  const [hatalar, setHatalar] = useState<Hatalar>({});
  const [sunucuHatasi, setSunucuHatasi] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const yasAlani = useRef<TextInputInstance>(null);
  const epostaAlani = useRef<TextInputInstance>(null);
  const telefonAlani = useRef<TextInputInstance>(null);

  // Pozisyonlar (seçim için) ve düzenlemedeyse adayın mevcut bilgileri birlikte getirilir
  useEffect(() => {
    Promise.all([
      istekAt<Pozisyon[]>('/api/pozisyonlar'),
      id ? istekAt<Aday[]>('/api/adaylar') : Promise.resolve(null),
    ]).then(([pozisyonSonucu, adaySonucu]) => {
      if (!pozisyonSonucu.veri) {
        setYuklemeHatasi(pozisyonSonucu.hata);
        return;
      }

      const aday = adaySonucu?.veri?.find((kayit) => String(kayit.id) === id);

      if (aday) {
        setAdSoyad(aday.adSoyad);
        setYas(String(aday.yas));
        setEposta(aday.eposta);
        setTelefon(aday.telefon);
        setPozisyonId(aday.pozisyonId);
      }

      setPozisyonlar(pozisyonSonucu.veri);
    });
  }, [id]);

  const kaydet = async () => {
    const yeniHatalar: Hatalar = {};
    const yasSayisi = Number(yas);

    if (!adSoyad.trim()) yeniHatalar.adSoyad = 'Ad soyad boş bırakılamaz.';
    if (!yas) yeniHatalar.yas = 'Yaş boş bırakılamaz.';
    else if (yasSayisi < 18 || yasSayisi > 70) yeniHatalar.yas = 'Yaş 18 ile 70 arasında olmalıdır.';
    if (!eposta.trim()) yeniHatalar.eposta = 'E-posta boş bırakılamaz.';
    if (!telefon.trim()) yeniHatalar.telefon = 'Telefon boş bırakılamaz.';
    if (pozisyonId === null) yeniHatalar.pozisyon = 'Bir pozisyon seçin.';

    setHatalar(yeniHatalar);
    setSunucuHatasi('');

    if (Object.keys(yeniHatalar).length > 0) return;

    setKaydediliyor(true);

    // Biçim denetimi (e-posta, telefon) sunucuda yapılır; mesajı aynen gösterilir
    const { hata } = await istekAt(duzenleme ? `/api/adaylar/${id}` : '/api/adaylar', duzenleme ? 'PUT' : 'POST', {
      adSoyad: adSoyad.trim(),
      yas: yasSayisi,
      eposta: eposta.trim(),
      telefon: telefon.trim(),
      pozisyonId,
    });

    setKaydediliyor(false);

    if (hata) setSunucuHatasi(hata);
    else router.back();
  };

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: duzenleme ? 'Adayı Düzenle' : 'Yeni Aday',
          headerLeft: () => <BaslikDugmesi yazi="Vazgeç" onPress={() => router.back()} />,
        }}
      />

      {yuklemeHatasi ? (
        <HataDurumu mesaj={yuklemeHatasi} />
      ) : !pozisyonlar ? (
        <Yukleniyor />
      ) : pozisyonlar.length === 0 ? (
        <BosDurum
          baslik="Önce bir pozisyon ekleyin"
          aciklama="Aday bir pozisyona başvurur. Daha Fazla > Pozisyonlar bölümünden pozisyon ekleyebilirsiniz."
        />
      ) : (
        <Kart style={stiller.form}>
          <Girdi
            etiket="Ad Soyad"
            value={adSoyad}
            onChangeText={setAdSoyad}
            hata={hatalar.adSoyad}
            autoComplete="off"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => yasAlani.current?.focus()}
          />

          <Girdi
            ref={yasAlani}
            etiket="Yaş"
            value={yas}
            onChangeText={(metin) => setYas(metin.replace(/\D/g, '').slice(0, 2))}
            hata={hatalar.yas}
            keyboardType="number-pad"
            returnKeyType="next"
            onSubmitEditing={() => epostaAlani.current?.focus()}
          />

          <Girdi
            ref={epostaAlani}
            etiket="E-posta"
            value={eposta}
            onChangeText={setEposta}
            hata={hatalar.eposta}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="next"
            onSubmitEditing={() => telefonAlani.current?.focus()}
          />

          <Girdi
            ref={telefonAlani}
            etiket="Telefon"
            value={telefon}
            onChangeText={setTelefon}
            hata={hatalar.telefon}
            keyboardType="phone-pad"
            placeholder="05xx xxx xx xx"
          />

          <Secim
            etiket="Başvurulan pozisyon"
            secenekler={pozisyonlar.map((pozisyon) => ({ deger: pozisyon.id as number | null, etiket: pozisyon.ad }))}
            secili={pozisyonId}
            onSec={setPozisyonId}
            hata={hatalar.pozisyon}
          />

          {sunucuHatasi ? (
            <View style={[stiller.hata, { backgroundColor: renk.hataAcik }]} accessibilityLiveRegion="polite">
              <Yazi tur="kucuk" renk="hata">
                {sunucuHatasi}
              </Yazi>
            </View>
          ) : null}

          <Dugme yazi={duzenleme ? 'Kaydet' : 'Adayı Ekle'} onPress={kaydet} yukleniyor={kaydediliyor} />
        </Kart>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  form: { gap: bosluk.l, padding: bosluk.l + 4 },
  hata: { borderRadius: kose.s, padding: bosluk.m },
});
