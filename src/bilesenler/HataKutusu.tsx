import { StyleSheet, View } from 'react-native';

import { Yazi } from '@/bilesenler/Yazi';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Formlarda sunucudan gelen hata mesajı (boşsa hiçbir şey çizilmez)
export function HataKutusu({ mesaj }: { mesaj: string }) {
  const { renk } = useTema();

  if (!mesaj) return null;

  return (
    <View style={[stiller.kutu, { backgroundColor: renk.hataAcik }]} accessibilityLiveRegion="polite">
      <Yazi tur="kucuk" renk="hata">
        {mesaj}
      </Yazi>
    </View>
  );
}

const stiller = StyleSheet.create({
  kutu: { borderRadius: kose.s, padding: bosluk.m },
});
