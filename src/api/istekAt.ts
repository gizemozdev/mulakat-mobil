// Sunucu (web projesinin API'si) ile konuşan tek yer. Her istek { veri, hata } döndürür; ekranlar try/catch yazmaz.

export const API_ADRESI = process.env.EXPO_PUBLIC_API_URL ?? '';

// Sunucu yanıt vermezse istek sonsuza kadar beklemesin
const ZAMAN_ASIMI_MS = 15000;

// Oturum anahtarı ve "oturum düştü" bildirimi OturumContext tarafından ayarlanır
let oturumAnahtari: string | null = null;
let yetkisizOlunca: (() => void) | null = null;

export const anahtariAyarla = (anahtar: string | null) => {
  oturumAnahtari = anahtar;
};

export const yetkisizOluncaAyarla = (fonksiyon: (() => void) | null) => {
  yetkisizOlunca = fonksiyon;
};

export type IstekSonucu<T> = { veri: T; hata: '' } | { veri: null; hata: string };

export async function istekAt<T = unknown>(
  yol: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  govde?: object | FormData
): Promise<IstekSonucu<T>> {
  if (!API_ADRESI) {
    return { veri: null, hata: 'Sunucu adresi ayarlanmamış (.env.local içinde EXPO_PUBLIC_API_URL).' };
  }

  const formMu = govde instanceof FormData;
  const iptal = new AbortController();
  const zamanlayici = setTimeout(() => iptal.abort(), ZAMAN_ASIMI_MS);

  try {
    const yanit = await fetch(`${API_ADRESI}${yol}`, {
      method,
      headers: {
        ...(formMu || govde === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(oturumAnahtari ? { Authorization: `Bearer ${oturumAnahtari}` } : {}),
      },
      body: govde === undefined ? undefined : formMu ? govde : JSON.stringify(govde),
      signal: iptal.signal,
    });

    const veri = await yanit.json().catch(() => null);

    // Anahtar süresi dolmuş ya da silinmişse kullanıcı giriş ekranına döner
    if (yanit.status === 401 && oturumAnahtari) {
      yetkisizOlunca?.();
    }

    if (!yanit.ok) {
      return { veri: null, hata: veri?.error ?? `Sunucu hatası (${yanit.status}).` };
    }

    return { veri: veri as T, hata: '' };
  } catch {
    return {
      veri: null,
      hata: 'Sunucuya ulaşılamadı. Bilgisayardaki sunucunun açık olduğundan ve telefonla aynı ağda olduğunuzdan emin olun.',
    };
  } finally {
    clearTimeout(zamanlayici);
  }
}
