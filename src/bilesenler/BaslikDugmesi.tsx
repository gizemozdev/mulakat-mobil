import { Pressable } from 'react-native';

import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';

type BaslikDugmesiProps = {
  yazi: string;
  onPress: () => void;
  kalin?: boolean;
  pasif?: boolean;
};

// Ekranın üst çubuğundaki yazılı düğme ("Ekle", "Kaydet", "Vazgeç")
export function BaslikDugmesi({ yazi, onPress, kalin = false, pasif = false }: BaslikDugmesiProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={pasif}
      accessibilityRole="button"
      hitSlop={10}
      style={({ pressed }) => ({ paddingHorizontal: bosluk.xs, opacity: pasif ? 0.4 : pressed ? 0.6 : 1 })}
    >
      <Yazi tur={kalin ? 'govdeKalin' : 'govde'} renk="marka">
        {yazi}
      </Yazi>
    </Pressable>
  );
}
