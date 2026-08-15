# Sayac — Son Hareketler (Proje Günlüğü)

> **Yeni sohbete başlarken:**
> 1. Önce **📌 GÜNCEL DURUM** kutusunu oku — projenin şu anki hâli orada.
> 2. `PROJE_KUNYESI.md`'ye bak — henüz **olmayan** şeyler orada.
> 3. İlerleme kaydedeceksen **✍️ Bu günlük nasıl güncellenir** kurallarını izle.

---

## 📌 GÜNCEL DURUM (her zaman en güncel — önce bunu oku)

- **Versiyon:** v3.1 · **Sürüm:** `1.0.0` (dört yerde eşit) · **Etiket:** `v1.0.0` · **Uzak depo:** `github.com/Sudo-Nwep/sayac` (private, bağlı, `main` senkron)
- **Aşama:** {{ASAMA}} — fiilen: madde 1 · 2 · 3 · 4 · 5 kapandı; **arayüzlü, kurulabilir eklenti var**, madde 5 (teslim) dört kutusu da ölçülüp kapandı
- **Amaç:** {{AMAC}}
- **Kapsam:** {{KAPSAM}}
- **Depo/çalışır mı:** **evet — kurulabilir bir Firefox eklentisi var.** Üretilebilir kanıtlar:
  `npm run eklenti:test` → çıkış 0 · **16 hücre: 10 YEŞİL · 5 ölçülemedi · 1 atlandı**
  (gerçek YouTube dâhil; ölçülemeyenler: Y4 · Y16 · Y11 · Y12 · Y13; atlanan: Y10, gerekçesi
  tabloda) · `npm run eklenti:kontrol` → çıkış 0 (üretim senkron) · `npm test` → `KALAN: 0`,
  çıkış 0 · `npm run mutasyon` → 7/7, çıkış 0 ·
  `npm run eklenti:sayac-kanit` → çıkış 0 (sayacın kendisi bozularak sınandı, 3/3).
- **LibreWolf'a kurulabilirlik KANITLANDI** (`node test-yolu/eklenti-kosum.mjs Y10` → YEŞİL):
  imzasız XPI profile düşürüldü, `extensions.json` → `active:true · signedState:0 ·
  appDisabled:false`; sondadan 15 işaret, `gecen=11 · kalan=0`. **RDP kullanılmadı.**
- **Arayüz VAR:** açılır pencerede üç sayaç (`İzleniyor · Duraklatıldı · Mola`), **MOLA** ve
  **DUR / DEVAM ET** butonları, Türkçe. MOLA oynayan videoyu **gerçekten duraklatıyor**
  (ölçüldü: `video.paused=true`). İzin eklenmedi. Ayrıntı `ARAYUZ.md`.
- **Seçilen test yolu:** `playwright-webextext` · yedek: Mozilla `web-ext` RDP ·
  elenen: Playwright'ın kendi Firefox desteği. Gerekçe + rakamlar `TEST_YOLU.md`.
- **Zaman mantığı:** `mantik/sayac.mjs` — saf (statik **ve** dinamik olarak ölçüldü),
  değişmez, serileştirilebilir; tek sayaç birimi modeller. Ayrıntı `MANTIK.md`.
- **Eklenti:** `eklenti/` — MV2, **hiçbir host izni yok**, içerik betiği yalnız YouTube'a
  enjekte olur. `eklenti/sayac.js` çekirdekten **üretilir**, senkronluk SHA-256'yla kanıtlı.
  Ayrıntı `EKLENTI.md`.
- **Açık işler:** `PROJE_KUNYESI.md`'deki boyutlar + doldurulmamış ELDE yer tutucuları.
  **ürün** boyutu ⛔ → 🟡 → ✅ oldu: kod, **arayüz**, doğrulaması ve teslimi (madde 5) var.
  Diğer altı çevre boyutu (veri/gizlilik · maliyet · operasyon · para · hukuk · dağıtımın
  "gerçek kullanıcı" ölçütü) hâlâ ⛔/🟡 — bunlar bu turun kapsamı dışıdır.
- **Madde 5 (teslim) — yazılı dört kutu da kapandı:**
  ✅ **README.md** var — kurulum (ölçülmüş yol + ölçülmemiş yol ayrı etiketli), kullanım,
  üç sayacın anlamı, bilinen sınırlar, geliştirici komutları. Arayüzün dokuz Türkçe dizesi
  **9/9** birebir.
  ✅ **Sır taraması** — `npm run sir-tarama` → çıkış 0 (desen tabanlı; entropi tabanlı
  **değil**, gerekçesi ölçülü). `npm run sir-tarama:kanit` → çıkış 0, üç bacak: temiz **0** ·
  sahte sırla **1** (maskelenmiş bulgu) · SHA-256+UUID ile **0**. **007'den beri kanıt modu
  kendi log dosyasına yazıyor** (`sir-tarama-kanit.log`) — normal modla artık kanıtları
  birbirini silmiyor.
  ✅ **Etiket** `v1.0.0` — HEAD'e düştü. Sürüm dört yerde `1.0.0`.
  ✅ **Uzak depo bağlı ve doğrulandı** — `git ls-remote origin`: `main` sha = yerel `HEAD`,
  `v1.0.0^{}` sha = `git rev-list -n1 v1.0.0`, ikisi de birebir eşit. Görünürlük **private**
  ölçüldü (iki anonim istek 404, kimlikli ls-remote başarılı). Kanıt: `test-yolu/kanit/uzak-depo.log`.
- **Ürün paketi ölçüldü:** `npm run eklenti:paketle` → `sayac-1.0.0.xpi`, **tam 7 ürün
  dosyası** (`uret.mjs` pakete girmiyor — kelepçe), SHA-256 kayıtlı.
- **Sıradaki adım:** yazılı, zorunlu bir sonraki iş yok — madde 5'in dört kutusu da kapandı.
  Kalan tek ölçüm açığı kapsam dışı: Y4 (arka plandaki sekme) ve depolama yokluğu.
- **✅ 005'te KAPANANLAR:** ⑴ **LibreWolf'a kurulabilirlik** — RDP'siz yolla kanıtlandı
  (yukarıda) · ⑵ **sekme kimliği zinciri** — **gerçek araç çubuğu panelinde** ölçüldü:
  karşıt deney `999999 → 999999`, `888888 → 888888`, `getCurrent=yok` → panelde `sender.tab`
  **yok**, `msg.sekmeId` yolu **geçerli**; `pencereHedef=1 = sorguId=1`; panel DOM canlı
  (`0:00:02`, `#uyari` boş). *"Pencere hedef sekmeyi kendiliğinden buluyor"* cümlesi artık
  **ölçüme dayanıyor** — ama yalnız **panel** bağlamı için.
- **⚠️ Bilinen açıklar:** ⑴ **arka plandaki sekme kutusu ÖLÇÜLEMEDİ** — Y4a/Y4b/Y4c üç yol da
  denendi, üçünde de `visibilityState="visible"` ölçüldü (Y4b'de `tabs.create` gerçekten
  yeni aktif sekme açtı) · ⑵ tarayıcı yeniden başlarsa sayaçlar **kaybolur** (durum bellekte,
  depolama eklenmedi) · ⑶ **butonların Playwright'tan ARAYÜZDEN sürülmesi ölçülemedi** —
  `moz-extension://` sayfası sürülemiyor (dört yol birebir hata metniyle elendi); davranışları
  mesaj API'si yolundan **yeşil ölçüldü** (`ARAYUZ.md` → Y6) ve panel DOM'u LibreWolf'ta
  **canlı görüldü**.
- **🔧 LibreWolf bu makinede KURULU** (`C:\Program Files\LibreWolf\`). Tur 001 *"kurulu değil"*
  diye ölçmüştü (`TEST_YOLU.md:286-292`), tur 003 bunu düzeltti. **005'teki ölçümlerde o kurulu
  ikiliye HİÇ dokunulmadı**: her çağrı taşınabilir geçici kopya + `-no-remote` +
  `MOZ_NO_REMOTE=1` + kendi tek kullanımlık profille yapıldı; kurulu LibreWolf PID kümesi
  tur başı ve tur sonu **aynı** ölçüldü.

---

## 🗂️ Proje Dosyaları (ve ilişkileri)

- **`CLAUDE.md`** — açılış protokolü; her sohbette Claude'un çalışma şekli. §0 AĞ bloğu ORKESTRA bağlantısıdır.
- **`SON_HAREKETLER.md`** — bu dosya; proje hafızası / giriş noktası.
- **`KONTROL_DOSYASI.md`** — aktif işin ve değişken verinin tek kaynağı.
- **`PROJE_KUNYESI.md`** — **ne YOK** dosyası: ⛔ çevre boyutları + doldurulmamış ELDE yer tutucuları.
- **`.gitignore`** — repoya girmeyecekler (secret dahil). `test-yolu/kanit/*.log` bilerek
  **muaf** tutuldu: kanıt depoya girer.
- **`README.md`** — **kullanıcının okuyacağı dosya.** LibreWolf'a kurulum (A: ölçüldü ·
  B: ölçülmedi, ikisi de etiketli), kullanım, üç sayacın anlamı, **bilinen üç açık gizlenmeden**,
  geliştirici komut tablosu.
- **`TESLIM.md`** — **madde 5'in raporu:** sır taraması tasarımı ve üç bacaklı kanıtı ·
  paketleme ölçümü · README dayanak tablosu · sürüm kararı · **`git-rehberi` kısmi taşıması**
  (§2.4 fark tablosu, §2.6 doldurulmuş adımlar, taşınmayanlar ve neden) · uzak depo durumu.
- **`arac/`** — teslim araçları: `sir-tarama.mjs` (desen tabanlı sır taraması + `--kanit`;
  007'den beri normal mod `test-yolu/kanit/sir-tarama.log`'a, kanıt modu ayrı
  `test-yolu/kanit/sir-tarama-kanit.log`'a yazıyor — ikisi artık birbirini silmiyor) ·
  `paketle.mjs` (ürün XPI'si, yedi dosya kelepçesi).
- **`test-yolu/kanit/uzak-depo.log`** — 007'nin uzak depo ölçümü: `ls-remote` ham çıktısı,
  sha karşılaştırmaları, görünürlük (iki anonim istek).
- **`.orkestra-surum`** — `git-rehberi`'nin **kısmi** kurulum kaydı (`sema:1`, `surum:1`,
  `kismi:true`, `alinan_bolumler:["2.4","2.6"]`). Bankadan dosya kopyalanmadı → `yazilan:[]`.
- **`ARAYUZ.md`** — **madde 4'ün raporu:** hücre tablosu · **sekme kimliği zinciri** (karşıt
  deney + pozitif kontrol) · MOLA↔KAPALI tablosu · on bir Türkçe dize · altı karar · izin
  bütçesi · ürün↔test kopyası farkı · **arayüzden ölçümün neden yapılamadığı** (dört yol,
  birebir hata metinleriyle) · ölçülemeyenler tablosu.
- **`eklenti/pencere.html` · `pencere.js` · `bicim.js`** — **arayüz.** Satır içi betik yok (CSP);
  `bicim.js` `document`/`window`'a dokunmaz, `node:vm` ile tarayıcısız sınanır.
- **`test-yolu/` (madde 4 eki)** — `arayuz-e2e.mjs` (Y11·Y12·Y13·Y16) · `arayuz-izin.mjs` (Y14,
  kendi süreç ömrünü yönetir) · `bicim-testi.mjs` (Y15) · `sonda/sonda-pencere.js` (ürüne ait
  **değil**; karşıt deney ve komut kanalı burada).
- **`EKLENTI.md`** — **madde 3'ün raporu:** mimari (kim damgalar, durum nerede yaşar) ·
  **madde 4'ün kullanacağı mesaj API'si sözleşmesi** · on hücrenin tablosu (rakamlarıyla) ·
  iki cetvelin yan yana çıktısı · dört açık kararın kapanışı · ölçülemeyenler tablosu.
- **`eklenti/`** — **ÜRÜN.** LibreWolf'a olduğu gibi kurulacak olan. MV2, host izni yok.
  - `manifest.json` — `content_scripts` yalnız YouTube; `background.scripts` sırası
    **`sayac.js` önce, `arkaplan.js` sonra** (üst düzey `const`'lar sonraki betiğe görünsün).
  - `sayac.js` — **ÜRETİLEN**; elle düzenlenmez. Kaynak `mantik/sayac.mjs`.
  - `arkaplan.js` — sekme başına `Map`, tek saat, gece yarısı nöbeti, mesaj API'si.
  - `icerik.js` — `document` üzerinde **yakalama fazı** dinleyicisi; yalnız "ne oldu" der.
  - `uret.mjs` — üretici + `--kontrol` (SHA-256 senkron kanıtı) + `--kanit` (kontrolü bozarak sınar).
- **`test-yolu/` (madde 3 eki)** — `ortak/sunucu-eklenti.mjs` · `ortak/eklenti-testi.mjs` ·
  `ortak/hucre.mjs` (TOLERANS burada, koşumdan önce sabit) · `sonda/` (ürüne ait **değil**) ·
  `eklenti-e2e.mjs` · `karsit-izin.mjs` · `eklenti-youtube.mjs` · `librewolf.mjs` ·
  `eklenti-kosum.mjs`. Kanıt `kanit/eklenti-*.log|json` — **düz**, alt klasörsüz.
- **`MANTIK.md`** — **madde 2'nin raporu:** durum modeli · olay etki tablosu · 16 kutunun
  senaryo karşılıkları · saflık ölçümünün çıktısı · 8 kombinasyon tablosu · mutasyon sonuçları ·
  **madde 3'e devreden sözleşme** (`gece-yarısı` damgası kimin işi, çoğullama nerede yapılır).
- **`mantik/`** — ürünün saf çekirdeği. Tarayıcı yok, ağ yok, zamanlayıcı yok:
  - `sayac.mjs` — **SAF** çekirdek; tek dosya, hiçbir yükleme satırı yok. Zaman parametre olarak girer.
  - `senaryolar.json` — doğruluğun tek kaynağı; **dilden bağımsız** 20 senaryo (K10).
  - `kosucu.mjs` — **katı** koşucu (`npm test`): saflık ölçümü + şema reddi + çakışma invaryantı.
  - `mutasyon.mjs` — kod mutantları + tablo bozmaları (`npm run mutasyon`); her mutant ayrı çocuk süreçte.
  - `kanit/` — `test-kosusu.log` + `mutasyon.log`, UTF-8. **Depoya girer** (`.gitignore:56`).
- **`TEST_YOLU.md`** — **madde 1'in raporu:** 3 aday × 2 manifest tablosu, elenen adayın
  birebir hata metinleri, seçim gerekçesi, kanıt koşusunun komutu ve çıktısı.
- **`package.json` / `package-lock.json`** — `"type": "module"`, yalnız `devDependencies`.
  Ürün çalışma zamanında hiçbiri gerekmez. Neden var → `KONTROL_DOSYASI.md` 📦 tablosu.
- **`test-yolu/`** — Firefox eklenti test iskelesi. Madde 3 ve 4'ün kanıtı da buradan çıkacak:
  - `ortak/sunucu.mjs` — işaret sunucusu + `<video>`'lu yerel sahte sayfa (madde 3'ün ① kanıtı
    bu sayfayı istiyor; iskele oraya devrolur).
  - `ortak/eklenti-hazirla.mjs` — kaynağı geçici dizine kopyalar, `port.js` yazar (kaynak kirlenmez).
  - `ortak/kosucu.mjs` — 120 sn sert sayaç + `finally`'de her koşulda kapatma (G23/G24).
  - `aday-a.mjs` **(seçilen)** · `aday-b.mjs` (yedek) · `aday-c.mjs` (elenen) · `kosum.mjs` (matris).
  - `kanit-kosusu.mjs` — seçilen yolun kanıt koşusu.
  - `kanit/` — her koşunun UTF-8 log'u + `rapor.json`. **Depoya girer.**
- {{KAPSAM}} içindeki diğer klasörler buraya, oluşturuldukca eklenir.

---

## 📜 GÜNLÜK (madde-tarih)

* **v0.1 · 13/08/2026** — proje ORKESTRA **kod** şablonundan kuruldu.
   > Oluşturulan dosyalar: `CLAUDE.md` (§0 AĞ dahil) · `SON_HAREKETLER.md` · `KONTROL_DOSYASI.md` · `PROJE_KUNYESI.md` · `.gitignore`.
   > Sicile kayıt: `sayac` · panel rengi `#f2c14e`.
   - **Güncel durum:** iskelet var, içerik yok. Bütün çevre boyutları ⛔; ELDE yer tutucuları doldurulmadı.

* **v0.5 · 14/08/2026** — Firefox eklenti test yolu **ölçülerek** seçildi; depodaki ilk çalışan parça.
   > **Karar:** seçilen yol **`playwright-webextext`** · yedek **Mozilla `web-ext` RDP** ·
   > elenen **Playwright'ın kendi Firefox desteği**.
   > **Ölçüm:** 3 aday × 2 manifest = 6 hücre, hepsi aynı cetvelle (eklentinin dışarı attığı
   > HTTP işareti). A: MV2 **E/E/E**, MV3 **E/E/E** · B: MV2 **E/E/E**, MV3 **E/E/E** ·
   > C: MV2 **H/H/H**, MV3 **H/H/H**. Boş hücre yok. Olay üretimi dört geçen hücrede de
   > `canvas.captureStream()` ile **gerçek** oynatma; sentetik olaya hiç düşülmedi.
   > **Eşitliği bozan ölçüt:** Playwright eli — madde 3/4'ün kanıtı sayfayı sürmeyi gerektiriyor,
   > aday B'de tarayıcıyı `web-ext` açar ve tutamaç yoktur.
   > **Aday C artefaktla elendi:** profile düşürülen eklenti **iki biçimde de** (XPI +
   > paketlenmemiş dizin) `extensions.json`'a kaydedilmedi; Playwright API yüzeyinde eklenti
   > yükleme parametresi yok (7 ad tarandı, `bulunan=[]`).
   > **Yan bulgu — madde 3'e girdi:** MV3 host izni riski **gerçekleşmedi**; Firefox 153'te
   > geçici MV3 eklentisinde `host_permissions` etkili oldu. Ürünün manifest sürümü kararı
   > bu turda **verilmedi**, madde 3'e bırakıldı.
   > **Yeni dosyalar:** `TEST_YOLU.md` · `package.json` · `package-lock.json` · `test-yolu/`
   > (iskele + `kanit/` altında 6 log + kanıt koşusu log'u). `.gitignore` ve
   > `KONTROL_DOSYASI.md` güncellendi.
   > **`commit: 0791cd6`**
   - **Güncel durum:** madde 1 kapandı, kanıtı üretilebilir (`node test-yolu\kanit-kosusu.mjs mv2`
     → çıkış kodu 0, iki olay okunur). Ürünün kendisi (sayaç) henüz yok, hiçbir ⛔ boyut kapanmadı.
     Sıradaki adım: madde 2 — saf zaman mantığı. Bilinen engel: LibreWolf makinede kurulu değil.

* **v1.0 · 14/08/2026** — saf zaman mantığı çekirdeği yazıldı ve **bozularak** sınandı; ürünün ilk gerçek parçası.
   > **Karar — durum temsili:** üç bağımsız bayrak + öncelikli türetme
   > (`anaKapali` > `molada` > `videoOynuyor`). Düz dört-durumlu FSM **elendi**: molaya ve
   > ana kapatmaya girmeden önceki durumu hatırlamak zorunda kalır, gizli bir ikinci eksen
   > doğar ve *"ikisi aynı anda olamaz"* garantisi tekrar konvansiyona bağlanırdı. Seçilen
   > temsille çakışma bir test sonucu değil, **yapısal imkânsızlık**: 8 bayrak kombinasyonunun
   > sekizi de dört addan tam birini döndürdü, tabloyla basıldı.
   > **Ölçüm:** `npm test` → **`GECEN: 20 · KALAN: 0`**, çıkış 0 (eşik 12 koşucuya gömülü) ·
   > `npm run mutasyon` → **7/7** bozma yakalandı, çıkış 0.
   > **Saflık iddia edilmedi, ölçüldü:** statik tarama 17 yasaklı belirteç → `bulunan=[]`,
   > yükleme satırı 0 · dinamik tuzak 14 global erişildiğinde fırlatan sahtelerle değiştirildi
   > → **20/20 senaryo yine geçti, tuzak tetiklendi: 0** · determinizm birebir aynı.
   > `process` tuzağa bilerek dâhil edilmedi (koşucunun kendi çıkış yolu ona bağlı) ve bu **yazıldı**.
   > **Mutasyon:** M1 mola önceliği · M2 gece-yarısı sıfırlama · M3 KAPALI süresi · M4 hız çarpanı
   > → dördü de koşucuyu çıkış 1'e düşürdü. T1 değer · T2 alan silme · T3 alan adı yazım hatası
   > → üçü de çıkış 1. **Test boşluğu 0.** Her bozmadan sonra SHA-256 birebir geri geldi.
   > **Düzeltme (test boşluğu DEĞİL):** M1'in ilk beklenti listesi yanlıştı (`S08a` duyarsız —
   > mola sırasında video duraklı); liste türetmeyle düzeltildi, senaryo eklenmedi.
   > **Yeni bağımlılık YOK** — saf JS + Node yerleşikleri yetti.
   > **Yeni dosyalar:** `MANTIK.md` · `mantik/` (`sayac.mjs`, `senaryolar.json`, `kosucu.mjs`,
   > `mutasyon.mjs`, `kanit/` ×2 log). `.gitignore` (`!mantik/kanit/*.log`),
   > `package.json` (`test` + `mutasyon` betikleri), `KONTROL_DOSYASI.md`, `PROJE_KUNYESI.md` güncellendi.
   > **`commit: 8489444`**
   - **Güncel durum:** küme A kapandı (madde 1 + madde 2), ikisinin de kanıtı üretilebilir.
     Kurulabilir eklenti hâlâ yok, hiçbir ⛔ boyut kapanmadı. Sıradaki adım: madde 3 —
     eklenti; `mantik/sayac.mjs` sekme başına çoğullanacak ve `gece-yarısı` olayını üretecek
     taraf orası olacak. Bilinen engel: LibreWolf makinede kurulu değil.

* **v1.5 · 14/08/2026** — eklenti yazıldı: sekme başına ayrı sayaç, on hücrede **ölçülerek** kanıtlandı.
   > **Karar — sayaç mantığı ikinci kez YAZILMADI.** `eklenti/sayac.js`, `mantik/sayac.mjs`'ten
   > **üretilir** (7 `export ` öneki soyulur) ve senkronluk SHA-256'yla kanıtlanır. Elenen iki yol:
   > dinamik `import()` (arka plan başlatması asenkron olurdu, Firefox geçici eklenti bağlamında
   > **ölçülmemiş** risk) ve elle kopyalama (madde 2'nin 20 senaryo + 7/7 mutasyon kanıtını
   > ürünün dışında bırakırdı). **Kontrolün kendisi bozularak sınandı:** tek bayt → çıkış 1 →
   > geri alındı → hash birebir aynı.
   > **Ürün sınırı:** `permissions` ve `host_permissions` **YOK** (`SAYAC_TEKLIF.md:44`);
   > sonda/port/saat kayması yalnız **geçici test kopyasına** enjekte edilir, kaynak kirletilmez.
   > **Mimari:** zaman damgasını **yalnız arka plan** basar; durum arka plan belleğinde
   > `Map<sekmeId, durum>`; olay yakalama `document` üzerinde **yakalama fazında** (sonradan
   > yaratılan `<video>`'lar da yakalanır — YouTube SPA için şart).
   > **Ölçüm:** `npm run eklenti:test` → **çıkış 0**. On hücre: **Y1** 2795/2795 · 2524/2524 ·
   > 2776/2776 · **Y2** sekmeId 1↔2, A izleniyor 7231 / B izleniyor **0** · **Y3** 3229 → **6476**
   > (sıfırlanmadı) · **Y5** `gunBasiMs` +86.400.000, {3231,26,0} → **{133,0,0}** ·
   > **Y6** Δmola 2753/2753, diğer ikisi tam 0 · **Y7** MV3 de geçti · **Y9** **gerçek YouTube**
   > 2806/2806 ve 2755/2755. **Her yeşil hücrede sapma tam 0** (tolerans 250 ms, koşumdan önce sabit).
   > **Y8 — tur 001'in bir iddiası ÇÜRÜTÜLDÜ:** *"host_permissions etkili oldu, izin olmadan
   > geçemezdi"* (`001.result.md:23`) **yanlıştır**. MV2 · izin YOK · ACAO VAR hücresinde `fetch`
   > **çözüldü**; ACAO başlığı tek başına yetiyor ve tur 001'in sunucusu o başlığı koyuyordu.
   > Ayrıca MV3 satırları izni **hiç ölçmüyor** — `playwright-webextext` kökenleri profile
   > önceden izin olarak yazıyor.
   > **İki kutu ÖLÇÜLEMEDİ, adıyla:** **Y4** arka plandaki sekme — `visibilityState` `hidden`
   > yapılamadı, headless **ve** headed'da `"visible"` ölçüldü · **Y10** LibreWolf — ikili indi
   > (162 MB) ve açıldı, RDP `ECONNREFUSED`; üç sertleştirme katmanı (`librewolf.cfg:547`,
   > profil-dizini override, `policies.json` HttpsOnlyMode) adreslendi, aşılamadı.
   > *"Kurulabilir"* iddiası **kanıtsız yazılmadı**.
   > **Madde 2 kırılmadı:** `npm test` → `KALAN: 0` çıkış 0 · `npm run mutasyon` → 7/7 çıkış 0.
   > `mantik/` ve madde 1'in dosyalarına **hiç yazılmadı** (istisna yok).
   > **Yeni dosyalar:** `EKLENTI.md` · `eklenti/` (5 dosya) · `test-yolu/` eki (9 dosya + `sonda/`)
   > + `kanit/eklenti-*` (22 dosya). `package.json`'a 4 betik **eklendi** (mevcut ikisine dokunulmadı),
   > `KONTROL_DOSYASI.md` ve `PROJE_KUNYESI.md` güncellendi. **Yeni bağımlılık YOK.**
   > **`commit: 612ae7a`**
   - **Güncel durum:** kurulabilir eklenti var ve çalıştığı rakamla doğrulandı; **arayüz yok**
     (madde 4). ürün boyutu ⛔ → 🟡. Sıradaki adım: madde 4 — açılır pencere, üç sayaç, iki buton,
     Türkçe; mesaj API'si hazır. Bilinen açıklar: LibreWolf kurulumu ölçülemedi (madde 5'e girdi),
     arka plan sekmesi kutusu ölçülemedi, tarayıcı yeniden başlarsa sayaçlar kaybolur.

* **v2.0 · 14/08/2026** — arayüz yazıldı: açılır pencere, üç sayaç, MOLA ve DUR/DEVAM ET, Türkçe.
   > **Karar — pencere hiçbir süre aritmetiği yapmaz.** Üç toplamı arka plandan hazır alır,
   > yalnız biçimlendirir (`bicim.js`). Doğruluğun tek kaynağı `mantik/sayac.mjs` kaldı.
   > **Karar — MOLA videoyu gerçekten duraklatır** (`SAYAC_TEKLIF.md:50-51`): içerik betiği
   > `runtime.connect` ile port açar, arka plan MOLA'ya geçince o porta `video-duraklat`
   > yollar. Bağlantıyı **içerik betiği** başlattığı için hiçbir izin gerekmez; idempotenttir.
   > **Karar — mola kapanınca video devam ETTİRİLMEZ** (kaynakta yazılı değil, G20).
   > **İzin eklenmedi.** Y14 karşıt deneyi: izinsizken `tabs.query` sekme kimliğini döndürdü
   > (`sorguId=2`), `tabs` izinliyle **birebir aynı** — izin hiçbir fark yaratmadı.
   > **Ölçümler:** `npm run eklenti:test` → **çıkış 0, zorunlu kırmızı 0**. Y15 **13/13** ·
   > Y6 (mesaj API'si yolu) **5 faz, sapma tam 0** — molada üçüncü kova 2508/2508, **KAPALI'da
   > üçü de tam 0** (canlılık Δan=2753), `video.paused=true`, kümülatif sıfırlanmadı ·
   > Y11 **9/9 Türkçe dize birebir** + manifest bildirimi + **ürünün bozulma kelepçesi çalıştı** ·
   > Y1/Y7 eklenti hâlâ yükleniyor (MV2 ve MV3).
   > **⚠️ ÖLÇÜLEMEDİ, adıyla:** butonların **arayüzden** üç durumu — Playwright
   > `moz-extension://` sayfasını süremiyor; **dört yol** birebir hata metniyle elendi
   > (WAR iframe'de `API.tabs` **undefined** · `page.goto` zaman aşımı · `window.open`'a
   > bağlanamıyor · sonda kanalı yarışlı). **Sekme kimliği zinciri:** `arkaplan.js:73-78`
   > önceliği `msg.sekmeId`'yi **gölgeliyor** (`999999`→`1`, `888888`→`1`); pozitif kontrol
   > deneyin **ayırt edici** olduğunu ölçtü (kendi sekmesinde `999999`→`2`).
   > ***"Pencere hedef sekmeyi kendiliğinden buluyor" cümlesi YAZILMADI.***
   > **Bir ara sürümde Y12 KIRMIZI çıktı ve o kırmızı geçerli sayılmadı:** canlı bağlamda
   > pencere sekme **1**'i hedefliyor, arka plan sekme **3**'ü yanıtlıyor. Koşucuya ölçülmüş
   > bir kapı kondu — `pencereHedef !== bgSekmeId` ise hücre "ölçülemedi" diye, iki kimliği de
   > yazarak kapanır (G22). Kutu hâlâ kırmızıya dönebilir.
   > **Y6'nın beklentisi değişti — tolerans DEĞİL, beklenen kova:** ürün davranışı kaynakta
   > yazılı biçimde değişti; ayrıca `durumAdi` ve `video.paused` kontrolleri **eklendi**
   > (hücre güçlendi). **Y10 atlandı**, gerekçesi tabloda görünür.
   > **Çekirdek donmuş kaldı:** `mantik/sayac.mjs` SHA-256 tur başı = tur sonu = `ad848d21…38ac`.
   > `npm test` → `KALAN: 0` · `npm run mutasyon` → 7/7 · `eklenti:kontrol` → senkron.
   > **Yeni dosyalar:** `ARAYUZ.md` · `eklenti/pencere.html|pencere.js|bicim.js` ·
   > `test-yolu/arayuz-e2e.mjs|arayuz-izin.mjs|bicim-testi.mjs|sonda/sonda-pencere.js` +
   > `kanit/eklenti-Y1[1-6]` (12 dosya). **Yeni bağımlılık YOK.**
   > **`commit: 665316a`**
   - **Güncel durum:** arayüzlü, kurulabilir eklenti var; davranışı rakamla doğrulanmış.
     Sıradaki adım: madde 5 — private depo, README, etiket, gizli taraması. Madde 5'e giren
     açıklar: LibreWolf kurulumu (Y10) · arka plandaki sekme (Y4) · gerçek araç çubuğu paneli
     bağlamı · butonların arayüzden ölçümü.

* **v2.1 · 14/08/2026** — madde 3'ün iki açık kutusu kapandı; ölçüm kaydındaki beş yanlış düzeltildi.
   > **✅ Y10 YEŞİL — LibreWolf'a kurulabilirlik KANITLANDI, RDP kullanılmadan.** İmzasız XPI
   > `<profil>\extensions\sayac@sayac.local.xpi` olarak düşürüldü; taşınabilir LibreWolf
   > `-no-remote -profile … -headless` ile başlatıldı. **Artefakt (G11):** `extensions.json` →
   > `active:true · location:"app-profile" · signedState:0 · appDisabled:false`.
   > `signedState 0` (imzasız) **ve** `appDisabled false` → LibreWolf imzasız eklentiyi **kabul
   > etti**. Sondadan **15 işaret**, ölçüm `gecen=11 · kalan=0`, iki durum görüldü.
   > **Aday A ölçülerek elendi, RDP'ye HİÇ VARILMADAN:** düz Playwright'a taşınabilir LibreWolf
   > `executablePath`'i verildi (`playwright-webextext` **kullanılmadı** → `installAddons`/RDP
   > hiç çağrılmadı) → `TimeoutError: browserType.launchPersistentContext: Timeout 45000ms
   > exceeded.` Engel **launch adımındadır**. `ECONNREFUSED` sayacı **artmadı** (4/5'te kaldı);
   > `web-ext` RDP yolu **bilerek denenmedi** (`HEDEF.md:156`).
   > **✅ BONUS — gerçek araç çubuğu paneli ÖLÇÜLDÜ.** LibreWolf kanalı açıldığı için mümkün
   > oldu: karşıt deney `999999 → 999999` · `888888 → 888888` · `getCurrent=yok` → panelde
   > `sender.tab` **YOK**, `msg.sekmeId` yolu **geçerli**; `sorguId=1 = pencereHedef=1`; panel
   > DOM canlı (`0:00:02`, `#uyari` boş). `EKLENTI.md:380`'in doğrulanmamış iddiası **kapandı**.
   > Gölgeleme yalnız **sekme** bağlamlarına özgüymüş.
   > **⚠️ Y4 ÖLÇÜLEMEDİ — üç yol da denendi, üçünün de ölçülen değeri yazıldı:** Y4a
   > `window.open` · Y4b sondadan `tabs.create({active:true})` (**gerçekten** yeni aktif sekme
   > açtı, `id=3`) · Y4c `newPage+bringToFront` → **üçünde de `visibilityState="visible"`**.
   > Taklit yapılmadı (ezme/dispatch yok). Y4b'nin ilk denemesi **geçersizdi ve öyle sayılmadı**:
   > ürünün `onMessage` dinleyicisi sondanınkini gölgeliyordu → ayrı adlı **port** kanalına
   > geçildi; **ürün değişmedi**, `ekIzinler:["tabs"]` yalnız test kopyasına girdi.
   > **🔧 Sayaç hatası:** `ZORUNLU OLCULEMEDI` satırı Y16'yı **saymıyordu** (tam dize
   > karşılaştırması; Y16 ASCII yazıyordu). Basılan `4 → Y4, Y11, Y12, Y13` idi; doğrusu
   > **`5 → Y4, Y16, Y11, Y12, Y13`**. `test-yolu/ortak/durum.mjs` tek kaynak oldu (bilerek
   > bağımlılıksız); sessiz normalleştirme **yok**, sapma `YAZIM SAPMASI` satırıyla **bağırılıyor**.
   > **Sayacın kendisi bozularak sınandı (G26):** `npm run eklenti:sayac-kanit` → **çıkış 0**,
   > üç bacak — sentetik (yeni 2 / eski 1) · gerçek rapor **bellekte** bozuldu (yeni 5→5, eski
   > 4→3) · negatif kontrol (5→4). Disk **değişmedi** (SHA-256 önce = sonra).
   > **Çelişen kalıcı cümleler ölçüme bağlandı** (özgün metin **silinmedi**, G09):
   > `EKLENTI.md:306-307` · `TEST_YOLU.md:293-294` · `librewolf.mjs` baştan yazıldı.
   > **📌 GÜNCEL DURUM kutusunun iç çelişkileri düzeltildi:** *"on hücre sekizi yeşil"* → gerçek
   > rakamlar (**16 hücre: 10 YEŞİL · 5 ölçülemedi · 1 atlandı**) · *"arayüz yok"* (aynı kutunun
   > *"Arayüz VAR"* satırıyla çelişiyordu) · *"LibreWolf kurulu değil"* (aynı kutunun DÜZELTME
   > satırıyla çelişiyordu). `KONTROL_DOSYASI.md:40` aynı eskime. **📜 GÜNLÜK'ün eski
   > maddelerine dokunulmadı** — orası tarihtir.
   > **EMNİYET:** Mustafa'nın LibreWolf'una dokunulmadı — her çağrı taşınabilir geçici kopya +
   > `-no-remote` + `MOZ_NO_REMOTE=1` + kendi profil; kurulu PID kümesi tur başı `[]` = tur sonu `[]`.
   > **Çekirdek donmuş:** `mantik/sayac.mjs` SHA-256 tur başı = tur sonu = `ad848d21…38ac`.
   > `eklenti/` ve `mantik/` **değişmedi**. Yeni bağımlılık **yok**.
   > **`commit: 28695a1`**
   - **Güncel durum:** madde 1-4 kapalı; LibreWolf'a kurulabilirlik ve gerçek panel bağlamı
     artık **kanıtlı**. Kalan tek açık: **Y4** (arka plandaki sekme — üç yol da `visible` ölçtü)
     ve depolama yokluğu (tarayıcı yeniden başlarsa sayaçlar kaybolur). Sıradaki adım:
     **madde 5** — private GitHub deposu, README (kurulum yolu ölçülü), ilk sürüm etiketi,
     gizli taraması.

* **v3.0 · 14/08/2026** — TESLİM. Madde 5'in üç kutusu kapandı, biri `bekliyor`; hedefin son maddesi.
   > **✅ README.md** — altı başlık. Kurulum **iki yol, ikisi de etiketli**: A kalıcı kurulum
   > **ÖLÇÜLDÜ** (dayanağı `eklenti-Y10.json`: `active:true` · `signedState:0` ·
   > `appDisabled:false`; 15 işaret; `geçen=11 kalan=0`), B `about:debugging` **ÖLÇÜLMEDİ**
   > (*"elle gezinme gerektirir"* — *"çalışmıyor"* demek değil). **Ölçümün sınırı aynı
   > bölümde yazılı:** taşınabilir LibreWolf 153.0.4-1, boş tek kullanımlık profil, headless.
   > **Kelepçe:** arayüzün dokuz Türkçe dizesi README'de **9/9** birebir — alıntı ürün
   > dosyalarından yapıldı, kanıt log'undan değil. **Bilinen üç açık gizlenmedi**, olmayan
   > özellik **vaat edilmedi**.
   > **✅ Sır taraması** (`arac/sir-tarama.mjs`) — `npm run sir-tarama` → **çıkış 0**
   > (110 dosya, 0 bulgu, `git check-ignore` üç ad için de satır döndürdü).
   > **Desen tabanlı, entropi tabanlı DEĞİL** — sebep ölçüldü: takip edilen dosyaların yarısı
   > SHA-256 hex ve UUID dolu kanıt dosyası; entropi kuralı **temiz ağaçta kırmızı yanardı**
   > (G22). Yerine 9 sır öneki ailesi + 1 dar atama kuralı (beş daraltma).
   > **✅ Koruma kırmızıya dönebiliyor (G26/K04):** `npm run sir-tarama:kanit` → **çıkış 0**,
   > üç bacak — temiz **0** · sahte sırla **1** (bulgu kendi dosyasında ve **maskelenmiş**:
   > `ghp_…(40 karakter)`) · SHA-256+UUID ile **0**. SHA-256 önce = sonra.
   > Sahte sır üç şartlı: gerçek token değil (`SAHTE` geçer) · kaynakta **bütün hâlde yok**
   > (çalışma zamanında kurulur) · log'a **maskelenmiş** girer.
   > **Bir ölçüm düzeltmesi:** ilk `--kanit` koşumunda bacak 2 çıkış 0 verdi; sebep ölçüldü —
   > dosya o an **izlenmiyordu**, tarama `git ls-files`'a bakıyor. İndekse alınınca beklendiği
   > gibi çıkış 1. **Kural gevşetilmedi**, kapsamın ne olduğu doğru anlaşıldı.
   > **✅ Ürün paketi ölçüldü** — `npm run eklenti:paketle` → `sayac-1.0.0.xpi`, **tam 7 ürün
   > dosyası**, `uret.mjs` pakete **girmiyor** (kelepçe), SHA-256 kayıtlı. Tur 005'te Y10 XPI'yi
   > **test kopyasından** üretmişti; ürünün kendisinden paketleme **ölçülmemişti** — o boşluk kapandı.
   > **✅ Sürüm `1.0.0`, etiket `v1.0.0`** — tur başında dört yerde çelişiyordu; `manifest.json`
   > `0.1.0` → `1.0.0` (tek satır). Gerekçe ve elenen seçenek `TESLIM.md`'de. Değişiklik
   > **hiçbir hücreyi kırmadı**: `eklenti:test` → çıkış 0, 16 hücre 10 YEŞİL / 5 ölçülemedi /
   > 1 atlandı (005 ile aynı tablo).
   > **⏳ Uzak depo `bekliyor`** — `git remote -v` **boş**; depoyu açma adımı Mustafa'nındır.
   > Push **denenmedi**, `<<<DUR>>>` **yazılmadı** — bu bir durma sebebi değil.
   > **✅ `git-rehberi` KISMİ taşındı** (§2.4 + §2.6). `.gitignore` **DEĞİŞMEDİ** — ölçüldü:
   > §2.4 gövdesi bu projeninkinden **zayıf** (20 kural eksik ve `*.log` muafiyeti **yok**;
   > körü körüne uygulansaydı bütün kanıt dosyaları yoksayılırdı). `data/` ve `*.sqlite`
   > eklenmedi — depoda karşılığı yok (ölçüldü). **§2.5 taşınmadı**: gövdesi `git add -A`,
   > bu projede yasak. `kur-sistem.ps1` **kullanılmadı** (Kilit B + tam-taşıma varsayımı).
   > `teslim-disiplini` **taşınmadı** (Mustafa'nın kararı). `.orkestra-surum` elle yazıldı.
   > **Regresyon yok:** `npm test` → `KALAN: 0` · `mutasyon` → 7/7 · `eklenti:kontrol` →
   > SENKRON · `eklenti:test` → çıkış 0 · `eklenti:sayac-kanit` → çıkış 0.
   > `mantik/sayac.mjs` SHA-256 tur başı = tur sonu = `ad848d21…38ac`;
   > `.gitignore` SHA-256 tur başı = tur sonu.
   > **`commit: 9a98745`**
   - **Güncel durum:** madde 1–5 kapalı; **hedefin beş maddesi de bitti**, tek açık kutu
     uzak depodur ve o **Mustafa'nın adımıdır**. Sıradaki adım: private `sayac` deposunu aç →
     `git remote add origin https://github.com/Sudo-Nwep/sayac.git` → `git push -u origin main`
     → `git push origin v1.0.0`. **Push'tan önce** `npm run sir-tarama` çıkış 0 vermelidir.
     Kalan ölçüm açığı (kapsam dışı): Y4 arka plandaki sekme · depolama yok.

* *(Bir sonraki madde buraya eklenecek — aşağıdaki kurallara göre.)*

---

## ✍️ Bu günlük nasıl güncellenir (devam kuralları)

Her gerçek ilerlemede **GÜNLÜK'ün en altına** yeni madde ekle:

1. **Format:** `* **vX.Y · GG/AA/YYYY** — [ne yapıldı / hangi karar].`
2. **Versiyon atlaması:** küçük → **v+0.1** · gerçek yeni çalışan parça → **v+0.5** · yeni aşama → **bir üst tam sürüm**.
3. **Madde içinde blockquote olarak** kararlar + değişen dosyalar + **`commit: <hash7>`**.
   > **Altın kural:** günlük maddesi varsa commit'i de vardır. Commit'siz madde yazma.
4. **Hemen altına ZORUNLU güncel durum özeti** (boş bırakılamaz):
   `   - **Güncel durum:** [aşama, açık işler, sıradaki adım].`
5. **Aynı anda 📌 GÜNCEL DURUM kutusunu da güncelle** (Versiyon satırı dahil).
6. Bir ⛔ boyut kapandıysa **`PROJE_KUNYESI.md`'yi de güncelle** — yoksa künye yalan söyler.
7. Yeni dosya/klasör eklenirse **🗂️ Proje Dosyaları**'na işle.
