import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { istekAt, type IstekSonucu } from '@/api/istekAt';
import { BosDurum, HataDurumu, Yukleniyor } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';
import { Kart } from '@/bilesenler/Kart';
import { Yazi } from '@/bilesenler/Yazi';
import { useOturum } from '@/oturum/OturumContext';
import { bosluk, kose } from '@/tema/olculer';
import { useTema } from '@/tema/useTema';

type AtananMulakat = {
  id: number;
  tur: 'ik' | 'teknik';
  tarih: string;
  saat: string;
  aday: { adSoyad: string; pozisyon: { ad: string } };
};

type AtananCevabi = { eslesmis: boolean; mulakatlar: AtananMulakat[] };

const ikiHane = (sayi: number) => String(sayi).padStart(2, '0');

// Sunucudaki "YYYY-AA-GG" biçimi; toISOString saat dilimi yüzünden günü kaydırabileceği için elle
const gunMetni = (tarih: Date) =>
  `${tarih.getFullYear()}-${ikiHane(tarih.getMonth() + 1)}-${ikiHane(tarih.getDate())}`;

// "2026-11-05" -> "Bugün" / "Yarın" / "7 Kasım Cumartesi"
const gunBasligi = (tarih: string) => {
  const bugun = new Date();
  const yarin = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() + 1);

  if (tarih === gunMetni(bugun)) return 'Bugün';
  if (tarih === gunMetni(yarin)) return 'Yarın';

  const [yil, ay, gun] = tarih.split('-').map(Number);

  return new Date(yil, ay - 1, gun).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
};

export default function Bugun() {
  const { renk } = useTema();
  const { kullanici } = useOturum();

  const [cevap, setCevap] = useState<AtananCevabi | null>(null);
  const [hata, setHata] = useState('');
  const [yenileniyor, setYenileniyor] = useState(false);

  const sonucuIsle = ({ veri, hata: istekHatasi }: IstekSonucu<AtananCevabi>) => {
    setHata(istekHatasi);
    if (veri) setCevap(veri);
  };

  const getir = async () => sonucuIsle(await istekAt<AtananCevabi>('/api/mulakatlar/bana-atanan'));

  // İlk yükleme: istek effect içinde başlar, sonuç geri çağırmada işlenir
  useEffect(() => {
    istekAt<AtananCevabi>('/api/mulakatlar/bana-atanan').then(sonucuIsle);
  }, []);

  const yenile = async () => {
    setYenileniyor(true);
    await getir();
    setYenileniyor(false);
  };

  // Sunucu tarih + saat sırasıyla verir; burada yalnızca günlere bölünür (sıra korunur)
  const gunler = (cevap?.mulakatlar ?? []).reduce<{ tarih: string; mulakatlar: AtananMulakat[] }[]>(
    (gruplar, mulakat) => {
      const son = gruplar[gruplar.length - 1];

      if (son?.tarih === mulakat.tarih) son.mulakatlar.push(mulakat);
      else gruplar.push({ tarih: mulakat.tarih, mulakatlar: [mulakat] });

      return gruplar;
    },
    []
  );

  const ilkAd = kullanici?.adSoyad.split(' ')[0] ?? '';

  return (
    <Ekran yenile={yenile} yenileniyor={yenileniyor}>
      <View style={stiller.selam}>
        <Yazi tur="baslik">Merhaba{ilkAd ? `, ${ilkAd}` : ''}</Yazi>
        <Yazi renk="yaziIkincil">
          {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
        </Yazi>
      </View>

      <Yazi tur="etiket" renk="yaziIkincil" style={stiller.bolum}>
        SANA ATANAN MÜLAKATLAR
      </Yazi>

      {hata && !cevap ? (
        <HataDurumu mesaj={hata} tekrarDene={getir} />
      ) : !cevap ? (
        <Yukleniyor />
      ) : !cevap.eslesmis ? (
        <BosDurum
          baslik="Hesabın bir mülakatçıyla eşleşmedi"
          aciklama="Mülakatçılar bölümünde kendi adının yanındaki hesap seçiminden eşleştirince sana atanan mülakatlar burada görünür."
        />
      ) : gunler.length === 0 ? (
        <BosDurum baslik="Yaklaşan mülakatın yok" aciklama="Sana atanan ve planlanmış yeni bir mülakat olunca burada görünür." />
      ) : (
        gunler.map((gun) => (
          <View key={gun.tarih} style={stiller.gun}>
            <Yazi tur="altBaslik">{gunBasligi(gun.tarih)}</Yazi>

            {gun.mulakatlar.map((mulakat) => {
              const ik = mulakat.tur === 'ik';

              return (
                <Kart key={mulakat.id} style={stiller.satir}>
                  <View style={stiller.saat}>
                    <Yazi tur="govdeKalin">{mulakat.saat || '--:--'}</Yazi>
                  </View>

                  <View style={[stiller.cizgi, { backgroundColor: ik ? renk.ik : renk.teknik }]} />

                  <View style={stiller.bilgi}>
                    <Yazi tur="govdeKalin" numberOfLines={1}>
                      {mulakat.aday.adSoyad}
                    </Yazi>
                    <Yazi tur="kucuk" renk="yaziIkincil" numberOfLines={1}>
                      {mulakat.aday.pozisyon.ad}
                    </Yazi>
                  </View>

                  <View style={[stiller.tur, { backgroundColor: ik ? renk.ikAcik : renk.teknikAcik }]}>
                    <Yazi tur="etiket" style={{ color: ik ? renk.ik : renk.teknik }}>
                      {ik ? 'İK' : 'Teknik'}
                    </Yazi>
                  </View>
                </Kart>
              );
            })}
          </View>
        ))
      )}
    </Ekran>
  );
}

const stiller = StyleSheet.create({
  selam: { gap: bosluk.xs, marginBottom: bosluk.s },
  bolum: { marginTop: bosluk.s },
  gun: { gap: bosluk.s, marginBottom: bosluk.s },
  satir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  saat: { width: 52 },
  cizgi: { width: 4, alignSelf: 'stretch', borderRadius: kose.tam },
  bilgi: { flex: 1, gap: 2 },
  tur: { paddingHorizontal: bosluk.s + 2, paddingVertical: bosluk.xs, borderRadius: kose.tam },
});
