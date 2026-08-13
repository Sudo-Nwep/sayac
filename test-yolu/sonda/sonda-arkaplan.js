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
