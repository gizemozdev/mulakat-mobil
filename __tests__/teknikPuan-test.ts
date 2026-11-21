import { izlenim, konularaGoreGrupla, teknikTamamlandi, yuzdeHesapla } from '@/api/teknikPuan';

// Web projesindeki puan kuralıyla aynı olmalı: Yeterli 2, Orta 1, Yetersiz 0, sonuç yüzde
describe('teknik puan', () => {
  it('yeterli, orta ve yetersizden yüzde hesaplar', () => {
    expect(yuzdeHesapla([{ degerlendirme: 'yeterli' }, { degerlendirme: 'orta' }, { degerlendirme: 'yetersiz' }])).toBe(50);
    expect(yuzdeHesapla([{ degerlendirme: 'yeterli' }, { degerlendirme: 'yeterli' }])).toBe(100);
  });

  it('boş listede sıfır döner (sıfıra bölme olmaz)', () => {
    expect(yuzdeHesapla([])).toBe(0);
  });

  it('değerlendirilmemiş soru sıfır puan sayılır', () => {
    expect(yuzdeHesapla([{ degerlendirme: 'yeterli' }, { degerlendirme: null }])).toBe(50);
  });

  it('yüzdeyi tam sayıya yuvarlar', () => {
    // 2 / 6 = %33,3
    expect(yuzdeHesapla([{ degerlendirme: 'orta' }, { degerlendirme: 'orta' }, { degerlendirme: 'yetersiz' }])).toBe(33);
  });

  it('izlenimin sınırları: 75 ve 50', () => {
    expect(izlenim(75)).toBe('Güçlü');
    expect(izlenim(74)).toBe('Orta düzey');
    expect(izlenim(50)).toBe('Orta düzey');
    expect(izlenim(49)).toBe('Gelişmeye açık');
  });

  it('puan yalnızca tamamlanmış ve hepsi değerlendirilmiş mülakatta anlamlıdır', () => {
    const hepsi = [{ degerlendirme: 'yeterli' as const }, { degerlendirme: 'orta' as const }];

    expect(teknikTamamlandi('Tamamlandı', hepsi)).toBe(true);
    expect(teknikTamamlandi('Planlandı', hepsi)).toBe(false);
    expect(teknikTamamlandi('Tamamlandı', [...hepsi, { degerlendirme: null }])).toBe(false);
    expect(teknikTamamlandi('Tamamlandı', [])).toBe(false);
  });

  it('cevapları konulara göre ilk görüldükleri sırayla gruplar', () => {
    const gruplar = konularaGoreGrupla([
      { konuAdi: 'SQL', id: 1 },
      { konuAdi: 'JavaScript', id: 2 },
      { konuAdi: 'SQL', id: 3 },
    ]);

    expect(gruplar.map(([konu]) => konu)).toEqual(['SQL', 'JavaScript']);
    expect(gruplar[0][1].map((cevap) => cevap.id)).toEqual([1, 3]);
  });
});
