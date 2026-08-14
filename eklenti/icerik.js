// Sayaç — içerik betiği. YALNIZ "ne oldu" der; "ne zaman" sorusunu arka plan cevaplar.
// Ürün DOM'a sayaç yazmaz, ağa bir şey göndermez (SAYAC_TEKLIF.md:44).

var API = typeof browser !== "undefined" ? browser : chrome;

function gonder(olay) {
  try {
    var p = API.runtime.sendMessage({ tur: "olay", olay: olay });
    if (p && p.catch) p.catch(function () {});
  } catch (e) {
    /* arka plan henüz hazır değilse olay düşer; bir sonraki olay yakalanır */
  }
}

// YAKALAMA fazı: medya olayları kabarmaz ama yakalama fazı document'a uğrar.
// Tek dinleyici, SONRADAN yaratılan <video> öğelerini de yakalar — YouTube'un SPA
// gezinmesinde <video> değiştiği için bu tasarımın çekirdeğidir.
document.addEventListener(
  "play",
  function () {
    gonder("oynat");
  },
  true
);
document.addEventListener(
  "pause",
  function () {
    gonder("duraklat");
  },
  true
);

// Sayfa giderken hiçbir "pause" olayı gelmez; bu satır olmadan sekme sonsuza dek
// İZLENİYOR sayılırdı. Sekmenin durumu arka planda yaşadığı için sayaç SIFIRLANMAZ,
// yalnızca doğru kovaya geçer.
window.addEventListener("pagehide", function () {
  gonder("duraklat");
});
window.addEventListener("beforeunload", function () {
  gonder("duraklat");
});

// Yükleme anında mevcut gerçeği bildir (video zaten oynuyor olabilir).
(function () {
  var v = document.querySelector("video");
  if (v && !v.paused) gonder("oynat");
})();

// MOLA'ya basınca oynayan video DURAKLATILIR (SAYAC_TEKLIF.md:50-51).
// Bağlantıyı içerik betiği başlatır → hiçbir izin gerekmez. Olay güdümlüdür,
// yeni zamanlayıcı kurulmaz.
//
// Sonsuz döngü yok: pause() → tarayıcı "pause" olayı üretir → arka plana "duraklat"
// gider → durum hâlâ MOLA → ikinci "video-duraklat" gelir → v.paused zaten true →
// pause() çağrılmaz → yeni olay doğmaz. İdempotenttir.
(function () {
  var kanal;
  try {
    kanal = API.runtime.connect({ name: "sayac" });
  } catch (e) {
    return; // arka plan hazır değilse betik çökmesin
  }
  if (!kanal) return;
  try {
    kanal.onMessage.addListener(function (m) {
      if (!m || m.tur !== "video-duraklat") return;
      var v = document.querySelector("video");
      if (v && !v.paused) v.pause();
    });
    // Kopmada sessizce bırak — yeniden bağlanma döngüsü KURULMAZ; sayfa yeniden
    // yüklendiğinde bu betik zaten yeniden koşar.
    kanal.onDisconnect.addListener(function () {});
  } catch (e) {}
})();

// İçerik betiğinin gerçekten enjekte olduğunun sayfadan okunabilir kanıtı.
// Geçici eklenti yükleme yarışına karşı testin bekleme çapası budur.
document.documentElement.setAttribute("data-sayac-icerik", "1");

// Oynatma hızı OKUNMAZ: "ratechange" dinlenmez, playbackRate'e bakılmaz.
// Gerçek zaman sayılır (SAYAC_TEKLIF.md:30-31, HEDEF.md:70).
