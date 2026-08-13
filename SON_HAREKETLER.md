# Sayac — Son Hareketler (Proje Günlüğü)

> **Yeni sohbete başlarken:**
> 1. Önce **📌 GÜNCEL DURUM** kutusunu oku — projenin şu anki hâli orada.
> 2. `PROJE_KUNYESI.md`'ye bak — henüz **olmayan** şeyler orada.
> 3. İlerleme kaydedeceksen **✍️ Bu günlük nasıl güncellenir** kurallarını izle.

---

## 📌 GÜNCEL DURUM (her zaman en güncel — önce bunu oku)

- **Versiyon:** v1.5
- **Aşama:** {{ASAMA}} — fiilen: madde 1 · 2 · 3 kapandı; **kurulabilir eklenti var**, madde 4 (arayüz) sırada
- **Amaç:** {{AMAC}}
- **Kapsam:** {{KAPSAM}}
- **Depo/çalışır mı:** **evet — kurulabilir bir Firefox eklentisi var.** Üretilebilir kanıtlar:
  `npm run eklenti:test` → çıkış 0 (on hücre, **sekizi yeşil**, gerçek YouTube dâhil) ·
  `npm run eklenti:kontrol` → çıkış 0 (üretim senkron) · `npm test` → `KALAN: 0`, çıkış 0 ·
  `npm run mutasyon` → 7/7, çıkış 0.
  **Arayüz YOK** — kullanıcı sayaçları henüz göremez; bu turda makine okudu (madde 4).
- **Seçilen test yolu:** `playwright-webextext` · yedek: Mozilla `web-ext` RDP ·
  elenen: Playwright'ın kendi Firefox desteği. Gerekçe + rakamlar `TEST_YOLU.md`.
- **Zaman mantığı:** `mantik/sayac.mjs` — saf (statik **ve** dinamik olarak ölçüldü),
  değişmez, serileştirilebilir; tek sayaç birimi modeller. Ayrıntı `MANTIK.md`.
- **Eklenti:** `eklenti/` — MV2, **hiçbir host izni yok**, içerik betiği yalnız YouTube'a
  enjekte olur. `eklenti/sayac.js` çekirdekten **üretilir**, senkronluk SHA-256'yla kanıtlı.
  Ayrıntı `EKLENTI.md`.
- **Açık işler:** `PROJE_KUNYESI.md`'deki boyutlar + doldurulmamış ELDE yer tutucuları.
  **ürün** boyutu ⛔ → 🟡 oldu (kod ve doğrulaması var; arayüz yok, LibreWolf kurulumu ölçülemedi).
- **Sıradaki adım:** `HEDEF.md` madde 4 — arayüz (üç sayaç, iki buton, Türkçe). Mesaj API'si
  hazır; MOLA'nın videoyu duraklatması orada yazılır.
- **⚠️ Bilinen açıklar:** ⑴ **LibreWolf'a kurulum ÖLÇÜLEMEDİ** (RDP `ECONNREFUSED`) — teslim
  ölçütü LibreWolf, madde 5'in işi · ⑵ **arka plandaki sekme kutusu ÖLÇÜLEMEDİ**
  (`visibilityState` `hidden` yapılamadı) · ⑶ tarayıcı yeniden başlarsa sayaçlar **kaybolur**
  (durum bellekte, depolama eklenmedi).
- **⚠️ Madde 3 için bilinen engel:** LibreWolf bu makinede **kurulu değil** — *"LibreWolf'a
  kurulur"* kanıtı bugün üretilemez. Kararı madde 3'ün turu verecek.

---

## 🗂️ Proje Dosyaları (ve ilişkileri)

- **`CLAUDE.md`** — açılış protokolü; her sohbette Claude'un çalışma şekli. §0 AĞ bloğu ORKESTRA bağlantısıdır.
- **`SON_HAREKETLER.md`** — bu dosya; proje hafızası / giriş noktası.
- **`KONTROL_DOSYASI.md`** — aktif işin ve değişken verinin tek kaynağı.
- **`PROJE_KUNYESI.md`** — **ne YOK** dosyası: ⛔ çevre boyutları + doldurulmamış ELDE yer tutucuları.
- **`.gitignore`** — repoya girmeyecekler (secret dahil). `test-yolu/kanit/*.log` bilerek
  **muaf** tutuldu: kanıt depoya girer.
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
