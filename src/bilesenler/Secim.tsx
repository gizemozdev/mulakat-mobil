import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Yazi } from '@/bilesenler/Yazi';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

type Secenek<T> = { deger: T; etiket: string };

type SecimProps<T> = {
  etiket?: string;
  secenekler: Secenek<T>[];
  secili: T;
  onSec: (deger: T) => void;
  // Çok seçenekte yatay kayan tek satır (süzgeçler), azsa alt alta sarılan kutucuklar (formlar)
  kaydirilabilir?: boolean;
  hata?: string;
};

// Telefonda açılır liste yerine dokunulabilir seçenek kutucukları
export function Secim<T extends string | number | null>({
  etiket,
  secenekler,
  secili,
  onSec,
  kaydirilabilir = false,
  hata,
}: SecimProps<T>) {
  const { renk } = useTema();

  const kutucuklar = secenekler.map((secenek) => {
    const seciliMi = secenek.deger === secili;

    return (
      <Pressable
        key={String(secenek.deger)}
        onPress={() => onSec(secenek.deger)}
        accessibilityRole="radio"
        accessibilityState={{ selected: seciliMi }}
        style={({ pressed }) => [
          stiller.kutucuk,
          {
            backgroundColor: seciliMi ? renk.marka : renk.yuzey,
            borderColor: seciliMi ? renk.marka : renk.kenar,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Yazi tur="etiket" renk={seciliMi ? 'markaUstuYazi' : 'yazi'}>
          {secenek.etiket}
        </Yazi>
      </Pressable>
    );
  });

  return (
    <View style={stiller.kap}>
      {etiket ? (
        <Yazi tur="etiket" renk="yaziIkincil">
          {etiket}
        </Yazi>
      ) : null}

      {kaydirilabilir ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.satir}>
          {kutucuklar}
        </ScrollView>
      ) : (
        <View style={[stiller.satir, stiller.sarilan]} accessibilityRole="radiogroup">
          {kutucuklar}
        </View>
      )}

      {hata ? (
        <Yazi tur="kucuk" renk="hata">
          {hata}
        </Yazi>
      ) : null}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: bosluk.xs + 2 },
  satir: { flexDirection: 'row', gap: bosluk.s },
  sarilan: { flexWrap: 'wrap' },
  kutucuk: {
    minHeight: 40,
    paddingHorizontal: bosluk.l - 2,
    justifyContent: 'center',
    borderRadius: kose.tam,
    borderWidth: 1,
  },
});
