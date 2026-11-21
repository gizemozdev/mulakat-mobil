import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_ADRESI, istekAt, type IstekSonucu } from '@/api/istekAt';
import { Dugme } from '@/bilesenler/Dugme';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Girdi } from '@/bilesenler/Girdi';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { useOturum } from '@/oturum/OturumContext';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Sistemde hiç kullanıcı yoksa ilk yönetici hesabı açılır, varsa giriş yapılır
export default function Giris() {
  const { renk } = useTema();
  const { girisYap, kurulumYap } = useOturum();

  // null: sunucuya henüz sorulmadı
  const [kurulumGerekli, setKurulumGerekli] = useState<boolean | null>(null);
  const [baglantiHatasi, setBaglantiHatasi] = useState('');

  const [adSoyad, setAdSoyad] = useState('');
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // Klavyedeki "İleri" tuşuyla sıradaki alana geçmek için
  const kullaniciAdiAlani = useRef<TextInputInstance>(null);
  const sifreAlani = useRef<TextInputInstance>(null);
  const sifreTekrarAlani = useRef<TextInputInstance>(null);

  const durumuIsle = ({ veri, hata: istekHatasi }: IstekSonucu<{ kurulumGerekli: boolean }>) => {
    if (veri) {
      setKurulumGerekli(veri.kurulumGerekli);
    } else {
      setBaglantiHatasi(istekHatasi);
    }
  };

  // Açılışta istek effect içinde başlar, sonucu geri çağırmada (then) işlenir
  useEffect(() => {
    istekAt<{ kurulumGerekli: boolean }>('/api/giris').then(durumuIsle);
  }, []);

  // "Tekrar dene"
  const durumuSor = async () => {
    setBaglantiHatasi('');
    setKurulumGerekli(null);
    durumuIsle(await istekAt<{ kurulumGerekli: boolean }>('/api/giris'));
  };

  const gonder = async () => {
    if (!kullaniciAdi.trim() || !sifre || (kurulumGerekli && !adSoyad.trim())) {
      setHata('Lütfen bütün alanları doldurun.');
      return;
    }

    if (kurulumGerekli && sifre !== sifreTekrar) {
      setHata('Şifreler birbiriyle aynı değil.');
      return;
    }

    setHata('');
    setGonderiliyor(true);

    // Başarılıysa oturum açılır ve yönlendirici kendiliğinden sekmelere geçer
    const sunucuHatasi = kurulumGerekli
      ? await kurulumYap(adSoyad.trim(), kullaniciAdi.trim(), sifre)
      : await girisYap(kullaniciAdi.trim(), sifre);

    if (sunucuHatasi) {
      setHata(sunucuHatasi);
      setGonderiliyor(false);
    }
  };

  return (
    <SafeAreaView style={[stiller.sayfa, { backgroundColor: renk.zemin }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={stiller.sayfa}>
        <ScrollView contentContainerStyle={stiller.icerik} keyboardShouldPersistTaps="handled">
          <View style={stiller.ust}>
            <View style={[stiller.logo, { backgroundColor: renk.marka }]}>
              <Yazi tur="baslik" renk="markaUstuYazi">
                MY
              </Yazi>
            </View>

            <Yazi tur="buyukBaslik" style={stiller.ortala}>
              Mülakat Yönetim Sistemi
            </Yazi>
            <Yazi renk="yaziIkincil" style={stiller.ortala}>
              {kurulumGerekli ? 'İlk kullanım: yönetici hesabını oluşturun' : 'Devam etmek için giriş yapın'}
            </Yazi>
          </View>

          {baglantiHatasi ? (
            <>
              <HataDurumu mesaj={baglantiHatasi} tekrarDene={durumuSor} />
              <Yazi tur="kucuk" renk="yaziSoluk" style={stiller.ortala}>
                Sunucu adresi: {API_ADRESI || 'ayarlanmamış'}
              </Yazi>
            </>
          ) : kurulumGerekli === null ? (
            <Yukleniyor yazi="Sunucuya bağlanılıyor..." />
          ) : (
            <Kart style={stiller.form}>
              {kurulumGerekli && (
                <Girdi
                  etiket="Ad Soyad"
                  value={adSoyad}
                  onChangeText={setAdSoyad}
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                  onSubmitEditing={() => kullaniciAdiAlani.current?.focus()}
                />
              )}

              <Girdi
                ref={kullaniciAdiAlani}
                etiket="Kullanıcı adı"
                value={kullaniciAdi}
                onChangeText={setKullaniciAdi}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => sifreAlani.current?.focus()}
              />

              <Girdi
                ref={sifreAlani}
                etiket="Şifre"
                sifre
                value={sifre}
                onChangeText={setSifre}
                autoComplete={kurulumGerekli ? 'new-password' : 'current-password'}
                textContentType={kurulumGerekli ? 'newPassword' : 'password'}
                returnKeyType={kurulumGerekli ? 'next' : 'go'}
                onSubmitEditing={() => (kurulumGerekli ? sifreTekrarAlani.current?.focus() : gonder())}
              />

              {/* E-postaya kod gönderilip şifre yeniden belirlenir; davet kodu olan yeni kullanıcı da buradan girer */}
              {!kurulumGerekli && (
                <Pressable
                  onPress={() => router.push('/sifremi-unuttum')}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={stiller.unuttum}
                >
                  <Yazi tur="etiket" renk="marka">
                    Şifremi unuttum / davet kodum var
                  </Yazi>
                </Pressable>
              )}

              {kurulumGerekli && (
                <Girdi
                  ref={sifreTekrarAlani}
                  etiket="Şifre (tekrar)"
                  sifre
                  value={sifreTekrar}
                  onChangeText={setSifreTekrar}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={gonder}
                />
              )}

              {hata ? (
                <View style={[stiller.hata, { backgroundColor: renk.hataAcik }]} accessibilityLiveRegion="polite">
                  <Yazi tur="kucuk" renk="hata">
                    {hata}
                  </Yazi>
                </View>
              ) : null}

              <Dugme
                yazi={kurulumGerekli ? 'Hesabı Oluştur' : 'Giriş Yap'}
                onPress={gonder}
                yukleniyor={gonderiliyor}
              />
            </Kart>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const stiller = StyleSheet.create({
  sayfa: { flex: 1 },
  icerik: { flexGrow: 1, justifyContent: 'center', padding: bosluk.xl, gap: bosluk.xl },
  ust: { alignItems: 'center', gap: bosluk.s },
  logo: {
    width: 64,
    height: 64,
    borderRadius: kose.l,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: bosluk.s,
  },
  ortala: { textAlign: 'center' },
  form: { gap: bosluk.l, padding: bosluk.xl },
  hata: { borderRadius: kose.s, padding: bosluk.m },
  unuttum: { alignSelf: 'flex-end', marginTop: -bosluk.s },
});
