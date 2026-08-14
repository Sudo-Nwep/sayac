# Eklenti — madde 3 raporu

> **Hedef 1 · madde 3** (`HEDEF.md:76-85`). `mantik/sayac.mjs` çekirdeğini kullanan gerçek bir
> Firefox eklentisi; `<video>` oynat/duraklat olayları yakalanır ve **sekme başına ayrı** bir
> sayaç örneğine işlenir. Doğruluk **rakamla** kanıtlanır.
> **Tarih:** 14/08/2026 · **Node** v26.5.0 · **Playwright** 1.62.1 · **Firefox** 153.0
> **Yeni bağımlılık: YOK.**

---

## Sonuç — tek cümle

`eklenti/` yazıldı; **on hücrenin sekizi YEŞİL**, ikisi **"ölçülemedi"** (Y4 arka plan sekmesi ·
Y10 LibreWolf) — hiçbiri KIRMIZI değil. `npm run eklenti:test` → **çıkış 0**.
Madde 2 kırılmadı: `npm test` → `KALAN: 0` çıkış 0 · `npm run mutasyon` → **7/7** çıkış 0.

**Seçilen test yolu uyuşması:** `KONTROL_DOSYASI.md:33` `playwright-webextext` diyor, bu tur onu
kullandı — **uyuşmazlık yok.** (Y10 bilerek yedek yolu, Aday B `web-ext`'i kullanır; gerekçe 7b'de.)

---

## Mimari — kim damgalar, durum nerede yaşar

| Soru | Cevap | Dosya |
|---|---|---|
| Sayaç mantığı nerede? | `mantik/sayac.mjs` — **tek doğruluk kaynağı**. Eklentinin sürümü ondan **üretilir**. | `eklenti/uret.mjs` |
| Zaman damgasını kim basar? | **Yalnız arka plan.** İçerik betiği "ne oldu" der, "ne zaman" demez. | `eklenti/arkaplan.js:88` |
| Durum nerede yaşar? | Arka planın belleğinde, `Map<sekmeId, durum>`. | `eklenti/arkaplan.js:13` |
| Sekme başına ayrılma? | `sender.tab.id` anahtarı; her sekme kendi donmuş durum nesnesi. | `eklenti/arkaplan.js:81-86` |
| Gece yarısını kim üretir? | Eklenti — `gunNobeti()`, saniyede bir. | `eklenti/arkaplan.js:41` |
| Canlı okuma? | `ozet(durum, an)` — son olaydan bu yana geçen süre **dâhil**. | `eklenti/arkaplan.js:118` |

**Neden içerik betiği damga basmaz:** iki ayrı saat çakışırsa `uygula()` `RangeError` fırlatır
(`mantik/sayac.mjs:137-141`). Y5'teki saat kaydırması bunu doğrudan zorlar; tek saat sayesinde
sorun çıkmadı (`kelepceSayisi: 0`).

**Olay yakalama — yakalama fazı, `MutationObserver` değil:**
```js
document.addEventListener("play",  h, true);   // eklenti/icerik.js:17
document.addEventListener("pause", h, true);   // eklenti/icerik.js:24
```
Medya olayları kabarmaz ama yakalama fazı `document`'a uğrar → **tek dinleyici sonradan
yaratılan `<video>` öğelerini de yakalar.** Y3 bunu ölçtü: aynı sekmede yaratılan ikinci
`<video>` (`v2`) sorunsuz yakalandı, `MutationObserver` yedeğine **düşülmedi**.

**`pagehide`/`beforeunload` → `duraklat`** (`eklenti/icerik.js:34-39`): sayfa giderken hiçbir
`pause` olayı gelmez; bu satır olmadan sekme sonsuza dek İZLENİYOR sayılırdı.

---

## Ürün sınırları — manifest kararları ve ölçümleri

```json
"permissions": YOK · "host_permissions": YOK
"content_scripts": [{ "matches": ["*://*.youtube.com/*"] }]
"background": { "scripts": ["sayac.js", "arkaplan.js"], "persistent": true }
```

| Karar | Gerekçe | Ölçüm |
|---|---|---|
| **Hiçbir host izni yok** | Ürün hiçbir ağ çağrısı yapmaz (`SAYAC_TEKLIF.md:44`). `runtime.sendMessage` ve `tabs.onRemoved` izin gerektirmez. | İzinsiz manifestle **Y1–Y7 geçti** |
| `matches` yalnız YouTube | `SAYAC_TEKLIF.md:42` | `127.0.0.1` **ürüne girmedi**, test kopyasına yamalandı |
| `persistent: true` | Sayaç durumu arka planın belleğinde yaşar | 7a'da tartışıldı |
| `gecko.id` | Geçici yükleme kimliği sabit kalsın | tüm hücrelerde yüklendi |

**Ürün kodu ile test kodu karışmadı.** Sonda, port, saat kayması ve `127.0.0.1` eşleşmesi
yalnız **geçici kopyaya** enjekte edilir (`test-yolu/ortak/eklenti-testi.mjs`). Kaynak klasör
`eklenti/` kirletilmedi.

---

## Üretim — tek doğruluk kaynağı korundu

`eklenti/sayac.js`, `mantik/sayac.mjs`'ten üretilir: satır başındaki **7** `export ` öneki
soyulur (MV2 `background.scripts` klasik betik yükler), başka hiçbir şey değişmez.

```
kaynak    : mantik/sayac.mjs · SHA-256 ad848d21f22916de80c2b5ab9f6c17a8872b93e83070860487438fed12ec38ac (soyulan 7 önek)
beklenen  : eklenti/sayac.js · SHA-256 f927876e421a225a6c3deaebb4c90d9587ef7c13948c134aab21ba68512c8f77
diskteki  : eklenti/sayac.js · SHA-256 f927876e421a225a6c3deaebb4c90d9587ef7c13948c134aab21ba68512c8f77
SENKRON   : EVET — iki SHA-256 birebir aynı
eklenti:kontrol CIKIS=0
```

**Kontrolün kendisi bozularak sınandı** (G22 — kontrol gerçekten ölçüyor mu?):

```
SHA-256 önce : f927876e421a225a6c3deaebb4c90d9587ef7c13948c134aab21ba68512c8f77
bozuldu      : "İZLENİYOR" → "IZLENİYOR" (tek bayt)
kontrol çıkışı: 1 · beklenen 1 → TAMAM
   diskteki  : eklenti/sayac.js · SHA-256 4e1e5304f84f64ba79bd5fd5192e35dbe8d2b29c8150061fe65df9a82b439e68
   SENKRON   : HAYIR — sürüklenme var
SHA-256 sonra: f927876e421a225a6c3deaebb4c90d9587ef7c13948c134aab21ba68512c8f77
geri alındı  : EVET (birebir aynı)
geri alma sonrası kontrol çıkışı: 0 (0 beklenir)
SONUÇ: ✓ kontrol gerçekten ölçüyor
```

> **Not — satır sonu:** karşılaştırma `\r\n` → `\n` normalizasyonundan sonra yapılır, çünkü git
> checkout dosyayı CRLF'e çevirebilir. İçerik farkı yine yakalanır — yukarıdaki tek baytlık
> bozma bunu ölçtü.

---

## Ölçüm protokolü — TOLERANS koşumdan ÖNCE yazıldı

`test-yolu/ortak/hucre.mjs:23-25`, **koşumdan önce sabit, ölçüm görüldükten sonra
gevşetilmedi**:

- `TOLERANS_MS = 250` · `FAZ_MS = 2500` · `YERLESME_MS = 400`
- Ölçüm **iki anlık görüntü arasındaki farkla** yapılır, nominal uykuyla değil:
  `Δan = anMs₂ − anMs₁` (arka planın **kendi** saatinden), `Δkova = kova₂ − kova₁`.
- İlerlemesi beklenen kova: `|Δkova − Δan| ≤ 250 ms` · İlerlememesi beklenen: **tam 0**.
- Toplam invaryantı: `Σ Δkova` ile `Δan` farkı ≤ 250 ms.

**İKİ BAĞIMSIZ CETVEL (K09 — sunucu testi istemciyi kanıtlamaz):**
- **Cetvel A (ürün):** sondadan gelen anlık görüntü — `toplam`, `durumAdi`, `sekmeId`, `anMs`.
- **Cetvel B (sayfa gerçeği):** `page.evaluate` → `video.paused`, `currentTime`, `readyState`,
  `visibilityState`, `data-sayac-icerik`.
- `sekmeId` ve `arkaPlanBaslangicMs` **yalnızca arka planın bilebileceği** değerlerdir; sondanın
  raporunda görünmeleri zincirin arka plan ucunun gerçekten koştuğunun kanıtıdır.

**Yükleme yarışı kapatıldı:** `playwright-webextext` eklentiyi `launchPersistentContext`
çözüldükten **sonra** yükler (`firefox_browser.js:47-53`). Her hücre ölçüme başlamadan önce
`data-sayac-icerik="1"` **ve** ilk anlık görüntüyü bekler (20 sn); gelmezse hücre
**"ölçülemedi"** yazılır — **0 rakamı başarı sayılmaz** (`hucre.mjs:97-115`).

---

## 📊 ON HÜCRE — boş hücre yok

| # | Ne ölçer | Durum | Rakam | Kanıt |
|---|---|---|---|---|
| **Y1** | yerel uçtan uca (MV2) | **YEŞİL** | 2795/2795 · 2524/2524 · 2776/2776 (sapma **0**) | `eklenti-Y1.log` |
| **Y2** | iki sekme aynı anda | **YEŞİL** | sekmeId 1↔2; A izleniyor 7231, B izleniyor **0** | `eklenti-Y2.log` |
| **Y3** | aynı sekmede ikinci video | **YEŞİL** | izleniyor 3229 → **6476** (sıfırlanmadı) | `eklenti-Y3.log` |
| **Y4** | arka plandaki sekme | **ölçülemedi** | ölçülen `visibilityState="visible"` (headless **ve** headed) | `eklenti-Y4.log` |
| **Y5** | gece yarısı | **YEŞİL** | `gunBasiMs` +86.400.000; {3231,26,0} → **{133,0,0}** | `eklenti-Y5.log` |
| **Y6** | mola (üçüncü kova) | **YEŞİL** | Δmola 2753/2753, diğer ikisi **tam 0**, durum `MOLA` | `eklenti-Y6.log` |
| **Y7** | Y1'in aynısı, **MV3** | **YEŞİL** | 2753/2753 · 2752/2752 · 2752/2752 | `eklenti-Y7.log` |
| **Y8** | host izni karşıt deneyi | **YEŞİL** | 8 hücre dolu; tur 001'in iddiası **çürütüldü** | `eklenti-Y8.log` |
| **Y9** | gerçek YouTube | **YEŞİL** | 2806/2806 · 2755/2755 (gerçek video) | `eklenti-Y9.log` |
| **Y10** | LibreWolf | **ölçülemedi** | ikili indi/açıldı, RDP `ECONNREFUSED` | `eklenti-Y10.log` |

**ZORUNLU KIRMIZI: 0** · **ZORUNLU ÖLÇÜLEMEDİ: 1 (Y4)** · `npm run eklenti:test` → **çıkış 0**.
*(Çıkış kodu yalnız zorunlu KIRMIZI hücrelere bakar; "ölçülemedi" bir başarısızlık değil,
ölçülmüş bir sonuçtur ve turu durdurmaz — `HEDEF.md:146-147`.)*

### Y1 — yerel uçtan uca, iki cetvel yan yana

```
FAZ oynat          Δan=2795 | Δizleniyor= 2795 Δduraklatildi=    0 Δmola=    0 | durum=İZLENİYOR sekme=1
    CETVEL B: {"paused":false,"currentTime":3.285,"readyState":4,"icerikBetigi":"1"}
FAZ duraklat       Δan=2524 | Δizleniyor=    0 Δduraklatildi= 2524 Δmola=    0 | durum=DURAKLATILDI
    CETVEL B: {"paused":true,"currentTime":3.285,"readyState":4,"icerikBetigi":"1"}
FAZ tekrar oynat   Δan=2776 | Δizleniyor= 2776 Δduraklatildi=    0 Δmola=    0 | durum=İZLENİYOR
    CETVEL B: {"paused":false,"currentTime":6.507,"readyState":4,"icerikBetigi":"1"}
```
Her fazda sapma **tam 0**. Cetvel B `paused` değerleri ürünün durumuyla birebir örtüşüyor —
tek uçtan okunan yeşil değil.

### Y2 — sekme başına ayrılık (eşzamanlılık kutusu)

Aynı anda: A oynuyor, B duraklı.

| Sekme | `sekmeId` | Δan | Δizleniyor | Δduraklatildi | Kümülatif toplam |
|---|---|---|---|---|---|
| **A** | **1** | 2754 | **2754** | 0 | `{izleniyor: 7231, duraklatildi: 24, mola: 0}` |
| **B** | **2** | 2754 | **0** | **2754** | `{izleniyor: 0, duraklatildi: 3742, mola: 0}` |

İki farklı `sekmeId`, iki ayrı toplam. A, B'den ~3000 ms önce oynamaya başladığı için
kümülatif `izleniyor` ayrışıyor (7231 ↔ 0). **Karışmıyorlar.**

> **`MANTIK.md:111-113`'ün tahmini TUTTU.** *"Durum nesnesi değişmez ve serileştirilebilir
> olduğu için çoğullama fazladan tek satır yazmadan gelir"* deniyordu. Ölçüm: çoğullama
> `Map<sekmeId, durum>` + `sender.tab.id` ile geldi — **modülde tek satır değişiklik
> gerekmedi**, `mantik/sayac.mjs`'e hiç dokunulmadı (SHA-256 aynı).

### Y3 — yeni video, sayaç sıfırlanmıyor

| | izleniyor | duraklatildi | mola |
|---|---|---|---|
| **ÖNCESİ** (ilk video `v1`) | **3229** | 21 | 0 |
| **SONRASI** (ikinci video `v2`) | **6476** | 27 | 0 |

İkinci video fazı: Δan 2754 → Δizleniyor **2754**. Cetvel B `video: "v2"`, `paused: false`.
Sayaç sıfırlanmadı, **kaldığı yerden devam etti**. Yakalama fazı sonradan yaratılan `<video>`'yu
gördü → `MutationObserver` yedeğine düşülmedi.

### Y4 — arka plandaki sekme · **ÖLÇÜLEMEDİ**

**Ölçülen değer:** `document.visibilityState = "visible"`.
İkinci sekme yaratıldı ve `bringToFront()` çağrıldı; **headless'ta da headed'da da** A sekmesi
kendini `"visible"` görmeye devam etti. Playwright'ın Firefox'unda sekme gerçekten arka plana
alınamadı.

**Kutu boş bırakılmadı — ölçülebilen kısım:** A sekmesi **öne alınmamışken** Δan 2753 →
Δizleniyor **2753**, diğer kovalar tam 0, tolerans sorunu **yok**.
⚠️ **Bu "arka plandaki sekme" kanıtı DEĞİLDİR** ve öyle sayılmadı: `visibilityState` `hidden`
olmadığı sürece tarayıcının arka plan kısıtlamaları devreye girmez, dolayısıyla ölçülen şey
kriterin sorduğu şey değildir (G22 — yanlış soruyu soran kontrol).

**Mimari not (ÖLÇÜLMEDİ, iddia edilmiyor):** sayaçlar olay damgalarıyla ilerler ve okuma anında
`ozet()` ile hesaplanır; `setInterval` yalnız gün dönümünü yakalar. Bu nedenle arka plan
zamanlayıcı kısıtlamasının sayacı etkilememesi **beklenir** — ama bu tur bunu **ölçemedi**.

### Y5 — gece yarısı

| | izleniyor | duraklatildi | mola | `gunBasiMs` | `durumAdi` |
|---|---|---|---|---|---|
| **ÖNCESİ** | **3231** | 26 | 0 | 1786654800000 | İZLENİYOR |
| **SONRASI** | **133** | **0** | **0** | 1786741200000 | İZLENİYOR |

`gunBasiMs` farkı **86.400.000 ms = tam 1 gün**. Üç sayaç da sıfırlandı; video oynamaya devam
ettiği için İZLENİYOR **sıfırdan devam etti** (devir sonrası fazı: Δan 2753 → Δizleniyor 2753).
`kelepceSayisi: 0` — kelepçe hiç devreye girmedi.

**Olayı EKLENTİ üretti:** `gunNobeti()` — `eklenti/arkaplan.js:41`, `setInterval(gunNobeti, 1000)`
`eklenti/arkaplan.js:63`. Test yalnız **arka plan bağlamında** `Date.now`'u 23:59:35'e kaydırdı
(`test-yolu/sonda/sonda-arkaplan.js`); ürün koduna dokunulmadı ve **gerçek 00:00 beklenmedi**.

### Y6 — üçüncü kova (arayüz DEĞİL, API çağrısı)

| Faz | Δan | Δizleniyor | Δduraklatildi | Δmola | durum |
|---|---|---|---|---|---|
| mola öncesi oynuyor | 2754 | **2754** | 0 | 0 | İZLENİYOR |
| **mola açık** | 2753 | **0** | **0** | **2753** | **MOLA** |
| mola kapalı | 2754 | **2754** | 0 | 0 | İZLENİYOR |

`mola-aç`/`mola-kapat` ürünün **mesaj API'sine** gönderildi. Bu turda **hiçbir HTML/CSS
yazılmadı** — açılır pencere ve butonlar madde 4'ün işidir.
**Not:** mola açıkken cetvel B `paused: false` gösteriyor — doğru: MOLA'nın videoyu duraklatması
`SAYAC_TEKLIF.md:50-51` gereği **madde 4'ün** işidir; bu turda `mola-aç` yalnız **kaydedilir**.
> ⚠️ **Madde 4'te ölçüldü:** ürün artık videoyu duraklatıyor; Y6 genişletildi ve
> `video.paused=true` ölçüldü. Bkz. `ARAYUZ.md` → Y6 tablosu.

### Y8 — host izni karşıt deneyi · tur 001'in iddiası ÇÜRÜTÜLDÜ

**Ölçülen:** arka plandaki `fetch` **çözüldü mü** (sunucuya ulaşma **değil**).

| manifest | host izni | ACAO | `fetch` | sunucuya ulaştı |
|---|---|---|---|---|
| MV2 | VAR | VAR | **geçti** | true |
| MV2 | VAR | YOK | **geçti** | true |
| **MV2** | **YOK** | **VAR** | **geçti** | true |
| **MV2** | **YOK** | **YOK** | **düştü** | true |
| MV3 | VAR | VAR | **geçti** | true |
| MV3 | VAR | YOK | **geçti** | true |
| MV3 | YOK | VAR | **geçti** | true |
| **MV3** | **YOK** | **YOK** | **geçti** | true |

Düşen tek hücrenin birebir hatası: `NetworkError when attempting to fetch resource.`

**① `001.result.md:23`'ün *"host_permissions etkili oldu — izin olmadan geçemezdi"* cümlesi
YANLIŞTIR.** MV2 · izin YOK · ACAO VAR hücresinde `fetch` **çözüldü**: `Access-Control-Allow-Origin`
başlığı tek başına çapraz kökenli okumaya yetiyor. Tur 001'in sunucusu o başlığı koyuyordu
(`test-yolu/ortak/sunucu.mjs:77`) → oradaki "E" izin gücünün kanıtı **değildi**.
Ayrıca **her sekiz hücrede de istek sunucuya ULAŞTI** — "ulaştı" sütunu baştan sona `true`;
yani tur 001'in kullandığı kanıt kanalı ayırt edici değil.

**② MV3 satırları izni HİÇ ölçmüyor.** MV3 · izin YOK · ACAO YOK bile **geçti**, çünkü
`playwright-webextext`, `content_scripts[].matches` içindeki kökenleri açılıştan önce profile
**izin olarak yazıyor** (`firefox_extension_preferences.js` · `firefox_browser.js:73-107`).
Tur 001'in MV3 hücresinde ölçülen şey Firefox'un izin modeli değil, **kütüphanenin yaması**ydı.

**③ İznin gerçek etkisi ölçüldü:** ACAO'suz uçta izin VAR → **geçti**, izin YOK → **düştü**.
Host izni CORS'u atlatıyor; ayırt edici hücre budur.

### Y9 — gerçek YouTube duman testi · **GEÇTİ**

Video: `https://www.youtube.com/watch?v=0muHFBSiybw` (uydurulmadı — YouTube'un kendi arama
sonuçlarından ilk bağlantı).

| Faz | Δan | Δizleniyor | Δduraklatildi | Δmola | Cetvel B |
|---|---|---|---|---|---|
| oynuyor | 2806 | **2806** | 0 | 0 | `paused:false, readyState:4, icerikBetigi:"1"` |
| duraklı | 2755 | 0 | **2755** | 0 | `paused:true, readyState:4` |

**Keşif yolu ölçüldü, tahmin edilmedi:** oturumsuz headless Firefox 153'te ana sayfa **0**
`/watch?v=` bağlantısı veriyor (öneri akışı render edilmiyor; gövde 311 KB, 24 bağlantı);
arama sonuçları **6**, kanal sayfası **60** veriyor. Kaynak sırası buna göre düzeltildi.
Bu hücrede **yalnız DOM kanalı** kullanıldı — YouTube kökeninden `127.0.0.1`'e çağrı hem çapraz
kökenli hem karışık içeriktir. **Ürüne veya test kopyasına YouTube host izni EKLENMEDİ.**

### Y10 — LibreWolf · **ÖLÇÜLEMEDİ**

**Yapılabilenler (rakamla):**
- Resmî taşınabilir dağıtım indirildi: `https://dl.librewolf.net/librewolf/153.0.4-1/librewolf-153.0.4-1-windows-x86_64-portable.zip`
  → **HTTP 200**, **162.887.896 bayt**.
- Açıldı, ikili bulundu: `…\librewolf-153.0.4-1\LibreWolf\librewolf.exe` (512.040 bayt).
- **LibreWolf 153.0.4 = Firefox 153 tabanlı** — Playwright'ın Firefox'uyla aynı ana sürüm.

**Takıldığı yer — birebir hata:** `Error: connect ECONNREFUSED 127.0.0.1:57877`
(web-ext'in RDP bağlantısı). **Kök sebep artefaktta bulundu:**

| Katman | Kanıt | Yapılan |
|---|---|---|
| Uzak hata ayıklayıcı kapalı | `librewolf.cfg:547` → `pref("devtools.debugger.remote-enabled", false);` | profil preflerine `true` yazıldı + `librewolf.overrides.cfg` |
| Override **profil** dizininden okunur | `librewolf.cfg:759-763` → *"Moved to patches/profile-directory.patch"* | ilk deneme kurulum dizinine yazmıştı → düzeltildi, profile yazıldı |
| HTTPS-only zorlaması | `distribution/policies.json` → `"HttpsOnlyMode": "enabled"` | geçici kopyada `"disabled"` yapıldı, `WebsiteFilter` silindi |

Üç katman da adreslendi; RDP yine bağlantı kabul etmedi (**4 deneme**). Bütçe (G24) doldu.

**⛔ *"LibreWolf'a kurulabilir"* iddiası KANITSIZ YAZILMIYOR** (`HEDEF.md:146-147`).
**Seçilen yolun LibreWolf'a uygulanması:**
- **Aday A (`playwright-webextext`) UYGULANAMAZ** — Playwright'ın Firefox'u Juggler protokollü
  **yamalı** bir yapıdır; stok bir Gecko ikilisi o yolla sürülemez.
- **Aday B (`web-ext` Node API) uygulanabilir yoldur** — `firefox: "<librewolf yolu>"` ile
  herhangi bir Gecko ikilisine yönlenir (`TEST_YOLU.md:126-128`). Bu turda RDP engeli aşılamadı.
- **Sıradaki somut adım (madde 5'e girdi):** RDP'siz yol — eklentiyi imzalatıp (AMO) ya da
  `xpinstall.signatures.required=false` ile `<profil>\extensions\` üzerinden kurmak; ya da
  LibreWolf'un `about:debugging` arayüzünden **elle** yüklemek. Hiçbiri bu turda ölçülmedi.

**Sistem geneline kurulum YAPILMADI:** `.msi`/`.exe` kurucu çalıştırılmadı, PATH değişmedi,
kayıt defterine dokunulmadı. Zip `os.tmpdir()` altına açıldı.

> ### ⚠️ Tur 001'in bir ölçümü ÇÜRÜDÜ — LibreWolf bu makinede KURULU
>
> `TEST_YOLU.md:286-290` (tur 001) *"LibreWolf KURULU DEĞİL"* diye kaydetmişti.
> **Bu tur bunun aksini ölçtü:** `Test-Path 'C:\Program Files\LibreWolf\librewolf.exe'` → **True**,
> ve tur sonu süreç kontrolünde o yoldan çalışan **10 LibreWolf süreci** bulundu
> (başlangıç 14/08 **00:40:42** — bu turun LibreWolf koşularından ~1.5 saat **önce**).
> Yani LibreWolf kurulu **ve Mustafa tarafından kullanılıyor**.
>
> **Kurulu ikiliye karşı Y10 tekrar KOŞULMADI — gerekçe:**
> ⑴ RDP engeli **yapı düzeyindedir** (`librewolf.cfg:547` ikilinin yanında gelir), taşınabilir
> kopyada aşılamayan engel kurulu kopyada da aynıdır — aynı hata 5. kez beklenirdi;
> ⑵ **daha önemlisi:** Mustafa'nın LibreWolf'u **o anda açıktı**. Gecko ailesinde ikinci bir
> örneği başlatmak, `-no-remote` garanti değilse çalışan örneğe **iliştirebilir** ve
> **Mustafa'nın oturum açmış profilinde** sekme açardı — `HEDEF.md:121-123`'ün açık yasağı.
> Riski almadım.
>
> **Madde 5'e girdi:** teslim hedefi LibreWolf ve **kurulu**. Kurulum kanıtı, tarayıcı kapalıyken
> ve **temiz tek kullanımlık profille**, RDP'siz bir yolla (imzalı XPI ya da `about:debugging`
> üzerinden elle) üretilebilir. Hiçbiri bu turda ölçülmedi.

---

## Dört açık karar

### 7a — MV2 mi MV3 mü? → **MV2**

**Ölçüm ayağı:** aynı senaryo iki manifestle koşuldu, ikisi de geçti.

| | Δan / Δizleniyor | Δan / Δduraklatildi | Δan / Δizleniyor |
|---|---|---|---|
| **Y1 (MV2)** | 2795 / **2795** | 2524 / **2524** | 2776 / **2776** |
| **Y7 (MV3)** | 2753 / **2753** | 2752 / **2752** | 2752 / **2752** |

**Mimari ayak (kararı bu veriyor):** MV2'de `"persistent": true` arka planı ayakta tutar
(`eklenti/manifest.json:12-15`). MV3'te bu alan **yoktur** ve sayaç durumu bellekte yaşadığı
için olay sayfasının boşaltılması **ölçülmemiş bir risktir** — MV2 bu riski hiç doğurmaz.
`TEST_YOLU.md:282-285` de MV2 öneriyordu. **MV3 ölçüldü ve çalıştı; üstünlüğü iddia edilmiyor.**

### 7b — LibreWolf → **ölçülemedi** (yukarıda, tam teşhis zinciriyle)

### 7c — `host_permissions` → **ürün hiç istemiyor, ve tur 001'in iddiası çürütüldü**

**Ayak ①:** ürün manifestinde `permissions` da `host_permissions` da **yok**; izinsiz manifestle
**Y1–Y7 geçti** (rakamlar yukarıda). *Gerekli olmadığı ölçüldü.*
**Ayak ②:** Y8'in 8 hücresi `001.result.md:23`'ün cümlesini **çürüttü** — gerekçe Y8 bölümünde.
Cümle savunulmadı; ölçüm ne dediyse o yazıldı.

### 7d — Gece yarısı → **eklenti kendi üretiyor**

Rakamlar Y5 bölümünde. Üreten fonksiyon `gunNobeti()` — `eklenti/arkaplan.js:41`;
nöbet `setInterval(gunNobeti, 1000)` — `eklenti/arkaplan.js:63`.
Nöbet **her mesajdan önce de** koşar (`arkaplan.js:88`): sıra kritiktir, yoksa gece yarısından
sonra damgalanan bir olay `olay.t < durum.t` ile `RangeError` fırlatırdı.

---

## Mesaj API'si — madde 4 bunu kullanacak

| İstek | Yanıt |
|---|---|
| `{tur:"olay", olay:<altı addan biri>}` | `{tamam, sekmeId, durumAdi, anMs}` · tanınmayan ad → `{hata:"bilinmeyen olay: …"}` |
| `{tur:"durum-iste"}` | `{sekmeId, durumAdi, toplam:{izleniyor,duraklatildi,mola}, anMs, arkaPlanBaslangicMs, gunBasiMs, kelepceSayisi, sekmeSayisi}` |
| bilinmeyen `tur` | `{hata:"bilinmeyen istek: …"}` |

`toplam` **canlı** okunur (`ozet()`); son olaydan bu yana geçen süre dâhildir.
Sekme kimliği `sender.tab.id`'den gelir; açılır pencerede yoksa `msg.sekmeId` verilir.
⚠️ **Bu cümle madde 4'te ölçüldü ve SINIRLANDIRILDI:** `sender.tab` varsa `msg.sekmeId`
**hiç okunmaz** (`999999` gönderildi, `1` döndü). `msg.sekmeId` yolu yalnız gerçek araç
çubuğu panelinde geçerli olabilir — o bağlam **ölçülemedi**.
Bkz. `ARAYUZ.md` → Sekme kimliği zinciri.
**Toplamlar ham milisaniyedir** — saat:dakika biçimlendirmesi madde 4'ün işidir.

---

## Koşulan komutlar ve çıktıları — birebir

```
npm run eklenti:kontrol        → CIKIS=0   (iki SHA-256 birebir aynı, yukarıda)
node eklenti/uret.mjs --kanit  → CIKIS=0   (kontrolün kendisi bozularak sınandı)
npm run eklenti:test           → EKLENTI TEST CIKIS=0
npm test                       → GECEN: 20 · KALAN: 0 · TOPLAM: 20      CIKIS=0
npm run mutasyon               → SONUÇ: 7/7 bozma beklendiği gibi yakalandı   CIKIS=0
```

### Kanıtın depoya girdiği — ölçüldü (`.gitignore` tuzağının üçüncü turu)

`.gitignore:30` `*.log` hâlâ genel kural; muafiyetler tek yıldızlı ve `/` geçmez.
Bu yüzden kanıt **alt klasör açılmadan**, `test-yolu/kanit/` içine `eklenti-` önekiyle **düz**
yazıldı — mevcut `!test-yolu/kanit/*.log` kuralı kapsıyor, `.gitignore` **değişmedi**.

```
--- check-ignore (bayraksiz: YALNIZCA yoksayilanlari listeler) ---
[cikti yukarida BOS ise yoksayilmiyor] cikis=1

--- git ls-files test-yolu/kanit (yeni dosyalar) ---
test-yolu/kanit/eklenti-Y1.log … eklenti-Y10.log · eklenti-rapor.json   (22 dosya)
```

---

## Bu turda ölçülemeyenler

| Ne | Neden | Nereye ait |
|---|---|---|
| **Arka plandaki sekme (Y4)** | `visibilityState` `hidden` yapılamadı — headless **ve** headed'da `"visible"` ölçüldü | kriter 5 · madde 4/5 turu tekrar deneyebilir |
| **LibreWolf'a kurulum (Y10)** | RDP `ECONNREFUSED`; üç sertleştirme katmanı adreslendi, aşılamadı | 7b · madde 5 |
| **Tarayıcı yeniden başlarsa sayaçlar** | Durum **bellekte** yaşar, yeniden başlatmada **kaybolur**. Depolama bu turda eklenmedi (`storage` izni yok, G19/G20). | madde 4/5 kararı |
| **MV3'te `tabs.onRemoved` ve mesajlaşma farkı** | Y7 yalnız Y1'in senaryosunu koştu; MV3'te ek davranış **iddia edilmiyor** | 7a |
| **MOLA'nın videoyu duraklatması** | `SAYAC_TEKLIF.md:50-51` — **madde 4'ün** işi | **madde 4'te ÖLÇÜLDÜ** → `ARAYUZ.md` Y6 |
| **Arayüz (açılır pencere, iki buton)** | Bu turun dışında (`HEDEF.md` madde 4) | madde 4 |

**Kapsam dışı kalan davranışlar (kural yazılmadı, not düşüldü):**
- Aynı sekmede iki `<video>` aynı anda oynarsa: `SAYAC_TEKLIF.md:106` *"aynı anda tek video"*
  diyor; modül tek bayrak tutar, ikinci `oynat` etkisizdir (`mantik/senaryolar.json` `S14`).
- YouTube'da `<video>` bulunmayan sayfada (ana sayfa, arama): hiçbir olay gönderilmez, sekmenin
  durumu **DURAKLATILDI** olarak birikir — `SAYAC_TEKLIF.md:20-21` ile uyumlu.
- Sekme kapanınca birikmiş süre **silinir** (`tabs.onRemoved`) — geçmiş gün/oturum kaydı
  kapsam dışı (`SAYAC_TEKLIF.md:81`).

## Süreç hijyeni (G23)

Tur bitiminde kontrol edildi. **Bu turun başlattığı hiçbir süreç ayakta değil:**
`firefox.exe` yok · `geckodriver.exe` yok · geçici kopyadan (`…\Temp\sayac-librewolf-*\…`)
çalışan `librewolf.exe` yok.

**Ayakta bulunan ve DOKUNULMAYAN süreçler — bu turun ürünü değildir:**

| Süreç | Neden dokunulmadı |
|---|---|
| 10 × `C:\Program Files\LibreWolf\librewolf.exe` | **Mustafa'nın kendi tarayıcısı.** Başlangıç 00:40:42 — bu turun LibreWolf koşularından ~1.5 saat önce. Yolu benim geçici kopyam değil. Öldürmek kullanıcının açık tarayıcısını kapatırdı. |
| `node … ORKESTRA\sunucu.mjs --port 4318` | ORKESTRA panel sunucusu |
| `node … ORKESTRA/defter-denetim.mjs` | ORKESTRA defter denetimi |

⚠️ **Öldürmeden önce yol doğrulandı.** İlk bakışta bu 10 süreç Y10'un artığı sanılabilirdi;
`ExecutablePath` ve `StartTime` ölçülmeden kapatılsaydı kullanıcının tarayıcısı kapanacaktı.

## Donmuş dosyalar

`mantik/*` ve madde 1'in dosyalarının **hiçbirine yazılmadı**; hepsi okundu ve içeri aktarıldı
(`eklenti-hazirla.mjs`'ten `gecici`/`sil`). `mantik/sayac.mjs` SHA-256 tur başındaki değerle
aynı: `ad848d21f22916de80c2b5ab9f6c17a8872b93e83070860487438fed12ec38ac`. **İstisna yok.**
