import type { Degerlendirme } from '@/api/tipler';
import type { Renkler } from '@/tema/renkler';

// Web projesindeki puan kuralının aynısı: Yeterli 2, Orta 1, Yetersiz 0; sonuç yüzde.
// Bu puan karar değil, fikir vermek içindir.
const puanlar: Record<Degerlendirme, number> = { yeterli: 2, orta: 1, yetersiz: 0 };

export const degerlendirmeAdi: Record<Degerlendirme, string> = { yeterli: 'Yeterli', orta: 'Orta', yetersiz: 'Yetersiz' };

export const yuzdeHesapla = (liste: { degerlendirme: Degerlendirme | null }[]) => {
  if (liste.length === 0) return 0;

  const toplam = liste.reduce((puan, cevap) => puan + (cevap.degerlendirme ? puanlar[cevap.degerlendirme] : 0), 0);

  return Math.round((toplam / (liste.length * 2)) * 100);
};

export const izlenim = (yuzde: number) => (yuzde >= 75 ? 'Güçlü' : yuzde >= 50 ? 'Orta düzey' : 'Gelişmeye açık');

export const izlenimRengi = (yuzde: number, renk: Renkler) =>
  yuzde >= 75 ? renk.basari : yuzde >= 50 ? renk.uyari : renk.hata;

export const degerlendirmeRenkleri = (degerlendirme: Degerlendirme, renk: Renkler) =>
  ({
    yeterli: { on: renk.basari, zemin: renk.basariAcik },
    orta: { on: renk.uyari, zemin: renk.uyariAcik },
    yetersiz: { on: renk.hata, zemin: renk.hataAcik },
  })[degerlendirme];

// Puan yalnızca durumu "Tamamlandı" olan ve bütün soruları değerlendirilmiş mülakatta anlamlı
export const teknikTamamlandi = (durum: string | undefined, cevaplar: { degerlendirme: Degerlendirme | null }[]) =>
  durum === 'Tamamlandı' && cevaplar.length > 0 && cevaplar.every((cevap) => cevap.degerlendirme);

// Cevapları konuya göre gruplar; konular ilk soruldukları sırayla gelir
export const konularaGoreGrupla = <T extends { konuAdi: string }>(cevaplar: T[]) => {
  const gruplar = new Map<string, T[]>();

  for (const cevap of cevaplar) {
    gruplar.set(cevap.konuAdi, [...(gruplar.get(cevap.konuAdi) ?? []), cevap]);
  }

  return [...gruplar.entries()];
};
