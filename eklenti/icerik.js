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

// İçerik betiğinin gerçekten enjekte olduğunun sayfadan okunabilir kanıtı.
// Geçici eklenti yükleme yarışına karşı testin bekleme çapası budur.
document.documentElement.setAttribute("data-sayac-icerik", "1");

// Oynatma hızı OKUNMAZ: "ratechange" dinlenmez, playbackRate'e bakılmaz.
// Gerçek zaman sayılır (SAYAC_TEKLIF.md:30-31, HEDEF.md:70).
