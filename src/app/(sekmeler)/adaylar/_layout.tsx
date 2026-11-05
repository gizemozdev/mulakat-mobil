import { Stack, router } from 'expo-router';

import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { useTema } from '@/tema/useTema';

// Adaylar sekmesinin sayfa yığını: liste -> detay; ekleme / düzenleme formu alttan açılır (modal)
export default function Duzen() {
  const { renk } = useTema();

  return (
    <Stack
      screenOptions={{
        headerTintColor: renk.marka,
        headerTitleStyle: { color: renk.yazi },
        headerStyle: { backgroundColor: renk.zemin },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Adaylar',
          headerLargeTitle: true,
          headerRight: () => <BaslikDugmesi yazi="Ekle" kalin onPress={() => router.push('/adaylar/form')} />,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: 'Aday', headerBackTitle: 'Adaylar' }} />
      <Stack.Screen name="form" options={{ presentation: 'modal', title: 'Aday' }} />
    </Stack>
  );
}
