import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { istekAt } from '@/api/istekAt';

// Ekran her öne geldiğinde (ilk açılış ve başka ekrandan geri dönüş) veriyi sunucudan getirir.
// Böylece bir formda yapılan değişiklik, forma dönülünce listede kendiliğinden görünür.
export function useVeri<T>(yol: string) {
  const [veri, setVeri] = useState<T | null>(null);
  const [hata, setHata] = useState('');
  const [yenileniyor, setYenileniyor] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let gecerli = true;

      // Sonuç geri çağırmada işlenir; ekran bu arada kapandıysa state değiştirilmez
      istekAt<T>(yol).then((sonuc) => {
        if (!gecerli) return;
        setHata(sonuc.hata);
        if (sonuc.veri) setVeri(sonuc.veri);
      });

      return () => {
        gecerli = false;
      };
    }, [yol])
  );

  // Aşağı çekip yenileme ve "Tekrar dene" için
  const yenile = async () => {
    setYenileniyor(true);
    const sonuc = await istekAt<T>(yol);
    setHata(sonuc.hata);
    if (sonuc.veri) setVeri(sonuc.veri);
    setYenileniyor(false);
  };

  return { veri, hata, yenileniyor, yenile, setVeri };
}
