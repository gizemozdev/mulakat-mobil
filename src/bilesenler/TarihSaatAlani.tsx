import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { gunMetni, metindenSaat, metindenTarih, saatMetni, tarihGoster } from '@/api/tarih';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Yazi } from '@/bilesenler/Yazi';
import { DOKUNMA_YUKSEKLIGI, bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

type TarihSaatAlaniProps = {
  tur: 'tarih' | 'saat';
  etiket: string;
  // "YYYY-AA-GG" ya da "SS:DD"; boş metin = belirlenmedi
  deger: string;
  onDegistir: (deger: string) => void;
};

// Telefonun kendi tarih / saat seçicisi. Seçici her zaman bir değer ister; "belirlenmedi" durumu için
// boşken yalnızca "Tarih seç" düğmesi görünür, seçilince yanına "Kaldır" gelir.
export function TarihSaatAlani({ tur, etiket, deger, onDegistir }: TarihSaatAlaniProps) {
  const { renk, koyu } = useTema();
  // Android'de seçici ekranın ortasında açılan bir pencere; yalnızca açıkken çizilir
  const [androidAcik, setAndroidAcik] = useState(false);

  const tarihMi = tur === 'tarih';
  const ios = Platform.OS === 'ios';

  const degerTarihe = () => (tarihMi ? metindenTarih(deger) : metindenSaat(deger));
  const tarihMetne = (tarih: Date) => (tarihMi ? gunMetni(tarih) : saatMetni(tarih));

  // İlk seçimde bugünün tarihi / 10:00 ile başlanır
  const ilkDeger = () => (tarihMi ? gunMetni(new Date()) : '10:00');

  const secici = (
    <DateTimePicker
      value={deger ? degerTarihe() : tarihMi ? new Date() : metindenSaat('10:00')}
      mode={tarihMi ? 'date' : 'time'}
      display={ios ? 'compact' : 'default'}
      locale="tr-TR"
      is24Hour
      minuteInterval={5}
      accentColor={renk.marka}
      themeVariant={koyu ? 'dark' : 'light'}
      onValueChange={(_olay, tarih) => {
        setAndroidAcik(false);
        onDegistir(tarihMetne(tarih));
      }}
      onDismiss={() => setAndroidAcik(false)}
    />
  );

  return (
    <View style={stiller.alan}>
      <Yazi tur="kucuk" renk="yaziIkincil">
        {etiket}
      </Yazi>

      <View style={stiller.satir}>
        {!deger ? (
          <Pressable
            onPress={() => (ios ? onDegistir(ilkDeger()) : setAndroidAcik(true))}
            accessibilityRole="button"
            accessibilityLabel={`${etiket} seç`}
            style={({ pressed }) => [
              stiller.bos,
              { borderColor: renk.kenar, backgroundColor: pressed ? renk.yuzeyIkincil : renk.yuzey },
            ]}
          >
            <Yazi renk="marka">{tarihMi ? 'Tarih seç' : 'Saat seç'}</Yazi>
          </Pressable>
        ) : ios ? (
          secici
        ) : (
          <Pressable
            onPress={() => setAndroidAcik(true)}
            accessibilityRole="button"
            accessibilityLabel={`${etiket}: ${deger}, değiştir`}
            style={({ pressed }) => [stiller.bos, { borderColor: renk.kenar, opacity: pressed ? 0.6 : 1 }]}
          >
            <Yazi>{tarihMi ? tarihGoster(deger) : deger}</Yazi>
          </Pressable>
        )}

        {deger ? <BaslikDugmesi yazi="Kaldır" onPress={() => onDegistir('')} /> : null}
      </View>

      {!ios && androidAcik && secici}
    </View>
  );
}

const stiller = StyleSheet.create({
  alan: { gap: bosluk.xs },
  satir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m, minHeight: DOKUNMA_YUKSEKLIGI - 8 },
  bos: {
    minHeight: DOKUNMA_YUKSEKLIGI - 8,
    paddingHorizontal: bosluk.l,
    borderWidth: 1,
    borderRadius: kose.s,
    justifyContent: 'center',
  },
});
