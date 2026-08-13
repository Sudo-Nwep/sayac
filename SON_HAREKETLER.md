# Sayac — Son Hareketler (Proje Günlüğü)

> **Yeni sohbete başlarken:**
> 1. Önce **📌 GÜNCEL DURUM** kutusunu oku — projenin şu anki hâli orada.
> 2. `PROJE_KUNYESI.md`'ye bak — henüz **olmayan** şeyler orada.
> 3. İlerleme kaydedeceksen **✍️ Bu günlük nasıl güncellenir** kurallarını izle.

---

## 📌 GÜNCEL DURUM (her zaman en güncel — önce bunu oku)

- **Versiyon:** v0.5
- **Aşama:** {{ASAMA}} — fiilen: `HEDEF.md` madde 1 kapandı, madde 2 sırada
- **Amaç:** {{AMAC}}
- **Kapsam:** {{KAPSAM}}
- **Depo/çalışır mı:** **evet — ilk çalışan parça var.** Firefox eklenti test yolu ölçüldü,
  seçildi ve kanıtlandı: boş sınama eklentisi yükleniyor, iki olay okunuyor
  (`node test-yolu\kanit-kosusu.mjs mv2` → çıkış kodu 0). Ürünün kendisi (sayaç) **henüz yok**.
- **Seçilen test yolu:** `playwright-webextext` · yedek: Mozilla `web-ext` RDP ·
  elenen: Playwright'ın kendi Firefox desteği. Gerekçe + rakamlar `TEST_YOLU.md`.
- **Açık işler:** `PROJE_KUNYESI.md`'deki ⛔ boyutlar + doldurulmamış ELDE yer tutucuları
  (bu turda **hiçbiri kapanmadı** — ürün hâlâ yok, künye değişmedi).
- **Sıradaki adım:** `HEDEF.md` madde 2 — saf zaman mantığı (tarayıcısız sınanabilir modül).
  Madde 1'den bağımsızdır; küme A'nın ikinci yarısıdır.
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
