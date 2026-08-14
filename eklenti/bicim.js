// Sayaç — süre biçimlendirici. TEK iş: ham milisaniyeyi "S:DD:SS" dizesine çevirmek.
//
// Bu dosya document'a ve window'a DOKUNMAZ. Sebep ölçüm: ürünün kendi baytları
// node:vm ile tarayıcısız koşulup doğruluk tablosuna sokulabilsin (test-yolu/bicim-testi.mjs).
//
// Burada HİÇBİR süre aritmetiği yapılmaz — üç toplam arka plandan hazır gelir,
// bu dosya yalnız BİÇİMLENDİRİR. "izleniyor + mola" gibi bir toplama yoktur.

function ikiHane(n) {
  return n < 10 ? "0" + n : "" + n;
}

/**
 * @param {number} ms — ham milisaniye (arka planın ozet() çıktısından)
 * @returns {string} "S:DD:SS" — saat doldurulmaz (en az 1 hane, üst sınır yok),
 *                   dakika ve saniye iki hane sıfır dolgulu, AŞAĞI yuvarlanır.
 *                   Geçersiz girdide savunmacı olarak "0:00:00".
 */
function sureBicim(ms) {
  if (typeof ms !== "number" || !isFinite(ms) || ms < 0) return "0:00:00";
  var toplamSaniye = Math.floor(ms / 1000);
  var saat = Math.floor(toplamSaniye / 3600);
  var dakika = Math.floor((toplamSaniye % 3600) / 60);
  var saniye = toplamSaniye % 60;
  return saat + ":" + ikiHane(dakika) + ":" + ikiHane(saniye);
}
