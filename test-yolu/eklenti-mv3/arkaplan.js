// Arka plan betigi. SUNUCU / ADAY / MANIFEST degiskenleri port.js'ten gelir.
// Yalnizca iki fetch atar: kutu 2 (arka plan kostu) ve kutu 3 (icerikten gelen olay).
var API = typeof browser !== "undefined" ? browser : chrome;

function isaret(p) {
  var q = [];
  for (var k in p) q.push(encodeURIComponent(k) + "=" + encodeURIComponent(p[k]));
  return fetch(SUNUCU + "/olay?" + q.join("&")).catch(function () {});
}

// KUTU 2 — arka plan betigi kostu
isaret({ aday: ADAY, manifest: MANIFEST, kutu: "2", kaynak: "arkaplan" });

// KUTU 3 — icerik betiginden gelen gercek sayfa olayi disari cikti
API.runtime.onMessage.addListener(function (msg) {
  if (!msg || msg.kutu !== 3) return;
  isaret({
    aday: ADAY,
    manifest: MANIFEST,
    kutu: "3",
    kaynak: "icerik",
    tur: msg.tur,
    uretim: msg.uretim
  });
});
