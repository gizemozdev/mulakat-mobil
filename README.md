# Mülakat Yönetim Sistemi — Mobil

Mülakat Yönetim Sistemi'nin iPhone / Android uygulaması. Adaylar, pozisyonlar ve mülakatçılar kaydedilir; İK ve teknik mülakatlar planlanır ve telefondan yapılır; aday kararı verilir, sonuç raporu PDF olarak paylaşılır.

Uygulamanın kendi veritabanı yoktur: bütün veriyi web projesinin ([mulakat-yonetim-sistemi](https://github.com/gizemozdev/mulakat-yonetim-sistemi)) API'sinden alır. Bu yüzden telefonu kullanmadan önce web sunucusunun çalışıyor olması gerekir.

## Özellikler

- **Giriş:** kullanıcı adı ve şifre; oturum anahtarı telefonun şifreli deposunda (SecureStore) tutulur ve her istekte `Authorization: Bearer` başlığıyla gönderilir. Şifremi unuttum / davet kodum var: e-postaya gelen 6 haneli kodla şifre belirleme.
- **Bugün:** giriş yapan kişiye atanmış yaklaşan mülakatlar.
- **Adaylar:** arama ve pozisyon süzgeci, aday detayı (telefon / e-postaya dokununca arama / e-posta), CV yükleme, açma ve kaldırma, karar, sonuç raporu (PDF paylaşma).
- **Mülakatlar:** aylık takvim, mülakatçı / tarih / saat / durum planlama, tam ekran teknik mülakat (konu seçimi, tek tek sorular, puan) ve dallanan İK mülakatı (akış seçimi, not, geri al, sonuç).
- **Daha Fazla:** pozisyonlar, mülakatçılar, soru havuzu, İK akış düzenleyicisi (ağaç önizleme), istatistikler ve aday karşılaştırma, kullanıcılar (davet, şifre sıfırlama, e-posta).
- Listelerde bir satıra **uzun basınca** Düzenle / Sil menüsü.
- Açık ve koyu tema telefonun ayarına göre değişir.

## Gereksinimler

- Node.js ve npm
- Telefonda **Expo Go** (App Store / Google Play)
- Aynı ağda çalışan web sunucusu (`mulakat-yonetim-sistemi` projesinde `npm run dev`)

## Kurulum

1. Bağımlılıkları kurun:

   ```bash
   npm install
   ```

2. Proje klasöründe `.env.local` dosyası oluşturup web sunucusunun **bilgisayarın ağdaki adresiyle** yazın (`localhost` olmaz: telefon için localhost telefonun kendisidir):

   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.66:3000
   ```

   Bilgisayarın adresi `ipconfig` (Windows) ile görülür. Bilgisayar başka bir ağa geçerse adres değişir; o zaman bu dosyayı güncelleyip Expo'yu yeniden başlatın (`EXPO_PUBLIC_` ile başlayan değişkenler paketleme sırasında koda yazılır).

3. Expo'yu başlatın ve terminaldeki QR kodu telefonun kamerasıyla okutun:

   ```bash
   npx expo start
   ```

   Telefon ile bilgisayar **aynı Wi-Fi ağında** olmalıdır. Expo Go'nun "Recently opened" listesindeki eski kayıtlar eski adreslere bağlanmaya çalışır; yeni adres için QR kodu okutun.

## Komutlar

```bash
npx expo start           # geliştirme sunucusu (Expo Go ile açılır)
npx expo start --clear   # önbelleği temizleyerek başlatır (paket ya da .env.local değişince)
npx expo lint            # ESLint
npx tsc --noEmit         # tip denetimi
npm test                 # Jest testleri (__tests__/*-test.ts)
npm run test:izle        # testleri değişiklikleri izleyerek çalıştırır
npx expo install <paket> # paket ekleme: Expo SDK'sıyla uyumlu sürümü seçer (npm install yerine)
npx expo install --check # paket sürümleri SDK ile uyumlu mu
npx expo-doctor          # proje ayarlarını ve sürümleri denetler
```

## Klasör yapısı

```
src/
  app/                          ekranlar (Expo Router: her dosya bir ekran, _layout.tsx gezinmeyi belirler)
    _layout.tsx                 kök yığın: giriş / sekmeler ayrımı (Stack.Protected), tam ekran ve modal ekranlar
    giris.tsx, sifremi-unuttum.tsx  giriş, ilk yönetici hesabı, kodla şifre belirleme
    (sekmeler)/                 alt menü: Bugün, Adaylar, Mülakatlar, Daha Fazla (her sekmenin kendi yığını)
    teknik/[adayId].tsx         tam ekran teknik mülakat
    ik/[adayId].tsx             tam ekran İK mülakatı
    rapor/[adayId].tsx          sonuç raporu ve PDF paylaşma
  ekranlar/                     iki sekmede kullanılan ortak ekran (adayın mülakat planlaması)
  bilesenler/                   ortak bileşenler: Yazi, Dugme, Girdi, Kart, Secim, Ekran, HataKutusu,
                                MulakatTakvimi, TarihSaatAlani, AkisAgaci, uzunBasma (menü + onaylı silme)
  api/                          istekAt (istek + Bearer + zaman aşımı), useVeri (ekran öne gelince veri),
                                tipler, tarih, teknikPuan, ikAkis (uyarılar), cv, rapor (PDF)
  oturum/OturumContext.tsx      oturum: giriş, çıkış, SecureStore
  tema/                         renkler (açık / koyu), ölçüler, useTema
__tests__/                      Jest testleri (saf fonksiyonlar)
```

## Kurallar

- Değişken, fonksiyon, dosya ve rota adları **Türkçe ve ASCII** (`adayKaydet`, `mulakatcilar`); ekrandaki yazılar Türkçe karakterlerle.
- Paket eklerken her zaman `npx expo install` kullanılır. Expo Go yalnızca kendi içinde gelen yerel modüllerle çalışır; yerel kodu olan yeni bir kütüphane eklenirse geliştirme derlemesi (development build) gerekir.
- Renkler `useTema()`'dan gelir, sabit renk yazılmaz (koyu tema). Boşluklar ve köşeler `tema/olculer.ts`'teki adlarla verilir.
- Sunucu istekleri `istekAt` ile yapılır; liste ekranları veriyi `useVeri` ile alır (ekran her öne geldiğinde yenilenir).
- Kurallar (benzersiz ad, silme kısıtları, döngü kontrolü vb.) sunucudadır; telefon kullanıcıya erken uyarı verir ve sunucunun mesajını gösterir.
- Silme her zaman onay ister (`onayliSil`).
- `src/app/` altına ekran olmayan dosya konmaz; ortak kod `src/` altındaki diğer klasörlerdedir.
- Her işten sonra `npx expo lint`, `npx tsc --noEmit` ve `npm test` çalıştırılır.

## Bilinen eksikler

- **Android:** telefonun uyarı penceresi en fazla 3 düğme gösterir; Kullanıcılar'da başkasının hesabına dokununca açılan menüde 4 seçenek var. Uygulama şimdiye kadar yalnızca iPhone'da denendi.
- `npm audit`'in gösterdiği orta seviye açıklar geliştirme araçlarında (minimatch); `npm audit fix --force` Expo'yu eski bir ana sürüme düşüreceği için kullanılmamalı.
- Uygulama yalnızca Expo Go ile çalıştırıldı; mağazaya göndermek için EAS ile derleme henüz yapılmadı.
