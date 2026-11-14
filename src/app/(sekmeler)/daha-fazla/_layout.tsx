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

      {/* Soru havuzu: konular -> konunun soruları; konu ve soru formları alttan */}
      <Stack.Screen
        name="soru-havuzu"
        options={{
          title: 'Soru Havuzu',
          headerLargeTitle: true,
          headerRight: () => <BaslikDugmesi yazi="Ekle" kalin onPress={() => router.push('/daha-fazla/konu-form')} />,
        }}
      />
      <Stack.Screen name="konu/[id]" options={{ title: 'Konu' }} />
      <Stack.Screen name="konu-form" options={{ presentation: 'modal', title: 'Konu' }} />
      <Stack.Screen name="soru-form" options={{ presentation: 'modal', title: 'Soru' }} />

      {/* İK akışları: liste -> akış düzenleyici; akış, soru ve seçenek formları alttan */}
      <Stack.Screen
        name="ik-akislari"
        options={{
          title: 'İK Akışları',
          headerLargeTitle: true,
          headerRight: () => <BaslikDugmesi yazi="Ekle" kalin onPress={() => router.push('/daha-fazla/akis-form')} />,
        }}
      />
      <Stack.Screen name="ik-akis/[id]" options={{ title: 'Akış' }} />
      <Stack.Screen name="akis-form" options={{ presentation: 'modal', title: 'Akış' }} />
      <Stack.Screen name="ik-soru-form" options={{ presentation: 'modal', title: 'Soru' }} />
      <Stack.Screen name="ik-secenek-form" options={{ presentation: 'modal', title: 'Seçenek' }} />

      {/* İstatistikler ve aynı pozisyondaki adayların karşılaştırması */}
      <Stack.Screen name="istatistikler" options={{ title: 'İstatistikler', headerLargeTitle: true }} />
      <Stack.Screen name="karsilastirma" options={{ title: 'Karşılaştırma' }} />

      {/* Kullanıcılar ve şifre */}
      <Stack.Screen
        name="kullanicilar"
        options={{
          title: 'Kullanıcılar',
          headerLargeTitle: true,
          headerRight: () => <BaslikDugmesi yazi="Ekle" kalin onPress={() => router.push('/daha-fazla/kullanici-form')} />,
        }}
      />
      <Stack.Screen name="kullanici-form" options={{ presentation: 'modal', title: 'Hesap' }} />
      <Stack.Screen name="sifre-sifirla" options={{ presentation: 'modal', title: 'Şifre' }} />
      <Stack.Screen name="sifre-degistir" options={{ presentation: 'modal', title: 'Şifre' }} />
    </Stack>
  );
}
