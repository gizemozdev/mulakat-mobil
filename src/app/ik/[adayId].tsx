import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { istekAt } from '@/api/istekAt';
import type { Aday, IkAkis, IkCevap, IkOturum } from '@/api/tipler';
import { BaslikDugmesi } from '@/bilesenler/BaslikDugmesi';
import { Dugme } from '@/bilesenler/Dugme';
import { HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Girdi } from '@/bilesenler/Girdi';
import { Kart } from '@/bilesenler/Kart';
import { Etiket } from '@/bilesenler/Kucukler';
import { Yazi } from '@/bilesenler/Yazi';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

// İK mülakatı. Teknik mülakattaki gibi görünüm verilerden çıkarılır:
// başlamadıysa akış seçimi, sıradaki soru varsa soru, sorular bittiyse genel not + bitir, tamamlandıysa sonuç.
export default function IkMulakati() {
  const { adayId } = useLocalSearchParams<{ adayId: string }>();

  const [aday, setAday] = useState<Aday | null>(null);
  const [oturum, setOturum] = useState<IkOturum | null>(null);
  const [akislar, setAkislar] = useState<IkAkis[]>([]);
  const [yuklemeHatasi, setYuklemeHatasi] = useState('');

  useEffect(() => {
    Promise.all([
      istekAt<IkOturum>(`/api/ik-mulakat/${adayId}`),
      istekAt<IkAkis[]>('/api/ik-akislar'),
      istekAt<Aday[]>('/api/adaylar'),
    ]).then(([oturumSonucu, akisSonucu, adaySonucu]) => {
      if (!oturumSonucu.veri || !akisSonucu.veri) {
        setYuklemeHatasi(oturumSonucu.hata || akisSonucu.hata);
        return;
      }

      setAday(adaySonucu.veri?.find((kayit) => String(kayit.id) === adayId) ?? null);
      setAkislar(akisSonucu.veri);
      setOturum(oturumSonucu.veri);
    });
  }, [adayId]);

  const ustBilgi = (
    <Stack.Screen
      options={{
        title: aday ? aday.adSoyad : 'İK Mülakatı',
        headerLeft: () => <BaslikDugmesi yazi="Kapat" onPress={() => router.back()} />,
      }}
    />
  );

  if (!oturum) {
    return (
      <Ekran>
        {ustBilgi}
        {yuklemeHatasi ? <HataDurumu mesaj={yuklemeHatasi} /> : <Yukleniyor />}
      </Ekran>
    );
  }

  return (
    <Ekran>
      {ustBilgi}

      {!oturum.baslatildi ? (
        <AkisSecimi adayId={adayId} aday={aday} akislar={akislar} onBasladi={setOturum} />
      ) : oturum.guncelSoru ? (
        // key: başka soruya geçilince (ileri ya da geri al) seçim ve not alanı sıfırdan başlasın
        <Soru key={oturum.guncelSoru.id} adayId={adayId} oturum={oturum} onDegisti={setOturum} />
      ) : oturum.durum !== 'Tamamlandı' ? (
        <SorularBitti adayId={adayId} oturum={oturum} onDegisti={setOturum} />
      ) : (
        <Sonuc adayId={adayId} oturum={oturum} onDegisti={setOturum} />
      )}
    </Ekran>
  );
}

// ---------- Akış seçimi ----------

function AkisSecimi({
  adayId,
  aday,
  akislar,
  onBasladi,
}: {
  adayId: string;
  aday: Aday | null;
  akislar: IkAkis[];
  onBasladi: (oturum: IkOturum) => void;
}) {
  // Genel Sorular her mülakatta sorulur; burada yalnızca üstüne eklenecek pozisyon akışı seçilir
  const pozisyonAkislari = akislar.filter((akis) => !akis.genel);
  const genelVar = akislar.some((akis) => akis.genel && akis.sorular.length > 0);

  // Adayın pozisyonuna bağlı ilk akış önerilir
  const onerilen = pozisyonAkislari.find((akis) => akis.pozisyonlar.some((p) => p.id === aday?.pozisyonId));

  // undefined: henüz seçim yapılmadı, önerilen kullanılır. null: yalnızca genel sorular.
  const [secim, setSecim] = useState<number | null | undefined>(undefined);
  const seciliAkisId = secim === undefined ? (onerilen?.id ?? null) : secim;

  const [hata, setHata] = useState('');
  const [basliyor, setBasliyor] = useState(false);

  const baslat = async () => {
    setHata('');
    setBasliyor(true);

    const { veri, hata: istekHatasi } = await istekAt<IkOturum>(`/api/ik-mulakat/${adayId}`, 'POST', {
      akisId: seciliAkisId,
    });

    setBasliyor(false);

    if (veri) onBasladi(veri);
    else setHata(istekHatasi);
  };

  const secenekler = [
    { id: null, ad: 'Yalnızca genel sorular', alt: 'Pozisyona özel soru sorulmaz' },
    ...pozisyonAkislari.map((akis) => ({
      id: akis.id as number | null,
      ad: akis.ad,
      alt: `${akis.sorular.length} soru${akis.pozisyonlar.length ? ` · ${akis.pozisyonlar.map((p) => p.ad).join(', ')}` : ''}`,
    })),
  ];

  return (
    <>
      <View style={stiller.giris}>
        <Yazi tur="baslik">Akışı seç</Yazi>
        <Yazi renk="yaziIkincil">
          {genelVar
            ? 'Önce genel sorular sorulur, ardından seçtiğin akışın pozisyona özel soruları gelir.'
            : 'Genel Sorular akışında henüz soru yok; yalnızca seçtiğin akışın soruları sorulacak.'}
        </Yazi>
      </View>

      {secenekler.map((secenek) => (
        <SecimKarti
          key={String(secenek.id)}
          baslik={secenek.ad}
          alt={secenek.alt}
          secili={secenek.id === seciliAkisId}
          onerilen={secenek.id !== null && secenek.id === onerilen?.id}
          onPress={() => setSecim(secenek.id)}
        />
      ))}

      {hata ? (
        <Yazi tur="kucuk" renk="hata" accessibilityLiveRegion="polite">
          {hata}
        </Yazi>
      ) : null}

      <Dugme yazi="Mülakatı başlat" onPress={baslat} yukleniyor={basliyor} style={stiller.alt} />
    </>
  );
}

// ---------- Soru ----------

type OturumProps = { adayId: string; oturum: IkOturum; onDegisti: (oturum: IkOturum) => void };

function Soru({ adayId, oturum, onDegisti }: OturumProps) {
  const { renk } = useTema();
  // guncelSoru burada her zaman dolu (üst bileşen kontrol ediyor)
  const soru = oturum.guncelSoru!;

  const [secenekId, setSecenekId] = useState<number | null>(null);
  const [not, setNot] = useState('');
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const secenekVar = soru.secenekler.length > 0;
  const sonCevap = oturum.cevaplar.at(-1);

  const devam = async () => {
    setHata('');
    setGonderiliyor(true);

    // Cevap kaydedilir ve sunucu seçeneğe göre sıradaki soruyu belirler (dallanma sunucuda)
    const { veri, hata: istekHatasi } = await istekAt<IkOturum>(`/api/ik-mulakat/${adayId}/cevap`, 'POST', {
      secenekId: secenekVar ? secenekId : null,
      not,
    });

    setGonderiliyor(false);

    if (veri) onDegisti(veri);
    else setHata(istekHatasi);
  };

  return (
    <>
      <View style={stiller.ilerleme}>
        <Etiket
          yazi={soru.genel ? 'Genel Sorular' : soru.akisAdi}
          on={soru.genel ? renk.yaziIkincil : renk.ik}
          zemin={soru.genel ? renk.yuzeyIkincil : renk.ikAcik}
        />
        <Yazi tur="kucuk" renk="yaziIkincil">
          {oturum.cevaplar.length + 1}. soru
        </Yazi>
      </View>

      <Kart style={stiller.soruKarti}>
        <Yazi tur="altBaslik" style={stiller.soruMetni}>
          {soru.metin}
        </Yazi>
      </Kart>

      {secenekVar ? (
        soru.secenekler.map((secenek) => (
          <SecimKarti
            key={secenek.id}
            baslik={secenek.metin}
            secili={secenek.id === secenekId}
            onPress={() => setSecenekId(secenek.id)}
          />
        ))
      ) : (
        <Yazi renk="yaziSoluk">Bu sorunun seçeneği yok; adayın cevabını dinleyip devam edebilirsin.</Yazi>
      )}

      <Girdi
        etiket="Not (isteğe bağlı)"
        value={not}
        onChangeText={setNot}
        placeholder="Adayın cevabıyla ilgili not"
        multiline
        style={stiller.cokSatir}
      />

      {hata ? (
        <Yazi tur="kucuk" renk="hata" accessibilityLiveRegion="polite">
          {hata}
        </Yazi>
      ) : null}

      <Dugme
        yazi={secenekVar && secenekId === null ? 'Bir seçenek seç' : 'Devam'}
        onPress={devam}
        disabled={secenekVar && secenekId === null}
        yukleniyor={gonderiliyor}
        style={stiller.alt}
      />

      {sonCevap && <GeriAl adayId={adayId} sonCevap={sonCevap} onDegisti={onDegisti} pasif={gonderiliyor} />}
    </>
  );
}

// Son cevabı siler ve o soruya geri döner (yanlış seçeneğe basıldıysa). Neyin geri alınacağı yazılır.
function GeriAl({
  adayId,
  sonCevap,
  onDegisti,
  pasif,
}: {
  adayId: string;
  sonCevap: IkCevap;
  onDegisti: (oturum: IkOturum) => void;
  pasif: boolean;
}) {
  const [geriAliniyor, setGeriAliniyor] = useState(false);

  const geriAl = async () => {
    setGeriAliniyor(true);
    const { veri, hata } = await istekAt<IkOturum>(`/api/ik-mulakat/${adayId}/geri-al`, 'POST');
    setGeriAliniyor(false);

    if (veri) onDegisti(veri);
    else Alert.alert('Geri alınamadı', hata);
  };

  return (
    <View style={stiller.geriAl}>
      <Yazi tur="kucuk" renk="yaziIkincil" numberOfLines={2} style={stiller.ortala}>
        Son cevap: {sonCevap.soruMetni} → {sonCevap.secenekMetni ?? 'Devam'}
      </Yazi>
      <Dugme yazi="Son cevabı geri al" tur="metin" onPress={geriAl} yukleniyor={geriAliniyor} disabled={pasif} />
    </View>
  );
}

// ---------- Sorular bitti: cevaplar, genel not, bitir ----------

function SorularBitti({ adayId, oturum, onDegisti }: OturumProps) {
  const [genelNot, setGenelNot] = useState(oturum.genelNot);
  const [bitiyor, setBitiyor] = useState(false);
  const sonCevap = oturum.cevaplar.at(-1);

  const bitir = () =>
    Alert.alert('Mülakat bitirilsin mi?', 'Mülakatın durumu Tamamlandı olur; bundan sonra cevap geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Bitir',
        onPress: async () => {
          setBitiyor(true);
          const { veri, hata } = await istekAt<IkOturum>(`/api/ik-mulakat/${adayId}/bitir`, 'POST', { genelNot });
          setBitiyor(false);

          if (veri) onDegisti(veri);
          else Alert.alert('Mülakat bitirilemedi', hata);
        },
      },
    ]);

  return (
    <>
      <View style={stiller.giris}>
        <Yazi tur="baslik">Sorular bitti</Yazi>
        <Yazi renk="yaziIkincil">Cevapları kontrol et, istersen genel bir not yaz ve mülakatı bitir.</Yazi>
      </View>

      <CevapListesi cevaplar={oturum.cevaplar} />

      <Girdi
        etiket="Genel not (isteğe bağlı)"
        value={genelNot}
        onChangeText={setGenelNot}
        placeholder="Mülakatın genel değerlendirmesi"
        multiline
        style={stiller.cokSatir}
      />

      <Dugme yazi="Mülakatı bitir" onPress={bitir} yukleniyor={bitiyor} style={stiller.alt} />

      {sonCevap && <GeriAl adayId={adayId} sonCevap={sonCevap} onDegisti={onDegisti} pasif={bitiyor} />}
    </>
  );
}

// ---------- Sonuç: puan yok, cevaplar ve notlar ----------

function Sonuc({ adayId, oturum, onDegisti }: OturumProps) {
  const [sifirlaniyor, setSifirlaniyor] = useState(false);

  const sifirla = () =>
    Alert.alert(
      'İK mülakatı sıfırlansın mı?',
      'Cevaplar, akış seçimi ve genel not silinir; mülakat yeniden başlatılabilir. Tarih, saat ve mülakatçı korunur.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            setSifirlaniyor(true);
            const { veri, hata } = await istekAt<IkOturum>(`/api/ik-mulakat/${adayId}`, 'DELETE');
            setSifirlaniyor(false);

            if (veri) onDegisti(veri);
            else Alert.alert('Sıfırlanamadı', hata);
          },
        },
      ]
    );

  return (
    <>
      <View style={stiller.giris}>
        <Yazi tur="baslik">İK mülakatı tamamlandı</Yazi>
        <Yazi renk="yaziIkincil">
          {oturum.akis ? `Genel Sorular + ${oturum.akis.ad}` : 'Yalnızca genel sorular'}
        </Yazi>
      </View>

      <CevapListesi cevaplar={oturum.cevaplar} />

      <Kart style={stiller.genelNot}>
        <Yazi tur="etiket" renk="yaziIkincil">
          GENEL NOT
        </Yazi>
        <Yazi renk={oturum.genelNot ? 'yazi' : 'yaziSoluk'}>{oturum.genelNot || 'Genel not yazılmadı.'}</Yazi>
      </Kart>

      <Dugme yazi="Mülakatı sıfırla" tur="tehlike" onPress={sifirla} yukleniyor={sifirlaniyor} style={stiller.alt} />
    </>
  );
}

// Cevaplar akış başlıkları altında, soruldukları sırayla (önce genel, sonra pozisyon akışı)
function CevapListesi({ cevaplar }: { cevaplar: IkCevap[] }) {
  const { renk } = useTema();

  // Art arda gelen aynı akıştaki cevaplar bir grupta toplanır
  const gruplar = cevaplar.reduce<{ akisAdi: string; cevaplar: IkCevap[] }[]>((liste, cevap) => {
    const son = liste[liste.length - 1];

    if (son?.akisAdi === cevap.akisAdi) son.cevaplar.push(cevap);
    else liste.push({ akisAdi: cevap.akisAdi, cevaplar: [cevap] });

    return liste;
  }, []);

  return gruplar.map((grup) => (
    <View key={grup.cevaplar[0].id} style={stiller.grup}>
      <Yazi tur="etiket" renk="yaziIkincil">
        {grup.akisAdi.toLocaleUpperCase('tr')}
      </Yazi>

      <Kart style={stiller.liste}>
        {grup.cevaplar.map((cevap, sira) => (
          <View
            key={cevap.id}
            style={[stiller.cevap, sira > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: renk.kenar }]}
          >
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
      </Kart>
    </View>
  ));
}

// Tek seçimli kart (radyo düğmesi gibi): akış seçiminde ve soru seçeneklerinde
function SecimKarti({
  baslik,
  alt,
  secili,
  onerilen = false,
  onPress,
}: {
  baslik: string;
  alt?: string;
  secili: boolean;
  onerilen?: boolean;
  onPress: () => void;
}) {
  const { renk } = useTema();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: secili }}
      style={({ pressed }) => [
        stiller.secimKarti,
        {
          backgroundColor: secili ? renk.markaAcik : renk.yuzey,
          borderColor: secili ? renk.marka : renk.kenar,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={[stiller.daire, { borderColor: secili ? renk.marka : renk.yaziSoluk }]}>
        {secili && <View style={[stiller.daireIci, { backgroundColor: renk.marka }]} />}
      </View>

      <View style={stiller.esnek}>
        <Yazi tur="govdeKalin">{baslik}</Yazi>
        {alt ? (
          <Yazi tur="kucuk" renk="yaziIkincil">
            {alt}
          </Yazi>
        ) : null}
      </View>

      {onerilen && <Etiket yazi="Önerilen" on={renk.basari} zemin={renk.basariAcik} />}
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  esnek: { flex: 1, gap: 2 },
  giris: { gap: bosluk.xs, marginBottom: bosluk.xs },
  alt: { marginTop: bosluk.m },
  ilerleme: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  soruKarti: { padding: bosluk.xl, minHeight: 120, justifyContent: 'center' },
  soruMetni: { lineHeight: 28 },
  secimKarti: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    padding: bosluk.l,
    borderRadius: kose.m,
    borderWidth: 1.5,
  },
  daire: { width: 22, height: 22, borderRadius: kose.tam, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  daireIci: { width: 10, height: 10, borderRadius: kose.tam },
  ortala: { textAlign: 'center' },
  cokSatir: { minHeight: 88, paddingTop: bosluk.m, textAlignVertical: 'top' },
  geriAl: { alignItems: 'center', gap: bosluk.xs, marginTop: bosluk.s },
  grup: { gap: bosluk.s },
  liste: { padding: 0, gap: 0 },
  cevap: { gap: 3, paddingHorizontal: bosluk.l, paddingVertical: bosluk.m },
  not: { fontStyle: 'italic' },
  genelNot: { gap: bosluk.xs },
});
