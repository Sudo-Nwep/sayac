# Sayaç — Kurulum ve Kullanım

YouTube'da geçirdiğiniz süreyi üç kalemde ayıran bir tarayıcı eklentisi:
**izlediğiniz** süre, **duraklattığınız** süre ve **mola** süresi.

Veriler bilgisayarınızdan çıkmaz. Hiçbir sunucuya gönderilmez, hesap gerekmez.

---

## Hangi tarayıcılarda çalışır

✅ **LibreWolf** · **Firefox** · **Waterfox** · **Zen** · **Floorp** · **Tor Browser**

❌ Chrome, Edge, Brave, Opera ve Safari'de **çalışmaz.** Bu sürüm Firefox tabanlı
tarayıcılar için hazırlandı.

---

## 1 · Dosyayı indirin

Sürümler sayfasından **`sayac-1.0.0.xpi`** dosyasını indirin:

**https://github.com/Sudo-Nwep/sayac/releases**

Tarayıcı "bu dosya zararlı olabilir" derse **Sakla / Yine de indir** deyin — dosya sizin
bilgisayarınızda kalacak, bir yere yüklenmiyor.

---

## 2 · Kurun — iki yol var

### A · Hızlı yol *(en kolayı, 30 saniye)*

Denemek için bu yeterli. **Tarayıcıyı kapatınca eklenti kalkar**, tekrar kurmanız gerekir.

1. Adres çubuğuna şunu yazın: **`about:debugging`**
2. Soldaki menüden **Bu Firefox** *(LibreWolf'ta: **Bu LibreWolf**)*
3. **Geçici Eklenti Yükle…** düğmesine basın
4. İndirdiğiniz **`sayac-1.0.0.xpi`** dosyasını seçin

Bitti. Simge araç çubuğunda belirir.

### B · Kalıcı yol *(bir kez yapılır, hep kalır)*

Her gün kullanacaksanız bunu tercih edin.

1. **Tarayıcıyı tamamen kapatın.**

2. Adres çubuğuna **`about:profiles`** yazın *(kapatmadan önce)* ve kullandığınız profilin
   **Kök Dizin** yolunu not alın. Genelde şuna benzer:
   `C:\Users\<kullanıcı adınız>\AppData\Roaming\librewolf\Profiles\xxxxxxxx.default`

3. O klasörün içinde **`extensions`** adında bir klasör yoksa oluşturun.

4. İndirdiğiniz dosyayı bu `extensions` klasörüne kopyalayın ve adını **tam olarak** şu
   şekilde değiştirin:

   ```
   sayac@sayac.local.xpi
   ```

   ⚠️ Bu ad rastgele değil, eklentinin kimliğidir. Yanlış yazılırsa tarayıcı görmez.

5. Profil klasörünün içine *(extensions'ın değil, bir üst klasöre)* **`user.js`** adında
   bir metin dosyası oluşturun ve içine şu dört satırı yapıştırın:

   ```
   user_pref("xpinstall.signatures.required", false);
   user_pref("extensions.autoDisableScopes", 0);
   user_pref("extensions.enabledScopes", 15);
   user_pref("extensions.startupScanScopes", 15);
   ```

6. Tarayıcıyı açın. **`about:addons`** → Uzantılar listesinde **Sayaç** görünmeli.

---

## 3 · Simgeyi bulun

Eklenti araç çubuğuna kendiliğinden **sabitlenmez**. İlk seferde:

1. Adres çubuğunun sağındaki **puzzle parçası** simgesine tıklayın
2. Listede **Sayaç**'ı bulun
3. Yanındaki dişli simgesinden **Araç çubuğuna sabitle** deyin

Artık doğrudan tıklayabilirsiniz.

---

## 4 · Nasıl kullanılır

Simgeye tıkladığınızda küçük bir pencere açılır:

```
Sayaç
İzleniyor        0:00:00
Duraklatıldı     0:00:00
Mola             0:00:00
Durum:           İZLENİYOR

        [ MOLA ]   [ DUR ]
```

### Üç sayaç

| sayaç | ne zaman işler |
|---|---|
| **İzleniyor** | video oynarken — otomatik |
| **Duraklatıldı** | video duraklatılmışken — otomatik |
| **Mola** | siz MOLA'ya bastığınızda — elle |

### İki düğme

**MOLA** — bastığınızda video durur, ilk iki sayaç durur, mola sayacı işlemeye başlar.
Tekrar bastığınızda normale döner.

**DUR / DEVAM ET** — bütün sayaçları kapatır. Moladan farkı: molada üçüncü sayaç işler,
burada **hiçbiri** işlemez.

### Bilmeniz gerekenler

- **Gerçek zaman sayılır.** 2 kat hızda izlerseniz 10 dakikalık video **5 dakika** yazar.
  Ölçülen şey videonun uzunluğu değil, sizin harcadığınız süre.

- **Her sekmenin kendi sayacı vardır.** Yeni bir sekme açarsanız orada sayaçlar sıfırdan
  başlar. Sekmeler birbirine karışmaz.

- **Video değişince sıfırlanmaz.** Aynı sekmede yeni bir video açarsanız sayaç kaldığı
  yerden devam eder.

- **Gece yarısı sıfırlanır.** Saat 00:00'da üç sayaç da sıfıra döner. Geçmiş günler
  saklanmaz — ekranda hep "bugün" görünür.

- **Arka planda da sayar.** Video oynarken başka sekmeye geçseniz bile İzleniyor işler.

---

## Sorun mu var?

**Simge hiç görünmüyor** → `about:addons` → Uzantılar listesinde Sayaç var mı bakın. Yoksa
kurulum tamamlanmamıştır; B yolunda dosya adını kontrol edin (`sayac@sayac.local.xpi`).

**Kurdum ama sayaçlar hep 0:00:00** → Eklenti yalnız **youtube.com** üzerinde çalışır.
Başka bir video sitesinde açtıysanız saymaz.

**"İmzalanmamış eklenti" uyarısı** → B yolundaki `user.js` dosyası eksik ya da yanlış
klasörde. 5. adımı tekrar edin ve tarayıcıyı yeniden başlatın.

**Tarayıcıyı kapatınca eklenti kayboldu** → A yolunu (geçici kurulum) kullanmışsınızdır.
Kalıcı olması için B yolunu izleyin.

---

*Sayaç 1.0.0 · Kaynak kodu: https://github.com/Sudo-Nwep/sayac*
