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

  function tur() {
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
