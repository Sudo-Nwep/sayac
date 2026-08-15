# Sayac — Kontrol Dosyası (Değişken Verinin Tek Kaynağı)

> **Ne işe yarar:** "Şimdi ne yapılacak" ve "hangi ayarlar var" sorularının tek cevabı burası.
> Diğer dosyalar ve Claude buraya bakar → çelişki olmaz.
> **Kim günceller:** Mustafa veya sohbetteki Claude. Değişiklik SADECE burada yapılır.

---

## 🔵 Şu ANKİ TEK İŞ

> **008 — Madde 5'in `commit sayısı` kalemi sha-ankrajlı bir rakamla kapandı.**
>
> ✅ **Commit sayısı ölçüldü:** `c4af8a9` itibarıyla **19** (ölçüm: `git rev-list --count
> c4af8a9`). 007'nin kendi tur başı ucu `5d471c8` itibarıyla **16** (`git rev-list --count
> 5d471c8`). **Tur sonu (008'in kapanış commit'i dahil): 22** — doğrulama `git rev-list
> --count HEAD`, `test-yolu/kanit/uzak-depo.log` Blok 3, ayrıca `TESLIM.md` §6.
> ✅ **Uzak senkron bugün tekrar ölçüldü** — `git ls-remote origin refs/heads/main` = yerel
> `HEAD`, `git rev-list --left-right --count main...origin/main` → `0	0`. Kanıt:
> `test-yolu/kanit/uzak-depo.log` Blok 2 (ve kapanışta Blok 3).
> **G09 notu:** aşağıdaki `007 (kapandı)` bloğundaki `(16 → tur sonunda güncellenir)` ifadesi
> **007'nin kendi kaydıdır ve silinmedi**; güncelleme burada (008'de) ve `TESLIM.md` §6'da
> yapıldı.
>
> **Sıradaki adım kararı döngünün planlayıcısınındır.**
>
> ---
>
> **007 (kapandı) — UZAK DEPO KENDİ ÖLÇÜMÜYLE KAPANDI. Madde 5'in yazılı dört kutusu da kapandı.**
>
> ✅ **Uzak depo bağlı ve doğrulandı** — `origin` → `https://github.com/Sudo-Nwep/sayac.git`.
> Bu turun başında zaten bağlıydı ve `main` yerel `HEAD` ile birebir eşti (turdan önce yapılmış).
> `git ls-remote origin`: `refs/heads/main` = yerel `HEAD` (`5d471c8…`) — **birebir eşit**;
> `refs/tags/v1.0.0^{}` = `git rev-list -n1 v1.0.0` — **birebir eşit**.
> `git rev-list --left-right --count main...origin/main` → `0	0` (ayrışma yok).
> Kanıt: `test-yolu/kanit/uzak-depo.log`.
> ✅ **Görünürlük ölçüldü: private.** İki anonim (kimliksiz) istek — `api.github.com` ve
> `github.com` — **ikisi de 404**; kimlikli `git ls-remote` gerçek ref döndürdü. Depo **var**
> (ls-remote kanıtlıyor) + anonim erişim **yok** (iki 404) = **private**.
> ✅ **Sır taraması push edilmiş ağaç üzerinde tekrar koşuldu** — `npm run sir-tarama` →
> **çıkış 0** (110 dosya, 0 bulgu) — düzenlemeden ÖNCE, yani push'lu içeriğin taraması.
> ✅ **Kanıt modu artık kendi log dosyasına yazıyor** — `arac/sir-tarama.mjs`'e 5 satırlık
> log-yolu ayrımı eklendi (`LOG_KANIT` sabiti, `logYaz` ikinci parametre aldı). Artık
> `npm run sir-tarama:kanit` → `test-yolu/kanit/sir-tarama-kanit.log`, normal mod →
> `sir-tarama.log`. İkisi artık birbirinin kanıtını **silmiyor**: kanıt log'unun SHA-256'sı
> kanıt koşumundan hemen sonra (K1) ve ardından normal koşumdan sonra (K2) **birebir aynı**
> ölçüldü. **İnvaryant (`:241-251` bloğu) değişmedi** — `git diff` yalnız bu 5 satırı gösteriyor.
> ✅ **Madde 5'in dört kanıt kalemi** artık `TESLIM.md` §6'da tek yerde, okunabilir: depo
> adresi · commit sayısı (`16` → tur sonunda güncellenir) · etiket adı (`v1.0.0`) · sır
> taraması çıkış 0.
>
> **Sıradaki tek iş yok** — madde 5'in yazılı dört kutusundan hiçbiri açık değil. Bu
> HEDEF.md'nin genel kapanışına dair bir iddia değildir, o karar planlayıcınındır; bu
> yalnız madde 5'in kendi durumudur.
>
> ---
>
> **006 (kapandı) — TESLİM. Madde 5'in üç kutusu kapandı, biri `bekliyor`.**
>
> ✅ **README.md** — kurulum (A ölçüldü · B ölçülmedi, ayrı etiketli), kullanım, üç sayacın
> anlamı, **bilinen üç açık gizlenmeden**, geliştirici komutları. Kelepçe: arayüzün dokuz
> Türkçe dizesi **9/9** birebir.
> ✅ **Sır taraması** (`arac/sir-tarama.mjs`) — `npm run sir-tarama` → **çıkış 0**
> (103 dosya tarandı, 0 bulgu, `git check-ignore` üç ad için de satır döndü).
> **Desen tabanlı, entropi tabanlı DEĞİL** — sebep ölçüldü: bu depoda ~50 kanıt dosyası
> SHA-256 hex ve UUID dolu, entropi kuralı temiz ağaçta kırmızı yanardı (G22).
> `npm run sir-tarama:kanit` → **çıkış 0**, üç bacak: temiz **0** · sahte sırla **1**
> (bulgu maskelenmiş: `ghp_…(40 karakter)`) · SHA-256+UUID ile **0**.
> ✅ **Etiket `v1.0.0`** — HEAD'e düştü. Sürüm dört yerde `1.0.0`'a eşitlendi
> (`eklenti/manifest.json` `0.1.0` → `1.0.0`; gerekçe `TESLIM.md`).
> ✅ **Ürün paketi ölçüldü** — `npm run eklenti:paketle` → `sayac-1.0.0.xpi`,
> **tam 7 ürün dosyası**, `uret.mjs` pakete **girmiyor** (kelepçe), SHA-256 kayıtlı.
> ⏳ **Uzak depo `bekliyor`** — `git remote -v` **boş**; depoyu açma adımı Mustafa'nındır.
> Push **denenmedi**, `<<<DUR>>>` yazılmadı — bu bir durma sebebi değil.
>
> ✅ **`git-rehberi` KISMİ taşındı** (Mustafa'nın kararı): §2.4 ve §2.6.
> `.gitignore` **değişmedi** (SHA-256 tur başı = tur sonu) — ölçüldü: §2.4 gövdesi bu
> projeninkinden **zayıf** (20 kural eksik, `*.log` muafiyeti yok). `kur-sistem.ps1`
> **kullanılmadı** (Kilit B + tam-taşıma varsayımı). `teslim-disiplini` **taşınmadı**.
>
> **Sıradaki tek iş:** Mustafa private depoyu açar; sonra `git push -u origin main` ve
> `git push origin v1.0.0`. Push'tan **önce** `npm run sir-tarama` çıkış 0 vermelidir.
>
> ---
>
> **005 (kapandı) — madde 3'ün iki açık kutusu kapandı, ölçüm kaydı düzeltildi.**
>
> **✅ Y10 YEŞİL — LibreWolf'a kurulabilirlik KANITLANDI.** RDP kullanılmadan: imzasız XPI
> `<profil>\extensions\sayac@sayac.local.xpi` olarak düşürüldü, taşınabilir LibreWolf
> `-no-remote -profile … -headless` ile başlatıldı. Artefakt: `extensions.json` →
> `active:true · signedState:0 · appDisabled:false · location:"app-profile"`.
> Sondadan 15 işaret; ölçüm `gecen=11 · kalan=0`, iki durum görüldü.
> **Aday A ölçülerek elendi** (düz Playwright + LibreWolf `executablePath` →
> `TimeoutError: launchPersistentContext: Timeout 45000ms`) — **RDP'ye hiç varılmadı**,
> `ECONNREFUSED` sayacı **artmadı** (4/5'te kaldı).
>
> **✅ Sekme kimliği zinciri GERÇEK PANELDE ölçüldü** (Faz 4, LibreWolf kanalı açıldığı için
> mümkün oldu): karşıt deney `999999 → 999999` · `888888 → 888888` · `getCurrent=yok` →
> panelde `sender.tab` **yok**, `msg.sekmeId` yolu **geçerli**. `pencereHedef=1 = sorguId=1`,
> panel DOM canlı (`0:00:02`, `#uyari` boş, `btnMola="MOLA"`). `EKLENTI.md:380`'in
> doğrulanmamış iddiası **kapandı**.
>
> **⚠️ Y4 ÖLÇÜLEMEDİ, üç yol da denendi:** Y4a `window.open` · Y4b sondadan
> `tabs.create({active:true})` (gerçekten yeni aktif sekme açtı, `id=3`) · Y4c
> `newPage+bringToFront` → **üçünde de `visibilityState="visible"`**. Taklit yapılmadı.
>
> **🔧 Sayaç düzeltildi + bozularak sınandı:** `ZORUNLU OLCULEMEDI` satırı Y16'yı
> saymıyordu (tam dize karşılaştırması, Y16 ASCII yazıyordu). `test-yolu/ortak/durum.mjs`
> tek kaynak oldu; sapma artık **bağırılıyor**. `npm run eklenti:sayac-kanit` → **3/3, çıkış 0**.
>
> **Sıradaki tek iş:** madde 5 — private GitHub deposu, README, etiket, gizli taraması.
>
> ---
>
> **Madde 4 (kapandı) — arayüz yazıldı; davranış ölçüldü.**
>
> `eklenti/pencere.html` + `pencere.js` + `bicim.js`; manifest `browser_action.default_popup`
> bildiriyor. **İzin eklenmedi** — Y14 karşıt deneyi: izinsizken `tabs.query` sekme kimliğini
> döndürdü (`sorguId=2`), `tabs` izniyle **birebir aynı**.
> **Ölçülenler:** Y15 biçimlendirici **13/13** · Y6 (mesaj API'si yolu) **5 faz, sapma tam 0** —
> molada üçüncü kova işledi, **KAPALI'da üçü de tam 0**, video **gerçekten duraklatıldı**
> (`video.paused=true`), kümülatif sıfırlanmadı · Y11 **9/9 Türkçe dize birebir** + manifest
> bildirimi + ürünün bozulma kelepçesi çalıştı · Y1/Y7 eklenti hâlâ yükleniyor (MV2 ve MV3).
> `npm run eklenti:test` → **çıkış 0**, zorunlu kırmızı **0**.
>
> **⚠️ ÖLÇÜLEMEDİ (adıyla):** butonlara Playwright ile tıklanamadı — **dört yol** birebir hata
> metinleriyle elendi (WAR iframe'de `API.tabs` **undefined** · `page.goto` zaman aşımı ·
> `window.open`'a Playwright bağlanamıyor · sonda kanalı **yarışlı**). Bu yüzden MOLA ve
> DUR/DEVAM ET'in üç durumu **arayüzden** ölçülemedi; **davranışları** Y6'da ölçüldü.
> Sekme kimliği zinciri de ölçülemedi: `arkaplan.js:73-78` önceliği `msg.sekmeId`'yi
> **gölgeliyor** (`999999` gönderildi, `1` döndü). Ayrıntı: `ARAYUZ.md`.
>
> **Sıradaki tek iş:** madde 5 — private GitHub deposu, README, etiket, gizli taraması.
> Madde 5'e giren açıklar: Y10 (LibreWolf kurulumu) · Y4 (arka plandaki sekme) ·
> gerçek araç çubuğu paneli bağlamı.
>
> ---
>
> **Madde 3 (kapandı) — kurulabilir eklenti var, sekme başına ayrı sayaç ölçüldü.**
>
> `eklenti/` — MV2, **hiçbir host izni yok**, içerik betiği yalnız YouTube'a enjekte olur.
> Sayaç mantığı ikinci kez yazılmadı: `eklenti/sayac.js`, `mantik/sayac.mjs`'ten **üretilir**
> ve senkronluk SHA-256 ile kanıtlanır (`npm run eklenti:kontrol` → çıkış 0).
> **Ölçüm (005'te güncellendi):** `npm run eklenti:test` → **çıkış 0** · **16 hücre:
> 10 YEŞİL · 5 ölçülemedi (Y4 · Y16 · Y11 · Y12 · Y13) · 1 atlandı (Y10)**,
> **hiçbiri KIRMIZI değil**. Y10 ayrıca elle koşuldu ve **YEŞİL** (LibreWolf'a kurulabilirlik).
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

_(boş)_ — 007'de madde 5'in son kutusu (uzak depo) kendi ölçümüyle kapandı; şu an açık
madde-5 işi yok. Sıradaki adım kararı döngünün planlayıcısınındır.

**Kalan ölçüm açığı (kapsam dışı, iş değil):** Y4 — arka plandaki sekme; üç yol da
`visibilityState="visible"` ölçtü, ürün kusuru **ölçülmedi**.

**Biten:** madde 1 (`TEST_YOLU.md`) · madde 2 (`MANTIK.md`) · madde 3 (`EKLENTI.md`) ·
madde 4 (`ARAYUZ.md`) —
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
| `web-ext` | `10.6.0` | **Yedek test yolu (Aday B)** — Mozilla'nın referans uygulaması. Ayrıca Aday C'nin ölçümünde imzasız XPI üretmek için `cmd.build` kullanıldı. Yalnız Node API ile koşulur, CLI olarak **asla** (G24). **006'dan beri ÜRÜN paketleyicisi:** `arac/paketle.mjs` yalnız `cmd.build` ile `sayac-<sürüm>.xpi` üretir (RDP yok, ağ yok) — teslim edilen XPI budur. |

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
| 15/08/2026 | Madde 5 — uzak depo | 007'de kendi ölçümüyle kapandı: `git ls-remote origin` gerçek ref döndürdü, `main` sha = yerel `HEAD`, `v1.0.0^{}` sha eşleşti, görünürlük private ölçüldü (iki anonim istek 404), push edilmiş ağaçta sır taraması çıkış 0. Kanıt `test-yolu/kanit/uzak-depo.log` + `TESLIM.md` §6 |
