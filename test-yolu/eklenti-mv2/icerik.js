// Icerik betigi. SUNUCU / ADAY / MANIFEST degiskenleri port.js'ten gelir.
var API = typeof browser !== "undefined" ? browser : chrome;

// TANI (kutu degil): icerik betiginin hic yuklenip yuklenmedigini ayirt eder.
// Sayfa ile ayni kokende oldugumuz icin bu fetch host izni gerektirmez.
try {
  fetch(
    SUNUCU +
      "/olay?aday=" + encodeURIComponent(ADAY) +
      "&manifest=" + encodeURIComponent(MANIFEST) +
      "&tani=icerik-yuklendi"
  ).catch(function () {});
} catch (e) {}

// Sayfaya "hazirim" de — sayfa oynatmayi bundan sonra baslatir.
document.documentElement.setAttribute("data-eklenti-hazir", "1");

var v = document.querySelector("video");
if (v) {
  v.addEventListener("play", function () {
    var uretim = v.getAttribute("data-uretim") || "bilinmiyor";
    try {
      API.runtime.sendMessage({ kutu: 3, tur: "play", uretim: uretim });
    } catch (e) {}
  });
}
