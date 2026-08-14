# Arayüz — madde 4 raporu

> **Hedef 1 · madde 4** (`HEDEF.md:87-95`). Açılır pencerede üç sayaç, MOLA ve
> DUR/DEVAM ET butonları, Türkçe metinler; MOLA'ya basınca oynayan video gerçekten
> duraklatılır; DUR'a basınca hiçbir sayaç işlemez.
> **Tarih:** 14/08/2026 · **Node** v26.5.0 · **Playwright** 1.62.1 · **Firefox** 153.0
> **Yeni bağımlılık: YOK.**

---

## Sonuç — tek cümle

Arayüz **yazıldı ve yükleniyor**; Türkçe metinler, manifest bildirimi, biçimlendirici ve
ürünün bozulma kelepçesi **rakamla doğrulandı**; MOLA'nın üç durumu, videoyu duraklatması ve
DUR/DEVAM ET'in üç durumu **mesaj API'si yolundan ölçüldü** (Y6, sapma tam 0) — ama
**butonlara Playwright ile tıklanamadığı için bu üç kutunun ARAYÜZDEN ölçümü "ölçülemedi"**,
dört ayrı yol birebir hata metinleriyle kayıtlı.

---

## ⚠️ Bu turun en önemli ölçümü — sekme kimliği zinciri

> Bu bölüm turun **ret sebebini** kapatır: *"pencere hedef sekmeyi kendiliğinden buluyor"*
> cümlesi **yazılmamıştır**, çünkü ölçüm onu desteklemiyor.

**16a — karşıt deney (WAR iframe bağlamı).** Arka plana bilerek var olmayan iki kimlik
gönderildi; yanıtın `sekmeId`'si okundu:

| gönderilen | dönen | eşit mi | hayaletin `toplam.izleniyor` | gerçek sekmenin |
|---|---|---|---|---|
| `999999` | **1** | **hayır** | 1807 | 2452 (`sekmeId=1`) |
| `888888` | **1** | **hayır** | 1808 | — |

**GÖLGELEME VAR.** `arkaplan.js:73-78` önceliği (`sender.tab.id` varsa `msg.sekmeId`
**hiç okunmaz**) ölçülerek doğrulandı. Hayalet kimliklerin `toplam`'ı sıfır değil — çünkü
hayalet için yeni durum yaratılmadı, **gerçek sekmenin** durumu döndü.

**16b — üç kimlik yan yana:** `pencereHedef=yok` · `tabs.query → yok` · `sonda sekmeId=1`.

**Neden `yok`:** WAR iframe bağlamında **`API.tabs` UNDEFINED'dır.** Birebir ölçüm:
```
tabsTipi=undefined
sorguHata="can't access property \"query\", API.tabs is undefined"
getCurrent="hata:can't access property \"getCurrent\", API.tabs is undefined"
```
Yani o bağlamda pencere kimliği **çözemez bile**; ölçülemeyen şey ürünün mantığı değil,
bağlamın API yüzeyidir.

**16c — pozitif kontrol (deneyin ayırt ediciliği, K05).** Aynı karşıt deney pencerenin
**kendi sekmesinde** tekrarlandı: `999999 → 2` (**gönderilenden farklı**), `getCurrent=2`,
`sorguId=2`. **Deney ayırt edicidir** — iframe'deki `999999→1` sonucu bir düzenek kusuru değil,
gerçek gölgelemedir.

**16d — gerçek araç çubuğu paneli:** `browserAction.openPopup()` iframe bağlamından
çağrılamadı (`API.browserAction` de undefined; ölçülen dönüş `donus:null`), panel bağlamından
rapor düşmedi. **ÖLÇÜLEMEDİ.**

### 🔴 Y16 kararı — Y16 karar tablosundan seçildi

> **ÖLÇÜLEMEDİ — iki katman birden:** ⑴ `arkaplan.js:73-78` önceliği `msg.sekmeId`'yi
> gölgeliyor (gönderilen `999999` → dönen `1`); ⑵ WAR iframe bağlamında `API.tabs`
> **UNDEFINED** olduğu için pencere kimlik **bile** çözemiyor ve ürünün kelepçesi devreye
> giriyor. Ölçülen: `tabs.query → yok`, `sonda → 1`.
> **Pencerenin kimlik çözümü bu bağlamda SINANAMAZ.**
> Y11–Y13 bu yüzden buton ve sayaç **davranışını** ölçer, **kimlik çözümünü ölçmez.**

**Bir kez canlı bağlam yakalandı ve orada da gölgeleme görüldü.** Pencere kendi sekmesinde
canlıyken tek bir koşuda şu ölçüldü:
```
PENCERE CANLI · pencereHedef=1 · bgSekmeId=3 · getCurrent=3 sorguId=1
```
Pencere **1** numaralı sekmeyi hedefledi, arka plan **3** numaralı sekmeyi yanıtladı.
`EKLENTI.md:380`'in *"açılır pencerede yoksa `msg.sekmeId` verilir"* cümlesi bu ölçümle
**sınırlandırılmalıdır**: `msg.sekmeId` yalnızca `sender.tab`'in **bulunmadığı** bağlamda
(gerçek araç çubuğu paneli) okunur — ve o bağlam bu turda **ölçülemedi**.

---

## Ürün — ne eklendi

| Dosya | Ne | Satır |
|---|---|---|
| `eklenti/pencere.html` | Açılır pencere; sabit kimlikler, satır içi betik **yok** (CSP) | yeni |
| `eklenti/pencere.js` | Hedef sekme çözümü + yoklama + iki buton; **hiçbir süre aritmetiği yok** | yeni |
| `eklenti/bicim.js` | `sureBicim(ms)` → `"S:DD:SS"`; `document`/`window`'a dokunmaz | yeni |
| `eklenti/manifest.json` | **Tek** ekleme: `browser_action.default_popup` + `default_title` | +4 |
| `eklenti/icerik.js` | `runtime.connect` portu → `video-duraklat` gelince `v.pause()` | +25 |
| `eklenti/arkaplan.js` | `kanallar` haritası · `onConnect` · MOLA'da porta mesaj · `onRemoved`'da temizlik | +30 |

**`permissions` ve `host_permissions` hâlâ YOK.** `default_icon` **yazılmadı** (olmayan
dosyaya atıf yükleme hatası verirdi). MV3 varyantında `browser_action` → `action` çevrimi
test kopyasında yapılır; çevrilmezse Y7 düşerdi.

**Sonsuz döngü yok, ölçüldü:** `pause()` → tarayıcı `pause` olayı üretir → arka plana
`duraklat` gider → durum hâlâ MOLA → ikinci `video-duraklat` gelir → `v.paused` zaten `true`
→ `pause()` çağrılmaz → yeni olay doğmaz. **İdempotent.**

---

## 📊 HÜCRE TABLOSU — boş hücre yok

| # | Ne ölçer | Durum | Rakam / sebep |
|---|---|---|---|
| **Y15** | `sureBicim` doğruluk tablosu (tarayıcısız, `node:vm`) | **YEŞİL** | **13/13**, çıkış 0 |
| **Y14** | izin bütçesi — karşıt deney | **YEŞİL** | izinsizken `sorguId=2`; izinli ile **birebir aynı** |
| **Y6** | MOLA + DUR/DEVAM ET **davranışı** (mesaj API'si) | **YEŞİL** | 5 faz, **sapma tam 0** |
| **Y1** | `browser_action` eklendikten sonra eklenti hâlâ yükleniyor mu | **YEŞİL** | 2795/2795 · 2524/2524 · 2776/2776 |
| **Y7** | MV3 varyantı (`action` çevrimi) | **YEŞİL** | 2753/2753 · 2752/2752 · 2752/2752 |
| **Y11** | pencere yüklendi · Türkçe dizeler · manifest · kelepçe | **kısmen ölçüldü** | **9/9 dize birebir**; iki cetvel örtüşmesi **ölçülemedi** |
| **Y12** | MOLA butonunun üç durumu (arayüzden) | **ölçülemedi** | pencere sekme **1**'i hedefliyor, arka plan sekme **3** için yanıt veriyor |
| **Y13** | DUR/DEVAM ET'in üç durumu (arayüzden) | **ölçülemedi** | aynı kapı + kelepçe (`getCurrent=3 sorguId=1`) |
| **Y16** | sekme kimliği zinciri | **ölçülemedi** | iki katman, yukarıda |
| **Y10** | LibreWolf | **atlandı** | aynı RDP hatası 4 kez alındı; 5. kez durma eşiği (`HEDEF.md:156`) — `005`'in işi |

**ZORUNLU KIRMIZI: 0.** `npm run eklenti:test` → **çıkış 0**.

---

## Y11 — ölçülenler (kriter 1 · 6)

**On bir Türkçe dizeden dokuzu pencerenin KENDİ DOM'undan okundu, BİREBİR eşit:**

| alan | beklenen | okunan | ✓ |
|---|---|---|---|
| `#baslik` | `Sayaç` | `Sayaç` | ✓ |
| `#etiket-izleniyor` | `İzleniyor` | `İzleniyor` | ✓ |
| `#etiket-duraklatildi` | `Duraklatıldı` | `Duraklatıldı` | ✓ |
| `#etiket-mola` | `Mola` | `Mola` | ✓ |
| `#etiket-durum` | `Durum:` | `Durum:` | ✓ |
| `#btn-mola` | `MOLA` | `MOLA` | ✓ |
| `#btn-ana` | `DUR` | `DUR` | ✓ |
| `#uyari` (kelepçe hâli) | `Hedef sekme belirlenemedi.` | `Hedef sekme belirlenemedi.` | ✓ |
| manifest `default_title` | `Sayaç` | `Sayaç` | ✓ |

Kalan iki dize — `MOLAYI BİTİR` ve `DEVAM ET` — yalnız buton tıklandıktan sonra görünür;
tıklanamadığı için **ölçülemedi**. (`Y6`'da aynı durum geçişleri **davranış olarak** ölçüldü.)

**Manifest bildirimi, pencerenin kendi içinden:**
`default_popup="moz-extension://…/pencere.html"` (Firefox mutlak adrese çözüyor) ·
`default_title="Sayaç"` → tarayıcı bildirimi gerçekten ayrıştırdı.

**Ürünün bozulma kelepçesi ÇALIŞTI** — sessizce yanlış sekmeye bakmadı:
```
#uyari="Hedef sekme belirlenemedi." · sayaçlar=["0:00:00","0:00:00","0:00:00"]
sebep (ölçüldü): can't access property "query", API.tabs is undefined
```
Bu, ürünün kendi savunmasıdır (test kancası değil) ve **kırmızıya dönebilir** bir kutudur:
uyarı gelmeseydi ya da sayaçlar sıfırdan farklı olsaydı hücre kırmızı yazılırdı.

---

## Y6 — MOLA ≠ KAPALI, aynı tabloda (kriter 3 · 4 · 5, DAVRANIŞ ölçümü)

> ⚠️ Bu tablo **arayüz** ölçümü **değildir** — olaylar ürünün mesaj API'sine gönderildi.
> Arayüzden ölçüm neden yapılamadığı bir alt bölümde, birebir hata metinleriyle.

| Faz | Δan | Δizleniyor | Δduraklatildi | Δmola | `durumAdi` | `video.paused` |
|---|---|---|---|---|---|---|
| mola öncesi oynuyor | 2754 | **2754** | 0 | 0 | İZLENİYOR | false |
| **mola açık** | 2508 | **0** | **0** | **2508** | **MOLA** | **true** ← ürün duraklattı |
| mola kapalı | 2753 | 0 | **2753** | 0 | DURAKLATILDI | **true** (ⓐ kararı) |
| **ana kapalı** | 2753 | **0** | **0** | **0** | **KAPALI** | — |
| ana tekrar açık | 2757 | **2757** | 0 | 0 | İZLENİYOR | false |

**Her fazda sapma tam 0.** Molada üçüncü kova işliyor; kapalıyken **hiçbiri** işlemiyor —
`SAYAC_TEKLIF.md:59`'un *"moladan farkı budur"* cümlesinin ölçülmüş hâli.

**CANLILIK KANITI (kapalı fazı):** `Δan=2753 ms > 2000` → arka plan **canlı**.
*"Her şey durdu"* ile *"bağlantı koptu"* aynı `Δ=0` rakamını verir; bu satır olmadan kutu
hiçbir şey ölçmezdi.

**Kümülatif sıfırlanmadı:** `T₁={izleniyor:3963, duraklatildi:3538, mola:3508}` →
`T₂={izleniyor:7470, duraklatildi:3538, mola:3508}`.

**Video GERÇEKTEN duraklatıldı** — sayfa gerçeğinden (`video.paused`), ürünün raporundan
değil (K09). Test videoyu kendisi duraklatmadı; hücrede `window.duraklat` çağrısı **yok**.

### Y6'nın beklentisi neden değişti — tolerans DEĞİL, beklenen kova

Tur 003'te `mola-aç` yalnızca **kaydediliyordu** (`EKLENTI.md:230-233`) ve video oynamaya
devam ediyordu; mola kapanınca ilerleyen kova `izleniyor` idi. Madde 4'te ürün
`SAYAC_TEKLIF.md:50-51` gereği videoyu **duraklatıyor** → mola kapanınca görünen durum
**DURAKLATILDI** olur ve ilerleyen kova `duraklatildi`'dır.
**Tolerans gevşetilmedi, beklenen kova değişti.** Ayrıca `durumAdi` ve `video.paused`
kontrolleri **eklendi** → hücre **güçlendi**, gevşemedi.

---

## Arayüzden ölçüm neden yapılamadı — dört yol, birebir hata metinleriyle

| # | Yol | Ölçülen sonuç |
|---|---|---|
| 1 | **WAR iframe** (Playwright sürebiliyor) | `API.tabs` **undefined** → ürünün kelepçesi haklı olarak devreye girer, pencere yoklamaya başlamaz. Birebir: `can't access property "query", API.tabs is undefined` |
| 2 | `page.goto("moz-extension://…")` | `waitUntil:"load"` → `TimeoutError: page.goto: Timeout 20000ms exceeded` · `waitUntil:"commit"` → `Timeout 10000ms exceeded` |
| 3 | Sayfadan `window.open` | `window.open` **pencere nesnesi döndürüyor** ve sayfa **koşuyor** (sonda raporu düşüyor), ama Playwright bağlanamıyor: `context` `"page"` olayı gelmiyor, `context.pages()` yalnız `["…/sayac.html","about:blank"]` |
| 4 | Sondaya tıklattırma (komut kanalı) | Pencere **canlı bağlama sokulabildi** ama **yarışlı**: ürünün `hedefBul()` yalnız açılışta koşar ve Playwright'ın `bringToFront()`'u aktif sekmeyi güvenilir biçimde değiştirmiyor (tur 003'te `visibilityState` için de ölçülmüştü). Dört yenileme denemesinde bazen tuttu, bazen kelepçe tetiklendi |

**Araç çubuğu simgesine tıklayarak açma:** Playwright Firefox'ta tarayıcı kromuna erişemez —
bu kutu **baştan ölçülemezdir**; yerine 16d denendi ve o da ölçülemedi (birebir: `donus:null`).

### ⚠️ Neden KIRMIZI değil "ölçülemedi" — ölçülmüş bir kapı

4. yol bazen pencereyi canlı bağlama sokabildi. Orada koşan bir ara sürümde Y12 **KIRMIZI**
çıktı. **O kırmızı geçerli bir hüküm değildir** ve öyle yazılmadı; sebebi ölçüldü:

```
PENCERE CANLI · pencereHedef=1 · bgSekmeId=3
```

Pencere **1** numaralı sekmeyi hedefliyor, arka plan **3** numaralı sekme için yanıt veriyor
(`arkaplan.js:73-78` gölgelemesi). O konfigürasyonda arayüzden okunan her rakam **yanlış
kablolanmış bir düzeni** ölçer — ürünün amaçladığı yolu değil. Ürünü bu rakamla suçlamak
tam olarak G22 olurdu.

Bu yüzden koşucuya **açık bir kapı** kondu: `pencereHedef !== bgSekmeId` ise hücre
**"ölçülemedi"** diye, **iki kimliği de yazarak** kapanır. Ürünün MOLA/DUR davranışı
**Y6'da yeşil ölçüldü** — kırmızı iddiasını destekleyen hiçbir kanıt yok.

> **Kutu yine de kırmızıya dönebilir:** kapı yalnız *"pencere ve arka plan farklı sekmeye
> bakıyor"* hâlini ayıklar. İkisi aynı sekmeye baktığı bir bağlam bulunursa (gerçek panel)
> hücre normal tolerans kontrolüne girer ve sapma varsa kırmızı yazar.

---

## Y14 — izin bütçesi (kriter 7)

| Koşu | `manifest.permissions` | `tabsTipi` | `sorguUzunluk` | `sorguId` | `urlTipi` | url süzgeci |
|---|---|---|---|---|---|---|
| **A izinsiz** | `null` | `object` | 1 | **2** | `string` | `sonuc:0` |
| **B `tabs` izinli** | `["tabs"]` | `object` | 1 | **2** | `string` | `sonuc:0` |

> **Arayüz YENİ İZİN GEREKTİRMEDİ.** Dayanağı ölçüm: izinsiz manifestle `tabs.query`
> sekme kimliğini **döndürdü** (`sorguId=2`) ve Y1–Y9 · Y11 · Y14–Y16 `permissions` ve
> `host_permissions` **bulunmayan** manifestle koştu (kanıt: her hücrenin `sonuc.manifest`
> alanı). **İznin ne satın aldığı da ölçüldü:** bu Firefox yapısında `urlTipi` A'da da
> `string`, url süzgeci A'da da çalışıyor (`sonuc:0`) — yani `tabs` izni bu iki ölçümde
> **hiçbir fark yaratmadı**.

---

## Altı karar — karar · gerekçe · kaynağın satırı · dayandığı ölçüm

**ⓐ MOLA kapanınca video devam ettirilmez.** `SAYAC_TEKLIF.md:51` yalnız *"duraklatılır"*
diyor; `:55` *"normal düzene dönülür"*. Yeniden başlatmak **yazılı değildir** (G20) ve
`v.play()` otomatik oynatma politikasınca reddedilebilirdi. **Ölçüm:** Y6 "mola kapalı"
fazı — `video.paused=true`, `durumAdi=DURAKLATILDI`, `Δduraklatildi=2753/Δan=2753`.

**ⓑ `#durum-adi` satırı eklendi.** `SAYAC_TEKLIF.md:67` saymıyor. Gerekçe: `:59`
*"moladan farkı budur"* ayrımının kullanıcıya görünmesi ve iki buton yazısının **zaten**
duruma bağlı olması. **Karar olarak yazıldı ki Mustafa itiraz edebilsin.** Başka hiçbir öğe
konmadı. **Ölçüm:** Y11 — `#etiket-durum="Durum:"` birebir.

**ⓒ Hedef sekme `tabs.query({active:true,currentWindow:true})` ile bulunur, izin istenmez.**
**Ölçüm:** Y14 (izinsizken `sorguId` geldi). **Sınır:** Y16 — bulunan kimliğin arka planda
**kullanıldığı ölçülemedi** (gölgeleme).

**ⓓ Bozulma kelepçesi ürüne kondu** (test kancası değil): pencere kendi sekmesinde açılmışsa
hedef = kendisi olur; o hâlde uyarı gösterilir ve yoklama başlatılmaz. **Ölçüm:** Y11 —
kelepçe çalıştı, üç sayaç `0:00:00`, uyarı metni birebir.

**ⓔ Biçimlendirme ayrı ürün dosyasında** (`bicim.js`), `document`/`window`'a dokunmaz.
**Ölçüm:** Y15 — 13/13 ve saflık taraması (yorumlar ayıklanarak) `bulunan=[]`.

**ⓕ Mesaj API'si genişletilmedi** (G19/G20). `durum-iste` yanıtı `molada` bayrağını
**döndürmüyor**; bu yüzden ana anahtar KAPALI iken molada olunsa bile `#btn-mola` yazısı
`MOLA` kalır. **Bilinen davranıştır**, ölçülemeyenler tablosunda adıyla duruyor.

---

## Koşulan komutlar ve çıktıları — birebir

```
npm run eklenti:test    → EKLENTI TEST CIKIS=0
                          ZORUNLU KIRMIZI: 0
                          ZORUNLU OLCULEMEDI: 4 → Y4, Y11, Y12, Y13
                          ATLANAN: Y10 (gerekce tabloda)
node test-yolu/bicim-testi.mjs → GECEN: 13 · KALAN: 0 · TOPLAM: 13   CIKIS=0
npm test                → GECEN: 20 · KALAN: 0 · TOPLAM: 20          CIKIS=0
npm run mutasyon        → 7/7 bozma yakalandi                        CIKIS=0
npm run eklenti:kontrol → SENKRON: EVET — iki SHA-256 birebir aynı   CIKIS=0
node eklenti/uret.mjs --kanit → SONUÇ: ✓ kontrol gerçekten ölçüyor   CIKIS=0
mantik/sayac.mjs SHA-256 = ad848d21f22916de80c2b5ab9f6c17a8872b93e83070860487438fed12ec38ac
                          (tur başı = tur sonu — çekirdek DONMUŞ kaldı)
```

**Önceki maddeler kırılmadı:** Y1–Y3 · Y5 · Y7–Y9 hâlâ **YEŞİL** (yeni `browser_action`'lı
manifestle). Y6'nın beklentisi değişti — gerekçesi yukarıda, ayrı başlıkta.

## Ürün ↔ test kopyası farkı

Yalnız **test kopyasına** enjekte edilenler (`test-yolu/ortak/eklenti-testi.mjs`):
`web_accessible_resources` · `sonda-icerik.js` · `sonda-arkaplan.js` ·
**`sonda-pencere.js` ve `pencere.html`'e eklenen iki `<script>`** · `content_scripts` içine
`http://127.0.0.1/*` eşleşmesi · `ekIzinler` (yalnız Y14'te) · MV3'te `action` çevrimi.
**Kaynak klasör `eklenti/` kirletilmedi.**

---

## Bu turda ölçülemeyenler

| Kutu | Neden | Ölçülen değer |
|---|---|---|
| **MOLA butonunun üç durumu (arayüzden)** | butona Playwright ile tıklanamadı | dört yol, yukarıdaki tablo |
| **DUR/DEVAM ET'in üç durumu (arayüzden)** | aynı sebep | aynı |
| **İki cetvelin örtüşmesi (kriter 2)** | pencere canlı sayı göstermediği bağlamda ölçüm yapılamadı | DOM `0:00:00`, kelepçe metni |
| **Sekme kimliği çözümünün kullanıldığı** | gölgeleme + `API.tabs` undefined | `999999→1`, `tabs.query→yok` |
| **Araç çubuğu paneli bağlamı** | Playwright tarayıcı kromuna erişemez; `openPopup()` iframe'de yok | `donus:null` |
| **Simgeye tıklayarak açma** | aynı | — |
| **`MOLAYI BİTİR` ve `DEVAM ET` dizeleri** | yalnız tıklamadan sonra görünür | Y6'da durum geçişleri davranış olarak ölçüldü |
| **KAPALI + molada buton yazısı** | `durum-iste` `molada`'yı döndürmüyor (ⓕ) | — |
| **Tarayıcı yeniden başlarsa sayaçlar** | durum bellekte; `storage` eklenmedi (G20) | — |
| **Y4 (arka plandaki sekme)** | `005`'in işi | tur 003'te ölçüldü |
| **Y10 (LibreWolf)** | aynı RDP hatası 4 kez; 5. kez durma eşiği | `005`'in işi |
