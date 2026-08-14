// SONDA — ürüne ait DEĞİLDİR. Yalnız test kopyasına enjekte edilir.
// Arka plan bağlamında EN ÖNCE yüklenir (sayac.js'ten de arkaplan.js'ten de önce),
// çünkü Date.now() sarmalanmalı ki gece yarısı kutusu ölçülebilsin.
//
// Ürün kodu değişmez: ürün gerçek saati okumaya devam eder; test 23:59:5x'e kayar.
(function () {
  var gercekNow = Date.now;
  var kayma =
    typeof SAYAC_TEST !== "undefined" && typeof SAYAC_TEST.kaymaMs === "number"
      ? SAYAC_TEST.kaymaMs
      : 0;
  // Kayma 0 olsa da sarmalanır — davranış farkı olmasın.
  Date.now = function () {
    return gercekNow.call(Date) + kayma;
  };
  console.log("SONDA: Date.now sarmalandi, kayma =", kayma, "ms");
})();

// Y4b — SONDA komutu: aktif yeni sekme aç. ÜRÜNE AİT DEĞİLDİR.
//
// ⚠️ onMessage KULLANILMAZ: ölçüldü (005) — ürünün arkaplan.js dinleyicisi HER mesaja
// cevap veriyor (`{hata:"bilinmeyen istek: sonda-sekme-ac"}`) ve sondanınkini gölgeliyor.
// Bu yüzden AYRI ADLI PORT kullanılır: ürünün onConnect'i yalnız name==="sayac" dinler
// (eklenti/arkaplan.js), "sonda" adı ona hiç uğramaz. Ürün DEĞİŞMEZ.
(function () {
  var API = typeof browser !== "undefined" ? browser : chrome;
  try {
    API.runtime.onConnect.addListener(function (port) {
      if (!port || port.name !== "sonda") return;
      port.onMessage.addListener(function (msg) {
        // Faz 4 — gercek arac cubugu paneli denemesi. TEK DENEME.
        if (msg && msg.tur === "panel-ac") {
          try {
            var eylem = API.browserAction || API.action;
            if (!eylem || !eylem.openPopup) {
              port.postMessage({ tamam: false, hata: "browserAction.openPopup yok" });
              return;
            }
            var r = eylem.openPopup();
            if (r && r.then) {
              r.then(
                function () { port.postMessage({ tamam: true, not: "openPopup cozuldu" }); },
                function (e) { port.postMessage({ tamam: false, hata: "red: " + String(e && e.message ? e.message : e) }); }
              );
            } else {
              port.postMessage({ tamam: false, hata: "donus: " + String(r) });
            }
          } catch (e) {
            port.postMessage({ tamam: false, hata: "istisna: " + (e && e.message ? e.message : String(e)) });
          }
          return;
        }
        if (!msg || msg.tur !== "sekme-ac") return;
        if (!API.tabs || !API.tabs.create) {
          port.postMessage({ tamam: false, hata: "API.tabs.create yok (izin verilmedi mi?)" });
          return;
        }
        API.tabs.create({ url: msg.url, active: true }).then(
          function (t) {
            port.postMessage({ tamam: true, id: t && t.id });
          },
          function (e) {
            port.postMessage({ tamam: false, hata: String(e && e.message ? e.message : e) });
          }
        );
      });
    });
  } catch (e) {}
})();
