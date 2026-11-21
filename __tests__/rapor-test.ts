import { dosyaAdi, kacir, raporHtml } from '@/api/rapor';
import type { Rapor } from '@/api/tipler';

const rapor = (adSoyad: string, teknikDurum: 'Tamamlandı' | 'Planlandı'): Rapor => ({
  aday: {
    id: 1,
    adSoyad,
    yas: 25,
    eposta: 'aday@ornek.com',
    telefon: '0555 000 00 00',
    karar: 'Değerlendiriliyor',
    kararNotu: '',
    pozisyonId: 1,
    pozisyon: { id: 1, ad: 'Frontend Geliştirici' },
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  ik: null,
  teknik: {
    tarih: '2026-11-05',
    saat: '14:30',
    durum: teknikDurum,
    genelNot: '',
    mulakatci: { adSoyad: 'Deneme Mülakatçı' },
    ikAkis: null,
    ikCevaplar: [],
    teknikCevaplar: [
      { id: 1, sira: 1, konuAdi: 'JavaScript', soruMetni: 'let ve const farkı?', degerlendirme: 'yeterli' },
      { id: 2, sira: 2, konuAdi: 'JavaScript', soruMetni: 'Closure nedir?', degerlendirme: 'orta' },
    ],
  },
});

describe('HTML kaçırma', () => {
  it('HTML için özel karakterleri dönüştürür', () => {
    expect(kacir('<b>"A & B"</b>')).toBe('&lt;b&gt;&quot;A &amp; B&quot;&lt;/b&gt;');
  });

  it('önce & işaretini dönüştürür (çift dönüştürme yapmaz)', () => {
    expect(kacir('&lt;')).toBe('&amp;lt;');
  });
});

describe('PDF dosya adı', () => {
  it('Türkçe karakterleri sadeleştirir', () => {
    expect(dosyaAdi('Elif Yıldız')).toBe('Elif Yildiz - Mulakat Raporu.pdf');
    expect(dosyaAdi('Çağrı Öztürk Şahin')).toBe('Cagri Ozturk Sahin - Mulakat Raporu.pdf');
  });

  it('dosya adında sorun çıkaracak karakterleri siler', () => {
    expect(dosyaAdi('Ali/../Veli: "x"')).toBe('AliVeli x - Mulakat Raporu.pdf');
  });

  it('geriye harf kalmazsa "Aday" kullanır', () => {
    expect(dosyaAdi('***')).toBe('Aday - Mulakat Raporu.pdf');
  });
});

describe('rapor HTML', () => {
  it('kullanıcının yazdığı metni HTML olarak çalıştırmaz', () => {
    const html = raporHtml(rapor('<script>alert(1)</script>', 'Tamamlandı'));

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('tamamlanmış teknik mülakatta puanı yazar', () => {
    const html = raporHtml(rapor('Elif Yıldız', 'Tamamlandı'));

    // Yeterli + Orta = 3 / 4 = %75
    expect(html).toContain('<p class="puan">%75 · Güçlü</p>');
    expect(html).toContain('karar değil');
  });

  it('tamamlanmamış mülakatta puan yazmaz', () => {
    const html = raporHtml(rapor('Elif Yıldız', 'Planlandı'));

    expect(html).not.toContain('class="puan"');
    expect(html).toContain('puan hesaplanmadı');
  });
});
