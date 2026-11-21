import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { akisUyarilari, kisalt } from '@/api/ikAkis';
import { istekAt } from '@/api/istekAt';
import type { IkAkis, IkSoru } from '@/api/tipler';
import { useVeri } from '@/api/useVeri';
import { AkisAgaci } from '@/bilesenler/AkisAgaci';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Kart } from '@/bilesenler/Kart';
import { Etiket } from '@/bilesenler/Kucukler';
import { Secim } from '@/bilesenler/Secim';
import { uzunBasmaMenusu } from '@/bilesenler/uzunBasma';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

type Gorunum = 'sorular' | 'onizleme';

// Bir akışın düzenleme ekranı: uyarılar, soru kartları (seçenekler ve gittikleri soru) ve ağaç önizleme.
// Her değişiklik ayrı bir formda yapılır; forma dönülünce ekran veriyi yeniden çeker (useVeri).
export default function AkisDuzenleyici() {
  const { renk } = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { veri: akislar, hata, yenileniyor, yenile } = useVeri<IkAkis[]>('/api/ik-akislar');

  const [gorunum, setGorunum] = useState<Gorunum>('sorular');
  const [ilkYapilan, setIlkYapilan] = useState<number | null>(null);

  const akis = akislar?.find((kayit) => String(kayit.id) === id);

  if (!akislar) {
    return <Ekran>{hata ? <HataDurumu mesaj={hata} tekrarDene={yenile} /> : <Yukleniyor />}</Ekran>;
  }

  if (!akis) {
    return (
      <Ekran>
        <BosDurum baslik="Akış bulunamadı" aciklama="Bu akış silinmiş olabilir." />
      </Ekran>
    );
  }

  const uyarilar = akisUyarilari(akis);

  // İlk soru en başta, diğerleri eklenme sırasıyla
  const sorular = [...akis.sorular].sort(
    (a, b) => Number(b.id === akis.ilkSoruId) - Number(a.id === akis.ilkSoruId)
  );

  const ilkSoruYap = async (soru: IkSoru) => {
    setIlkYapilan(soru.id);
    const { hata: istekHatasi } = await istekAt(`/api/ik-akislar/${akis.id}`, 'PUT', { ilkSoruId: soru.id });
    await yenile();
    setIlkYapilan(null);

    if (istekHatasi) Alert.alert('İlk soru değiştirilemedi', istekHatasi);
  };

  return (
    <Ekran yenile={yenile} yenileniyor={yenileniyor}>
      <Stack.Screen
        options={{
          title: akis.ad,
          headerRight: () => (
            <BaslikDugmesi
              yazi="Düzenle"
              onPress={() => router.push({ pathname: '/daha-fazla/akis-form', params: { id: akis.id } })}
            />
          ),
        }}
      />

      <Yazi renk="yaziIkincil">
        {akis.genel
          ? 'Her İK mülakatında, pozisyon akışından önce sorulur.'
          : akis.pozisyonlar.length
            ? `Pozisyonlar: ${akis.pozisyonlar.map((pozisyon) => pozisyon.ad).join(', ')}`
            : 'Henüz bir pozisyona bağlı değil; mülakatta yine de seçilebilir.'}
      </Yazi>

      {uyarilar.length > 0 && (
        <View style={[stiller.uyarilar, { backgroundColor: renk.uyariAcik }]}>
          {uyarilar.map((uyari) => (
            <Yazi key={uyari} tur="kucuk" renk="uyari">
              • {uyari}
            </Yazi>
          ))}
        </View>
      )}

      <Secim
        secenekler={[
          { deger: 'sorular' as Gorunum, etiket: `Sorular (${akis.sorular.length})` },
          { deger: 'onizleme', etiket: 'Önizleme' },
        ]}
        secili={gorunum}
        onSec={setGorunum}
      />

      {gorunum === 'onizleme' ? (
        <Kart>
          <AkisAgaci akis={akis} />
        </Kart>
      ) : (
        <>
          {sorular.length === 0 && (
            <BosDurum baslik="Bu akışta soru yok" aciklama="İlk eklediğin soru otomatik olarak akışın ilk sorusu olur." />
          )}

          {sorular.map((soru) => {
            const ilk = soru.id === akis.ilkSoruId;

            return (
              <Kart key={soru.id} style={stiller.soru}>
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/daha-fazla/ik-soru-form', params: { id: soru.id, akisId: akis.id } })
                  }
                  onLongPress={() =>
                    uzunBasmaMenusu({
                      baslik: kisalt(soru.metin, 40),
                      duzenle: () =>
                        router.push({ pathname: '/daha-fazla/ik-soru-form', params: { id: soru.id, akisId: akis.id } }),
                      sil: {
                        baslik: 'Soru silinsin mi?',
                        mesaj: 'Sorunun seçenekleri de silinir. Bu soruya giden seçenekler "Mülakat biter" olur; ilk soruysa akışın ilk sorusu boşalır.',
                        yol: `/api/ik-sorular/${soru.id}`,
                        sonra: yenile,
                      },
                    })
                  }
                  delayLongPress={400}
                  accessibilityRole="button"
                  accessibilityLabel={`Soru: ${soru.metin}. Düzenlemek için dokun.`}
                  style={({ pressed }) => [stiller.soruUst, pressed && { opacity: 0.6 }]}
                >
                  <View style={stiller.esnek}>
                    {ilk && <Etiket yazi="İlk soru" on={renk.basari} zemin={renk.basariAcik} />}
                    <Yazi tur="govdeKalin">{soru.metin}</Yazi>
                  </View>
                  <Yazi tur="kucuk" renk="marka">
                    Düzenle
                  </Yazi>
                </Pressable>

                {soru.secenekler.map((secenek) => {
                  const sonraki = akis.sorular.find((kayit) => kayit.id === secenek.sonrakiSoruId);

                  return (
                    <Pressable
                      key={secenek.id}
                      onPress={() =>
                        router.push({
                          pathname: '/daha-fazla/ik-secenek-form',
                          params: { id: secenek.id, soruId: soru.id, akisId: akis.id },
                        })
                      }
                      onLongPress={() =>
                        uzunBasmaMenusu({
                          baslik: secenek.metin,
                          duzenle: () =>
                            router.push({
                              pathname: '/daha-fazla/ik-secenek-form',
                              params: { id: secenek.id, soruId: soru.id, akisId: akis.id },
                            }),
                          sil: {
                            baslik: 'Seçenek silinsin mi?',
                            mesaj: `"${secenek.metin}" seçeneği silinecek.`,
                            yol: `/api/ik-secenekler/${secenek.id}`,
                            sonra: yenile,
                          },
                        })
                      }
                      delayLongPress={400}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        stiller.secenek,
                        { backgroundColor: pressed ? renk.yuzeyIkincil : renk.zemin },
                      ]}
                    >
                      <Yazi tur="govdeKalin" style={stiller.esnek}>
                        {secenek.metin}
                      </Yazi>
                      <Yazi tur="kucuk" renk={sonraki ? 'yaziIkincil' : 'basari'} style={stiller.sonraki} numberOfLines={2}>
                        {sonraki ? `→ ${kisalt(sonraki.metin, 30)}` : 'Mülakat biter'}
                      </Yazi>
                    </Pressable>
                  );
                })}

                <View style={stiller.soruAlt}>
                  <Dugme
                    yazi="+ Seçenek"
                    tur="metin"
                    onPress={() =>
                      router.push({ pathname: '/daha-fazla/ik-secenek-form', params: { soruId: soru.id, akisId: akis.id } })
                    }
                  />
                  {!ilk && (
                    <Dugme
                      yazi="İlk soru yap"
                      tur="metin"
                      onPress={() => ilkSoruYap(soru)}
                      yukleniyor={ilkYapilan === soru.id}
                      disabled={ilkYapilan !== null}
                    />
                  )}
                </View>
              </Kart>
            );
          })}

          <Dugme
            yazi="Soru ekle"
            tur="ikincil"
            onPress={() => router.push({ pathname: '/daha-fazla/ik-soru-form', params: { akisId: akis.id } })}
          />
        </>
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  esnek: { flex: 1, gap: bosluk.xs },
  uyarilar: { borderRadius: kose.m, padding: bosluk.m, gap: bosluk.xs },
  soru: { gap: bosluk.s },
  soruUst: { flexDirection: 'row', alignItems: 'flex-start', gap: bosluk.m },
  secenek: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m, padding: bosluk.m, borderRadius: kose.s },
  sonraki: { maxWidth: '55%', textAlign: 'right' },
  soruAlt: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
