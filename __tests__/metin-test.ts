import { basHarfler, metinIceriyor } from '@/bilesenler/Kucukler';

describe('baş harfler', () => {
  it('ilk iki kelimenin baş harflerini büyük yazar', () => {
    expect(basHarfler('elif yıldız')).toBe('EY');
    expect(basHarfler('Ayşe Nur Demir')).toBe('AN');
  });

  it('Türkçe kurala göre büyütür: i -> İ, ı -> I', () => {
    expect(basHarfler('ilker ışık')).toBe('İI');
  });

  it('fazladan boşlukları yok sayar', () => {
    expect(basHarfler('  elif   yıldız ')).toBe('EY');
  });
});

describe('Türkçe arama', () => {
  it('büyük / küçük harf duyarsızdır', () => {
    expect(metinIceriyor('Elif Yıldız', 'YILDIZ')).toBe(true);
  });

  it('İ ve ı harflerini Türkçe kurala göre eşleştirir', () => {
    expect(metinIceriyor('İSTANBUL', 'istanbul')).toBe(true);
    expect(metinIceriyor('ışık', 'IŞIK')).toBe(true);
  });

  it('aranan metnin başındaki ve sonundaki boşlukları yok sayar', () => {
    expect(metinIceriyor('Frontend Geliştirici', '  front ')).toBe(true);
  });

  it('boş arama her şeyle eşleşir', () => {
    expect(metinIceriyor('Elif', '')).toBe(true);
  });
});
