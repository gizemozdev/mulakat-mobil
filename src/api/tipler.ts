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
  ben: boolean;
};
