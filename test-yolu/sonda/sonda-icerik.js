// SONDA — ürüne ait DEĞİLDİR. Yalnız test kopyasına enjekte edilir.
// İçerik betiklerinde EN SON yüklenir.
//
// Ürünün KENDİ mesaj API'sini çağırır (durum-iste) ve cevabı İKİ kanaldan yayar:
//   ① DOM özniteliği  → Playwright page.evaluate ile okur; hiçbir izin gerektirmez,
//                        her kökende çalışır (YouTube hücresinin tek kanalı budur).
//   ② aynı kökene fetch → Playwright eli olmayan hücrenin (LibreWolf/web-ext) kanalı.
//                        Yerel sayfada aynı köken olduğu için izin gerektirmez.
// ②'nin başarısızlığı sessizce yutulur; ① yeterlidir.
(function () {
  var API = typeof browser !== "undefined" ? browser : chrome;
  var aralik =
    typeof SAYAC_TEST !== "undefined" && SAYAC_TEST.aralikMs ? SAYAC_TEST.aralikMs : 250;
  var sunucu = typeof SAYAC_TEST !== "undefined" ? SAYAC_TEST.sunucu : null;

  // Pencerenin moz-extension:// adresini sayfadan okunabilir kıl.
  // UUID profil başına RASTGELEDİR — sabitlenmez, OKUNUR. Hiçbir pref, hiçbir tahmin.
  try {
    document.documentElement.setAttribute(
      "data-sayac-pencere",
      API.runtime.getURL("pencere.html")
    );
  } catch (e) {}

  function yay(g) {
    if (!g || g.hata) return;
    try {
      document.documentElement.setAttribute("data-sayac-durum", JSON.stringify(g));
    } catch (e) {}
    if (!sunucu) return;
    try {
      var q =
        "an=" + g.anMs +
        "&sekme=" + g.sekmeId +
        "&durum=" + encodeURIComponent(g.durumAdi) +
        "&izleniyor=" + g.toplam.izleniyor +
        "&duraklatildi=" + g.toplam.duraklatildi +
        "&mola=" + g.toplam.mola +
        "&gunBasi=" + g.gunBasiMs +
        "&bp=" + g.arkaPlanBaslangicMs +
        "&kelepce=" + g.kelepceSayisi;
      fetch(sunucu + "/olay?" + q).catch(function () {});
    } catch (e) {}
  }

  // Y4b — testin istediği sekmeyi AKTİF olarak açar. ÜRÜNE AİT DEĞİLDİR; "tabs" izni
  // yalnız test kopyasına verilir (eklenti-testi.mjs ekIzinler), eklenti/manifest.json
  // DEĞİŞMEZ. Amaç: A sekmesini gerçekten arka plana düşürmek (taklit değil).
  function sekmeAcKomutu() {
    var u;
    try {
      u = document.documentElement.getAttribute("data-sayac-sekme-ac");
    } catch (e) {
      return;
    }
    if (!u) return;
    try {
      document.documentElement.removeAttribute("data-sayac-sekme-ac");
    } catch (e) {}
    // AYRI ADLI PORT — ürünün onMessage dinleyicisi bu kanala hiç uğramaz.
    try {
      var kanal = API.runtime.connect({ name: "sonda" });
      kanal.onMessage.addListener(function (c) {
        document.documentElement.setAttribute(
          "data-sayac-sekme-sonuc",
          c && c.tamam ? "tabs.create tamam id=" + c.id : "yanit: " + JSON.stringify(c)
        );
      });
      kanal.postMessage({ tur: "sekme-ac", url: u });
    } catch (e) {
      document.documentElement.setAttribute("data-sayac-sekme-sonuc", "istisna: " + e.message);
    }
  }

  // Faz 4 — panel acma komutu (yalniz test kopyasi).
  var panelDenendi = false;
  function panelKomutu() {
    if (panelDenendi) return;
    // Tetikleyici URL parametresi — sunucu sayfasina dokunmadan.
    if (String(location.search || "").indexOf("panel=1") === -1) return;
    panelDenendi = true;
    try {
      var k2 = API.runtime.connect({ name: "sonda" });
      k2.onMessage.addListener(function (c) {
        document.documentElement.setAttribute("data-sayac-panel-sonuc", JSON.stringify(c));
      });
      k2.postMessage({ tur: "panel-ac" });
    } catch (e) {
      document.documentElement.setAttribute("data-sayac-panel-sonuc", "istisna: " + e.message);
    }
  }

  function tur() {
    sekmeAcKomutu();
    panelKomutu();
    // Testin gönderdiği komutu ürünün olay API'sine çevir (arayüz değil, API çağrısı).
    try {
      var k = document.documentElement.getAttribute("data-sayac-komut");
      if (k) {
        document.documentElement.removeAttribute("data-sayac-komut");
        var pk = API.runtime.sendMessage({ tur: "olay", olay: k });
        if (pk && pk.then) pk.then(function () {}, function () {});
      }
    } catch (e) {}

    try {
      var p = API.runtime.sendMessage({ tur: "durum-iste" });
      if (p && p.then) p.then(yay, function () {});
    } catch (e) {}
  }

  setInterval(tur, aralik);
  tur();
})();
