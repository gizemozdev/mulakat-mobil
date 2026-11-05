import { type Href, router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { API_ADRESI } from '@/api/istekAt';
import { Dugme } from '@/bilesenler/Dugme';
import { Ekran } from '@/bilesenler/Ekran';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { useOturum } from '@/oturum/OturumContext';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Adresi olan bölümler açılır; olmayanlar sonraki aşamalarda gelecek
const bolumler: { ad: string; aciklama: string; adres?: Href }[] = [
  { ad: 'Pozisyonlar', aciklama: 'Açık pozisyonlar', adres: '/daha-fazla/pozisyonlar' },
  { ad: 'Mülakatçılar', aciklama: 'İK ve teknik mülakatçılar', adres: '/daha-fazla/mulakatcilar' },
  { ad: 'Soru Havuzu', aciklama: 'Teknik konular ve sorular' },
  { ad: 'İK Akışları', aciklama: 'Dallanan İK soruları' },
  { ad: 'İstatistikler', aciklama: 'Kararlar, durumlar, konular' },
  { ad: 'Kullanıcılar', aciklama: 'Hesaplar ve şifre' },
];

// "Elif Yıldız" -> "EY"
const basHarfler = (adSoyad: string) =>
  adSoyad
    .split(' ')
    .filter(Boolean)
    .map((kelime) => kelime[0])
    .slice(0, 2)
    .join('')
    .toLocaleUpperCase('tr');

export default function DahaFazla() {
  const { renk } = useTema();
  const { kullanici, cikisYap } = useOturum();

  // Yanlışlıkla basılmasın diye telefonun kendi onay penceresi
  const cikisOnayi = () =>
    Alert.alert('Çıkış yapılsın mı?', 'Tekrar girmek için kullanıcı adın ve şifren gerekecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: cikisYap },
    ]);

  return (
    <Ekran>
      <Kart style={stiller.profil}>
        <View style={[stiller.simge, { backgroundColor: renk.markaAcik }]}>
          <Yazi tur="altBaslik" renk="marka">
            {basHarfler(kullanici?.adSoyad ?? '')}
          </Yazi>
        </View>

        <View style={stiller.profilBilgi}>
          <Yazi tur="altBaslik">{kullanici?.adSoyad}</Yazi>
          <Yazi tur="kucuk" renk="yaziIkincil">
            {kullanici?.kullaniciAdi}
          </Yazi>
        </View>
      </Kart>

      <Yazi tur="etiket" renk="yaziIkincil" style={stiller.bolumBasligi}>
        YÖNETİM
      </Yazi>

      <Kart style={stiller.liste}>
        {bolumler.map((bolum, sira) => {
          const adres = bolum.adres;

          return (
            <Pressable
              key={bolum.ad}
              onPress={adres ? () => router.push(adres) : undefined}
              disabled={!adres}
              accessibilityRole={adres ? 'button' : undefined}
              accessibilityLabel={adres ? bolum.ad : `${bolum.ad}, yakında`}
              style={({ pressed }) => [
                stiller.satir,
                sira > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: renk.kenar },
                pressed && { backgroundColor: renk.yuzeyIkincil },
              ]}
            >
              <View style={stiller.satirYazi}>
                <Yazi tur="govdeKalin" renk={adres ? 'yazi' : 'yaziIkincil'}>
                  {bolum.ad}
                </Yazi>
                <Yazi tur="kucuk" renk="yaziIkincil">
                  {bolum.aciklama}
                </Yazi>
              </View>

              {adres ? (
                <Yazi renk="yaziSoluk">›</Yazi>
              ) : (
                <Yazi tur="etiket" renk="yaziSoluk">
                  Yakında
                </Yazi>
              )}
            </Pressable>
          );
        })}
      </Kart>

      <Yazi tur="etiket" renk="yaziIkincil" style={stiller.bolumBasligi}>
        BAĞLANTI
      </Yazi>

      <Kart>
        <Yazi tur="kucuk" renk="yaziIkincil">
          Sunucu
        </Yazi>
        <Yazi selectable>{API_ADRESI || 'Ayarlanmamış'}</Yazi>
      </Kart>

      <Dugme yazi="Çıkış yap" tur="tehlike" onPress={cikisOnayi} style={stiller.cikis} />
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  profil: { flexDirection: 'row', alignItems: 'center', gap: bosluk.l },
  simge: { width: 52, height: 52, borderRadius: kose.tam, alignItems: 'center', justifyContent: 'center' },
  profilBilgi: { flex: 1, gap: 2 },
  bolumBasligi: { marginTop: bosluk.m },
  liste: { padding: 0, gap: 0 },
  satir: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: bosluk.l, paddingVertical: bosluk.m + 2 },
  satirYazi: { flex: 1, gap: 2 },
  cikis: { marginTop: bosluk.l },
});
