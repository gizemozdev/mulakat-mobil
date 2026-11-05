import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesenler/Dugme';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Her listenin üç ortak durumu: yükleniyor, boş, hata. Ekranlar bunları tekrar yazmaz.

export function Yukleniyor({ yazi = 'Yükleniyor...' }: { yazi?: string }) {
  const { renk } = useTema();

  return (
    <View style={stiller.orta} accessibilityLabel={yazi}>
      <ActivityIndicator color={renk.marka} />
      <Yazi tur="kucuk" renk="yaziIkincil">
        {yazi}
      </Yazi>
    </View>
  );
}

export function BosDurum({ baslik, aciklama }: { baslik: string; aciklama?: string }) {
  return (
    <Kart style={stiller.ortaKart}>
      <Yazi tur="altBaslik" style={stiller.ortala}>
        {baslik}
      </Yazi>
      {aciklama ? (
        <Yazi tur="kucuk" renk="yaziIkincil" style={stiller.ortala}>
          {aciklama}
        </Yazi>
      ) : null}
    </Kart>
  );
}

export function HataDurumu({ mesaj, tekrarDene }: { mesaj: string; tekrarDene?: () => void }) {
  const { renk } = useTema();

  return (
    <Kart style={{ backgroundColor: renk.hataAcik, borderColor: renk.hataAcik }}>
      <Yazi tur="govdeKalin" renk="hata">
        Bir sorun oluştu
      </Yazi>
      <Yazi tur="kucuk" renk="yaziIkincil">
        {mesaj}
      </Yazi>
      {tekrarDene ? <Dugme yazi="Tekrar dene" tur="ikincil" onPress={tekrarDene} /> : null}
    </Kart>
  );
}

const stiller = StyleSheet.create({
  orta: { alignItems: 'center', gap: bosluk.s, paddingVertical: bosluk.xxl },
  ortaKart: { alignItems: 'center', paddingVertical: bosluk.xl },
  ortala: { textAlign: 'center' },
});
