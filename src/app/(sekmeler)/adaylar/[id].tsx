import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { cvAc, cvYukle } from '@/api/cv';
import { istekAt } from '@/api/istekAt';
import type { Aday } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { Dugme } from '@/bilesenler/Dugme';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Kart } from '@/bilesenler/Kart';
import { BasHarf, KararEtiketi } from '@/bilesenler/Kucukler';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// 245760 -> "240 KB", 1572864 -> "1,5 MB"
const boyutGoster = (bayt: number) =>
  bayt < 1024 * 1024
    ? `${Math.max(1, Math.round(bayt / 1024))} KB`
    : `${(bayt / (1024 * 1024)).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} MB`;

// Dokununca arama / e-posta uygulaması açılan satır
function IletisimSatiri({ etiket, deger, adres }: { etiket: string; deger: string; adres: string }) {
  const { renk } = useTema();

  if (!deger) {
    return (
      <View style={stiller.iletisim}>
        <Yazi tur="kucuk" renk="yaziIkincil">
          {etiket}
        </Yazi>
        <Yazi renk="yaziSoluk">Girilmemiş</Yazi>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => Linking.openURL(adres).catch(() => Alert.alert('Açılamadı', `${etiket} uygulaması açılamadı.`))}
      accessibilityRole="link"
      accessibilityLabel={`${etiket}: ${deger}`}
      style={({ pressed }) => [stiller.iletisim, pressed && { backgroundColor: renk.yuzeyIkincil }]}
    >
      <Yazi tur="kucuk" renk="yaziIkincil">
        {etiket}
      </Yazi>
      <Yazi renk="marka">{deger}</Yazi>
    </Pressable>
  );
}

export default function AdayDetayi() {
  const { renk } = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { veri: adaylar, hata, yenile, setVeri } = useVeri<Aday[]>('/api/adaylar');

  const [cvIsleniyor, setCvIsleniyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);

  const aday = adaylar?.find((kayit) => String(kayit.id) === id);

  if (!adaylar) {
    return <Ekran>{hata ? <HataDurumu mesaj={hata} tekrarDene={yenile} /> : <Yukleniyor />}</Ekran>;
  }

  if (!aday) {
    return (
      <Ekran>
        <BosDurum baslik="Aday bulunamadı" aciklama="Bu aday silinmiş olabilir." />
      </Ekran>
    );
  }

  // Sunucudan dönen güncel adayı listede yerine koyar (CV değişince)
  const adayiGuncelle = (guncel: Aday) =>
    setVeri(adaylar.map((kayit) => (kayit.id === guncel.id ? guncel : kayit)));

  const cvyiAc = async () => {
    setCvIsleniyor(true);
    const hataMesaji = await cvAc(aday.id);
    setCvIsleniyor(false);
    if (hataMesaji) Alert.alert('CV açılamadı', hataMesaji);
  };

  const cvyiYukle = async () => {
    setCvIsleniyor(true);
    const sonuc = await cvYukle(aday.id);
    setCvIsleniyor(false);

    if (sonuc.aday) adayiGuncelle(sonuc.aday);
    else if (sonuc.hata) Alert.alert('CV yüklenemedi', sonuc.hata);
  };

  const cvyiKaldir = () =>
    Alert.alert('CV kaldırılsın mı?', `${aday.adSoyad} adayının CV'si silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: async () => {
          setCvIsleniyor(true);
          const { veri, hata: istekHatasi } = await istekAt<Aday>(`/api/adaylar/${aday.id}/cv`, 'DELETE');
          setCvIsleniyor(false);

          if (veri) adayiGuncelle(veri);
          else Alert.alert('CV kaldırılamadı', istekHatasi);
        },
      },
    ]);

  const sil = () =>
    Alert.alert('Aday silinsin mi?', `${aday.adSoyad} ve bütün mülakat kayıtları silinecek. Bu geri alınamaz.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setSiliniyor(true);
          const { hata: istekHatasi } = await istekAt(`/api/adaylar/${aday.id}`, 'DELETE');
          setSiliniyor(false);

          if (istekHatasi) Alert.alert('Aday silinemedi', istekHatasi);
          else router.back();
        },
      },
    ]);

  return (
    <Ekran yenile={yenile}>
      <View style={stiller.ust}>
        <BasHarf adSoyad={aday.adSoyad} boyut={72} />
        <Yazi tur="baslik" style={stiller.ortala}>
          {aday.adSoyad}
        </Yazi>
        <Yazi renk="yaziIkincil">
          {aday.pozisyon.ad} · {aday.yas} yaş
        </Yazi>
      </View>

      <Kart style={stiller.liste}>
        <IletisimSatiri etiket="E-posta" deger={aday.eposta} adres={`mailto:${aday.eposta}`} />
        <View style={[stiller.ayrac, { backgroundColor: renk.kenar }]} />
        <IletisimSatiri etiket="Telefon" deger={aday.telefon} adres={`tel:${aday.telefon.replace(/[^\d+]/g, '')}`} />
      </Kart>

      {/* Dokununca karar formu alttan açılır; dönünce useVeri ekranı yenilediği için yeni karar görünür */}
      <Kart
        onPress={() => router.push({ pathname: '/adaylar/karar', params: { id: aday.id } })}
        erisimEtiketi={`Karar: ${aday.karar}. Değiştirmek için dokun.`}
      >
        <View style={stiller.kararUst}>
          <Yazi tur="etiket" renk="yaziIkincil" style={stiller.esit}>
            KARAR
          </Yazi>
          <Yazi tur="kucuk" renk="marka">
            Değiştir ›
          </Yazi>
        </View>
        <KararEtiketi karar={aday.karar} />
        {aday.kararNotu ? <Yazi>{aday.kararNotu}</Yazi> : null}
      </Kart>

      <Kart>
        <Yazi tur="etiket" renk="yaziIkincil">
          CV
        </Yazi>

        {aday.cv ? (
          <>
            <Yazi numberOfLines={1}>{aday.cv.dosyaAdi}</Yazi>
            <Yazi tur="kucuk" renk="yaziIkincil">
              {boyutGoster(aday.cv.boyut)}
            </Yazi>
            <Dugme yazi="CV'yi aç" onPress={cvyiAc} yukleniyor={cvIsleniyor} />
            <View style={stiller.ikili}>
              <Dugme yazi="Değiştir" tur="ikincil" onPress={cvyiYukle} disabled={cvIsleniyor} style={stiller.esit} />
              <Dugme yazi="Kaldır" tur="tehlike" onPress={cvyiKaldir} disabled={cvIsleniyor} style={stiller.esit} />
            </View>
          </>
        ) : (
          <>
            <Yazi renk="yaziSoluk">Henüz CV yüklenmemiş.</Yazi>
            <Dugme yazi="CV yükle (PDF)" tur="ikincil" onPress={cvyiYukle} yukleniyor={cvIsleniyor} />
          </>
        )}
      </Kart>

      <View style={stiller.ikili}>
        <Dugme
          yazi="Mülakatlar"
          onPress={() => router.push({ pathname: '/adaylar/mulakat/[adayId]', params: { adayId: aday.id } })}
          style={stiller.esit}
        />
        <Dugme
          yazi="Rapor"
          tur="ikincil"
          onPress={() => router.push({ pathname: '/rapor/[adayId]', params: { adayId: aday.id } })}
          style={stiller.esit}
        />
      </View>

      <View style={stiller.ikili}>
        <Dugme
          yazi="Düzenle"
          tur="ikincil"
          onPress={() => router.push({ pathname: '/adaylar/form', params: { id: aday.id } })}
          style={stiller.esit}
        />
        <Dugme yazi="Sil" tur="tehlike" onPress={sil} yukleniyor={siliniyor} style={stiller.esit} />
      </View>
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  ust: { alignItems: 'center', gap: bosluk.xs, marginVertical: bosluk.s },
  ortala: { textAlign: 'center' },
  liste: { padding: 0, gap: 0 },
  iletisim: { paddingHorizontal: bosluk.l, paddingVertical: bosluk.m, gap: 2 },
  ayrac: { height: StyleSheet.hairlineWidth, marginLeft: bosluk.l },
  ikili: { flexDirection: 'row', gap: bosluk.m },
  esit: { flex: 1 },
  kararUst: { flexDirection: 'row', alignItems: 'center' },
});
