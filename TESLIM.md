# Teslim — madde 5 raporu

> **Hedef 1 · madde 5** (`HEDEF.md:97-103`). Depo · README · ilk sürüm etiketi · sır taraması.
> Ayrıca Mustafa'nın onayladığı **kısmi** `git-rehberi` taşıması.
> **Tarih:** 14/08/2026 · **Node** v26.5.0 · **Yeni bağımlılık: YOK.**

---

## Sonuç — tek cümle

README yazıldı (arayüzün dokuz Türkçe dizesi **9/9** birebir), ürün XPI'si **ölçülerek**
paketlendi (tam 7 dosya), sır taraması **çıkış 0** verdi **ve kırmızıya dönebildiği
kanıtlandı**, sürüm dört yerde `1.0.0`'a eşitlenip `v1.0.0` etiketlendi;
**uzak depo bağlı ve doğrulandı** (007) — `git ls-remote origin` gerçek ref döndürüyor,
`main` sha = yerel `HEAD`, `v1.0.0^{}` sha eşleşti, görünürlük **private** ölçüldü.

---

## 1 · Sır taraması (`arac/sir-tarama.mjs`)

### Neden desen tabanlı, entropi tabanlı değil — ÖLÇÜLMÜŞ gerekçe

Takip edilen dosyaların yarısı kanıt dosyasıdır ve içleri **64 karakterlik SHA-256 hex**,
**UUID** (ör. `moz-extension://<uuid>/pencere.html`) ve uzun rasgele görünen dizelerle
doludur. Entropi ya da salt uzunluk kuralı **temiz ağaçta çıkış 1** verirdi ve kontrol ilk
günden okunmaz olurdu (**G22** — yanlış soruyu soran kontrol).

Bunun yerine: **9 bilinen sır öneki ailesi** + **1 dar atama kuralı**. Atama kuralında beş
daraltma birden aranır — uzunluk ≥16 · yalnız `[A-Za-z0-9_-]` · **en az bir harf ve en az
bir rakam** · **saf hex değil** (SHA-256/SHA-1/MD5 elenir) · **UUID biçiminde değil** ·
yer tutucu değil (çift süslü parantez, `<`, `xxx`, `your`, `ornek`, `example`, `changeme`,
`placeholder`).

### Yeşil koşum

```
takip edilen dosya : 103
taranan metin dosya: 103
atlanan ikili      : 0
taranan desen ailesi: 9 + 1 dar atama kurali

git check-ignore -v dogrulamasi (git-rehberi §2.4'un gercek dogrulamasi):
   .env           → .gitignore:5:.env	.env
   bildirim.json  → .gitignore:36:bildirim.json	bildirim.json
   node_modules   → .gitignore:19:node_modules/	node_modules

BULGU: 0 — temiz
SONUC: TEMIZ · cikis 0
```

Taranan dosya sayısı `git ls-files` sayısıyla **eşit** (103). Sonraki koşumlarda bu sayı
bu turun eklediği dosyalarla artar.

### Kırmızıya dönebiliyor mu — üç bacak (G26/K04)

Koruma, **kırmızıya dönebildiği gösterilmeden yeşil sayılmaz.**

| Bacak | Ne yapıldı | Beklenen | Ölçülen |
|---|---|---|---|
| **1 — yeşil** | ağaca dokunulmadı | çıkış 0 | **0** · 105 dosya tarandı |
| **2 — kırmızı** | sahte sır, tarayıcının **kendi kaynağının** sonuna `//` yorumu olarak | çıkış 1 + bulgu kendi dosyasında | **1** · `arac/sir-tarama.mjs:268 — GitHub klasik token — ghp_…(40 karakter)` |
| **3 — negatif** | 64 karakterlik SHA-256 hex + `moz-extension://<uuid>` | çıkış 0 | **0** — uzun dizeye kör körüne ateş etmiyor |

`arac/sir-tarama.mjs` SHA-256 **önce = sonra**; geri alma sonrası gerçek tarama **çıkış 0**;
bozulan dosya `git status`'ta **değişmiş görünmüyor**.

**Sahte sır güvenliği — üç şart birden:** ⑴ gerçek token değil, içinde `SAHTE` geçiyor ·
⑵ literal dize kaynakta **bütün hâlde bulunmuyor**, çalışma zamanında parçalardan kuruluyor ·
⑶ log'a ve bu rapora **maskelenmiş** giriyor (`ilk 4 karakter + … + uzunluk`).
Log: `test-yolu/kanit/sir-tarama.log`.

> **Bir ölçüm düzeltmesi.** İlk `--kanit` koşumunda bacak 2 **çıkış 0** verdi. Sebep ölçüldü:
> `arac/sir-tarama.mjs` o an **izlenmiyordu**, tarama ise `git ls-files`'a bakıyor — yani
> bacak var olmayan bir dosyayı bozuyordu. Dosya indekse alındıktan sonra bacak 2 beklendiği
> gibi **çıkış 1** verdi. Kural gevşetilmedi; **kapsamın ne olduğu** doğru anlaşıldı.

---

## 2 · Ürün XPI'si (`arac/paketle.mjs`)

Tur 005'te Y10 XPI'yi **test kopyasından** üretmişti (sonda enjekte edilmiş); ürünün
kendisinden paketleme **ölçülmemişti**. Bu tur o boşluğu kapattı.

```
XPI      : web-ext-artifacts\sayac-1.0.0.xpi
bayt     : 10835
SHA-256  : f86744de3080aefb49ba4cef4ca2b40052e41dc7e3fc552f00d6a1cc13e6fbee
zip icerigi (7 dosya):
   arkaplan.js · bicim.js · icerik.js · manifest.json · pencere.html · pencere.js · sayac.js

KELEPCE — uret.mjs pakete girdi mi: false · fazla: yok · eksik: yok · liste tam esit: true
SONUC: cikis 0
```

**Kelepçe gerçek bir kutudur:** `uret.mjs` bir **üretim aracıdır**, ürün değildir; pakete
girerse çıkış 1. Fazla ya da eksik dosya da çıkış 1.
`web-ext`in yalnız `cmd.build`'i kullanıldı — RDP yok, ağ çağrısı yok.
Log: `test-yolu/kanit/paketle.log`.

---

## 3 · README dayanak tablosu

| README cümlesi | Dayanağı |
|---|---|
| "üç kalemde ayırır… veriler bilgisayarınızda kalır" | `SAYAC_TEKLIF.md` (tek cümle + çalışma kuralları) |
| `npm run eklenti:paketle` → `sayac-1.0.0.xpi`, 7 dosya | **bu turun ölçümü** — `test-yolu/kanit/paketle.log` |
| XPI adı `sayac@sayac.local.xpi` | `eklenti/manifest.json` → `browser_specific_settings.gecko.id` |
| Altı `user_pref` satırı | `test-yolu/librewolf.mjs:136-142` (birebir) |
| "`active:true` · `signedState:0` · `appDisabled:false`" | `test-yolu/kanit/eklenti-Y10.json` |
| "15 işaret · geçen=11 · kalan=0" | aynı dosya |
| "Ölçümün sınırı: taşınabilir 153.0.4-1, boş profil, headless" | aynı dosya (sürüm + profil + kip) |
| `about:debugging` yolu **ölçülmedi** | aynı dosya — *"Makine kanali yok — ELLE gezinme gerektirir"* |
| MOLA videoyu gerçekten duraklatıyor (`video.paused=true`) | `ARAYUZ.md` → Y6 tablosu |
| Mola bitince video devam ettirilmez | `ARAYUZ.md` → karar ⓐ |
| Üç sayaç tablosu + dört ek kural | `SAYAC_TEKLIF.md` (üç sayaç · çalışma kuralları) |
| Durum önceliği `KAPALI > MOLA > …` | `mantik/sayac.mjs` (`durumAdi` öncelik sırası) |
| Üç bilinen açık | `SON_HAREKETLER.md` 📌 kutusu (005 sonrası hâli) |
| Kapsam dışı yedi madde | `SAYAC_TEKLIF.md` → "Kapsam dışı" |
| Dokuz Türkçe dize | `eklenti/pencere.html` + `test-yolu/arayuz-e2e.mjs` `DIZELER` |

**README kelepçesi:** dokuz dizenin dokuzu da README'de **birebir** bulundu → **9/9**.
*(Alıntı ürün dosyalarından yapıldı, kanıt log'undan değil.)*

---

## 4 · Sürüm kararı — `1.0.0`, etiket `v1.0.0`

Tur başında sürüm **dört yerde** çelişiyordu: `eklenti/manifest.json` `0.1.0` ·
`package.json` `1.0.0` · `package-lock.json` iki yerde `1.0.0`.

**Karar: `manifest.json` `0.1.0` → `1.0.0`.** Dört gerekçe:

1. Bu tur **sözleşmenin teslimidir**; `HEDEF.md` *"İlk sürüm etiketlenir"* diyor ve `1.0.0`
   "ilk yayın"ın semver karşılığıdır.
2. **Tek satır değişir.** `0.1.0`'a inmek `package.json` + `package-lock.json` (iki yer)
   olmak üzere üç satır ve iki dosya değiştirirdi; kilit dosyasını elle düzenlemek kırılgan.
3. Sürüm numarasını **düşürmek** semver'e aykırıdır ve `1.0.0` zaten üç yerde yazılıydı.
4. Etiket adı ile paket adı çakışmaz: `sayac-1.0.0.xpi` ↔ `v1.0.0`.

**Elenen seçenek (`0.1.0`):** savunulabilir yanı, `package.json`'ın `npm init -y` çıktısı
olması (beş npm varsayılanı — `description:""`, `main:"index.js"`, `keywords:[]`,
`author:""`, `license:"ISC"` — el değmemiş duruyor) ve ölçülmüş üç açığın "kararlı 1.0"
iddiasını zayıflatması. **Elendi çünkü:** üç açığın hiçbiri kapsamda değil
(`SAYAC_TEKLIF.md` depolama/kalıcılık istemiyor; Y4 ölçülemedi ama **ürün kusuru
ölçülmedi**), maliyeti üç kat dosya değişikliği, ve sürüm düşürmek gerekirdi.

**Sürüm değişikliği bir hücreyi kırmadı:** değişiklikten sonra `eklenti:kontrol` ve
`eklenti:test` koşuldu, ikisi de çıkış 0.

---

## 5 · `git-rehberi` — KISMİ taşıma

**Karar Mustafa'nındır (14 Ağustos): `git-rehberi` kısmi taşınır, `teslim-disiplini`
taşınmaz.** Yeniden sorulmadı.

`D:\Yönetim\kur-sistem.ps1` **kullanılmadı**, iki bağımsız sebeple:
① betiğin **Kilit B**'si hedef `<MyDocuments>\Claude\Projects` ağacının içindeyse
`exit 16` veriyor — Sayaç tam olarak orada; ② betik `dosyalar\` altındaki **her** dosyayı
kopyalar, yani **tam** taşıma yapar — Mustafa'nın kararı ise **kısmi**.

### §2.4 karşılığı — `.gitignore`

Rehberin §2.4'ü **referans olarak** alındı; gövdesi mevcut dosyanın üstüne **yazılmadı**.
Sebep ölçüm: §2.4 gövdesi bu projenin `.gitignore`'undan **zayıf**.

**§2.4'te olup Sayaç'ta olmayan — 2 kural:**

| Kural | Bu projede karşılığı |
|---|---|
| `data/` | Depoda `data/` dizini **yok** (ölçüldü) |
| `*.sqlite` | Depoda `.sqlite`/`.db` dosyası **yok** (ölçüldü) |

**Sayaç'ta olup §2.4'te olmayan — 20 kural:**
`!.env.example` · `desktop.ini` · `.vscode/` · `.idea/` · `out/` · `coverage/` · `.venv/` ·
`npm-debug.log*` · `tmp/` · `.cache/` · `bildirim.json` · `.claude/loop/` · `tarayicilar/` ·
`.playwright-browsers/` · `ms-playwright/` · `web-ext-artifacts/` · `test-yolu/gecici/` ·
`test-log/` · **`!test-yolu/kanit/*.log`** · **`!mantik/kanit/*.log`**

Son ikisi kritiktir: §2.4 `*.log` deyip **muafiyet koymuyor**; körü körüne uygulansaydı bu
projenin bütün kanıt dosyaları sessizce yoksayılırdı — bu tuzak üç turda üç kez tetiklendi.

**Karar:** `data/` ve `*.sqlite` **eklenmedi**, gerekçe *"depoda karşılığı yok (ölçüldü)"*.
İhtiyaç doğarsa tek satırdır. **`.gitignore` SHA-256 tur başı = tur sonu.**

**§2.4'ün gerçek doğrulaması** (`TASIMA.md`): `git check-ignore -v .env` bir satır dönmeli.
Sır taraması bunu her koşuda üç ad için yapıyor — çıktısı yukarıda (§1).

### §2.6 karşılığı — private depo aç ve bağla

Bu bölüm **Mustafa'nın izleyeceği adımdır**; tur depoyu açmaz.
Rehberin yer tutucu alanları **dolduruldu** (GitHub kimliği bu makinede `Sudo-Nwep`):

1. https://github.com → sağ üst **+** → **New repository**
2. Ad: `sayac` · **Private** seç · README/gitignore ekleme (zaten var) → **Create repository**
3. Sonra:
   ```bash
   git remote add origin https://github.com/Sudo-Nwep/sayac.git
   git branch -M main
   git push -u origin main
   git push origin v1.0.0
   ```
4. İlk push'ta şifre yerine **Personal Access Token** gerekir:
   GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)** →
   Generate new token → `repo` yetkisi.
   *(Alternatif: GitHub Desktop — token'ı kendisi halleder.)*

⚠️ **Push'tan önce `npm run sir-tarama` koşulmalı ve çıkış 0 vermelidir.**

### Taşınmayan bölümler ve neden

| Bölüm | Neden taşınmadı |
|---|---|
| §1 "Git nedir" | Rehberin kendi `TASIMA.md`'si deneyimli geliştirici için atlanabilir diyor |
| §2.1–2.3 | Git kurulumu ve kimliği bu makinede zaten yapılmış (12 commit var) |
| **§2.5 "İlk commit"** | Gövdesi **`git add -A`** — bu projede **YASAK**: `DEVIR.md` Mustafa'nındır ve izlenmiyor; dosyalar adıyla eklenir |
| §3 | Günlük akış; bu projenin `CLAUDE.md`'sinde zaten yazılı |
| §4 | Dal akışı; bu projede tek dal (`main`) kullanılıyor |
| §5 | Geri alma; `CLAUDE.md` zaten `git revert` diyor |
| §6 | Sır sızıntısı → anahtar iptali; **`CLAUDE.md`'de zaten kurulu** (K08) |
| §7 | PaaS deploy; bu projede PaaS **yok** (tarayıcı eklentisi) |
| §8 | Kapanış/özet |

### `teslim-disiplini` neden taşınmadı

Mustafa'nın 14 Ağustos kararı: taşınmaz. Yeniden sorulmadı.

### `.orkestra-surum`

Proje kökünde, şeması `kur-sistem.ps1`'ten alındı. `surum: 1` **uydurulmadı**,
`git-rehberi/TASIMA.md`'den okundu. `yazilan: []` **doğrudur**: bankadan hiçbir dosya bayt
bayt kopyalanmadı; §2.4 ve §2.6 yeniden yazılarak bu rapora girdi. Şema dışı üç bilgi alanı
(`kismi`, `alinan_bolumler`, `not`) eklendi — `ConvertFrom-Json` bunları yok sayar.

---

## 6 · Uzak depo (007'de kendi ölçümüyle kapandı)

**Madde 5'in dört kanıt kalemi — tek yerde:**

| Kalem | Değer | Dayanak |
|---|---|---|
| Depo adresi | `https://github.com/Sudo-Nwep/sayac.git` | `git remote -v` |
| Commit sayısı | **`c4af8a9` itibarıyla `19`** — 007'nin kapandığı uç. Ölçüm: `git rev-list --count c4af8a9` (= `git rev-list --count HEAD`, 008'in FAZ 0'ında ölçüldü). (007'nin kendi tur başı `5d471c8` itibarıyla `16`, ölçüm: `git rev-list --count 5d471c8`.) **Tur sonu (008'in kapanış commit'i dahil): `22`** — doğrulama `git rev-list --count HEAD`, `test-yolu/kanit/uzak-depo.log` Blok 3. | `test-yolu/kanit/uzak-depo.log` Blok 2 + Blok 3 |
| Etiket adı | `v1.0.0`, `HEAD`'e düşüyor | `git rev-list -n1 v1.0.0` = `git rev-parse HEAD` |
| Sır taraması | `npm run sir-tarama` → **çıkış 0** (push edilmiş ağaç üzerinde, düzenlemeden önce tekrar koşuldu) | `test-yolu/kanit/sir-tarama.log` |

> ⚠️ **DÜZELTME (008, 15/08/2026):** Bu satır önceki hâlde şöyle yazıyordu: *"tur başında `17`
> (bu belgenin ve kalan 007 commit'lerinin kendisi hariç); tur sonu kesin sayı
> `test-yolu/kanit/uzak-depo.log` ve FAZ 6 doğrulamasında"*. İki ayrı kusur vardı: ⑴ `17`
> **ölçülmemişti** — 007'nin gerçek tur başı ucu (`5d471c8`) `git rev-list --count` ile **16**'dır,
> `17` diye yazılan rakamın hangi sha'da geçerli olduğu hiç belirtilmemişti; ⑵ tur sonu için
> attıfta bulunduğu iki kaynağın **ikisi de** kesin sayıyı vermiyordu — bu bir **erteleme**ydi
> (deferral), ölçüm değil. 008'in FAZ 6'sı tur sonu rakamını kapanış commit'i dahil olarak
> aşağıya (bu satırın devamına) ekleyecek. *(Özgün metin silinmedi — G09: iki hafıza.)*

**Bağlantı ve senkron kanıtı** (007, `test-yolu/kanit/uzak-depo.log`):

```
$ git remote -v
origin	https://github.com/Sudo-Nwep/sayac.git (fetch)
origin	https://github.com/Sudo-Nwep/sayac.git (push)

$ git ls-remote origin
5d471c804c37661243225c20f51cdcfc95762dd3	HEAD
5d471c804c37661243225c20f51cdcfc95762dd3	refs/heads/main
ef5ba0d736ab66176fcd95d382edc91ff92118a1	refs/tags/v1.0.0
5d471c804c37661243225c20f51cdcfc95762dd3	refs/tags/v1.0.0^{}
```

`refs/heads/main` = yerel `HEAD` (007'nin tur başı ölçümünde, sha `5d471c8…` — **birebir
eşit**). `refs/tags/v1.0.0^{}` = `git rev-list -n1 v1.0.0` (**birebir eşit**; `refs/tags/v1.0.0`
kendisi annotated etiket nesnesinin ayrı SHA'sıdır, `ef5ba0d…` — bu normaldir, `^{}` onu peel
edip işaret ettiği commit'i verir). `git rev-list --left-right --count main...origin/main` →
`0	0` — ayrışma yok.

Bu senkronun **bu turdan önce** kurulduğu ölçüldü: 007'nin FAZ 0 taban ölçümünde `origin`
zaten tanımlıydı ve `origin/main` yerel `HEAD` ile zaten birebir eşti. Yani `git remote add`
+ ilk `git push` bu turdan önce yapılmış; bu tur onu **doğruladı**, push edilmiş ağaç
üzerinde sır taramasını **tekrar koştu**, ve kendi yeni commit'lerini (FAZ 6'da) uca gönderdi.

**Görünürlük — ölçüldü: private.** İki anonim (kimliksiz) HTTP isteği:

```
$ node -e "fetch('https://api.github.com/repos/Sudo-Nwep/sayac')…"
status=404

$ node -e "fetch('https://github.com/Sudo-Nwep/sayac')…"
status=404
```

Tek başına bir anonim 404, "depo yok" anlamına da gelebilirdi. Bu yüzden iki ayak birlikte
okunur: kimlikli `git ls-remote origin` gerçek ref'ler döndürdü → depo **var**; iki anonim
istek de 404 → anonim erişim **yok**. İkisi birlikte = **private**.

> ⚠️ **DÜZELTME (007, 15/08/2026):** Önceki hâlde şu yazıyordu: *"Deponun private olduğunu
> tur ölçemez (ağ/API çağrısı yok) — açıldığında bunu doğrulamak Mustafa'nın adımıdır."*
> Bu cümle **silinmedi** (G09: iki hafıza — özgün ölçüm/karar metni korunur, düzeltme altına
> eklenir). 007'de görev tanımı ağ çağrısını açıkça izin verdi (`fetch`, Node yerleşik) ve
> görünürlük yukarıdaki iki anonim istekle **ölçüldü**: **private**.

---

## Bu turda ölçülemeyenler

| Kutu | Neden |
|---|---|
| **Uzak depoya push** | Remote yok; depoyu açma adımı Mustafa'nın (`bekliyor`) |
| **Deponun private olduğu** | Ağ/API çağrısı yok; tur ölçemez |
| **`about:debugging` ile geçici kurulum** | Makine kanalı yok — elle gezinme gerektirir (005'te de ölçülememişti) |
| **Kurulu LibreWolf'un mevcut profilinde kurulum** | Mustafa'nın profili yasak (`HEDEF.md`); ölçüm boş, tek kullanımlık profille yapıldı |

> ⚠️ **DÜZELTME (007, 15/08/2026):** Yukarıdaki tablonun ilk iki satırı — *"Uzak depoya push"*
> ve *"Deponun private olduğu"* — bu turda **ölçüldü** ve §6'ya işlendi. Tablo satırları
> **silinmedi** (G09: iki hafıza); 006 turunda gerçekten ölçülememişti, bu doğrudur ve kalır.
| **"En az bir gerçek kullanıcı denedi"** (dağıtım boyutu ölçütü) | Kurulum yolu yazılı ve ölçülü, ama gerçek kullanıcı denemesi yapılmadı |
