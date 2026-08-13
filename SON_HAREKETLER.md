# Sayac — Son Hareketler (Proje Günlüğü)

> **Yeni sohbete başlarken:**
> 1. Önce **📌 GÜNCEL DURUM** kutusunu oku — projenin şu anki hâli orada.
> 2. `PROJE_KUNYESI.md`'ye bak — henüz **olmayan** şeyler orada.
> 3. İlerleme kaydedeceksen **✍️ Bu günlük nasıl güncellenir** kurallarını izle.

---

## 📌 GÜNCEL DURUM (her zaman en güncel — önce bunu oku)

- **Versiyon:** v0.1
- **Aşama:** {{ASAMA}}
- **Amaç:** {{AMAC}}
- **Kapsam:** {{KAPSAM}}
- **Depo/çalışır mı:** iskelet kuruldu, henüz çalışan çıktı yok
- **Açık işler:** `PROJE_KUNYESI.md`'deki ⛔ boyutlar + doldurulmamış ELDE yer tutucuları
- **Sıradaki adım:** ELDE yer tutucularını doldur, sonra ilk ⛔ boyuta tek somut adım yaz

---

## 🗂️ Proje Dosyaları (ve ilişkileri)

- **`CLAUDE.md`** — açılış protokolü; her sohbette Claude'un çalışma şekli. §0 AĞ bloğu ORKESTRA bağlantısıdır.
- **`SON_HAREKETLER.md`** — bu dosya; proje hafızası / giriş noktası.
- **`KONTROL_DOSYASI.md`** — aktif işin ve değişken verinin tek kaynağı.
- **`PROJE_KUNYESI.md`** — **ne YOK** dosyası: ⛔ çevre boyutları + doldurulmamış ELDE yer tutucuları.
- **`.gitignore`** — repoya girmeyecekler (secret dahil).
- {{KAPSAM}} içindeki diğer klasörler buraya, oluşturuldukca eklenir.

---

## 📜 GÜNLÜK (madde-tarih)

* **v0.1 · 13/08/2026** — proje ORKESTRA **kod** şablonundan kuruldu.
   > Oluşturulan dosyalar: `CLAUDE.md` (§0 AĞ dahil) · `SON_HAREKETLER.md` · `KONTROL_DOSYASI.md` · `PROJE_KUNYESI.md` · `.gitignore`.
   > Sicile kayıt: `sayac` · panel rengi `#f2c14e`.
   - **Güncel durum:** iskelet var, içerik yok. Bütün çevre boyutları ⛔; ELDE yer tutucuları doldurulmadı.

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
