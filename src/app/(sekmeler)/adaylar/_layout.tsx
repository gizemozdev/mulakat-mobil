import { Stack } from 'expo-router';

import { useTema } from '@/tema/useTema';

// Sekmenin kendi sayfa yığını: listeden detaya geçilince geri hareketi ve başlık telefonun kendisinden gelir
export default function Duzen() {
  const { renk } = useTema();

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTintColor: renk.marka,
        headerTitleStyle: { color: renk.yazi },
        headerStyle: { backgroundColor: renk.zemin },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Adaylar' }} />
    </Stack>
  );
}
