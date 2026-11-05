import { Stack, router } from 'expo-router';

import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { useTema } from '@/tema/useTema';

// Daha Fazla sekmesinin sayfa yığını: yönetim bölümleri buradan açılır, formlar alttan gelir (modal)
export default function Duzen() {
  const { renk } = useTema();

  return (
    <Stack
      screenOptions={{
        headerTintColor: renk.marka,
        headerTitleStyle: { color: renk.yazi },
        headerStyle: { backgroundColor: renk.zemin },
        headerShadowVisible: false,
        headerBackTitle: 'Geri',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Daha Fazla', headerLargeTitle: true }} />
      <Stack.Screen
        name="pozisyonlar"
        options={{
          title: 'Pozisyonlar',
          headerLargeTitle: true,
          headerRight: () => (
            <BaslikDugmesi yazi="Ekle" kalin onPress={() => router.push('/daha-fazla/pozisyon-form')} />
          ),
        }}
      />
      <Stack.Screen name="pozisyon-form" options={{ presentation: 'modal', title: 'Pozisyon' }} />
      <Stack.Screen
        name="mulakatcilar"
        options={{
          title: 'Mülakatçılar',
          headerLargeTitle: true,
          headerRight: () => (
            <BaslikDugmesi yazi="Ekle" kalin onPress={() => router.push('/daha-fazla/mulakatci-form')} />
          ),
        }}
      />
      <Stack.Screen name="mulakatci-form" options={{ presentation: 'modal', title: 'Mülakatçı' }} />
    </Stack>
  );
}
