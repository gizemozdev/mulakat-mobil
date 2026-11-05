import { StyleSheet, Text, type TextProps } from 'react-native';

import type { Renkler } from '@/tema/renkler';
import { useTema } from '@/tema/useTema';

type Tur = 'buyukBaslik' | 'baslik' | 'altBaslik' | 'govde' | 'govdeKalin' | 'kucuk' | 'etiket';

type YaziProps = TextProps & {
  tur?: Tur;
  renk?: keyof Renkler;
};

// Uygulamadaki bütün yazılar; telefonun "büyük yazı" ayarına uyar (allowFontScaling varsayılan açık)
export function Yazi({ tur = 'govde', renk = 'yazi', style, ...digerleri }: YaziProps) {
  const { renk: tema } = useTema();

  return <Text style={[stiller[tur], { color: tema[renk] }, style]} {...digerleri} />;
}

const stiller = StyleSheet.create({
  buyukBaslik: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.5 },
  baslik: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  altBaslik: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  govde: { fontSize: 16, lineHeight: 22 },
  govdeKalin: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  kucuk: { fontSize: 14, lineHeight: 19 },
  etiket: { fontSize: 13, lineHeight: 17, fontWeight: '600', letterSpacing: 0.2 },
});
