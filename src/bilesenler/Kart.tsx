import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

type KartProps = {
  children: ReactNode;
  // Verilirse kart dokunulabilir olur (basılınca hafifçe kararır)
  onPress?: () => void;
  erisimEtiketi?: string;
  style?: StyleProp<ViewStyle>;
};

export function Kart({ children, onPress, erisimEtiketi, style }: KartProps) {
  const { renk } = useTema();
  const gorunum = [stiller.kart, { backgroundColor: renk.yuzey, borderColor: renk.kenar }, style];

  if (!onPress) {
    return <View style={gorunum}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={erisimEtiketi}
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
