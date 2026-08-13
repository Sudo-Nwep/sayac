# Sayac — Kontrol Dosyası (Değişken Verinin Tek Kaynağı)

> **Ne işe yarar:** "Şimdi ne yapılacak" ve "hangi ayarlar var" sorularının tek cevabı burası.
> Diğer dosyalar ve Claude buraya bakar → çelişki olmaz.
> **Kim günceller:** Mustafa veya sohbetteki Claude. Değişiklik SADECE burada yapılır.

---

## 🔵 Şu ANKİ TEK İŞ

> **Madde 3 kapandı — kurulabilir eklenti var, sekme başına ayrı sayaç ölçüldü.**
>
> `eklenti/` — MV2, **hiçbir host izni yok**, içerik betiği yalnız YouTube'a enjekte olur.
> Sayaç mantığı ikinci kez yazılmadı: `eklenti/sayac.js`, `mantik/sayac.mjs`'ten **üretilir**
> ve senkronluk SHA-256 ile kanıtlanır (`npm run eklenti:kontrol` → çıkış 0).
> **Ölçüm:** `npm run eklenti:test` → **çıkış 0** · on hücrenin **sekizi YEŞİL**, ikisi
> "ölçülemedi" (Y4 arka plan sekmesi · Y10 LibreWolf), **hiçbiri KIRMIZI değil**.
> Her yeşil hücrede sapma **tam 0** (Δkova = Δan; tolerans 250 ms, koşumdan önce sabit).
> Gerçek YouTube duman testi de geçti (Y9). Ayrıntı: `EKLENTI.md`.
>
> **Madde 4'e devreden mesaj API'si:** `{tur:"olay", olay:<altı addan biri>}` ve
> `{tur:"durum-iste"}` → `{sekmeId, durumAdi, toplam, anMs, gunBasiMs, …}`. Toplamlar **ham
> milisaniye**; saat:dakika biçimlendirmesi madde 4'ün işi. DUR/DEVAM ET tek `ana-kapat`
> olayı gönderir (toggle). **MOLA'nın videoyu duraklatması madde 4'te** — bu turda `mola-aç`
> yalnız kaydedildi.
>
> **Bilinen açık:** tarayıcı yeniden başlarsa sayaçlar **kaybolur** (durum bellekte; depolama
> eklenmedi). Karar madde 4/5'in.
>
> **Sıradaki tek iş:** madde 4 — arayüz (üç sayaç, iki buton, Türkçe).
>
> ---
>
> **Madde 2 (kapandı) — saf zaman mantığı yazıldı ve bozularak sınandı.**
>
> `mantik/sayac.mjs` — tarayıcıya, gerçek saate, zamanlayıcıya, global duruma **bağlı
> olmayan** saf çekirdek. Zaman modüle parametre olarak girer.
> **Ölçüm:** `npm test` → `GECEN: 20 · KALAN: 0`, çıkış 0 (eşik 12, koşucuya gömülü) ·
> `npm run mutasyon` → 4 kod mutantı + 3 tablo bozması = **7/7 yakalandı**, çıkış 0,
> her bozmadan sonra SHA-256 birebir geri geldi.
> **Saflık iddia edilmedi, ölçüldü:** statik tarama `bulunan=[]` **ve** 14 global
> erişildiğinde fırlatan sahtelerle değiştirilip 20/20 senaryo yine geçti (`tuzak
> tetiklendi: 0`). Ayrıntı: `MANTIK.md`.
>
> **Madde 3'e devreden sözleşme:** `gece-yarısı` olayının zaman damgası **çağıranın**
> sorumluluğudur (modül saf olduğu için 00:00'ı bilemez) · modül **tek** sayaç birimini
> modeller, sekme başına çoğullama madde 3'ün işidir · durum nesnesi değişmez ve
> serileştirilebilir, çoğullama+depolama orada bedavaya gelir.
>
> ---
>
> **Madde 1 (kapandı) — Firefox eklenti test yolu ölçüldü ve seçildi.**
>
> **Seçilen yol: `playwright-webextext`** (Aday A) — `test-yolu/aday-a.mjs`,
> kanıt koşusu `test-yolu/kanit-kosusu.mjs`.
>
> **Neden seçildi:** üç adaydan ikisi (A ve B) üç kutuyu da **iki manifestte de** geçti.
> Eşitliği bozan ölçüt ①'dir: **A, Playwright eli veriyor** — dönen nesne gerçek bir
> `BrowserContext` olduğu için `page.evaluate()` / `page.click()` çalışıyor (ölçüldü:
> `currentTime: 0.192, readyState: 4, paused: false`). `HEDEF.md` madde 3 *"sayaçlar
> doğru yönde ilerler, rakamla"* ve madde 4 *"iki butonun üç durumu da ölçülür"* diyor;
> ikisi de sayfayı sürmeyi gerektirir. Aday B'de (`web-ext`) tarayıcıyı web-ext açar,
> Playwright tutamacı yoktur — aynı kanıt için ürüne test kancası koymak gerekirdi (G20 ihlali).
>
> **Yedek: Mozilla `web-ext` RDP (Aday B)** — o da altı kutuyu geçti, `test-yolu/aday-b.mjs`
> çalışır hâlde depoda. A'nın bilinen kırılganlığı (sürüm `0.0.5`, ~2 yıllık, RDP aktör
> adlarına bağlı) gerçekleşirse geçiş maliyeti düşük.
>
> **Elenen: Playwright'ın kendi Firefox desteği (Aday C)** — ölçülerek elendi, hata metni
> ve artefakt kanıtı `TEST_YOLU.md`'de.
>
**Tarih:** 14/08/2026 · **Dal:** `main` · **Ayrıntı:** `MANTIK.md` (madde 2) · `TEST_YOLU.md` (madde 1)

---

## Aktif işler (sıralı — üstteki önce)

| # | İş | Durum | Not |
|---|---|---|---|
| 1 | Madde 4 — arayüz (üç sayaç, iki buton, Türkçe) | 🔵 bugün | Mesaj API'si hazır (`EKLENTI.md`). Playwright eli var → iki butonun üç durumu ölçülebilir. MOLA'nın videoyu duraklatması **burada** yazılır |
| 2 | Madde 5 — private GitHub deposu, README, etiket | ⚪ sırada | `git push` yalnız burada, önceden yetkili. ⚠️ Y10 (LibreWolf kurulumu) ölçülemedi — sıradaki somut adım `EKLENTI.md` 7b'de |

**Biten:** madde 1 (`TEST_YOLU.md`) · madde 2 (`MANTIK.md`) · madde 3 (`EKLENTI.md`) —
küme A kapandı, küme B'nin ilk yarısı bitti.

**Durum kodları:** 🔵 bugün · ⚪ sırada · 🔴 takıldı · ✅ bitti (→ arşive)

> Kural: aynı anda **tek** 🔵 olur. İkinci iş açılmaz (**G19**).

---

## 💡 Fikir havuzu (bugün yapılmayacak ama unutulmayacak)

- _(boş)_

> Çalışırken aklına gelen her yeni fikir buraya yazılır, işe girmez.

---

## ⚙️ Config / ortam değişkenleri

**Değerleri BURAYA YAZILMAZ** — sadece hangi anahtarın gerektiği listelenir.
Değerler `.env` dosyasında ve `.gitignore`'dadır.

| Anahtar | Ne işe yarar | Nereden alınır | Yerelde | Yayında |
|---|---|---|---|---|
| _(boş)_ | — | — | ❌ | ❌ |

---

## 📦 Bağımlılıklar (neden var)

Sürümler `npm ls --depth=0` çıktısından okundu, tahmin edilmedi. Hepsi `devDependencies` —
ürün çalışma zamanında hiçbiri gerekmez (eklenti saf tarayıcı kodudur).

| Paket | Sürüm | Neden gerekli |
|---|---|---|
| `playwright` | `1.62.1` | Firefox ikilisini sistem geneline kurmadan indirir (`npx playwright install firefox` → Firefox 153.0) ve sayfayı süren `BrowserContext`'i verir. **Seçilen test yolunun taşıyıcısı.** |
| `playwright-webextext` | `0.0.5` | **Seçilen test yolu.** Playwright'ın başlattığı Firefox'un RDP'sine bağlanıp geçici eklenti yükler; Playwright eli korunur. ⚠️ `tslib` ve `@playwright/test`'i bağımlılık olarak **bildirmiyor** — ikisi elle eklendi. |
| `tslib` | `2.8.1` | `playwright-webextext@0.0.5`'in bildirilmemiş çalışma-zamanı bağımlılığı. Yoksa `Cannot find module 'tslib'` ile düşer (`TEST_YOLU.md`'de birebir hata metni). |
| `@playwright/test` | `1.62.1` | `playwright-webextext`'in `dist/index.js`'i `fixtures.js`'i koşulsuz yüklüyor, o da bunu `require` ediyor. Yoksa `Cannot find module '@playwright/test'`. Sürüm `playwright` ile eşitlendi. |
| `web-ext` | `10.6.0` | **Yedek test yolu (Aday B)** — Mozilla'nın referans uygulaması. Ayrıca Aday C'nin ölçümünde imzasız XPI üretmek için `cmd.build` kullanıldı. Yalnız Node API ile koşulur, CLI olarak **asla** (G24). |

---

## Ekleme / çıkarma kuralları

- **EKLE:** iş, ancak "bittiğinde neyin çalışacağı/olacağı" tek cümleyle yazılabiliyorsa eklenir.
  Yazılamıyorsa iş değil, fikirdir → fikir havuzuna.
- **BÖL:** bir iş 2 günde bitmiyorsa ikiye bölünür.
- **ÇIKAR:** 2 haftadır dokunulmayan iş ölüdür → sil veya fikir havuzuna indir.
- **Protokol:** değişiklikte → bu dosyayı güncelle → `SON_HAREKETLER.md`'ye kısa madde işle.

---

## ✅ Arşiv (bitenler)

| Tarih | İş | Not |
|---|---|---|
| — | — | — |
