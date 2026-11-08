// Sunucu tarihleri "YYYY-AA-GG", saatleri "SS:DD" metni olarak tutuyor (web projesiyle aynı).
// Date nesnesine çevirirken toISOString kullanılmaz: UTC'ye çevirdiği için gece saatlerinde günü kaydırır.

export const ikiHane = (sayi: number) => String(sayi).padStart(2, '0');

// Date -> "2026-11-05" (telefonun kendi saat dilimine göre)
export const gunMetni = (tarih: Date) =>
  `${tarih.getFullYear()}-${ikiHane(tarih.getMonth() + 1)}-${ikiHane(tarih.getDate())}`;

// "2026-11-05" -> o günün yerel gece yarısı
export const metindenTarih = (metin: string) => {
  const [yil, ay, gun] = metin.split('-').map(Number);

  return new Date(yil, ay - 1, gun);
};

// Date -> "14:30"
export const saatMetni = (tarih: Date) => `${ikiHane(tarih.getHours())}:${ikiHane(tarih.getMinutes())}`;

// "14:30" -> bugünün 14:30'u (saat seçicinin başlangıç değeri için)
export const metindenSaat = (metin: string) => {
  const [saat, dakika] = metin.split(':').map(Number);
  const tarih = new Date();

  tarih.setHours(saat, dakika, 0, 0);

  return tarih;
};

// "2026-11-05" -> "5 Kasım Perşembe"
export const tarihGoster = (metin: string) =>
  metindenTarih(metin).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
