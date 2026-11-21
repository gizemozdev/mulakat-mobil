import { gunMetni, ikiHane, metindenSaat, metindenTarih, saatMetni, tarihGoster } from '@/api/tarih';

describe('tarih ve saat metinleri', () => {
  it('tek haneli sayıların başına sıfır ekler', () => {
    expect(ikiHane(5)).toBe('05');
    expect(ikiHane(12)).toBe('12');
  });

  it('Date nesnesini sunucunun "YYYY-AA-GG" biçimine çevirir (ay sıfırdan başlar)', () => {
    expect(gunMetni(new Date(2026, 0, 3))).toBe('2026-01-03');
    expect(gunMetni(new Date(2026, 10, 21))).toBe('2026-11-21');
  });

  it('gece yarısından hemen sonra da günü kaydırmaz (toISOString tuzağı)', () => {
    // Türkiye saatiyle 00:30: UTC'ye çevrilseydi bir önceki gün olurdu
    expect(gunMetni(new Date(2026, 10, 21, 0, 30))).toBe('2026-11-21');
  });

  it('metni yerel gece yarısına çevirir; geri çevirince aynı metin çıkar', () => {
    const tarih = metindenTarih('2026-02-28');

    expect(tarih.getFullYear()).toBe(2026);
    expect(tarih.getMonth()).toBe(1);
    expect(tarih.getDate()).toBe(28);
    expect(tarih.getHours()).toBe(0);
    expect(gunMetni(tarih)).toBe('2026-02-28');
  });

  it('saati "SS:DD" metnine ve geri çevirir', () => {
    expect(saatMetni(new Date(2026, 0, 1, 9, 5))).toBe('09:05');

    const saat = metindenSaat('14:30');
    expect(saat.getHours()).toBe(14);
    expect(saat.getMinutes()).toBe(30);
    expect(saatMetni(saat)).toBe('14:30');
  });

  it('tarihi Türkçe gün ve ay adıyla gösterir', () => {
    expect(tarihGoster('2026-11-05')).toBe('5 Kasım Perşembe');
  });
});
