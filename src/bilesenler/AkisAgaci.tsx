import { StyleSheet, View } from 'react-native';

import { kisalt } from '@/api/ikAkis';
import type { IkAkis, IkSoru } from '@/api/tipler';
import { Etiket } from '@/bilesenler/Kucukler';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Bir soruyu ve seçeneklerinin götürdüğü soruları iç içe çizer (kendini çağıran bileşen).
// yol: kökten bu soruya kadar geçilen sorular; döngü olursa sonsuza gitmesin diye (sunucu zaten engelliyor).
function SoruDugumu({ soru, akis, yol }: { soru: IkSoru; akis: IkAkis; yol: number[] }) {
  const { renk } = useTema();

  return (
    <View style={stiller.dugum}>
      <Yazi tur="govdeKalin">{kisalt(soru.metin, 60)}</Yazi>

      {soru.secenekler.length === 0 ? (
        <Yazi tur="kucuk" renk="uyari">
          Seçenek yok
        </Yazi>
      ) : (
        <View style={[stiller.dallar, { borderLeftColor: renk.kenar }]}>
          {soru.secenekler.map((secenek) => {
            const sonraki = akis.sorular.find((kayit) => kayit.id === secenek.sonrakiSoruId);

            return (
              <View key={secenek.id} style={stiller.dal}>
                <Etiket yazi={secenek.metin} on={renk.marka} zemin={renk.markaAcik} />
                <View style={stiller.alt}>
                  {!sonraki ? (
                    <Yazi tur="kucuk" renk="basari">
                      Akış biter
                    </Yazi>
                  ) : yol.includes(sonraki.id) ? (
                    <Yazi tur="kucuk" renk="hata">
                      Döngü
                    </Yazi>
                  ) : (
                    <SoruDugumu soru={sonraki} akis={akis} yol={[...yol, sonraki.id]} />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// Akışın ilk sorudan başlayan salt okunur ağaç önizlemesi
export function AkisAgaci({ akis }: { akis: IkAkis }) {
  const ilkSoru = akis.sorular.find((soru) => soru.id === akis.ilkSoruId);

  if (!ilkSoru) {
    return <Yazi renk="yaziSoluk">Önizleme için akışa soru ekle ve bir ilk soru seç.</Yazi>;
  }

  return <SoruDugumu soru={ilkSoru} akis={akis} yol={[ilkSoru.id]} />;
}

const stiller = StyleSheet.create({
  dugum: { gap: bosluk.xs + 2 },
  dallar: { borderLeftWidth: 2, paddingLeft: bosluk.m, gap: bosluk.m },
  dal: { gap: bosluk.xs + 2 },
  alt: { paddingLeft: bosluk.m },
});
