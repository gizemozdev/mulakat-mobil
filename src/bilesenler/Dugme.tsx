import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Yazi } from '@/bilesenler/Yazi';
import { DOKUNMA_YUKSEKLIGI, bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

type Tur = 'birincil' | 'ikincil' | 'tehlike' | 'metin';

type DugmeProps = Omit<PressableProps, 'children'> & {
  yazi: string;
  tur?: Tur;
  yukleniyor?: boolean;
};

// Basılınca hafifçe kararır; yüklenirken dönen gösterge çıkar ve ikinci kez basılamaz
export function Dugme({ yazi, tur = 'birincil', yukleniyor = false, disabled, style, ...digerleri }: DugmeProps) {
  const { renk } = useTema();
  const pasif = disabled || yukleniyor;

  const zemin = {
    birincil: renk.marka,
    ikincil: renk.yuzeyIkincil,
    tehlike: renk.hataAcik,
    metin: 'transparent',
  }[tur];

  const yaziRengi = ({ birincil: 'markaUstuYazi', ikincil: 'yazi', tehlike: 'hata', metin: 'marka' } as const)[tur];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: pasif, busy: yukleniyor }}
      disabled={pasif}
      style={(durum) => [
        stiller.dugme,
        { backgroundColor: zemin, opacity: pasif ? 0.55 : durum.pressed ? 0.8 : 1 },
        typeof style === 'function' ? style(durum) : style,
      ]}
      {...digerleri}
    >
      {yukleniyor ? (
        <ActivityIndicator color={renk[yaziRengi]} />
      ) : (
        <Yazi tur="govdeKalin" renk={yaziRengi}>
          {yazi}
        </Yazi>
      )}
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  dugme: {
    minHeight: DOKUNMA_YUKSEKLIGI,
    borderRadius: kose.m,
    paddingHorizontal: bosluk.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
