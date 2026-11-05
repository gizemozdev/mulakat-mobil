import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { anahtariAyarla, istekAt, yetkisizOluncaAyarla } from '@/api/istekAt';

export type Kullanici = {
  kullaniciAdi: string;
  adSoyad: string;
};

// yukleniyor: açılışta kayıtlı anahtar kontrol ediliyor (bu sırada açılış ekranı görünür kalır)
type Durum = 'yukleniyor' | 'girisli' | 'girissiz';

type OturumDegeri = {
  durum: Durum;
  kullanici: Kullanici | null;
  girisYap: (kullaniciAdi: string, sifre: string) => Promise<string | null>;
  kurulumYap: (adSoyad: string, kullaniciAdi: string, sifre: string) => Promise<string | null>;
  cikisYap: () => Promise<void>;
};

// Anahtar telefonun şifreli deposunda (iOS Keychain, Android Keystore) tutulur
const ANAHTAR_KAYDI = 'oturum-anahtari';
const KULLANICI_KAYDI = 'oturum-kullanici';

const OturumContext = createContext<OturumDegeri | null>(null);

type GirisCevabi = Kullanici & { anahtar: string };

export function OturumSaglayici({ children }: { children: ReactNode }) {
  const [durum, setDurum] = useState<Durum>('yukleniyor');
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);

  // Hem çıkışta hem anahtar geçersiz olunca çalışır
  const oturumuTemizle = async () => {
    anahtariAyarla(null);
    setKullanici(null);
    setDurum('girissiz');
    await SecureStore.deleteItemAsync(ANAHTAR_KAYDI);
    await SecureStore.deleteItemAsync(KULLANICI_KAYDI);
  };

  // Herhangi bir istek 401 alırsa (anahtarın süresi dolmuş) giriş ekranına dönülür
  useEffect(() => {
    yetkisizOluncaAyarla(() => {
      oturumuTemizle();
    });

    return () => yetkisizOluncaAyarla(null);
  }, []);

  // Açılışta kayıtlı anahtar varsa sunucuda hâlâ geçerli mi bakılır
  useEffect(() => {
    const kayitliOturumuYukle = async () => {
      const anahtar = await SecureStore.getItemAsync(ANAHTAR_KAYDI);

      if (!anahtar) {
        setDurum('girissiz');
        return;
      }

      anahtariAyarla(anahtar);

      const { veri, hata } = await istekAt<Kullanici>('/api/oturum');

      if (veri) {
        setKullanici(veri);
        setDurum('girisli');
        return;
      }

      // 401 ise oturumuTemizle zaten çalıştı. Sunucuya ulaşılamadıysa (ör. bilgisayar kapalı)
      // kullanıcı dışarı atılmaz; son bilinen bilgilerle açılır, ekranlar bağlantı hatasını gösterir.
      if (hata && !hata.startsWith('Bu işlem için giriş')) {
        const kayitliKullanici = await SecureStore.getItemAsync(KULLANICI_KAYDI);

        if (kayitliKullanici) {
          setKullanici(JSON.parse(kayitliKullanici));
          setDurum('girisli');
          return;
        }
      }

      await oturumuTemizle();
    };

    kayitliOturumuYukle();
  }, []);

  const oturumuBaslat = async (cevap: GirisCevabi) => {
    const yeniKullanici = { kullaniciAdi: cevap.kullaniciAdi, adSoyad: cevap.adSoyad };

    await SecureStore.setItemAsync(ANAHTAR_KAYDI, cevap.anahtar);
    await SecureStore.setItemAsync(KULLANICI_KAYDI, JSON.stringify(yeniKullanici));

    anahtariAyarla(cevap.anahtar);
    setKullanici(yeniKullanici);
    setDurum('girisli');
  };

  // Hata varsa mesajını, başarılıysa null döndürür
  const girisYap = async (kullaniciAdi: string, sifre: string) => {
    const { veri, hata } = await istekAt<GirisCevabi>('/api/giris', 'POST', {
      kullaniciAdi,
      sifre,
      istemci: 'mobil',
    });

    if (!veri) return hata;

    await oturumuBaslat(veri);
    return null;
  };

  // Sistemde hiç kullanıcı yokken ilk yönetici hesabını açar
  const kurulumYap = async (adSoyad: string, kullaniciAdi: string, sifre: string) => {
    const { veri, hata } = await istekAt<GirisCevabi>('/api/kurulum', 'POST', {
      adSoyad,
      kullaniciAdi,
      sifre,
      istemci: 'mobil',
    });

    if (!veri) return hata;

    await oturumuBaslat(veri);
    return null;
  };

  // Sunucudaki oturum silinir; sunucuya ulaşılamasa bile telefondaki anahtar silinir
  const cikisYap = async () => {
    await istekAt('/api/cikis', 'POST');
    await oturumuTemizle();
  };

  return (
    <OturumContext.Provider value={{ durum, kullanici, girisYap, kurulumYap, cikisYap }}>
      {children}
    </OturumContext.Provider>
  );
}

export function useOturum() {
  const deger = useContext(OturumContext);

  if (!deger) {
    throw new Error('useOturum, OturumSaglayici içinde kullanılmalıdır.');
  }

  return deger;
}
