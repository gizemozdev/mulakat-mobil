// Sunucudan (web projesinin API'si) gelen kayıtların uygulamada kullanılan biçimi

export type Pozisyon = {
  id: number;
  ad: string;
};

export const kararlar = ['Değerlendiriliyor', 'Beklemede', 'Teklif verildi', 'İşe alındı', 'Reddedildi'] as const;

export type Karar = (typeof kararlar)[number];

export type Aday = {
  id: number;
  adSoyad: string;
  yas: number;
  eposta: string;
  telefon: string;
  karar: Karar;
  kararNotu: string;
  pozisyonId: number;
  pozisyon: Pozisyon;
  // Yalnızca CV'nin bilgisi; dosyanın kendisi ayrıca indirilir
  cv: { dosyaAdi: string; boyut: number; yuklenme: string } | null;
  createdAt: string;
};

export type Alan = 'ik' | 'teknik';

export const alanAdi: Record<Alan, string> = { ik: 'İK', teknik: 'Teknik' };

export type Mulakatci = {
  id: number;
  adSoyad: string;
  alan: Alan;
  kullaniciId: number | null;
};

export type Kullanici = {
  id: number;
  kullaniciAdi: string;
  adSoyad: string;
  // Davet ve şifre sıfırlama kodunun gittiği adres (eski hesaplarda boş olabilir)
  eposta: string | null;
  ben: boolean;
};

export const durumlar = ['Planlanmadı', 'Planlandı', 'Tamamlandı', 'İptal'] as const;

export type Durum = (typeof durumlar)[number];

// GET /api/mulakatlar: her aday için en fazla bir İK ve bir teknik kaydı (aday + tür benzersiz)
export type Mulakat = {
  id: number;
  adayId: number;
  tur: Alan;
  mulakatciId: number | null;
  tarih: string;
  saat: string;
  durum: Durum;
  // İK: sıradaki soru (null + cevap yoksa başlamamış). include, tablonun bütün düz alanlarını da döndürür.
  ikGuncelSoruId: number | null;
  _count: { teknikCevaplar: number; ikCevaplar: number };
  teknikCevaplar: { konuAdi: string; degerlendirme: Degerlendirme | null }[];
  ikAkis: { ad: string } | null;
};

export type Degerlendirme = 'yeterli' | 'orta' | 'yetersiz';

// Teknik mülakatta sorulan soru: metin havuzdan kopyalanır, havuz değişse de sonuç korunur
export type TeknikCevap = {
  id: number;
  sira: number;
  konuAdi: string;
  soruMetni: string;
  degerlendirme: Degerlendirme | null;
};

// GET / POST / DELETE /api/teknik-mulakat/[adayId]
export type TeknikOturum = { durum: Durum; cevaplar: TeknikCevap[] };

export type Konu = { id: number; ad: string; sorular: { id: number; metin: string }[] };

export type IkSecenek = { id: number; soruId: number; metin: string; sonrakiSoruId: number | null };

export type IkSoru = { id: number; akisId: number; metin: string; secenekler: IkSecenek[] };

// GET /api/ik-akislar: akışlar, soruları ve seçenekleriyle (genel akış en başta)
export type IkAkis = {
  id: number;
  ad: string;
  genel: boolean;
  ilkSoruId: number | null;
  pozisyonlar: { id: number; ad: string }[];
  sorular: IkSoru[];
};

export type IkCevap = {
  id: number;
  sira: number;
  akisAdi: string;
  soruMetni: string;
  // null: seçeneği olmayan soruda "Devam" ile geçilmiş
  secenekMetni: string | null;
  not: string;
};

// GET / POST /api/ik-mulakat/[adayId] ve /cevap
export type IkOturum = {
  durum: Durum;
  baslatildi: boolean;
  akis: { id: number; ad: string } | null;
  genelNot: string;
  cevaplar: IkCevap[];
  // null: sorular bitti (ya da başlamadı)
  guncelSoru: {
    id: number;
    metin: string;
    akisAdi: string;
    genel: boolean;
    secenekler: { id: number; metin: string }[];
  } | null;
};

// GET /api/rapor/[adayId]: adayın bilgileri ve iki mülakatının bütün ayrıntıları tek seferde
export type RaporMulakati = {
  tarih: string;
  saat: string;
  durum: Durum;
  genelNot: string;
  mulakatci: { adSoyad: string } | null;
  ikAkis: { ad: string } | null;
  ikCevaplar: IkCevap[];
  teknikCevaplar: TeknikCevap[];
};

export type Rapor = {
  aday: Omit<Aday, 'cv'> & { pozisyon: Pozisyon };
  ik: RaporMulakati | null;
  teknik: RaporMulakati | null;
};
