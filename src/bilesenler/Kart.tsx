import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

type KartProps = {
  children: ReactNode;
  // Verilirse kart dokunulabilir olur (basılınca hafifçe kararır)
  onPress?: () => void;
  // Verilirse karta uzun basınca çalışır (Düzenle / Sil menüsü için)
  onLongPress?: () => void;
  erisimEtiketi?: string;
  style?: StyleProp<ViewStyle>;
};

export function Kart({ children, onPress, onLongPress, erisimEtiketi, style }: KartProps) {
  const { renk } = useTema();
  const gorunum = [stiller.kart, { backgroundColor: renk.yuzey, borderColor: renk.kenar }, style];

  if (!onPress && !onLongPress) {
    return <View style={gorunum}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      accessibilityRole="button"
      accessibilityLabel={erisimEtiketi}
      // Uzun basma gözle görülmeyen bir hareket: ekran okuyucu kullananlara ayrıca söylenir ve
      // VoiceOver'ın "işlemler" listesinden de açılabilir
      accessibilityHint={onLongPress ? 'Düzenlemek ya da silmek için basılı tut' : undefined}
      accessibilityActions={onLongPress ? [{ name: 'longpress', label: 'Seçenekler' }] : undefined}
      onAccessibilityAction={(olay) => {
        if (olay.nativeEvent.actionName === 'longpress') onLongPress?.();
      }}
      style={({ pressed }) => [gorunum, pressed && { backgroundColor: renk.yuzeyIkincil }]}
    >
      {children}
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  kart: {
    borderRadius: kose.l,
    borderWidth: StyleSheet.hairlineWidth,
    padding: bosluk.l,
    gap: bosluk.s,
  },
});
