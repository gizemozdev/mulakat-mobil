import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';

import { bosluk } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

type EkranProps = {
  children: ReactNode;
  // Verilirse ekran aşağı çekilince yenilenir
  yenile?: () => void;
  yenileniyor?: boolean;
};

// Sekme ekranlarının ortak kalıbı. contentInsetAdjustmentBehavior: iOS'taki büyük başlığın ve alt menünün
// altında içerik kalmasın diye boşluklar sistem tarafından ayarlanır.
export function Ekran({ children, yenile, yenileniyor = false }: EkranProps) {
  const { renk } = useTema();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: renk.zemin }}
      contentContainerStyle={stiller.icerik}
      keyboardShouldPersistTaps="handled"
      // Klavye açılınca alttaki alanlar ve düğmeler klavyenin altında kalmasın (iOS)
      automaticallyAdjustKeyboardInsets
      refreshControl={
        yenile ? <RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={renk.marka} /> : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const stiller = StyleSheet.create({
  icerik: { padding: bosluk.l, gap: bosluk.m, paddingBottom: bosluk.xxl },
});
