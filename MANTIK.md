# Saf zaman mantığı — madde 2 raporu

> **Hedef 1 · madde 2** (`HEDEF.md:62-74`). Olay girip üç toplam çıkaran, tarayıcıya ·
> gerçek saate · zamanlayıcıya · global duruma **bağlı olmayan** saf modül; doğruluğu
> koddan ayrı bir senaryo tablosunda; tablonun ve kodun gerçekten ölçtüğü **bozularak**
> kanıtlandı.
> **Tarih:** 14/08/2026 · **Node:** v26.5.0 · **Yeni bağımlılık:** yok (saf JS + Node yerleşikleri)

---

## Sonuç — tek cümle

`mantik/sayac.mjs` yazıldı; **20 senaryo geçti (`GECEN: 20 · KALAN: 0`, çıkış 0)**; saflık
statik **ve** dinamik olarak ölçüldü; **4 kod mutantı + 3 tablo bozması = 7/7 yakalandı**
(çıkış 0) ve her bozmadan sonra kaynak SHA-256 birebir geri geldi.

---

## Kuralların kaynağı — hiçbiri uydurulmadı

`VERI_MODELI.md` bu projede **yoktur**; karşılığı `SAYAC_TEKLIF.md` + `HEDEF.md`'dir.
Aşağıdaki dokuz satırın **hepsi kaynaktan okunarak doğrulandı**, prompttan kopyalanmadı.

| Kural | Kaynak | Doğrulandı |
|---|---|---|
| Üç sayaç: İZLENİYOR (oto) · DURAKLATILDI (oto) · MOLA (manuel) | `SAYAC_TEKLIF.md:18-22` | ✓ |
| Gerçek zaman sayılır; 2× hızda 10 dk video = **5 dk** yazar | `SAYAC_TEKLIF.md:30-31` | ✓ |
| Yeni video açılınca sayaç sıfırlanmaz — sayaç videoya değil **sekmeye** bağlı | `SAYAC_TEKLIF.md:33-34` | ✓ |
| 00:00'da üç sayaç sıfırlanır; geçmiş gün saklanmaz | `SAYAC_TEKLIF.md:36-37` · `:102` | ✓ |
| MOLA: video duraklatılır, İZLENİYOR+DURAKLATILDI durur, MOLA işler | `SAYAC_TEKLIF.md:50-55` | ✓ |
| DUR/DEVAM ET: **hiçbir sayaç işlemez** — moladan farkı budur | `SAYAC_TEKLIF.md:57-59` | ✓ |
| Ana anahtar (tek anahtar, iki konum) | `SAYAC_TEKLIF.md:107` · `HEDEF.md:33` | ✓ |
| Dört durum, ikisi aynı anda olamaz | `HEDEF.md:69` | ✓ |
| Olay dağarcığı: `oynat` `duraklat` `mola-aç` `mola-kapat` `ana-kapat` `gece-yarısı` | `HEDEF.md:67` | ✓ |
| Duraklatma geçmişi listesi YOK → modül geçmiş tutmaz | `SAYAC_TEKLIF.md:79` · `:81` | ✓ |

---

## Durum modeli — çakışma bir test sonucu değil, yapısal imkânsızlık

**Üç bağımsız bayrak + öncelikli türetme.** Tek bir `durum` değişkeni tutan düz FSM elendi:
molaya girmeden önceki durumu ve ana anahtar kapanmadan önceki durumu **hatırlamak**
zorunda kalırdı — yani gizli bir ikinci eksen doğar ve "ikisi aynı anda olamaz" garantisi
tekrar bir konvansiyona bağlanırdı.

```
durum = { t, anaKapali, molada, videoOynuyor, toplam:{izleniyor, duraklatildi, mola} }
```

| Öncelik | Koşul | Görünen durum |
|---|---|---|
| 1 | `anaKapali` | `KAPALI` |
| 2 | `molada` | `MOLA` |
| 3 | `videoOynuyor` | `İZLENİYOR` |
| 4 | aksi hâlde | `DURAKLATILDI` |

`durumAdi()` **her zaman** dört addan tam birini döndürür → çakışma imkânsızdır.
`molada=true` iken `anaKapali=true` olabilmesi bir çakışma **değildir**: görünen durum
tektir (`KAPALI`), mola bayrağı yalnız hatırlanır (senaryo `S17`).

**Türkçe `i` tuzağı:** durum adları sabit dizelerle karşılaştırılır;
`toUpperCase()`/`toLowerCase()` **kullanılmaz** — `İ`/`ı` dönüşümü yerelde bozulur.

## Olay etki tablosu

`uygula()` sırası **kesin — önce süre, sonra geçiş**:
① `durum.t → olay.t` aralığı, **mevcut** görünen duruma karşılık gelen kovaya eklenir
(`KAPALI` ise **hiçbir kovaya**) · ② sonra olay bayrakları değiştirir.

| Olay | Etki | Neden böyle |
|---|---|---|
| `oynat` | `videoOynuyor = true` — **kipten bağımsız** | MOLA'ya basınca video duraklatılır (`:51`), tarayıcı bir duraklatma olayı üretir; modül videoyu kendisi duraklatmaz, **yalnız gerçeği kaydeder** |
| `duraklat` | `videoOynuyor = false` — kipten bağımsız | aynı gerekçe; mola kapanınca doğru durum kayıtlı bayraktan türetilir |
| `mola-aç` | `molada = true` (idempotent) | `S15` ölçüyor |
| `mola-kapat` | `molada = false` (idempotent) | `S15` ölçüyor |
| `ana-kapat` | `anaKapali = !anaKapali` — **toggle** | tek anahtar, iki konum (`SAYAC_TEKLIF.md:57` "DUR / DEVAM ET", `:107` "ana anahtar", `HEDEF.md:33` "ana aç/kapa anahtarı"). Dağarcık genişletilmedi, `ana-aç` diye yeni olay **uydurulmadı** (G20) |
| `gece-yarısı` | üç toplam sıfırlanır, **bayraklar korunur** | video oynuyorsa İZLENİYOR sıfırdan devam eder (`:36-37`) |

**"Yeni video açılınca sıfırlanmaz" yapısal olarak sağlanır:** modülde *"video değişti"*
diye bir olay **yoktur**, dolayısıyla sıfırlayacak bir yer de yoktur.

**`hiz` alanı modül tarafından okunmaz.** Şemada tanımlıdır ki *"oynatma hızı hesaba
girmez"* iddiası **ölçülebilir** olsun: `S13a` (hiz 1) ve `S13b` (hiz 4) aynı zaman
damgalarına sahiptir ve **aynı** toplamı bekler. Alan olmasaydı bu kutu boş bir kontrol
olurdu (G22). Mutant **M4** bunu kanıtlıyor: `hiz` çarpan yapılınca `S13b` kırılıyor.

## Dışa açılan yüzey

| Ad | İmza | Davranış |
|---|---|---|
| `DURUMLAR` | sabit | Dört durum adı; başka yerde durum dizesi sabiti yazılmaz |
| `OLAY_TURLERI` | sabit | Altı olay adı; tanınmayan tür **fırlatır** |
| `baslangic(t0)` | → durum | Ana açık · mola kapalı · video duraklı · üç toplam 0 |
| `uygula(durum, olay)` | → **YENİ** durum | Değişmez: girdi nesnesi mutasyona uğramaz (`Object.freeze`) |
| `ozet(durum, t)` | → üç toplam | `durum.t → t` aralığını ekler; `t < durum.t` ise **fırlatır** |
| `durumAdi(durum)` | → dize | Dört addan **tam biri** |
| `calistir(t0, olaylar, tSon)` | → `{toplam, durumAdi}` | Tablo koşucusunun sarmalayıcısı |

**Birim: milisaniye, tam sayı.** Kayan nokta yok → toplamlar birebir karşılaştırılabilir.
Alan adları ASCII (`izleniyor` · `duraklatildi` · `mola`) — JSON anahtarı olarak güvenli.
Arayüz biçimlendirmesi (saat:dakika) **madde 4'ün işi**; modül ham sayı döndürür.

---

## Sözleşme — madde 3'ün turuna devrediliyor

1. **`gece-yarısı` olayının zaman damgası ÇAĞIRANIN sorumluluğudur.** Modül saf olduğu için
   00:00'ı kendisi bilemez. Çağıran, olayı **tam gece yarısı anının** damgasıyla gönderir;
   modül o ana kadar biriktirir, sonra sıfırlar. Olay geç gelirse aradaki fark **eski güne**
   yazılır ve silinir — sapma, çağıranın gecikmesi kadardır. Madde 3 bu olayı üretecek taraftır.
2. **Modül TEK sayaç birimini modeller.** Sekme başına çoğullama madde 3'ün işidir; orada bu
   modülün N örneği kullanılır. Durum nesnesi **değişmez** ve **serileştirilebilir** olduğu için
   çoğullama ve depolama madde 3'te fazladan tek satır yazmadan gelir.
3. **`ana-kapat` toggle'dır.** Madde 4'ün DUR/DEVAM ET butonu bu **tek** olayı gönderir.
4. **KAPALI baskındır.** Kapalıyken `mola-aç` gelirse görünen durum `KAPALI` kalır, `molada`
   bayrağı yine de kaydedilir; ana anahtar açılınca MOLA'ya dönülür (`S17`). Bu ayrı bir kural
   değil, öncelikli türetmenin doğal sonucudur.

---

## Bölüm A — saflık ÖLÇÜLDÜ, iddia edilmedi

> **Neden iki yol birden:** statik tarama bir **YOKLUK** ölçer — G22'nin tam konusu.
> Dinamik tuzak bir **VARLIK** ölçer: *"global'ler zehirliyken bile doğru sonuç üretti."*
> Yalnız statik kontrolle kapatılan bu madde, ölçüyor görünüp hiçbir şey ölçmezdi (K05).

**A1 — statik tarama** (`npm test` çıktısından birebir):

```
A1 statik tarama — dosya: mantik/sayac.mjs (6292 bayt, 189 satır)
   taranan yasaklı belirteç listesi (17): Date · performance · setTimeout · setInterval · Math.random · process · fetch · window · document · localStorage · browser. · chrome. · import · require · globalThis · eval · new Function
   bulunan=[]
   yükleme satırı sayısı (import/require): 0
   ✓ statik: temiz
```

**A2 — dinamik global tuzağı** (erişildiğinde fırlatan sahteler):

```
A2 dinamik global tuzağı — erişildiğinde fırlatan sahtelerle değiştirildi
   tuzaklanan global: 14 (Date · performance · setTimeout · setInterval · setImmediate · fetch · localStorage · sessionStorage · document · window · browser · chrome · XMLHttpRequest · Math.random)
   tuzak altında geçen senaryo: 20/20
   tuzak tetiklendi: 0
   NOT: "process" tuzağa DAHİL EDİLMEDİ — koşucunun kendi çıkış/akış yazma yolu ona bağlı;
        statik tarama (A1) onu zaten kapsıyor ve bulunan=[] döndürdü.
   ✓ dinamik: global'ler zehirliyken bile tüm senaryolar koştu
```

`process` **bilerek hariç tutuldu ve bu yazıldı** — sessizce atlanmadı. Koşucunun kendi
çıkış kodu ve akış yazma yolu ona bağlıdır; A1 onu zaten kapsıyor.

**A3 — determinizm:**

```
A3 determinizm — aynı senaryolar iki kez koşuldu
   1. koşu 1604 bayt · 2. koşu 1604 bayt · birebir aynı: true
```

**A4 — 8 bayrak kombinasyonu** (2×2×2), hepsi dört addan **tam birini** döndürdü:

| anaKapali | molada | videoOynuyor | `durumAdi()` | dört addan tam biri |
|---|---|---|---|---|
| false | false | false | DURAKLATILDI | evet |
| false | false | true | İZLENİYOR | evet |
| false | true | false | MOLA | evet |
| false | true | true | MOLA | evet |
| true | false | false | KAPALI | evet |
| true | false | true | KAPALI | evet |
| true | true | false | KAPALI | evet |
| true | true | true | KAPALI | evet |

**İhlal denemesi** — üç bayrak birden `true` → tek değer: **`KAPALI`**. ✓

---

## Bölüm B — koşucunun katılığı

Aşağıdakilerden **herhangi biri** → hata mesajı + çıkış 1: üst düzeyde `surum`/`birim`/
`senaryolar` dışında alan · senaryoda tanımsız ya da eksik alan · `id` tekrarı · boş
`olaylar` · olayda `t`/`tur`/`hiz` dışında alan · `tur` altı addan biri değil · `t`
monotonik değil ya da `baslangic.t`'den küçük · `son` < son olayın `t`'si · `beklenen`
tam üç alan değil ya da bir değer tam sayı/negatif · `beklenenDurum` dört addan biri değil ·
**senaryo sayısı < 12**.

**12 eşiği koşucuya gömülüdür** (`HEDEF.md:73`) ki sonradan sessizce düşürülemesin.
Katılığın kendisi de sınandı — aşağıdaki T1/T2/T3.

---

## Bölüm C — 16 kutunun senaryo karşılıkları

**20 senaryo** (eşik 12). Boş kutu yok.

| # | Ne ölçer | Senaryo `id` | Ölçülen |
|---|---|---|---|
| 1 | Yalnız izleniyor | `S01-yalniz-izleniyor` | izleniyor=10000 |
| 2 | Yalnız duraklatıldı (hiç `oynat` yok) | `S02-yalniz-duraklatildi` | duraklatildi=10000 |
| 3 | Karışık dizi | `S03-karisik-dizi` | 9000 / 3000 / 0 |
| 4 | **MOLA: iki sayaç durur, üçüncü işler** | `S04-mola-ucuncu-sayac-isler` | 4000 / 3000 / **6000** |
| 5 | `mola-kapat` sonrası kaldığı yerden devam | `S05-mola-kapaninca-kaldigi-yerden` | 5000 / 0 / 5000 |
| 6 | Mola sırasında `oynat` → mola bozulmaz | `S06-mola-sirasinda-oynatma` | 3000 / 1000 / 5000 |
| 7 | **KAPALI: üçü de durur** | `S07-ana-kapali-ucu-de-durur` | 3000 / **0** / **0** |
| 8 | **MOLA ≠ KAPALI**, aynı olay dizisi | `S08a-…-mola-kipinde` · `S08b-…-kapali-kipinde` | **mola 10000** ↔ **hiçbiri 0** |
| 9 | `ana-kapat` toggle; ara süre hiçbir kovaya yazılmaz | `S09-ana-anahtar-kapat-ac` | 4000 / 0 / 0 (7000 ms kayıp, kasıtlı) |
| 10 | **Gece yarısı**: sıfırlanır, İZLENİYOR sıfırdan devam | `S10-gece-yarisi-izlenirken` | 3000 / 0 / 0 |
| 11 | **Gece yarısı MOLA sırasında** | `S11-gece-yarisi-mola-sirasinda` | 0 / 0 / 3000 |
| 12 | **Gece yarısı KAPALI iken** | `S12-gece-yarisi-ana-kapaliyken` | 0 / 0 / 0 |
| 13 | **Oynatma hızı**: `hiz:1` ↔ `hiz:4`, **aynı** toplam | `S13a-oynatma-hizi-bir` · `S13b-oynatma-hizi-dort` | ikisi de **10000 / 2000 / 0** |
| 14 | İdempotanlık | `S14-ust-uste-oynat-etkisiz` · `S15-ust-uste-mola-etkisiz` | 8000/1000/0 · 0/5000/5000 |
| 15 | Sıfır süreli aralık (iki olay aynı `t`) | `S16-sifir-sureli-aralik` (ayrıca `S04`, `S08a/b`, `S14`, `S18`) | 0 / 5000 / 0 |
| 16 | KAPALI iken `mola-aç` → açılınca MOLA | `S17-kapaliyken-mola-ac` | 2000 / 0 / 3000, durum **MOLA** |
| — | Altı olay türü tek dizide, başlangıç anı **sıfır değil** | `S18-uzun-karma-sifirdan-farkli-baslangic` | 4000 / 0 / 0 |

### Kutu 8 — MOLA ile KAPALI yan yana (asıl ayrım)

Aynı olay dizisi, **tek fark ikinci olayın türü**:

| Senaryo | Olaylar | izleniyor | duraklatildi | **mola** | durum |
|---|---|---|---|---|---|
| `S08a` | oynat@0 · **mola-aç**@2000 · duraklat@2000 · son 12000 | 2000 | 0 | **10000** | MOLA |
| `S08b` | oynat@0 · **ana-kapat**@2000 · duraklat@2000 · son 12000 | 2000 | 0 | **0** | KAPALI |

Aynı 10.000 ms: molada üçüncü kaleme yazılır, kapalıda **hiçbir kaleme** yazılmaz.
`SAYAC_TEKLIF.md:59`'un ölçülmüş hâli.

### Otomatik invaryant — 20 senaryoya bedava 20 çakışma kontrolü

Koşucu her senaryoda, senaryo yazarı istemese de şunu kendisi kontrol eder:

> `izleniyor + duraklatildi + mola` **=** (`son` − `tBaz`) − KAPALI'da geçen süre

`tBaz` = son `gece-yarısı` olayının anı (yoksa `baslangic.t`) — sıfırlama öncesi birikim
silindiği için taban oraya kayar. KAPALI süresi kovalardan değil `durumAdi()`'den türetilir,
yani koddan **bağımsız ikinci yol**. Bu, *"iki kova aynı anda işledi"* ve *"süre kayboldu"*
hatalarının ikisini de yakalar. **20/20 senaryoda invaryant sağlandı.**

---

## Mutasyon — bozuldu, kırmızıya döndü, geri alındı

Her mutant **AYRI ÇOCUK SÜREÇTE** koştu. Sebep: ESM modül önbelleği aynı süreçte diskteki
değişikliği yeniden yüklemez — bozulmuş dosyayı aynı süreçte yüklemek eski sürümü verir ve
sınama **yalancı yeşil** döner. Sert sayaç 30 sn + zaman aşımında `taskkill /T /F`.

### A — Kod mutantları (`mantik/sayac.mjs`)

| Mutant | Bozma | Koşucu çıkışı | Kırdığı senaryolar | SHA-256 önce=sonra |
|---|---|---|---|---|
| **M1** | MOLA önceliği kaldırıldı (video oynuyorsa İZLENİYOR sayılır) | **1** | `S05`, `S06`, `S11`, `S17` | ✓ |
| **M2** | `gece-yarısı` sıfırlamayı atlıyor | **1** | `S10`, `S11`, `S12`, `S18` | ✓ |
| **M3** | KAPALI'da geçen süre `duraklatildi`'ya yazılıyor | **1** | `S07`, `S08b`, `S09`, `S12`, `S17` | ✓ |
| **M4** | `hiz` çarpan olarak kullanılıyor | **1** | `S13b` | ✓ |

**Hiçbir mutant "kırmadan geçmedi"** — test boşluğu sayısı **0**.

> **M1'in ilk koşusunda bir düzeltme yapıldı ve bu bir test boşluğu DEĞİLDİ.**
> İlk beklentim `S05, S06, S08a` idi; ölçüm `S05, S06, S11, S17` verdi. Yanlış olan
> beklentiydi, kod değil. M1 yalnızca **`molada && videoOynuyor && !anaKapali`** iken
> **sıfırdan büyük** aralık varsa fark yaratır:
> `S04` ve `S08a` duyarsızdır çünkü mola sırasında video **duraklıdır**; `S18` de duyarsızdır
> çünkü koşul sağlanır ama sondaki `gece-yarısı` birikimi siler. `S11` ve `S17` ise mola
> sırasında video oynadığı için duyarlıdır. Beklenti listesi bu türetmeye göre düzeltildi;
> senaryo **eklenmedi**, çünkü mutant zaten dört senaryo kırıyordu.

### B — Tablo bozmaları (`mantik/senaryolar.json`)

| Bozma | Ne yapıldı | Koşucu çıkışı | Reddin gerekçesi | SHA-256 önce=sonra |
|---|---|---|---|---|
| **T1** | `S01.beklenen.izleniyor`: 10000 → 9999 | **1** | senaryo kırıldı: `S01-yalniz-izleniyor` | ✓ |
| **T2** | `S03.beklenenDurum` **silindi** | **1** | şema reddi — 2 hata (EKSİK alan) | ✓ |
| **T3** | `S05.beklenen` → `beklenenn` yazım hatası | **1** | şema reddi — 3 hata (TANIMSIZ + EKSİK alan) | ✓ |

Üçünde de çıkış **1**: koşucu eksik alanı da tanımsız alanı da **sessizce varsaymıyor**.

### Geri alma — iki bağımsız ayak

```
sayac.mjs       SHA-256 (başlangıç): ad848d21f22916de80c2b5ab9f6c17a8872b93e83070860487438fed12ec38ac
sayac.mjs       SHA-256 (bitiş):     ad848d21f22916de80c2b5ab9f6c17a8872b93e83070860487438fed12ec38ac
senaryolar.json SHA-256 (başlangıç): 4b853417cc8bdf7e51572e78b18066ef9653c65f2a6f9e395c341c381800ab46
senaryolar.json SHA-256 (bitiş):     4b853417cc8bdf7e51572e78b18066ef9653c65f2a6f9e395c341c381800ab46
geri alma: sayac.mjs BİREBİR AYNI · senaryolar.json BİREBİR AYNI
```

İkinci ayak `git status --porcelain` — aşağıda.

---

## Koşulan komutlar ve çıktıları — birebir

### `npm test`

```
GECEN: 20 · KALAN: 0 · TOPLAM: 20
NPM TEST CIKIS KODU: 0
```

Senaryo satırları (Bölüm C, birebir):

```
  ✓ S01-yalniz-izleniyor                       izleniyor= 10000 duraklatildi=     0 mola=     0 durum=İZLENİYOR
  ✓ S02-yalniz-duraklatildi                    izleniyor=     0 duraklatildi= 10000 mola=     0 durum=DURAKLATILDI
  ✓ S03-karisik-dizi                           izleniyor=  9000 duraklatildi=  3000 mola=     0 durum=İZLENİYOR
  ✓ S04-mola-ucuncu-sayac-isler                izleniyor=  4000 duraklatildi=  3000 mola=  6000 durum=DURAKLATILDI
  ✓ S05-mola-kapaninca-kaldigi-yerden          izleniyor=  5000 duraklatildi=     0 mola=  5000 durum=İZLENİYOR
  ✓ S06-mola-sirasinda-oynatma                 izleniyor=  3000 duraklatildi=  1000 mola=  5000 durum=İZLENİYOR
  ✓ S07-ana-kapali-ucu-de-durur                izleniyor=  3000 duraklatildi=     0 mola=     0 durum=KAPALI
  ✓ S08a-ayni-dizi-mola-kipinde                izleniyor=  2000 duraklatildi=     0 mola= 10000 durum=MOLA
  ✓ S08b-ayni-dizi-kapali-kipinde              izleniyor=  2000 duraklatildi=     0 mola=     0 durum=KAPALI
  ✓ S09-ana-anahtar-kapat-ac                   izleniyor=  4000 duraklatildi=     0 mola=     0 durum=İZLENİYOR
  ✓ S10-gece-yarisi-izlenirken                 izleniyor=  3000 duraklatildi=     0 mola=     0 durum=İZLENİYOR
  ✓ S11-gece-yarisi-mola-sirasinda             izleniyor=     0 duraklatildi=     0 mola=  3000 durum=MOLA
  ✓ S12-gece-yarisi-ana-kapaliyken             izleniyor=     0 duraklatildi=     0 mola=     0 durum=KAPALI
  ✓ S13a-oynatma-hizi-bir                      izleniyor= 10000 duraklatildi=  2000 mola=     0 durum=İZLENİYOR
  ✓ S13b-oynatma-hizi-dort                     izleniyor= 10000 duraklatildi=  2000 mola=     0 durum=İZLENİYOR
  ✓ S14-ust-uste-oynat-etkisiz                 izleniyor=  8000 duraklatildi=  1000 mola=     0 durum=İZLENİYOR
  ✓ S15-ust-uste-mola-etkisiz                  izleniyor=     0 duraklatildi=  5000 mola=  5000 durum=DURAKLATILDI
  ✓ S16-sifir-sureli-aralik                    izleniyor=     0 duraklatildi=  5000 mola=     0 durum=İZLENİYOR
  ✓ S17-kapaliyken-mola-ac                     izleniyor=  2000 duraklatildi=     0 mola=  3000 durum=MOLA
  ✓ S18-uzun-karma-sifirdan-farkli-baslangic   izleniyor=  4000 duraklatildi=     0 mola=     0 durum=İZLENİYOR
```

Tam ham çıktı: `mantik/kanit/test-kosusu.log` (UTF-8, depoda).

### `npm run mutasyon`

```
kod mutantı   : 4 · yakalanan: 4
tablo bozması : 3 · yakalanan: 3
test boşluğu (hiçbir senaryoyu kırmayan mutant): 0
geri alma: sayac.mjs BİREBİR AYNI · senaryolar.json BİREBİR AYNI

SONUÇ: 7/7 bozma beklendiği gibi yakalandı
CIKIS KODU: 0
```

Tam ham çıktı: `mantik/kanit/mutasyon.log` (UTF-8, depoda).

### Kanıtın depoya girdiği — ölçüldü (tur 001'in G22 tuzağının tekrarı engellendi)

`.gitignore:30` `*.log` genel kuralı hâlâ yürürlükte; `mantik/kanit/` için **ikinci bir
negatif kural** (`.gitignore:56`) eklendi ve etkisi ölçüldü:

```
--- check-ignore (bayraksiz: yalnizca YOKSAYILANLARI listeler) ---
[cikti yukarida bos ise yoksayilmiyor] cikis=1

--- git ls-files mantik/kanit ---
mantik/kanit/mutasyon.log
mantik/kanit/test-kosusu.log
```

`git check-ignore` **boş** döndü (çıkış 1 = yoksayılmıyor) ve `git ls-files` iki log'u da
görüyor. *(`-v` bayrağı negatif kuralı da bastığı için tek başına belirsizdir — çıplak
biçim ölçüldü.)*

---

## Bu turda ölçülemeyenler / yapılmayanlar

| Ne | Neden |
|---|---|
| Sekme başına çoğullama | `HEDEF.md` madde 3'ün işi. Modül tek birim modeller; durum nesnesi serileştirilebilir olduğu için orada bedava gelir. |
| Depolama / zamanlayıcı / gerçek 00:00 tetiği | Modül **saf** olmak zorunda. `gece-yarısı` olayını üretmek çağıranın işi — sözleşme yukarıda. |
| Arayüz biçimlendirmesi (saat:dakika) | Madde 4. Modül ham milisaniye döndürür. |
| Tarayıcıda uçtan uca davranış | Bu tur tamamen tarayıcısızdır; `test-yolu/` alt ağacına dokunulmadı (madde 1 kapandı, kanıtı donmuş). |
| Yeni bağımlılık | **Gerekmedi.** Saf JS + `node:fs`, `node:path`, `node:url`, `node:crypto`, `node:child_process` yetti. |
