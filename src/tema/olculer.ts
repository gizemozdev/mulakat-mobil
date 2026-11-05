// Boşluklar 4'ün katları; ekranlar arasında aynı ritim olsun diye sayılar yerine bu adlar kullanılır
export const bosluk = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
} as const;

export const kose = {
  s: 8,
  m: 12,
  l: 16,
  tam: 999,
} as const;

// Parmakla rahat dokunulabilecek en küçük yükseklik (Apple 44, Material 48 önerir)
export const DOKUNMA_YUKSEKLIGI = 48;
