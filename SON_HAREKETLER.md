# Sayac — Son Hareketler (Proje Günlüğü)

> **Yeni sohbete başlarken:**
> 1. Önce **📌 GÜNCEL DURUM** kutusunu oku — projenin şu anki hâli orada.
> 2. `PROJE_KUNYESI.md`'ye bak — henüz **olmayan** şeyler orada.
> 3. İlerleme kaydedeceksen **✍️ Bu günlük nasıl güncellenir** kurallarını izle.

---

## 📌 GÜNCEL DURUM (her zaman en güncel — önce bunu oku)

- **Versiyon:** v1.0
- **Aşama:** {{ASAMA}} — fiilen: `HEDEF.md` **küme A kapandı** (madde 1 + madde 2), madde 3 sırada
- **Amaç:** {{AMAC}}
- **Kapsam:** {{KAPSAM}}
- **Depo/çalışır mı:** **evet — ürünün ilk gerçek parçası var.** İki üretilebilir kanıt:
  `npm test` → `GECEN: 20 · KALAN: 0`, çıkış 0 · `npm run mutasyon` → 7/7 bozma yakalandı,
  çıkış 0 · `node test-yolu\kanit-kosusu.mjs mv2` → çıkış 0.
  **Kurulabilir eklenti hâlâ YOK** — sayaç mantığı ile tarayıcı arası bağ kurulmadı.
- **Seçilen test yolu:** `playwright-webextext` · yedek: Mozilla `web-ext` RDP ·
  elenen: Playwright'ın kendi Firefox desteği. Gerekçe + rakamlar `TEST_YOLU.md`.
- **Zaman mantığı:** `mantik/sayac.mjs` — saf (statik **ve** dinamik olarak ölçüldü),
  değişmez, serileştirilebilir; tek sayaç birimi modeller. Ayrıntı `MANTIK.md`.
- **Açık işler:** `PROJE_KUNYESI.md`'deki ⛔ boyutlar + doldurulmamış ELDE yer tutucuları.
  **Hiçbir boyut kapanmadı**; ürün boyutunun *"sıradaki tek somut adım"* sütunu artık dolu.
- **Sıradaki adım:** `HEDEF.md` madde 3 — eklenti (LibreWolf + YouTube). `mantik/sayac.mjs`'in
  N örneğiyle sekme başına çoğullanacak ve `gece-yarısı` olayını **üretecek taraf orası**.
- **⚠️ Madde 3'e devreden sözleşme:** `gece-yarısı`'nın zaman damgası **çağıranın**
  sorumluluğudur — modül saf olduğu için 00:00'ı bilemez; olay geç gelirse fark eski güne
  yazılır ve silinir.
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
