import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { gunMetni, tarihGoster } from '@/api/tarih';
import { alanAdi, type Aday, type Mulakat, type Mulakatci } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Kart } from '@/bilesenler/Kart';
import { AramaKutusu, DurumEtiketi, metinIceriyor } from '@/bilesenler/Kucukler';
import { MulakatTakvimi } from '@/bilesenler/MulakatTakvimi';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

const adayaGit = (adayId: number) => router.push({ pathname: '/mulakatlar/[adayId]', params: { adayId } });

// Mülakatlar sekmesi: üstte aylık takvim ve seçilen günün mülakatları, altta adayların mülakat durumları
export default function Mulakatlar() {
  const { renk } = useTema();
  const mulakatVerisi = useVeri<Mulakat[]>('/api/mulakatlar');
  const adayVerisi = useVeri<Aday[]>('/api/adaylar');
  const mulakatciVerisi = useVeri<Mulakatci[]>('/api/mulakatcilar');

  const [seciliGun, setSeciliGun] = useState(() => gunMetni(new Date()));
  const [arama, setArama] = useState('');

  const yenileniyor = mulakatVerisi.yenileniyor || adayVerisi.yenileniyor || mulakatciVerisi.yenileniyor;
  const yenile = async () => {
    await Promise.all([mulakatVerisi.yenile(), adayVerisi.yenile(), mulakatciVerisi.yenile()]);
  };

  const mulakatlar = mulakatVerisi.veri;
  const adaylar = adayVerisi.veri;
  const hata = mulakatVerisi.hata || adayVerisi.hata || mulakatciVerisi.hata;

  if (!mulakatlar || !adaylar) {
    return <Ekran>{hata ? <HataDurumu mesaj={hata} tekrarDene={yenile} /> : <Yukleniyor />}</Ekran>;
  }

  const adayHaritasi = new Map(adaylar.map((aday) => [aday.id, aday]));
  const mulakatciHaritasi = new Map((mulakatciVerisi.veri ?? []).map((mulakatci) => [mulakatci.id, mulakatci]));

  // Takvimde yalnızca tarihi olan ve iptal edilmemiş mülakatlar
  const takvimdekiler = mulakatlar.filter((mulakat) => mulakat.tarih && mulakat.durum !== 'İptal');

  // Saati olmayanlar günün sonuna: "~" bütün rakamlardan sonra sıralanır
  const gununMulakatlari = takvimdekiler
    .filter((mulakat) => mulakat.tarih === seciliGun && adayHaritasi.has(mulakat.adayId))
    .sort((a, b) => (a.saat || '~').localeCompare(b.saat || '~'));

  // Adayın İK / teknik kaydı; kaydı olmayan mülakat "Planlanmadı" sayılır (web'deki kural)
  const durumu = (adayId: number, tur: 'ik' | 'teknik') =>
    mulakatlar.find((mulakat) => mulakat.adayId === adayId && mulakat.tur === tur)?.durum ?? 'Planlanmadı';

  const gorunenAdaylar = adaylar.filter(
    (aday) => metinIceriyor(aday.adSoyad, arama) || metinIceriyor(aday.pozisyon.ad, arama)
  );

  return (
    <Ekran yenile={yenile} yenileniyor={yenileniyor}>
      <MulakatTakvimi mulakatlar={takvimdekiler} secili={seciliGun} onSec={setSeciliGun} />

      <Yazi tur="altBaslik" style={stiller.bolum}>
        {tarihGoster(seciliGun)}
      </Yazi>

      {gununMulakatlari.length === 0 ? (
        <Yazi renk="yaziSoluk">Bu gün planlanmış mülakat yok.</Yazi>
      ) : (
        gununMulakatlari.map((mulakat) => {
          const aday = adayHaritasi.get(mulakat.adayId);
          const mulakatci = mulakat.mulakatciId ? mulakatciHaritasi.get(mulakat.mulakatciId) : undefined;
          const ik = mulakat.tur === 'ik';

          return (
            <Kart
              key={mulakat.id}
              onPress={() => adayaGit(mulakat.adayId)}
              erisimEtiketi={`${mulakat.saat || 'Saat belirlenmedi'}, ${aday?.adSoyad}, ${alanAdi[mulakat.tur]} mülakatı`}
              style={stiller.satir}
            >
              <Yazi tur="govdeKalin" style={stiller.saat}>
                {mulakat.saat || '--:--'}
              </Yazi>

              <View style={[stiller.cizgi, { backgroundColor: ik ? renk.ik : renk.teknik }]} />

              <View style={stiller.bilgi}>
                <Yazi tur="govdeKalin" numberOfLines={1}>
                  {aday?.adSoyad}
                </Yazi>
                <Yazi tur="kucuk" renk="yaziIkincil" numberOfLines={1}>
                  {alanAdi[mulakat.tur]} · {mulakatci?.adSoyad ?? 'Mülakatçı seçilmedi'}
                </Yazi>
              </View>

              <DurumEtiketi durum={mulakat.durum} />
            </Kart>
          );
        })
      )}

      <Yazi tur="etiket" renk="yaziIkincil" style={stiller.bolum}>
        ADAYLAR
      </Yazi>

      {adaylar.length === 0 ? (
        <BosDurum baslik="Henüz aday yok" aciklama="Adaylar sekmesinden aday ekleyince mülakatlarını burada planlayabilirsin." />
      ) : (
        <>
          <AramaKutusu deger={arama} onDegistir={setArama} yerTutucu="Aday ya da pozisyon ara" />

          {gorunenAdaylar.length === 0 && <Yazi renk="yaziSoluk">Aramaya uyan aday yok.</Yazi>}

          {gorunenAdaylar.map((aday) => (
            <Kart key={aday.id} onPress={() => adayaGit(aday.id)} erisimEtiketi={aday.adSoyad} style={stiller.aday}>
              <View style={stiller.adayUst}>
                <View style={stiller.bilgi}>
                  <Yazi tur="govdeKalin" numberOfLines={1}>
                    {aday.adSoyad}
                  </Yazi>
                  <Yazi tur="kucuk" renk="yaziIkincil" numberOfLines={1}>
                    {aday.pozisyon.ad}
                  </Yazi>
                </View>
                <Yazi renk="yaziSoluk">›</Yazi>
              </View>

              <View style={stiller.etiketler}>
                <DurumEtiketi durum={durumu(aday.id, 'ik')} onEk="İK" />
                <DurumEtiketi durum={durumu(aday.id, 'teknik')} onEk="Teknik" />
              </View>
            </Kart>
          ))}
        </>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  bolum: { marginTop: bosluk.s },
  satir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  saat: { width: 48 },
  cizgi: { width: 4, alignSelf: 'stretch', borderRadius: kose.tam },
  bilgi: { flex: 1, gap: 2 },
  aday: { gap: bosluk.s },
  adayUst: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  etiketler: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.s },
});
