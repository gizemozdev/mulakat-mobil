import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { gunMetni } from '@/api/tarih';
import type { Alan } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

const gunAdlari = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

type MulakatTakvimiProps = {
  // Yalnızca tarihi olan mülakatlar; gün başına İK / teknik noktası için
  mulakatlar: { tarih: string; tur: Alan }[];
  secili: string;
  onSec: (tarih: string) => void;
};

// Aylık takvim: hafta pazartesi başlar, mülakat olan günlerin altında İK (mor) / teknik (mavi) noktası
export function MulakatTakvimi({ mulakatlar, secili, onSec }: MulakatTakvimiProps) {
  const { renk } = useTema();
  const bugun = gunMetni(new Date());

  // Gösterilen ayın ilk günü
  const [ay, setAy] = useState(() => {
    const simdi = new Date();
    return new Date(simdi.getFullYear(), simdi.getMonth(), 1);
  });

  // "2026-11-05" -> o günkü mülakat türleri
  const gunTurleri = new Map<string, Set<Alan>>();
  for (const mulakat of mulakatlar) {
    if (!gunTurleri.has(mulakat.tarih)) gunTurleri.set(mulakat.tarih, new Set());
    gunTurleri.get(mulakat.tarih)?.add(mulakat.tur);
  }

  // getDay(): pazar 0; pazartesiyi 0 yapmak için 6 eklenip 7'ye göre kalan alınır
  const bosluklar = (ay.getDay() + 6) % 7;
  // Sonraki ayın 0. günü = bu ayın son günü
  const gunSayisi = new Date(ay.getFullYear(), ay.getMonth() + 1, 0).getDate();

  const hucreler: (string | null)[] = [
    ...Array<null>(bosluklar).fill(null),
    ...Array.from({ length: gunSayisi }, (_, i) => gunMetni(new Date(ay.getFullYear(), ay.getMonth(), i + 1))),
  ];
  while (hucreler.length % 7 !== 0) hucreler.push(null);

  const haftalar = Array.from({ length: hucreler.length / 7 }, (_, i) => hucreler.slice(i * 7, i * 7 + 7));

  const ayDegistir = (fark: number) => setAy(new Date(ay.getFullYear(), ay.getMonth() + fark, 1));

  const buAy = bugun.startsWith(gunMetni(ay).slice(0, 7));

  const bugunGit = () => {
    const simdi = new Date();
    setAy(new Date(simdi.getFullYear(), simdi.getMonth(), 1));
    onSec(bugun);
  };

  return (
    <Kart style={stiller.kart}>
      <View style={stiller.ust}>
        <Yazi tur="altBaslik" style={stiller.ayAdi}>
          {ay.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
        </Yazi>
        {!buAy && <BaslikDugmesi yazi="Bugün" onPress={bugunGit} />}
        <Pressable onPress={() => ayDegistir(-1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Önceki ay" style={stiller.ok}>
          <Yazi tur="altBaslik" renk="marka">
            ‹
          </Yazi>
        </Pressable>
        <Pressable onPress={() => ayDegistir(1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Sonraki ay" style={stiller.ok}>
          <Yazi tur="altBaslik" renk="marka">
            ›
          </Yazi>
        </Pressable>
      </View>

      <View style={stiller.hafta}>
        {gunAdlari.map((ad) => (
          <Yazi key={ad} tur="etiket" renk="yaziSoluk" style={stiller.gunAdi}>
            {ad}
          </Yazi>
        ))}
      </View>

      {haftalar.map((hafta, sira) => (
        <View key={sira} style={stiller.hafta}>
          {hafta.map((tarih, i) => {
            if (!tarih) return <View key={`bos-${i}`} style={stiller.hucre} />;

            const seciliMi = tarih === secili;
            const bugunMu = tarih === bugun;
            const turler = gunTurleri.get(tarih);
            const gun = Number(tarih.slice(8));

            return (
              <Pressable
                key={tarih}
                onPress={() => onSec(tarih)}
                accessibilityRole="button"
                accessibilityState={{ selected: seciliMi }}
                accessibilityLabel={`${gun}${turler ? ', mülakat var' : ''}`}
                style={stiller.hucre}
              >
                <View
                  style={[
                    stiller.daire,
                    seciliMi && { backgroundColor: renk.marka },
                    !seciliMi && bugunMu && { backgroundColor: renk.markaAcik },
                  ]}
                >
                  <Yazi
                    tur={bugunMu || seciliMi ? 'govdeKalin' : 'govde'}
                    style={{ color: seciliMi ? renk.markaUstuYazi : bugunMu ? renk.marka : renk.yazi }}
                  >
                    {gun}
                  </Yazi>
                </View>

                <View style={stiller.noktalar}>
                  {turler?.has('ik') && <View style={[stiller.nokta, { backgroundColor: renk.ik }]} />}
                  {turler?.has('teknik') && <View style={[stiller.nokta, { backgroundColor: renk.teknik }]} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={stiller.aciklama}>
        <View style={[stiller.nokta, { backgroundColor: renk.ik }]} />
        <Yazi tur="kucuk" renk="yaziIkincil">
          İK
        </Yazi>
        <View style={[stiller.nokta, { backgroundColor: renk.teknik }]} />
        <Yazi tur="kucuk" renk="yaziIkincil">
          Teknik
        </Yazi>
      </View>
    </Kart>
  );
}

const stiller = StyleSheet.create({
  kart: { gap: bosluk.xs },
  ust: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m, marginBottom: bosluk.s },
  ayAdi: { flex: 1, textTransform: 'capitalize' },
  ok: { paddingHorizontal: bosluk.s },
  hafta: { flexDirection: 'row' },
  gunAdi: { flex: 1, textAlign: 'center' },
  hucre: { flex: 1, alignItems: 'center', paddingVertical: 2, minHeight: 48 },
  daire: { width: 36, height: 36, borderRadius: kose.tam, alignItems: 'center', justifyContent: 'center' },
  noktalar: { flexDirection: 'row', gap: 3, height: 6, marginTop: 2 },
  nokta: { width: 6, height: 6, borderRadius: kose.tam },
  aciklama: { flexDirection: 'row', alignItems: 'center', gap: bosluk.xs + 2, marginTop: bosluk.s },
});
