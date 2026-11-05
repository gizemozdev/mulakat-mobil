import * as DocumentPicker from 'expo-document-picker';
import { File, Paths, UploadType } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { API_ADRESI, yetkiBasligi } from '@/api/istekAt';
import type { Aday } from '@/api/tipler';

// Sunucudaki sınırla aynı; büyük dosya hiç gönderilmeden uyarılır
const EN_FAZLA_BOYUT = 5 * 1024 * 1024;

// CV adresi giriş istediği için tarayıcıda açılamaz: anahtar başlığıyla geçici klasöre indirilir,
// sonra telefonun önizlemesinde (iOS'ta Quick Look) ya da paylaşım penceresinde açılır.
export async function cvAc(adayId: number): Promise<string | null> {
  try {
    const hedef = new File(Paths.cache, `cv-${adayId}.pdf`);

    // İndirme, aynı adlı dosya varsa hata verir; önceki açılıştan kalan silinir
    if (hedef.exists) hedef.delete();

    const gorev = File.createDownloadTask(`${API_ADRESI}/api/adaylar/${adayId}/cv`, hedef, {
      headers: yetkiBasligi(),
    });
    const dosya = await gorev.downloadAsync();

    if (!dosya) return 'CV indirilemedi.';

    if (await dosya.canPreview()) {
      await dosya.preview();
    } else if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(dosya.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } else {
      return 'Bu telefonda PDF açılamıyor.';
    }

    return null;
  } catch {
    return 'CV açılamadı. Sunucuya bağlı olduğunuzdan emin olun.';
  }
}

type YuklemeSonucu = { aday: Aday; hata: '' } | { aday: null; hata: string };

// Telefondan PDF seçtirip yükler. Seçim iptal edilirse { aday: null, hata: '' } döner.
export async function cvYukle(adayId: number): Promise<YuklemeSonucu> {
  const secim = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });

  if (secim.canceled) return { aday: null, hata: '' };

  const varlik = secim.assets[0];

  if ((varlik.size ?? 0) > EN_FAZLA_BOYUT) {
    return { aday: null, hata: 'CV en fazla 5 MB olabilir.' };
  }

  try {
    // Seçici dosyayı geçici klasöre rastgele bir adla (ör. "A7B7...F042.pdf") kopyalıyor; sunucu adı
    // dosyanın kendisinden aldığı için önce kopya, seçilen dosyanın gerçek adıyla yeniden kopyalanır.
    const gercekAd = varlik.name.toLocaleLowerCase('tr').endsWith('.pdf') ? varlik.name : `${varlik.name}.pdf`;
    const gonderilecek = new File(Paths.cache, gercekAd);

    if (gonderilecek.exists) gonderilecek.delete();
    await new File(varlik.uri).copy(gonderilecek);

    // Web'deki form gönderimiyle aynı: "dosya" alanında çok parçalı (multipart) istek
    const sonuc = await gonderilecek.upload(`${API_ADRESI}/api/adaylar/${adayId}/cv`, {
      uploadType: UploadType.MULTIPART,
      fieldName: 'dosya',
      mimeType: 'application/pdf',
      headers: yetkiBasligi(),
    });

    // Kopya yalnızca gönderim içindi; telefonda yer kaplamasın
    if (gonderilecek.exists) gonderilecek.delete();

    const veri = JSON.parse(sonuc.body || '{}');

    if (sonuc.status < 200 || sonuc.status >= 300) {
      return { aday: null, hata: veri.error ?? 'CV yüklenemedi.' };
    }

    return { aday: veri as Aday, hata: '' };
  } catch {
    return { aday: null, hata: 'CV yüklenemedi. Sunucuya bağlı olduğunuzdan emin olun.' };
  }
}
