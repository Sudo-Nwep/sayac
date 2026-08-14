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
| ⬜ | `{{DEPO_URL}}` | Git uzak depo adresi (yoksa 'yok' yaz) | `CLAUDE.md` |

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
| 🟡 | **ürün** | Repoda çalışan kod + çalıştığını gösteren doğrulama | **Ölçüt karşılandı:** `eklenti/` yüklenebilir bir Firefox eklentisidir, **arayüzü de var** (açılır pencere: üç sayaç, MOLA, DUR/DEVAM ET, Türkçe) ve çalıştığı **rakamla** doğrulanmıştır (`EKLENTI.md` + `ARAYUZ.md`; `npm run eklenti:test` → çıkış 0, zorunlu kırmızı 0). **✅ değil 🟡 — iki gerekçe, ikisi de ölçüme dayalı:** ⑴ **LibreWolf'a kurulum ölçülemedi** (Y10, RDP `ECONNREFUSED` ×4), oysa teslim ölçütü LibreWolf'tur; ⑵ arayüz **butonlarının arayüzden** çalıştığı ölçülemedi — davranışları mesaj API'si yolundan ölçüldü (Y6, sapma tam 0), ama gerçek panel bağlamı Playwright'la erişilemiyor. *"Kullanıcı sayaçları göremez"* gerekçesi **düştü.** **Sıradaki tek somut adım:** madde 5 — private depo + README + etiket + gizli taraması; LibreWolf kurulum kanıtı orada RDP'siz bir yolla aranır. |
| ⛔ | **veri/gizlilik** | Aydınlatma/rıza metni veya veri saklama kararı yazılı | _(yazılmadı)_ |
| ⛔ | **maliyet** | Ölçülmüş rakam + tavan mekanizması | _(yazılmadı)_ |
| ⛔ | **operasyon** | Yedeğin **geri yüklendiği kanıtlanmış**; çökünce haber veren bir şey var | _(yazılmadı)_ |
| ⛔ | **dağıtım** | Kurulum/erişim yolu yazılı, en az bir gerçek kullanıcı denemiş | _(yazılmadı)_ |
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
