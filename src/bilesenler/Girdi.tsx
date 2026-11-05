import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { Yazi } from '@/bilesenler/Yazi';
import { DOKUNMA_YUKSEKLIGI, bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

type GirdiProps = TextInputProps & {
  ref?: Ref<TextInputInstance>;
  etiket: string;
  hata?: string;
  // Şifre alanında "Göster / Gizle" düğmesi çıkar
  sifre?: boolean;
};

// Etiketli giriş alanı; odaklanınca marka renginde, hata varsa kırmızı kenarlık.
// ref (React 19'da sıradan bir prop): formda "İleri" tuşuyla sonraki alana geçebilmek için
export function Girdi({ ref, etiket, hata, sifre = false, style, onFocus, onBlur, ...digerleri }: GirdiProps) {
  const { renk } = useTema();
  const [odakli, setOdakli] = useState(false);
  const [sifreGorunur, setSifreGorunur] = useState(false);

  const kenarRengi = hata ? renk.hata : odakli ? renk.marka : renk.kenar;

  return (
    <View style={stiller.kap}>
      <Yazi tur="etiket" renk="yaziIkincil">
        {etiket}
      </Yazi>

      <View style={[stiller.alan, { borderColor: kenarRengi, backgroundColor: renk.yuzey }]}>
        <TextInput
          ref={ref}
          placeholderTextColor={renk.yaziSoluk}
          secureTextEntry={sifre && !sifreGorunur}
          accessibilityLabel={etiket}
          onFocus={(olay) => {
            setOdakli(true);
            onFocus?.(olay);
          }}
          onBlur={(olay) => {
            setOdakli(false);
            onBlur?.(olay);
          }}
          style={[stiller.girdi, { color: renk.yazi }, style]}
          {...digerleri}
        />

        {sifre && (
          <Pressable
            onPress={() => setSifreGorunur(!sifreGorunur)}
            accessibilityRole="button"
            accessibilityLabel={sifreGorunur ? 'Şifreyi gizle' : 'Şifreyi göster'}
            hitSlop={8}
            style={stiller.goster}
          >
            <Yazi tur="etiket" renk="marka">
              {sifreGorunur ? 'Gizle' : 'Göster'}
            </Yazi>
          </Pressable>
        )}
      </View>

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
  alan: {
    minHeight: DOKUNMA_YUKSEKLIGI + 4,
    borderWidth: 1.5,
    borderRadius: kose.m,
    flexDirection: 'row',
    alignItems: 'center',
  },
  girdi: { flex: 1, fontSize: 16, paddingHorizontal: bosluk.l, paddingVertical: bosluk.m },
  goster: { paddingHorizontal: bosluk.l, paddingVertical: bosluk.m },
});
