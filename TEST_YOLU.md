# Firefox eklenti test yolu — ölçüm raporu

> **Hedef 1 · madde 1.** Üç aday aynı ölçüm protokolüyle koşuldu, sonuç rakamla kaydedildi,
> tutan yol seçildi ve seçilen yolla boş bir sınama eklentisi yüklenip bir olay okundu.
> **Tarih:** 14/08/2026 · **Makine:** Windows 11 Pro 10.0.26200 (win32)

---

## Sonuç — tek cümle

**Seçilen yol: `playwright-webextext` (Aday A).** Yedek: Mozilla `web-ext` RDP (Aday B) — o da
üç kutuyu iki manifestte de geçti. Aday C (Playwright'ın kendi Firefox desteği) **ölçülerek elendi**.

---

## Ortam — ölçüldü, ezberden yazılmadı

| Ne | Değer | Nereden |
|---|---|---|
| `node -v` | `v26.5.0` | komut çıktısı |
| `npm -v` | `11.17.0` | komut çıktısı |
| `npx playwright --version` | `Version 1.62.1` | komut çıktısı |
| Firefox ikilisi | `C:\Users\kadio\AppData\Local\ms-playwright\firefox-1538\firefox\firefox.exe` | `firefox.executablePath()` |
| İkili diskte var mı | **evet** (721.920 bayt) | `fs.existsSync()` + `fs.statSync()` — **G11: artefakta bakıldı** |
| Firefox sürümü | 153.0 (playwright firefox v1538) | `npx playwright install firefox` çıktısı |
| İkili nereden geldi | **Playwright indirmesi** (`npx playwright install firefox`) | yedek `@puppeteer/browsers` yoluna **gerek kalmadı** |

`npm ls --depth=0`:

```
sayac@1.0.0 C:\Users\kadio\Documents\Claude\Projects\Sayac
+-- @playwright/test@1.62.1
+-- playwright-webextext@0.0.5
+-- playwright@1.62.1
+-- tslib@2.8.1
`-- web-ext@10.6.0
```

> ⚠️ Prompt `playwright-webextext` için `0.0.4` diyordu; **kurulan gerçek sürüm `0.0.5`**.
> Rakam paket dosyasından okundu, prompttan kopyalanmadı.

---

## Ölçüm protokolü — üç adayda da aynı cetvel

- **İşaret sunucusu:** test betiğinin **kendi süreci** içinde `http.createServer`, `127.0.0.1:0`
  (dinamik port). `GET /test.html` → içinde `<video>` olan sahte sayfa · `GET /olay?...` →
  isteği diziye yazar, `204` döner. `finally` içinde `server.close()`.
  Ayrı kabuk süreci olarak sunucu **başlatılmadı** (G24).
- **Port eklentiye nasıl taşındı:** eklenti kaynağı geçici dizine **kopyalandı**, kopyaya
  `port.js` yazıldı; manifest'te `port.js` hem `background.scripts` hem `content_scripts.js`
  dizisinde **ilk sırada**. Kaynak klasör kirletilmedi.
- **Kanıt nereden okundu:** tarayıcıdan değil, **eklentinin dışarı attığı işaretten**.
  Aday B'de Playwright eli yoktur; DOM okumaya dayalı bir kanıt o satırı ölçemez ve tablo
  karşılaştırılamaz hâle gelirdi.
- **Süreç disiplini:** her hücre kendi çocuk sürecinde, kendi tek kullanımlık profiliyle,
  kendi **120 sn sert sayacıyla** koştu; ebeveyn 180 sn'de `taskkill /T /F` ile süreç
  **ağacını** öldürecek şekilde kuruldu (bu turda tetiklenmedi). Her betik `try/finally`
  içinde tarayıcıyı ve sunucuyu her koşulda kapattı (G23/G24).

---

## 📊 TABLO — 3 aday × 2 manifest = 6 satır

| Aday | Manifest | 1 · yüklendi mi | 2 · eklenti bağlandı mı | 3 · bir olay okunabildi mi | Süre | Kanıt |
|---|---|---|---|---|---|---|
| **A** `playwright-webextext` | MV2 | **E** | **E** | **E** (gerçek olay) | 2.770 ms | `test-yolu/kanit/aday-a-mv2.log` |
| **A** `playwright-webextext` | MV3 | **E** | **E** | **E** (gerçek olay) | 2.673 ms | `test-yolu/kanit/aday-a-mv3.log` |
| **B** `web-ext` RDP | MV2 | **E** | **E** | **E** (gerçek olay) | 1.571 ms | `test-yolu/kanit/aday-b-mv2.log` |
| **B** `web-ext` RDP | MV3 | **E** | **E** | **E** (gerçek olay) | 1.476 ms | `test-yolu/kanit/aday-b-mv3.log` |
| **C** Playwright kendi Firefox desteği | MV2 | **H** | **H** | **H** | 50.489 ms | `test-yolu/kanit/aday-c-mv2.log` |
| **C** Playwright kendi Firefox desteği | MV3 | **H** | **H** | **H** | 50.385 ms | `test-yolu/kanit/aday-c-mv3.log` |

**Boş hücre yok.** Dördüncü yol (geckodriver/Marionette) **denenmedi** — üç adaydan ikisi
tuttuğu için ön koşulu doğmadı; tabloda dördüncü satır yoktur.

**Olay üretimi:** altı hücrenin de dördünde `play` olayı **merdiven 1** ile üretildi —
`canvas.captureStream()` → `video.srcObject` → `video.play()`, yani **gerçek oynatma olayı**.
Sentetik olaya (`dispatchEvent`) **hiçbir hücrede düşülmedi**. Kanıt: her kayıtta `uretim=gercek`.

---

## Kutu kutu kanıt

### Aday A — `playwright-webextext@0.0.5` · **TUTTU (MV2 + MV3)**

Kütüphanenin MV3 için koştuğu **iki şart bilerek uygulandı**, sonra ölçüldü:
① `eklenti-mv3/manifest.json` içinde `browser_specific_settings.gecko.id = "sinama@sayac.local"` var ·
② tarayıcı `launch()` ile değil **`launchPersistentContext()`** ile açıldı (`test-yolu/aday-a.mjs`).

| Kutu | MV2 | MV3 | Kanıt (birebir) |
|---|---|---|---|
| 1 | E | E | `launchPersistentContext çözüldü → _BrowserContext; installAddons() istisna atmadı (RDP installTemporaryAddon başarılı), acik sayfa sayisi=1` |
| 2 | E | E | MV2: `{"aday":"a","manifest":"mv2","kutu":"2","kaynak":"arkaplan","ms":1786655461403}` · MV3: `{"aday":"a","manifest":"mv3","kutu":"2","kaynak":"arkaplan","ms":1786655464905}` |
| 3 | E | E | MV2: `{"aday":"a","manifest":"mv2","kutu":"3","kaynak":"icerik","tur":"play","uretim":"gercek","ms":1786655461868}` · MV3: `{"aday":"a","manifest":"mv3","kutu":"3","kaynak":"icerik","tur":"play","uretim":"gercek","ms":1786655465380}` |

**⚠️ Aday A ilk iki koşuda düştü — sebep adayın mekanizması değil, paketleme kusuru.**
`playwright-webextext@0.0.5` iki çalışma-zamanı bağımlılığını `package.json`'ında
**bildirmiyor**. Birebir hata metinleri:

```
Error: Cannot find module 'tslib'
Require stack:
- ...\node_modules\playwright-webextext\dist\firefox_browser.js
- ...\node_modules\playwright-webextext\dist\factory.js
- ...\node_modules\playwright-webextext\dist\index.js
  code: 'MODULE_NOT_FOUND'
```

```
Error: Cannot find module '@playwright/test'
Require stack:
- ...\node_modules\playwright-webextext\dist\fixtures.js
- ...\node_modules\playwright-webextext\dist\index.js
  code: 'MODULE_NOT_FOUND'
```

İkisi de `npm i -D tslib @playwright/test@1.62.1` ile kuruldu (`HEDEF.md`: *"kütüphane
eksik → kurulur"*), sonra aday **iki manifestte de üç kutuyu geçti**. Bu bir eleme sebebi
değildir ama **bakım sinyalidir** — seçim gerekçesinde tartılmıştır.

### Aday B — Mozilla `web-ext@10.6.0` RDP (Node API) · **TUTTU (MV2 + MV3)**

`web-ext run` **CLI olarak koşulmadı** (dönmeyen süreçtir — G24). Yalnız Node API:
`webExt.cmd.run({...}, { shouldExitProgram: false })` → `finally { await runner.exit() }`.
Seçenek adları prompttan değil **kurulu paketin kendi kaynağından** doğrulandı
(`node_modules/web-ext/lib/cmd/run.js:15-34` → `firefox · firefoxProfile · sourceDir ·
noReload · noInput · pref · args · startUrl · keepProfileChanges · profileCreateIfMissing · target`).

| Kutu | MV2 | MV3 | Kanıt (birebir) |
|---|---|---|---|
| 1 | E | E | `cmd.run çözüldü: MultiExtensionRunner; RDP installTemporaryAddon sonucu: Firefox Desktop → addonId=sinama@sayac.local` |
| 2 | E | E | MV2: `{"aday":"b","manifest":"mv2","kutu":"2","kaynak":"arkaplan","ms":1786655468245}` · MV3: `{"aday":"b","manifest":"mv3","kutu":"2","kaynak":"arkaplan","ms":1786655470675}` |
| 3 | E | E | MV2: `{"aday":"b","manifest":"mv2","kutu":"3","kaynak":"icerik","tur":"play","uretim":"gercek","ms":1786655468294}` · MV3: `{"aday":"b","manifest":"mv3","kutu":"3","kaynak":"icerik","tur":"play","uretim":"gercek","ms":1786655470820}` |

Kutu 1 kanıtı özellikle güçlü: `reloadableExtensions` haritası RDP'nin **döndürdüğü**
`addonId`'yi taşıyor — yükleme çağrısının dönüş değeri, kabulü değil.

**Profil:** `firefoxProfile` verilmedi → `web-ext` kendi tek kullanımlık temp profilini yarattı
(`node_modules/web-ext/lib/firefox/index.js:262` `createProfile()` → `new FirefoxProfile()`,
`destinationDirectory` yok = `tmp`). Mustafa'nın profiline dokunulmadı.

**`web-ext` Playwright'ın yamalı Firefox'unu reddetmedi** — riskli görülen madde ölçüldü,
gerçekleşmedi. Yedek indirme (`@puppeteer/browsers`) yoluna gerek kalmadı.

### Aday C — Playwright'ın kendi Firefox desteği · **ELENDİ (MV2 + MV3)**

İki somut yoklama yapıldı; "desteklenmiyor" **varsayım değil ölçüm** olarak kaydedildi.

**Yoklama 1 — API yüzeyi.** `playwright-core/types/types.d.ts` (1.110.782 bayt) içinde
eklenti yükleme parametresi arandı:

```
aranan  = ["loadExtension","extensionPath","addonPath","installTemporaryAddon",
           "firefoxExtensions","webExtensions","--load-extension"]
bulunan = []
```

Yedisi de **yok**. Playwright 1.62.1'in genel API yüzeyinde eklenti yükleyen bir parametre
bulunmuyor — Chromium'a özel `--load-extension` anahtarı bile tip tanımlarında geçmiyor.

**Yoklama 2 — profile düşürme, İKİ BİÇİM.** Tek biçimle eleme yapılmadı:

- **2a — XPI:** `web-ext build` ile üretilen imzasız XPI (1.787-1.793 bayt)
  `<profil>\extensions\sinama@sayac.local.xpi` olarak kondu.
- **2b — paketlenmemiş dizin:** kaynak, `<profil>\extensions\sinama@sayac.local\` olarak kondu.

İkisinde de profil önce `launchPersistentContext()` ile bir kez yaratıldı, kapatıldı,
eklenti düşürüldü, `firefoxUserPrefs` ile yeniden açıldı:
`xpinstall.signatures.required=false` · `extensions.autoDisableScopes=0` ·
`extensions.enabledScopes=15` · `extensions.startupScanScopes=15`.

**Preflerin gerçekten profile yazıldığı ölçüldü** (K05 — doğrulama iddia eder, ölçmez).
`<profil>\prefs.js` taraması:

```
xpinstall.signatures.required=prefs.js'te VAR · extensions.autoDisableScopes=prefs.js'te VAR
extensions.enabledScopes=prefs.js'te VAR    · extensions.startupScanScopes=prefs.js'te VAR
media.autoplay.default=prefs.js'te VAR      · media.autoplay.blocking_policy=prefs.js'te YOK
```

Eklenti için gereken **dört prefin dördü de** profile düştü. Yani H, "pref yazılmamış"tan
gelmiyor.

**Kutu 1 kanıtı — artefakttan (G11).** Her iki biçimde de, `<profil>\extensions.json`
içinde `sinama@sayac.local` **YOK**. Dosyadaki id listesi (birebir):

```
["formautofill@mozilla.org","ipp-activator@mozilla.com","newtab@mozilla.org",
 "pictureinpicture@mozilla.org","addons-search-detection@mozilla.com",
 "webcompat@mozilla.org","default-theme@mozilla.org","firefox-compact-light@mozilla.org",
 "firefox-compact-dark@mozilla.org","firefox-alpenglow@mozilla.org"]
```

Firefox on yerleşik eklentisini kaydetti, bizimkini **hiç kaydetmedi** — reddedilmiş bir
kayıt (`appDisabled` / `signedState: -1`) bile yok. Playwright'ın Firefox yapısı profile
düşürülen eklentiyi taramıyor.

**Kutu 2:** `/olay?kutu=2` isteği **hiç gelmedi (sıfır bayt)** — arka plan betiği koşmadı.
**Kutu 3:** `/olay?kutu=3` isteği **hiç gelmedi (sıfır bayt)**.

**H adayın, cetvelin değil (G22).** Kutu 3'te sayfanın kendi durumu okundu:

```
Sayfa durumu: zaman-asimi / play olayi ucti
```

Yani sayfa `play` olayını **gerçekten üretti** (`play olayi ucti`), ama içerik betiği hiç
bağlanmadığı için sayfa 8 sn bekleyip zaman aşımına düştü (`zaman-asimi`) ve işareti dışarı
taşıyacak eklenti yoktu. Ölçüm düzeneği o hücrede de çalışıyordu; H adaydan geliyor.

---

## Seçim — gerekçe

En az bir hücrede üç kutuyu da E geçen **iki** aday var: **A** ve **B**. Sıralama ölçütü
uygulandı:

| # | Ölçüt | Aday A | Aday B | Kazanan |
|---|---|---|---|---|
| ① | **Madde 3/4 için Playwright eli veriyor mu?** | **EVET** — dönen nesne gerçek bir Playwright `BrowserContext`; `page.evaluate()` / `page.click()` çalışıyor. **Ölçüldü**, aşağıdaki kanıt koşusunda. | **HAYIR** — tarayıcıyı `web-ext` açar, Playwright tutamacı yoktur. | **A** |
| ② | Bakımlı mı | ⚠️ `0.0.5`, iki bildirilmemiş bağımlılık (ölçüldü) | ✅ Mozilla'nın kendi referans uygulaması, `10.6.0` | **B** |
| ③ | Kurulum yükü | 3 paket (`playwright-webextext` + `tslib` + `@playwright/test`) | 1 paket (`web-ext`) | **B** |

**Ölçüt ① belirleyicidir ve A kazanır.** Sebep: `HEDEF.md` madde 4'ün kanıtı *"iki butonun
üç durumu da ölçülür"* diyor; madde 3'ün kanıtı *"sayaçlar doğru yönde ilerler, rakamla"*
diyor. İkisi de sayfayı **sürmeyi** (butona basmak) ve sayfa durumunu **okumayı** gerektirir.
Aday B'de bu yok — orada aynı kanıtı üretmek için ürünün içine test kancası koymak gerekirdi,
bu da kapsam kaymasıdır (G20).

**Aday B elenmedi, YEDEK olarak kayıtlıdır.** İki manifestte de üç kutuyu geçti ve
`test-yolu/aday-b.mjs` çalışır hâlde depodadır. A'nın bilinen kırılganlığı (0.0.5, ~2 yıllık,
RDP aktör adlarına bağlı) gerçekleşirse geçiş maliyeti düşüktür.

---

## Kanıt koşusu — seçilen yolla, birebir

**Çalıştırılan komut:**

```
node test-yolu\kanit-kosusu.mjs mv2
```

**Çıktı (özetlenmedi, birebir):**

```
[+000000ms] KANIT KOSUSU — secilen yol: playwright-webextext · manifest=mv2
[+000000ms] firefox ikilisi: C:\Users\kadio\AppData\Local\ms-playwright\firefox-1538\firefox\firefox.exe
[+000007ms] isaret sunucusu ayakta: http://127.0.0.1:51213
[+000014ms] bos sinama eklentisi (gecici kopya): C:\Users\kadio\AppData\Local\Temp\sayac-ekl-kanit-mv2-NvFge3
[+000014ms] tek kullanimlik profil: C:\Users\kadio\AppData\Local\Temp\sayac-profil-kanit-mv2-jraezM
[+001770ms] EKLENTI YUKLENDI — launchPersistentContext cozuldu (_BrowserContext)
[+001773ms] ISARET <- {"aday":"kanit","manifest":"mv2","kutu":"2","kaynak":"arkaplan","ms":1786655634139}
[+001823ms] sayfa acildi: http://127.0.0.1:51213/test.html
[+001824ms] OLAY 1/2 (arka plan): {"aday":"kanit","manifest":"mv2","kutu":"2","kaynak":"arkaplan","ms":1786655634139}
[+001825ms] ISARET <- {"aday":"kanit","manifest":"mv2","tani":"icerik-yuklendi","ms":1786655634191}
[+002028ms] ISARET <- {"aday":"kanit","manifest":"mv2","kutu":"3","kaynak":"icerik","tur":"play","uretim":"gercek","ms":1786655634394}
[+002229ms] OLAY 2/2 (sayfa->icerik->arkaplan): {"aday":"kanit","manifest":"mv2","kutu":"3","kaynak":"icerik","tur":"play","uretim":"gercek","ms":1786655634394}
[+002235ms] PLAYWRIGHT ELI (page.evaluate ile sayfa durumu): {"baslik":"Sayac — sinama sayfasi","videoVar":true,"currentTime":0.192,"readyState":4,"paused":false,"uretim":"gercek","durum":"play olayi ucti"}
[+002314ms] PLAYWRIGHT ELI (page.click('h1') sorunsuz dondu) — madde 3/4 icin sayfa surulebilir
[+002314ms] SONUC: eklenti yuklendi=true · okunan olay sayisi=2/2 · GECTI=true
[+002670ms] isaret sunucusu kapatildi
[+002679ms] temizlik bitti
CIKIS KODU: 0
```

Boş sınama eklentisi yüklendi ve **iki olay okundu**. Seçim gerekçesi olan Playwright eli
iddia edilmedi, **ölçüldü**: `currentTime: 0.192` · `readyState: 4` · `paused: false` —
video gerçekten oynuyor ve Playwright sayfa durumunu doğrudan okuyabiliyor.

---

## Madde 3'e girdi olan bulgular

1. **MV3 riski gerçekleşmedi.** Beklenti şuydu: Firefox MV3'te host izinleri kullanıcı
   onayına bağlı olduğu için arka planın `fetch`'i sessizce çalışmaz. **Ölçüm bunu çürüttü:**
   Firefox 153'te geçici olarak yüklenen MV3 eklentisinde `host_permissions` etkili oldu.
   Kanıt kesin — arka plan sayfasının kökeni `moz-extension://`, `http://127.0.0.1`'e attığı
   `fetch` çapraz kökenlidir ve host izni olmadan geçemezdi; **iki adayda da geçti**.
   İçerik betiği de `http://127.0.0.1/*` eşleşmesine enjekte oldu.
2. **Ürünün manifest sürümü kararı (AÇIK SORU 1) hâlâ açık — çünkü ikisi de ölçüldü ve
   ikisi de tuttu.** Varsayılan kural gereği **MV2** öneriliyor: Firefox MV2'yi desteklemeye
   devam ediyor, kalıcı arka plan (`"persistent": true`) sayaç için basit, araç zinciri MV2'de
   olgun. **Bu turda karar verilmedi** — madde 3'ün turuna girdi olarak bırakıldı.
3. **LibreWolf bu makinede kurulu değil** (`Program Files\**\librewolf.exe` → sonuç yok,
   `AppData\Local\LibreWolf` → yok). Madde 3'ün *"LibreWolf'a kurulur"* kanıtı bu makinede
   **bugün üretilemez**. Bu turda dokunulmadı (G20); kararı madde 3'ün turu verecek.
   Not: seçilen yol LibreWolf'a da uygulanabilir — `playwright-webextext` bir `BrowserType`
   sarar, `web-ext` ise `firefox: '<ikili yolu>'` ile herhangi bir Gecko ikilisine yönlenir.
4. **Aynı iskele madde 3'e devroluyor.** `<video>`'lu yerel sahte sayfa madde 3'ün ①
   kanıtının tam olarak istediği şeydir; işaret sunucusu + tek kullanımlık profil + sert
   sayaç düzeneği olduğu gibi kullanılabilir.

---

## Bu turda ölçülemeyenler

| Ne | Neden |
|---|---|
| Dördüncü yol (geckodriver/Marionette) | **Denenmedi** — ön koşulu (üç adayın da tutmaması) doğmadı. Ölçüm yok, iddia da yok. |
| Doğrudan RDP (`--start-debugger-server` + `addonsActor`) | **Denenmedi** — A ve B zaten bu mekanizmayı içeriden kullanıyor ve tuttu; ayrıca ölçmek yeni bilgi üretmezdi. |
| Gerçek Mozilla Firefox ikilisi (`@puppeteer/browsers`) | **İndirilmedi** — Playwright'ın Firefox'u üç adayın da ihtiyacını karşıladı, `web-ext` onu reddetmedi. |
| LibreWolf üzerinde davranış | Makinede LibreWolf **yok**; ölçülemez. Madde 3'ün konusu. |

---

## Süreç hijyeni (G23)

Tur bitiminde kontrol edildi: **firefox veya geckodriver artık süreci yok.**
Ayakta kalan tek `node` süreci `D:\Yönetim\ORKESTRA\sunucu.mjs --port 4318` (ORKESTRA panel
sunucusu, 13/08 22:10'da başlamış) — **bu turun ürünü değildir, dokunulmadı.**

## Sınırlar — uyuldu

- `C:\Users\kadio\AppData\Roaming\Mozilla` ve `...\LibreWolf`: **ne okundu ne yazıldı.**
  Her koşu kendi tek kullanımlık profiliyle koştu (`os.tmpdir()` altında `mkdtemp`).
- Sistem geneline tarayıcı kurulmadı: `.msi`/`.exe` kurulumu, PATH değişikliği, kayıt defteri
  dokunuşu **yok**. Firefox yalnız Playwright önbelleğine indi.
- `git push` **yapılmadı** (uzak depo yok — madde 5'in işi).
- `D:\Yönetim` yalnız **okundu** (`DERSLER\INDEKS.md`).
