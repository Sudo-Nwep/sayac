# Sayac — Proje Künyesi

> **Bu dosya "ne YOK" sorusunun cevabıdır.** Denetim "ne bozuk" der, "ne yok" demez (**G03**);
> eksik olan şey hiçbir bulgu listesine girmez ve aylarca görünmez. Bu dosya o boşluğu kapatır.
>
> **Neden iki liste aynı dosyada:** "doldurulmamış yer tutucu" ve "dokunulmamış boyut" aynı
> sorunun iki yüzüdür. İki ayrı dosyaya bölünürse biri okunur, diğeri unutulur.
> `jubbio` tam olarak böyle kayboldu: doldurulacak bir alan `CLAUDE.md`'nin düzyazısının
> içine gömülüydü ve aylarca kimse görmedi. Tek dosya, tek bakış.

**Tip:** kod · **id:** `sayac` · **kurulum:** 13/08/2026 · **panel rengi:** `#f2c14e`
**Kök:** `C:\Users\kadio\Documents\Claude\Projects\Sayac` · **ders katmanı:** `D:\Yönetim\DERSLER\TIP\kod\`

---

## 🔴 DOLDURULMAMIŞ (ELDE) — Mustafa doldurur

Aşağıdaki yer tutucuları `yeni-proje.ps1` **dolduramaz**; anlam gerektirir.
Doldurduğun her satırı ⬜ → ✅ yap. **Hepsi ✅ olmadan bu proje kurulmuş sayılmaz.**

| Durum | Yer tutucu | Ne yazılacak | Nerede |
|---|---|---|---|
| ⬜ | `{{AMAC}}` | Tek cümle: ne çalışırsa/olursa bu proje başarılı sayılır | `CLAUDE.md` |
| ⬜ | `{{KAPSAM}}` | Ana bileşenler ve aralarındaki ilişki | `CLAUDE.md` |
| ⬜ | `{{ASAMA}}` | Şu an nerede olunduğu (kurulum / ilk sürüm / …) | `CLAUDE.md` |
| ⬜ | `{{KIRMIZI_CIZGILER}}` | Bu projede ASLA yapılmayacaklar | `CLAUDE.md` |
| ⬜ | `{{STACK}}` | Dil, runtime sürümü, ana kütüphaneler | `CLAUDE.md` |
| ✅ | `{{DEPO_URL}}` | Git uzak depo adresi (yoksa 'yok' yaz) | `CLAUDE.md` |

> Hızlı kontrol: proje kökünde yer tutucu işaretini (çift süslü parantez) ara.
> Hiç sonuç çıkmıyorsa hepsi dolmuştur.

---

## ⛔ ÇEVRE BOYUTLARI (7 boyut)

**Kaynak:** `D:\Yönetim\CEVRE\BOYUTLAR.md` → `kod` bölümü. Bu liste elle yazılmadı,
şablon üretilirken oradan türetildi. Boyut eklemek/çıkarmak için **önce `BOYUTLAR.md`** değişir.

Denetim üç soru sorar: (1) bu boyutun bir **dosyası** var mı · (2) son **30 günde** dokunulmuş mu ·
(3) yazılı bir **sıradaki adım** var mı. Üçü de evet → ✅ · biri hayır → 🟡 · dosya yok → ⛔.

**Her ⛔ için tek somut adım yazılır — teşhis yetmez.**
*"Pazarlama düşünülmeli"* değil; *"Mağaza sayfası için 5 ekran görüntüsü + 1 paragraf tanıtım — 2 saat"*.

| Durum | Boyut | "Var" ölçütü | Sıradaki tek somut adım |
|---|---|---|---|
| ✅ | **ürün** | Repoda çalışan kod + çalıştığını gösteren doğrulama | **Ölçüt karşılandı:** `eklenti/` yüklenebilir bir Firefox eklentisidir, **arayüzü de var** (açılır pencere: üç sayaç, MOLA, DUR/DEVAM ET, Türkçe) ve çalıştığı **rakamla** doğrulanmıştır (`EKLENTI.md` + `ARAYUZ.md`; `npm run eklenti:test` → çıkış 0, zorunlu kırmızı 0). **005'te iki gerekçe de DÜŞTÜ:** ⑴ **LibreWolf'a kurulabilirlik KANITLANDI** — imzasız XPI profile düşürüldü, `extensions.json`: `active:true · signedState:0 · appDisabled:false`, sondadan 15 işaret, `gecen=11 kalan=0`; ⑵ **gerçek araç çubuğu paneli ÖLÇÜLDÜ** — panel DOM canlı (`0:00:02`, `#uyari` boş) ve kimlik zinciri kapandı (`999999 → 999999`, `getCurrent=yok`). **006'da teslim kalemleri kapandı:** `README.md` yazıldı (kurulum yolu ölçülü) · sır taraması **çıkış 0** ve kırmızıya dönebildiği kanıtlı · ilk sürüm **`v1.0.0`** etiketlendi · ürün XPI'si ölçülerek paketlendi (tam 7 dosya). **007'de son kalem de kapandı:** kaynak artık **uzak depoda** — `git ls-remote origin` gerçek ref döndürüyor, `main` sha yerel `HEAD` ile birebir eşit, `v1.0.0^{}` sha eşleşti, görünürlük **private** ölçüldü (`TESLIM.md` §6, `test-yolu/kanit/uzak-depo.log`). Üç denetim sorusu da evet: dosya var (`TESLIM.md`) · 30 gün içinde dokunuldu (15/08/2026) · sıradaki adım yazılı (aşağıda). **Sıradaki tek somut adım (bu boyut için):** yok — bu boyutun ölçütü tam karşılandı; kalan altı çevre boyutu (veri/gizlilik · maliyet · operasyon · dağıtım · para · hukuk) ayrı satırlar, bu satırın konusu değil. |
| ⛔ | **veri/gizlilik** | Aydınlatma/rıza metni veya veri saklama kararı yazılı | _(yazılmadı)_ |
| ⛔ | **maliyet** | Ölçülmüş rakam + tavan mekanizması | _(yazılmadı)_ |
| ⛔ | **operasyon** | Yedeğin **geri yüklendiği kanıtlanmış**; çökünce haber veren bir şey var | _(yazılmadı)_ |
| 🟡 | **dağıtım** | Kurulum/erişim yolu yazılı, en az bir gerçek kullanıcı denemiş | **Kurulum yolu YAZILI ve ÖLÇÜLÜ:** `README.md` → "LibreWolf'a nasıl kurulur / A · Kalıcı kurulum"; dayanağı `test-yolu/kanit/eklenti-Y10.json` (`active:true`, `signedState:0`, `appDisabled:false`) ve bu turun `paketle.log`'u. Paket: `npm run eklenti:paketle` → `sayac-1.0.0.xpi`, tam 7 dosya. **✅ değil 🟡 — ölçütün ikinci yarısı karşılanmadı:** *"en az bir gerçek kullanıcı denemiş"* — henüz kimse denemedi. **Sıradaki tek somut adım:** Mustafa `sayac-1.0.0.xpi`'yi kendi LibreWolf profiline kursun ve sonucu bildirsin. |
| ⛔ | **para** | Fiyat modeli yazılı (rakam olmasa da mekanizma) | _(yazılmadı)_ |
| ⛔ | **hukuk** | İlgili metin dosyada | _(yazılmadı)_ |

> Yeni kurulan projede **hepsi ⛔'dir** — bu bir hata değil, başlangıç durumudur.
> ⛔ → 🟡 → ✅ geçişi yapıldıkça bu tablo elle güncellenir.

---

## 🧬 ORGAN BANKASI — bu tipe uygun sistemler

**Kaynak:** `D:\Yönetim\SISTEMLER\KATALOG.md` → "Uyduğu tipler" sütunu.
Yeni bir mekanizma kurmadan **önce** buraya bak (§0 AĞ, madde 2). Taşıma tek yönlüdür:
banka → hedef. Kaynak asla değişmez.

| Sistem | Ne çözer | Taşıma maliyeti | Nerede |
|---|---|---|---|
| `gunluk-hafiza` | Oturumlar arası "nerede kaldık" — tek GÜNCEL DURUM kutusu | Düşük (1 dosya kopyala + doldur) | `SISTEMLER\gunluk-hafiza\NEDIR.md` |
| `kontrol-dosyasi` | Aktif iş + config anahtarlarının tek kaynağı, "tek 🔵 iş" kuralı | Düşük (1 dosya kopyala + doldur) | `SISTEMLER\kontrol-dosyasi\NEDIR.md` |
| `protokol-bakimi` | CLAUDE.md'nin sessizce eskimemesi — öner, onaysız yazma | Düşük (1 bölüm ekle) | `SISTEMLER\protokol-bakimi\NEDIR.md` |
| `kesin-net-konus` | Muğlak dil yasağı + her iddiaya dayanak zorunluluğu | Düşük (1 paragraf ekle) | `SISTEMLER\kesin-net-konus\NEDIR.md` |
| `planlama-kilidi` | Saha verisi gelmeden büyük planlamaya kilit | Düşük (1 paragraf ekle) | `SISTEMLER\planlama-kilidi\NEDIR.md` |
| `gunluk-disiplin` | Günlük ritim (aç→yap→kapat), analiz felcine karşı 5 kilit, "bitti" tanımı | Orta (git diline bağımlı, üretim/oyuna çeviri gerekir) | `SISTEMLER\gunluk-disiplin\NEDIR.md` |
| `izin-duvari` | Geri dönülemez komutları izin katmanında mekanik engelleme | Düşük (settings.json birleştir) | `SISTEMLER\izin-duvari\NEDIR.md` |
| `teslim-disiplini` | "Bitti" için 6 zorunlu adım + 4 durma koşulu | Orta (build/lint/denetçi adımları proje-özel) | `SISTEMLER\teslim-disiplini\NEDIR.md` |
| `denetci-ajanlar` | 3 bağımsız denetçi subagent: kod hatası · güvenlik invaryantı · gerçek akış testi | Orta-Yüksek (invaryant listesi CLAUDE.md'den özgün yazılmalı) | `SISTEMLER\denetci-ajanlar\NEDIR.md` |
| `otonom-dongu` | Cowork↔Claude Code otonom tur köprüsü, çoklu proje, izolasyon | Düşük (motor değişmez, sadece kayit.json doldurulur) | `SISTEMLER\otonom-dongu\NEDIR.md` |
| `git-rehberi` | Sıfırdan git kurulumu + secret sızıntısı disiplini (token iptali) | Düşük (kimlik + deploy komutları doldur) | `SISTEMLER\git-rehberi\NEDIR.md` |
| `maliyet-tavani` | Kullanıcı başına TL-bazlı AI harcama tavanı + eşzamanlılık-güvenli rezervasyon | Yüksek (Prisma şemasına bağımlı, kavram olarak yeniden kurulur) | `SISTEMLER\maliyet-tavani\NEDIR.md` |

**Koşullu** ("uyduğu tipler" sütunu bir tip adı vermiyor — karar duruma bağlı):
- `canli-panel` — otonom-dongu kuran her proje

---

## Bakım

- Bir ELDE yer tutucusu doldu → buradaki satırı ✅ yap.
- Bir boyut için dosya açıldı → ⛔'yi 🟡/✅ yap ve dosya yolunu "sıradaki adım" sütununa yaz.
- `BOYUTLAR.md` değişirse bu tablo **eskir**; güncelleme elle yapılır ve `SON_HAREKETLER.md`'ye işlenir.
