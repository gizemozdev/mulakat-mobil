import { DarkTheme, DefaultTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';

import { OturumSaglayici, useOturum } from '@/oturum/OturumContext';
import { useTema } from '@/tema/useTema';

// Kayıtlı oturum kontrol edilene kadar açılış ekranı kapanmasın (giriş ekranı bir an görünüp kaybolmasın)
SplashScreen.preventAutoHideAsync();

export default function KokDuzen() {
  const { renk, koyu } = useTema();

  // Gezinme çubuklarının ve sekmelerin renkleri uygulamanın temasıyla aynı olsun
  const temel = koyu ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...temel,
        colors: { ...temel.colors, primary: renk.marka, background: renk.zemin, card: renk.yuzey, border: renk.kenar },
      }}
    >
      <OturumSaglayici>
        <Yonlendirici />
      </OturumSaglayici>
    </ThemeProvider>
  );
}

// Giriş yapılmamışsa yalnızca giriş ekranı, yapılmışsa yalnızca sekmeler açılabilir.
// Not: Bu yalnızca ekranları gizler; asıl koruma sunucudadır (her API isteği anahtarı denetler).
function Yonlendirici() {
  const { durum } = useOturum();
  const { renk } = useTema();

  useEffect(() => {
    if (durum !== 'yukleniyor') {
      SplashScreen.hide();
    }
  }, [durum]);

  if (durum === 'yukleniyor') {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={durum === 'girisli'}>
        <Stack.Screen name="(sekmeler)" />
        {/* Mülakat sırasında sekmeler gizlensin, mülakatçı yalnızca sorulara odaklansın: tam ekran */}
        <Stack.Screen
          name="teknik/[adayId]"
          options={{
            presentation: 'fullScreenModal',
            headerShown: true,
            title: 'Teknik Mülakat',
            headerTintColor: renk.marka,
            headerTitleStyle: { color: renk.yazi },
            headerStyle: { backgroundColor: renk.zemin },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="ik/[adayId]"
          options={{
            presentation: 'fullScreenModal',
            headerShown: true,
            title: 'İK Mülakatı',
            headerTintColor: renk.marka,
            headerTitleStyle: { color: renk.yazi },
            headerStyle: { backgroundColor: renk.zemin },
            headerShadowVisible: false,
          }}
        />
        {/* Rapor hem aday detayından hem karşılaştırmadan açılır; sekmelerin üstünde alttan gelen sayfa */}
        <Stack.Screen
          name="rapor/[adayId]"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Rapor',
            headerTintColor: renk.marka,
            headerTitleStyle: { color: renk.yazi },
            headerStyle: { backgroundColor: renk.zemin },
            headerShadowVisible: false,
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={durum === 'girissiz'}>
        <Stack.Screen name="giris" />
        {/* Giriş yapamayan kişi için: e-postaya kod ve kodla yeni şifre (davet kodu da buradan) */}
        <Stack.Screen
          name="sifremi-unuttum"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Şifremi Unuttum',
            headerTintColor: renk.marka,
            headerTitleStyle: { color: renk.yazi },
            headerStyle: { backgroundColor: renk.zemin },
            headerShadowVisible: false,
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}
