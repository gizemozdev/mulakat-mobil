import { akisUyarilari, kisalt } from '@/api/ikAkis';
import type { IkAkis, IkSoru } from '@/api/tipler';

const soru = (id: number, metin: string, sonrakiler: (number | null)[]): IkSoru => ({
  id,
  akisId: 1,
  metin,
  secenekler: sonrakiler.map((sonrakiSoruId, sira) => ({ id: id * 10 + sira, soruId: id, metin: `Seçenek ${sira}`, sonrakiSoruId })),
});

const akis = (ilkSoruId: number | null, sorular: IkSoru[]): IkAkis => ({
  id: 1,
  ad: 'Deneme Akışı',
  genel: false,
  ilkSoruId,
  pozisyonlar: [],
  sorular,
});

describe('kisalt', () => {
  it('kısa metni olduğu gibi bırakır', () => {
    expect(kisalt('Kısa soru')).toBe('Kısa soru');
  });

  it('uzun metni keser ve sonuna üç nokta koyar', () => {
    expect(kisalt('a'.repeat(50), 10)).toBe('aaaaaaaaaa…');
  });
});

describe('akış uyarıları', () => {
  it('sorusu olmayan akışta uyarı yoktur', () => {
    expect(akisUyarilari(akis(null, []))).toEqual([]);
  });

  it('sorunsuz bir akışta uyarı yoktur', () => {
    // 1 -> 2 ya da biter, 2 -> biter
    expect(akisUyarilari(akis(1, [soru(1, 'İlk', [2, null]), soru(2, 'İkinci', [null])]))).toEqual([]);
  });

  it('ilk soru seçilmemişse uyarır', () => {
    const uyarilar = akisUyarilari(akis(null, [soru(1, 'Tek soru', [null])]));

    expect(uyarilar).toHaveLength(1);
    expect(uyarilar[0]).toContain('İlk soru seçilmemiş');
  });

  it('hiçbir seçenekten ulaşılamayan soruyu bulur', () => {
    const uyarilar = akisUyarilari(akis(1, [soru(1, 'İlk', [null]), soru(2, 'Unutulan soru', [null])]));

    expect(uyarilar).toEqual(['"Unutulan soru" sorusuna hiçbir seçenekten ulaşılamıyor.']);
  });

  it('seçeneği olmayan soruyu bulur', () => {
    const uyarilar = akisUyarilari(akis(1, [soru(1, 'İlk', [2]), soru(2, 'Seçeneksiz', [])]));

    expect(uyarilar).toEqual(['"Seçeneksiz" sorusunun hiç seçeneği yok.']);
  });

  it('döngü olsa bile sonsuza kadar dolaşmaz', () => {
    // Sunucu döngüye izin vermez; yine de fonksiyon güvenli olmalı: 1 -> 2 -> 1
    expect(akisUyarilari(akis(1, [soru(1, 'Bir', [2]), soru(2, 'İki', [1])]))).toEqual([]);
  });
});
