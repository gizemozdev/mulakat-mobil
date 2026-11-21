import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

import { istekAt } from '@/api/istekAt';

type Silme = {
  // Onay penceresinde yazılacaklar
  baslik: string;
  mesaj: string;
  // DELETE isteğinin gideceği adres, ör. "/api/pozisyonlar/3"
  yol: string;
  // Silme başarılı olunca (listeyi yenilemek ya da kaydı listeden çıkarmak için)
  sonra: () => void;
};

// Silmeden önce her zaman onay sorulur: uzun basma yanlışlıkla da olabilir.
// Sunucu silmeyi reddederse (ör. "Bu pozisyona başvuran 2 aday olduğu için silinemez.") sebebi gösterilir.
export const onayliSil = ({ baslik, mesaj, yol, sonra }: Silme) =>
  Alert.alert(baslik, mesaj, [
    { text: 'Vazgeç', style: 'cancel' },
    {
      text: 'Sil',
      style: 'destructive',
      onPress: async () => {
        const { hata } = await istekAt(yol, 'DELETE');

        if (hata) Alert.alert('Silinemedi', hata);
        else sonra();
      },
    },
  ]);

// Uzun basmayı hissettiren kısa titreşim. Desteklenmiyorsa (bazı Android'ler) sessizce geçilir.
export const titret = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
};

// Liste satırına uzun basınca açılan menü: önce hafif bir titreşim, sonra telefonun seçenek penceresi.
// duzenle ya da sil verilmezse o seçenek menüde çıkmaz (ör. genel akış silinemez).
export const uzunBasmaMenusu = ({
  baslik,
  duzenle,
  sil,
}: {
  baslik: string;
  duzenle?: () => void;
  sil?: Silme;
}) => {
  titret();

  Alert.alert(baslik, undefined, [
    ...(duzenle ? [{ text: 'Düzenle', onPress: duzenle }] : []),
    ...(sil ? [{ text: 'Sil', style: 'destructive' as const, onPress: () => onayliSil(sil) }] : []),
    { text: 'Vazgeç', style: 'cancel' as const },
  ]);
};
