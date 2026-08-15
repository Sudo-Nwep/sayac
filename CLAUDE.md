# Sayac — Oturum Açılış Protokolü (Kod Projesi)

> Bu dosya, bu proje klasörüyle açılan **her yeni sohbette** Claude'un nasıl çalışacağını
> tanımlar. Kullanıcı ayrıca istemese de uygulanır.
> Tip: **kod** · ORKESTRA id: `sayac` · kurulum: 13/08/2026 · kök: `C:\Users\kadio\Documents\Claude\Projects\Sayac`

## 0. AĞ (her oturumda ilk — 60 saniye)

Bu proje `D:\Yönetim` ORKESTRA ağına bağlıdır. Sırayla:

1. **`D:\Yönetim\DERSLER\INDEKS.md`** → yapacağın işe göre **TETİKLEYİCİ** tablosundan satırını
   bul, oradaki ders kodlarını oku. Bir şey ters giderse **BELİRTİ** tablosuna bak.
   Tüm dersleri baştan sona okuma — tablolar giriş kapısıdır.
2. **Yeni bir sistem/mekanizma kurmadan ÖNCE** `D:\Yönetim\SISTEMLER\KATALOG.md`'ye bak.
   Eşleşme varsa **DUR ve sor:** *"Bu, <kaynak proje>'de var. Oradan taşıyayım mı,
   yoksa sıfırdan mı yazayım?"* Sıfırdan yazmak yalnızca Mustafa açıkça öyle derse.
3. **Oturum sonunda iki soru:**
   - Başka projede de geçerli bir ders çıktı mı? → `DERSLER`'e giriş **öner** (yazma, öner).
   - Taşınmaya değer bir sistem doğdu mu? → `SISTEMLER\KATALOG.md`'ye giriş **öner**.

Bu projenin tipi: **kod** → `D:\Yönetim\DERSLER\TIP\kod\` derslerini de kapsar.
Katmanlar duvar değil etikettir: `TIP\kod` dersleri bir üretim projesinde de geçerli olabilir.

## 1. Açılışta yap (sıra önemli)

1. `SON_HAREKETLER.md` → **📌 GÜNCEL DURUM** kutusunu oku — projenin anlık hâli, açık işler, sıradaki adım orada.
2. `PROJE_KUNYESI.md` → **ne YOK** listesi: doldurulmamış ELDE yer tutucuları + ⛔ çevre boyutları.
   Yeni bir projede burası **boş değildir**; boş görünüyorsa dosya yanlış kurulmuştur.
3. `KONTROL_DOSYASI.md` → aktif işler + config. **Şu anki TEK iş** buradan seçilir.
4. Depo durumu: `git status` ve `git log --oneline -5`. Kutu ile depo uyuşmuyorsa **önce bunu bildir**, çalışmaya başlama.
5. Göreve göre ilgili dosyayı derinlemesine oku — dosya haritası `SON_HAREKETLER.md` **🗂️ Proje Dosyaları**'nda.
   Tüm klasörü baştan sona okumak varsayılan **DEĞİL**.

## 2. Proje özü (her oturumda bilinmesi gerekenler)

- **Amaç:** {{AMAC}}
- **Kapsam/yapı:** {{KAPSAM}}
- **Şu anki aşama:** {{ASAMA}}
- **Stack:** {{STACK}}
- **Depo:** https://github.com/Sudo-Nwep/sayac (private, 15/08/2026'da ölçüldü) · ana dal: `main`
- **Sırlar:** `.env` dosyasında, **repoya asla girmez**. Hangi anahtarların gerektiği `KONTROL_DOSYASI.md`'de listelidir (değerleri değil, adları).
- **Değişken verinin kaynağı:** `KONTROL_DOSYASI.md` — değişiklik SADECE orada yapılır.

## 3. Çalışma kuralları

### Kod
- **Çalışan en küçük parça önce.** Güzel mimari değil, çalışan çıktı hedeflenir; sonra iyileştirilir.
- Yeni bağımlılık eklenirse gerekçesi + `.gitignore` / paket dosyası etkisi söylenir.
- Hata çözerken **tam hata metni** istenir; tahminle düzeltme yapılmaz.

### Git
- **main daima çalışır durumdadır.** Çalışmayan kod main'e girmez.
- Commit mesajı: `feat:` · `fix:` · `chore:` · `docs:`. Türkçe açıklama serbest.
- Küçük ve kesin iş (<1 saat) → doğrudan `main`. Gerçek özellik / riskli değişiklik → `feat/kisa-ad` dalı.
- Günlük maddesi ile commit birbirine bağlanır: madde içinde commit hash'inin ilk 7 karakteri yazılır.

### Genel
- Gerçek bir ilerleme/karar olduğunda `SON_HAREKETLER.md` **📜 GÜNLÜK**'üne versiyonlu madde ekle + **📌 GÜNCEL DURUM** kutusunu güncelle.
- Bir ⛔ boyut kapandığında `PROJE_KUNYESI.md`'deki satırı güncelle — künye eskirse "ne yok" sorusu cevapsız kalır.
- Rakam/teknik detay söylerken kaynaktan doğrula — ezberden konuşma.

## 4. Konuşma biçimi ve odak

- **Türkçe** konuş; kod, değişken adları ve commit mesajları İngilizce kalabilir.
- Kısa, net, aksiyon odaklı. Her tavsiyeyi "şimdi ne yapmalı"ya bağla.
- **KESİN NET KONUŞ** (**G15**): ya kesin konuş, ya bilgi eksikse sor → sonra kesin konuş.
  Her net iddia bir dayanağa bağlı olsun ve dayanağı göster. Dayanağın yoksa uydurma.
- Cevabı dosyalarda olan şeyi kullanıcıya sorma — önce oku.

## 5. Kırmızı çizgiler

- **Secret commit'leme.** Token/şifre/API anahtarı asla kod dosyasına yazılmaz; `.env`'e gider ve `.gitignore`'dadır. Kazara girdiyse: dosyayı silmek YETMEZ → **anahtar iptal edilip yenilenir.**
- **`git push --force` yok** (main'e asla). Geçmişi silmek yerine `git revert`.
- **Çalışmayan kod main'e girmez.**
- Kullanıcının onaylamadığı mimari değişiklik yapılmaz — önerilir.
- {{KIRMIZI_CIZGILER}}

## 6. Bu dosyanın bakımı — CLAUDE.md mutlak DEĞİLDİR

Proje evrilir: kapsam değişir, kurallar eskir. Bakım sorumluluğu Claude'da, **karar yetkisi Mustafa'da**:

1. **Her gerçek ilerleme sonrası** kontrol et: *bu değişiklik CLAUDE.md'yi eskitti mi?*
2. Eskittiyse **ASLA sessizce değiştirme.** Somut öneri sun: hangi madde · mevcut → önerilen · gerekçe.
3. **Onay gelirse** uygula + `SON_HAREKETLER.md`'ye işle. Onay gelmezse dokunma; reddedileni tekrar önerme.
4. Mustafa bu dosyayı elle güncellemeyecek — fark etmek ve önermek Claude'un işi.
