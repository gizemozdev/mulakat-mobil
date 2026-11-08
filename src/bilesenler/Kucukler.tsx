import { StyleSheet, TextInput, View } from 'react-native';

import { Yazi } from '@/bilesenler/Yazi';
import type { Durum, Karar } from '@/api/tipler';
import { DOKUNMA_YUKSEKLIGI, bosluk, kose } from '@/tema/olculer';
import type { Renkler } from '@/tema/renkler';
import { useTema } from '@/tema/useTema';

// "Elif Yıldız" -> "EY"
export const basHarfler = (adSoyad: string) =>
  adSoyad
    .split(' ')
    .filter(Boolean)
    .map((kelime) => kelime[0])
    .slice(0, 2)
    .join('')
    .toLocaleUpperCase('tr');

// Türkçe harflere uygun, büyük / küçük harf duyarsız arama ("ELİF" içinde "elif" bulunur)
export const metinIceriyor = (metin: string, aranan: string) =>
  metin.toLocaleLowerCase('tr').includes(aranan.trim().toLocaleLowerCase('tr'));

export function BasHarf({ adSoyad, boyut = 44 }: { adSoyad: string; boyut?: number }) {
  const { renk } = useTema();

  return (
    <View
      style={[stiller.simge, { width: boyut, height: boyut, backgroundColor: renk.markaAcik }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Yazi tur={boyut > 50 ? 'baslik' : 'govdeKalin'} renk="marka">
        {basHarfler(adSoyad)}
      </Yazi>
    </View>
  );
}

// Küçük renkli etiket (karar, alan); renk + yazı birlikte, yalnızca renge dayanmaz
export function Etiket({ yazi, on, zemin }: { yazi: string; on: string; zemin: string }) {
  return (
    <View style={[stiller.etiket, { backgroundColor: zemin }]}>
      <Yazi tur="etiket" style={{ color: on }}>
        {yazi}
      </Yazi>
    </View>
  );
}

// Web'deki karar renkleriyle aynı anlam: gri bekliyor, sarı beklemede, mavi teklif, yeşil işe alındı, kırmızı ret
export const kararRenkleri = (karar: Karar, renk: Renkler) =>
  ({
    'Değerlendiriliyor': { on: renk.yaziIkincil, zemin: renk.yuzeyIkincil },
    Beklemede: { on: renk.uyari, zemin: renk.uyariAcik },
    'Teklif verildi': { on: renk.teknik, zemin: renk.teknikAcik },
    'İşe alındı': { on: renk.basari, zemin: renk.basariAcik },
    Reddedildi: { on: renk.hata, zemin: renk.hataAcik },
  })[karar];

export function KararEtiketi({ karar }: { karar: Karar }) {
  const { renk } = useTema();

  return <Etiket yazi={karar} {...kararRenkleri(karar, renk)} />;
}

// Mülakat durumu: sarı planlanmadı, marka rengi planlandı, yeşil tamamlandı, kırmızı iptal
export const durumRenkleri = (durum: Durum, renk: Renkler) =>
  ({
    'Planlanmadı': { on: renk.uyari, zemin: renk.uyariAcik },
    Planlandı: { on: renk.marka, zemin: renk.markaAcik },
    Tamamlandı: { on: renk.basari, zemin: renk.basariAcik },
    İptal: { on: renk.hata, zemin: renk.hataAcik },
  })[durum];

// "onEk" verilirse durumun önüne eklenir: "İK: Planlandı"
export function DurumEtiketi({ durum, onEk }: { durum: Durum; onEk?: string }) {
  const { renk } = useTema();

  return <Etiket yazi={onEk ? `${onEk}: ${durum}` : durum} {...durumRenkleri(durum, renk)} />;
}

export function AramaKutusu({ deger, onDegistir, yerTutucu }: { deger: string; onDegistir: (metin: string) => void; yerTutucu: string }) {
  const { renk } = useTema();

  return (
    <TextInput
      value={deger}
      onChangeText={onDegistir}
      placeholder={yerTutucu}
      placeholderTextColor={renk.yaziSoluk}
      accessibilityLabel={yerTutucu}
      autoCorrect={false}
      clearButtonMode="while-editing"
      returnKeyType="search"
      style={[stiller.arama, { backgroundColor: renk.yuzeyIkincil, color: renk.yazi }]}
    />
  );
}

const stiller = StyleSheet.create({
  simge: { borderRadius: kose.tam, alignItems: 'center', justifyContent: 'center' },
  etiket: { alignSelf: 'flex-start', paddingHorizontal: bosluk.s + 2, paddingVertical: 3, borderRadius: kose.tam },
  arama: { minHeight: DOKUNMA_YUKSEKLIGI - 8, borderRadius: kose.m, paddingHorizontal: bosluk.l, fontSize: 16 },
});
