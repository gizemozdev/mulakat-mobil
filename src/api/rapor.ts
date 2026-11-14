import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { tarihGoster } from '@/api/tarih';
import { degerlendirmeAdi, izlenim, konularaGoreGrupla, teknikTamamlandi, yuzdeHesapla } from '@/api/teknikPuan';
import type { Rapor, RaporMulakati } from '@/api/tipler';

// Rapora yazılan her metin HTML'e kaçırılır: aday adında ya da notta "<" gibi bir karakter
// varsa sayfanın yapısını bozmasın (ya da HTML olarak çalışmasın)
const kacir = (metin: string) =>
  metin.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const tarihSaat = (mulakat: RaporMulakati) =>
  mulakat.tarih ? `${tarihGoster(mulakat.tarih)}${mulakat.saat ? `, ${mulakat.saat}` : ''}` : 'Tarih belirlenmedi';

const mulakatBasligi = (baslik: string, mulakat: RaporMulakati | null) =>
  `<h2>${baslik}</h2>` +
  (mulakat
    ? `<p class="bilgi">${kacir(mulakat.durum)} · ${kacir(tarihSaat(mulakat))} · Mülakatçı: ${kacir(
        mulakat.mulakatci?.adSoyad ?? 'Seçilmedi'
      )}</p>`
    : '<p class="bilgi">Planlanmadı</p>');

const ikBolumu = (ik: RaporMulakati | null) => {
  let html = mulakatBasligi('İK Mülakatı', ik);

  if (!ik || ik.ikCevaplar.length === 0) return html + '<p class="soluk">Henüz cevap yok.</p>';

  html += `<p class="bilgi">Akış: ${ik.ikAkis ? `Genel Sorular + ${kacir(ik.ikAkis.ad)}` : 'Yalnızca genel sorular'}</p>`;
  html += '<table><tr><th>Soru</th><th>Cevap</th></tr>';

  for (const cevap of ik.ikCevaplar) {
    html += `<tr><td>${cevap.sira}. ${kacir(cevap.soruMetni)}${
      cevap.not ? `<div class="not">Not: ${kacir(cevap.not)}</div>` : ''
    }</td><td>${kacir(cevap.secenekMetni ?? 'Devam')}</td></tr>`;
  }

  html += '</table>';
  if (ik.genelNot) html += `<p><b>Genel not:</b> ${kacir(ik.genelNot)}</p>`;

  return html;
};

const teknikBolumu = (teknik: RaporMulakati | null) => {
  let html = mulakatBasligi('Teknik Mülakat', teknik);

  if (!teknik || teknik.teknikCevaplar.length === 0) return html + '<p class="soluk">Henüz soru sorulmadı.</p>';

  // Puan yalnızca tamamlanmış ve bütün soruları değerlendirilmiş mülakatta yazılır
  if (teknikTamamlandi(teknik.durum, teknik.teknikCevaplar)) {
    const yuzde = yuzdeHesapla(teknik.teknikCevaplar);
    html += `<p class="puan">%${yuzde} · ${izlenim(yuzde)}</p>`;
    html += '<p class="soluk">Bu puan bir karar değil; adayın teknik sorulardaki genel durumu hakkında fikir verir.</p>';
    html += '<table><tr><th>Konu</th><th>Soru</th><th>Puan</th></tr>';

    for (const [konu, liste] of konularaGoreGrupla(teknik.teknikCevaplar)) {
      html += `<tr><td>${kacir(konu)}</td><td>${liste.length}</td><td>%${yuzdeHesapla(liste)}</td></tr>`;
    }

    html += '</table>';
  } else {
    html += '<p class="soluk">Mülakat tamamlanmadığı için puan hesaplanmadı.</p>';
  }

  html += '<table><tr><th>Soru</th><th>Değerlendirme</th></tr>';

  for (const cevap of teknik.teknikCevaplar) {
    html += `<tr><td>${cevap.sira}. <span class="soluk">${kacir(cevap.konuAdi)}</span> · ${kacir(cevap.soruMetni)}</td><td>${
      cevap.degerlendirme ? degerlendirmeAdi[cevap.degerlendirme] : '-'
    }</td></tr>`;
  }

  return html + '</table>';
};

// A4 sayfaya uygun, yazdırılabilir rapor (web'deki rapor sayfasının sade bir karşılığı)
export const raporHtml = ({ aday, ik, teknik }: Rapor) => `<!doctype html>
<html lang="tr"><head><meta charset="utf-8" />
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0f172a; font-size: 11pt; line-height: 1.45; }
  h1 { font-size: 20pt; margin: 0 0 4px; }
  h2 { font-size: 13pt; margin: 22px 0 4px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1; }
  .bilgi { margin: 2px 0; color: #334155; }
  .soluk { color: #64748b; }
  .puan { font-size: 16pt; font-weight: 700; margin: 8px 0 2px; }
  .not { font-style: italic; color: #334155; margin-top: 2px; }
  .karar { margin-top: 10px; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { text-align: left; vertical-align: top; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
  th { font-size: 9pt; text-transform: uppercase; color: #475569; }
  tr { page-break-inside: avoid; }
  .alt { margin-top: 28px; font-size: 9pt; color: #64748b; }
</style></head>
<body>
  <h1>${kacir(aday.adSoyad)}</h1>
  <p class="bilgi">${kacir(aday.pozisyon.ad)} · ${aday.yas} yaş</p>
  <p class="bilgi">${kacir(aday.eposta || '-')} · ${kacir(aday.telefon || '-')}</p>
  <div class="karar"><b>Karar:</b> ${kacir(aday.karar)}${aday.kararNotu ? `<br />${kacir(aday.kararNotu)}` : ''}</div>
  ${ikBolumu(ik)}
  ${teknikBolumu(teknik)}
  <p class="alt">Mülakat Yönetim Sistemi · ${new Date().toLocaleDateString('tr-TR')} tarihinde oluşturuldu.</p>
</body></html>`;

// "Elif Yıldız" -> "Elif Yildiz - Mulakat Raporu.pdf" (paylaşılan dosyanın adı; bazı uygulamalar
// Türkçe karakterli dosya adlarını bozabildiği için harfler sadeleştirilir)
const dosyaAdi = (adSoyad: string) => {
  const sade = adSoyad
    .replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G').replace(/ü/g, 'u').replace(/Ü/g, 'U').replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim();

  return `${sade || 'Aday'} - Mulakat Raporu.pdf`;
};

// HTML'den PDF üretir, okunur bir adla kopyalar ve telefonun paylaşım penceresini açar.
// Hata olursa mesajı, başarılıysa null döner.
export async function raporuPaylas(rapor: Rapor): Promise<string | null> {
  try {
    // A4: 595 x 842 nokta (varsayılan Letter boyutu Türkiye'de kullanılmıyor)
    const { uri } = await Print.printToFileAsync({ html: raporHtml(rapor), width: 595, height: 842 });

    // printToFileAsync dosyaya rastgele bir ad veriyor; CV yüklerken yaşadığım sorunun aynısı
    const kaynak = new File(uri);
    const hedef = new File(Paths.cache, dosyaAdi(rapor.aday.adSoyad));
    if (hedef.exists) hedef.delete();
    await kaynak.copy(hedef);
    kaynak.delete();

    if (!(await Sharing.isAvailableAsync())) return 'Bu telefonda paylaşım kullanılamıyor.';

    await Sharing.shareAsync(hedef.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Raporu paylaş' });

    return null;
  } catch {
    return 'Rapor oluşturulamadı.';
  }
}
