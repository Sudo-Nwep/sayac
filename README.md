# Sayaç

LibreWolf'ta YouTube izlerken geçen süreyi üç kalemde ayıran bir tarayıcı eklentisi:
**izlenen süre**, **duraklatılmış süre** ve **mola süresi**. Her sekmenin kendi üç sayacı
vardır, karışmaz. Veriler bilgisayarınızda kalır — eklenti hiçbir ağ çağrısı yapmaz,
hiçbir yere veri göndermez.

---

## LibreWolf'a nasıl kurulur

### A · Kalıcı kurulum — ✅ ÖLÇÜLDÜ

Bu yol makine tarafından sınandı; dayanağı aşağıda.

1. Bağımlılıkları kur ve paketi üret:
   ```
   npm install
   npm run eklenti:paketle
   ```
   Çıktı: `web-ext-artifacts/sayac-1.0.0.xpi` (7 dosya: `manifest.json` · `sayac.js` ·
   `arkaplan.js` · `icerik.js` · `pencere.html` · `pencere.js` · `bicim.js`).
2. **LibreWolf'u kapat.**
3. Profil dizinini bul: `about:profiles` → kullandığın profilin **Kök Dizin**'i.
4. Profil altında `extensions\` klasörü yoksa oluştur ve XPI'yi oraya
   **`sayac@sayac.local.xpi`** adıyla kopyala.
   *(Ad rastgele değil: eklentinin kimliğidir — `eklenti/manifest.json` →
   `browser_specific_settings.gecko.id`.)*
5. Aynı profil dizinine `user.js` adında bir dosya oluştur ve şunları yaz:
   ```
   user_pref("xpinstall.signatures.required", false);
   user_pref("extensions.autoDisableScopes", 0);
   user_pref("extensions.enabledScopes", 15);
   user_pref("extensions.startupScanScopes", 15);
   user_pref("dom.security.https_only_mode", false);
   user_pref("media.autoplay.default", 0);
   ```
6. LibreWolf'u aç. `about:addons` → Uzantılar listesinde **Sayaç** görünmeli.

**Dayanak (ölçüm):** LibreWolf profilinin `extensions.json` dosyasında eklenti şu kayıtla
göründü — `active: true` · `location: "app-profile"` · `signedState: 0` (imzasız) ·
`appDisabled: false` · `userDisabled: false`. Sayaçlar gerçekten işledi: sondadan **15
işaret** düştü, ölçüm `geçen=11 · kalan=0`, görülen durumlar `DURAKLATILDI` ve `İZLENİYOR`.
Ayrıntı: `test-yolu/kanit/eklenti-Y10.json`.

> **⚠️ Ölçümün sınırı.** Bu ölçüm **taşınabilir LibreWolf 153.0.4-1** üzerinde, **boş ve tek
> kullanımlık** bir profille, **headless** kipte yapıldı. Kurulu bir LibreWolf'un **mevcut**
> profilinde ölçülmedi.

### B · Geçici kurulum — ⚠️ ÖLÇÜLMEDİ

1. `about:debugging#/runtime/this-firefox` adresini aç.
2. **Geçici Eklenti Yükle** → `eklenti/manifest.json` dosyasını seç.
3. **Tarayıcı kapanınca eklenti kaybolur.**

> Bu yol **ölçülmedi**. Sebebi: *"Makine kanali yok — ELLE gezinme gerektirir.
> Otomatiklestirilemedigi icin OLCULEMEDI; 'calismiyor' DEGIL."*
> (`test-yolu/kanit/eklenti-Y10.json`). Yani **çalışmadığı söylenmiyor** — sınanmadığı
> söyleniyor.

---

## Nasıl kullanılır

Araç çubuğundaki eklenti simgesine tıklayınca küçük bir pencere açılır. İçinde üç sayaç,
bir durum satırı ve iki buton vardır:

- **MOLA** — bastığında oynayan video **duraklatılır**, İzleniyor ve Duraklatıldı sayaçları
  durur, Mola sayacı işlemeye başlar. Buton yazısı **MOLAYI BİTİR** olur; tekrar bastığında
  mola biter ve normal düzene dönülür.
  *Ölçüldü:* MOLA'ya basıldığında sayfadaki videonun gerçekten durduğu doğrulandı
  (`video.paused = true`).
  *Not:* mola bitince video **kendiliğinden devam etmez** — bu bilinçli bir karardır,
  gerekçesi `ARAYUZ.md`'de.
- **DUR / DEVAM ET** — **hiçbir sayaç işlemez.** Moladan farkı budur: molada üçüncü sayaç
  işler, burada üçü de durur. Buton yazısı **DEVAM ET** olur; tekrar bastığında sayım
  kaldığı yerden sürer, birikmiş süre **sıfırlanmaz**.

Pencerede ayrıca **Durum:** satırı bulunur; o an hangi sayacın işlediğini gösterir.
Hedef sekme belirlenemezse pencere **Hedef sekme belirlenemedi.** uyarısını gösterir ve
sessizce yanlış sekmeye bakmaz.

---

## Üç sayaç ne anlama gelir

| Sayaç | Nasıl işler |
|---|---|
| **İzleniyor** | otomatik — video oynarken |
| **Duraklatıldı** | otomatik — video duraklatılmışken |
| **Mola** | manuel — MOLA butonuna basınca |

Dört ek kural:

- **Gerçek zaman sayılır.** Videoyu 2 kat hızda izlersen 10 dakikalık video **5 dakika**
  yazar; ölçülen şey videonun uzunluğu değil, senin harcadığın süredir.
- **Sekme başına ayrıdır.** Her sekmenin kendi üç sayacı vardır, karışmaz.
- **Yeni video açınca sayaç sıfırlanmaz** — sayaç videoya değil sekmeye bağlıdır.
- **Gün sonunda, saat 00:00'da** üç sayaç da sıfırlanır. Geçmiş günlerin verisi saklanmaz;
  ekranda hep "bugün" görünür.

Durum önceliği: **KAPALI > MOLA > İZLENİYOR / DURAKLATILDI**. İkisi aynı anda olamaz.

---

## Bilinen sınırlar

Ölçülmüş üç açık — gizlenmiyor:

1. **Tarayıcı yeniden başlarsa sayaçlar kaybolur.** Durum arka planın belleğinde yaşar;
   kalıcı depolama **eklenmedi** (kapsam dışı).
2. **"Sekme arkadayken sayım sürüyor mu" kutusu ÖLÇÜLEMEDİ.** Üç ayrı yol denendi
   (`window.open` · eklenti API'siyle `tabs.create` · `bringToFront`); üçünde de test
   tarayıcısı sekmeyi arka plana almadı (`visibilityState` hep `"visible"` ölçüldü).
   Ürünün bu kutuda hatalı olduğu **ölçülmedi** — kutu sınanamadı.
3. **Butonların arayüzden makineyle sürülmesi ÖLÇÜLEMEDİ.** Test aracı `moz-extension://`
   sayfasını süremiyor (dört yol birebir hata metniyle elendi). Butonların **davranışı**
   mesaj API'si yolundan yeşil ölçüldü ve pencerenin kendisi LibreWolf'ta canlı görüldü.

Sözleşme gereği **bu sürümde yapılmayanlar** (`SAYAC_TEKLIF.md`):

- ❌ Duraklatma geçmişi listesi yok
- ❌ "O saniyeye geri dön" özelliği yok
- ❌ Geçmiş günlerin kaydı, raporu, grafiği yok
- ❌ Telefon uygulaması yok — sadece bilgisayar tarayıcısı
- ❌ Hesap, giriş, bulut yedeği, cihazlar arası eşitleme yok
- ❌ YouTube dışındaki siteler yok
- ❌ Başka kişilerin verisini görme / yönetici paneli yok

---

## Geliştirici

| Komut | Ne kanıtlar |
|---|---|
| `npm test` | Saf zaman mantığı — 20 senaryo, tarayıcısız |
| `npm run mutasyon` | Sınamanın kendisi ölçüyor mu — 4 kod mutantı + 3 tablo bozması |
| `npm run eklenti:kontrol` | `eklenti/sayac.js` çekirdekten üretildi ve senkron (SHA-256) |
| `npm run eklenti:test` | Eklenti hücre matrisi (yerel uçtan uca, gece yarısı, gerçek YouTube…) |
| `npm run eklenti:sayac-kanit` | "Ölçülemedi" sayacı gerçekten sayıyor mu — bozularak sınanır |
| `npm run eklenti:paketle` | Ürün XPI'si — tam 7 dosya, üretim aracı pakete girmiyor |
| `npm run sir-tarama` | Takip edilen dosyalarda sızmış kimlik bilgisi var mı |
| `npm run sir-tarama:kanit` | Sır taraması kırmızıya dönebiliyor mu — sahte sırla sınanır |

Ölçüm raporları: `TEST_YOLU.md` (test yolu seçimi) · `MANTIK.md` (zaman mantığı) ·
`EKLENTI.md` (eklenti) · `ARAYUZ.md` (arayüz) · `TESLIM.md` (teslim).

**Doğruluğun tek kaynağı `mantik/sayac.mjs`'tir.** `eklenti/sayac.js` ondan **üretilir**
(elle düzenlenmez); senkronluk SHA-256 ile kanıtlanır.
