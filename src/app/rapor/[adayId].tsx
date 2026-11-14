import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { istekAt } from '@/api/istekAt';
import { raporuPaylas } from '@/api/rapor';
import { tarihGoster } from '@/api/tarih';
import { degerlendirmeAdi, degerlendirmeRenkleri, izlenim, izlenimRengi, teknikTamamlandi, yuzdeHesapla } from '@/api/teknikPuan';
import type { Rapor, RaporMulakati } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Kart } from '@/bilesenler/Kart';
import { DurumEtiketi, Etiket, KararEtiketi } from '@/bilesenler/Kucukler';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// Adayın sonuç raporu: ekranda okunur, "PDF paylaş" ile A4 PDF olarak e-posta / WhatsApp vb. ile gönderilir
export default function RaporEkrani() {
  const { adayId } = useLocalSearchParams<{ adayId: string }>();
  const [rapor, setRapor] = useState<Rapor | null>(null);
  const [hata, setHata] = useState('');
  const [hazirlaniyor, setHazirlaniyor] = useState(false);

  useEffect(() => {
    // Rapor için web'de yazılmış tek istekli API: aday + iki mülakatın bütün ayrıntıları
    istekAt<Rapor>(`/api/rapor/${adayId}`).then(({ veri, hata: istekHatasi }) => {
      if (veri) setRapor(veri);
      else setHata(istekHatasi);
    });
  }, [adayId]);

  const paylas = async () => {
    if (!rapor) return;

    setHazirlaniyor(true);
    const hataMesaji = await raporuPaylas(rapor);
    setHazirlaniyor(false);

    if (hataMesaji) Alert.alert('Paylaşılamadı', hataMesaji);
  };

  return (
    <Ekran>
      <Stack.Screen
        options={{
          title: 'Rapor',
          headerLeft: () => <BaslikDugmesi yazi="Kapat" onPress={() => router.back()} />,
          headerRight: () => (
            <BaslikDugmesi yazi={hazirlaniyor ? 'Hazırlanıyor…' : 'PDF paylaş'} kalin pasif={!rapor || hazirlaniyor} onPress={paylas} />
          ),
        }}
      />

      {hata ? (
        <HataDurumu mesaj={hata} />
      ) : !rapor ? (
        <Yukleniyor />
      ) : (
        <>
          <View style={stiller.ust}>
            <Yazi tur="baslik">{rapor.aday.adSoyad}</Yazi>
            <Yazi renk="yaziIkincil">
              {rapor.aday.pozisyon.ad} · {rapor.aday.yas} yaş
            </Yazi>
          </View>

          <Kart style={stiller.bolum}>
            <Yazi tur="etiket" renk="yaziIkincil">
              KARAR
            </Yazi>
            <KararEtiketi karar={rapor.aday.karar} />
            {rapor.aday.kararNotu ? <Yazi>{rapor.aday.kararNotu}</Yazi> : null}
          </Kart>

          <IkBolumu ik={rapor.ik} />
          <TeknikBolumu teknik={rapor.teknik} />

          <Dugme yazi="PDF olarak paylaş" onPress={paylas} yukleniyor={hazirlaniyor} style={stiller.paylas} />
        </>
      )}
    </Ekran>
  );
}

function MulakatUstu({ baslik, mulakat }: { baslik: string; mulakat: RaporMulakati | null }) {
  return (
    <>
      <View style={stiller.satir}>
        <Yazi tur="altBaslik" style={stiller.esnek}>
          {baslik}
        </Yazi>
        <DurumEtiketi durum={mulakat?.durum ?? 'Planlanmadı'} />
      </View>
      {mulakat && (
        <Yazi tur="kucuk" renk="yaziIkincil">
          {mulakat.tarih ? `${tarihGoster(mulakat.tarih)}${mulakat.saat ? `, ${mulakat.saat}` : ''}` : 'Tarih belirlenmedi'} ·{' '}
          {mulakat.mulakatci?.adSoyad ?? 'Mülakatçı seçilmedi'}
        </Yazi>
      )}
    </>
  );
}

function IkBolumu({ ik }: { ik: RaporMulakati | null }) {
  return (
    <Kart style={stiller.bolum}>
      <MulakatUstu baslik="İK Mülakatı" mulakat={ik} />

      {!ik || ik.ikCevaplar.length === 0 ? (
        <Yazi renk="yaziSoluk">Henüz cevap yok.</Yazi>
      ) : (
        <>
          <Yazi tur="kucuk" renk="yaziIkincil">
            {ik.ikAkis ? `Genel Sorular + ${ik.ikAkis.ad}` : 'Yalnızca genel sorular'}
          </Yazi>
          {ik.ikCevaplar.map((cevap) => (
            <View key={cevap.id} style={stiller.kalem}>
              <Yazi tur="kucuk" renk="yaziIkincil">
                {cevap.sira}. {cevap.soruMetni}
              </Yazi>
              <Yazi tur="govdeKalin">{cevap.secenekMetni ?? 'Devam'}</Yazi>
              {cevap.not ? (
                <Yazi tur="kucuk" style={stiller.not}>
                  Not: {cevap.not}
                </Yazi>
              ) : null}
            </View>
          ))}
          {ik.genelNot ? <Yazi>Genel not: {ik.genelNot}</Yazi> : null}
        </>
      )}
    </Kart>
  );
}

function TeknikBolumu({ teknik }: { teknik: RaporMulakati | null }) {
  const { renk } = useTema();
  const cevaplar = teknik?.teknikCevaplar ?? [];
  const tamam = teknikTamamlandi(teknik?.durum, cevaplar);
  const yuzde = yuzdeHesapla(cevaplar);

  return (
    <Kart style={stiller.bolum}>
      <MulakatUstu baslik="Teknik Mülakat" mulakat={teknik} />

      {cevaplar.length === 0 ? (
        <Yazi renk="yaziSoluk">Henüz soru sorulmadı.</Yazi>
      ) : (
        <>
          {tamam ? (
            <Yazi tur="baslik" style={{ color: izlenimRengi(yuzde, renk) }}>
              %{yuzde} · {izlenim(yuzde)}
            </Yazi>
          ) : (
            <Yazi tur="kucuk" renk="yaziSoluk">
              Mülakat tamamlanmadığı için puan hesaplanmadı.
            </Yazi>
          )}
          {cevaplar.map((cevap) => (
            <View key={cevap.id} style={[stiller.kalem, stiller.satir]}>
              <Yazi tur="kucuk" style={stiller.esnek}>
                {cevap.sira}. {cevap.soruMetni}
              </Yazi>
              {cevap.degerlendirme && (
                <Etiket yazi={degerlendirmeAdi[cevap.degerlendirme]} {...degerlendirmeRenkleri(cevap.degerlendirme, renk)} />
              )}
            </View>
          ))}
        </>
      )}
    </Kart>
  );
}

const stiller = StyleSheet.create({
  ust: { gap: bosluk.xs, marginBottom: bosluk.xs },
  bolum: { gap: bosluk.s },
  satir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  esnek: { flex: 1 },
  kalem: { gap: 2, paddingTop: bosluk.xs },
  not: { fontStyle: 'italic' },
  paylas: { marginTop: bosluk.m },
});
