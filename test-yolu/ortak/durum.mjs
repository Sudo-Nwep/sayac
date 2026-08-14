// Hücre durum dizesinin TEK KAYNAĞI — bilerek BAĞIMLILIKSIZ.
//
// Neden ortak/hucre.mjs'ten import edilmiyor: hucre.mjs üst düzeyde `playwright` ve
// `playwright-webextext` yüklüyor (hucre.mjs:8-9). Ebeveyn koşucuya tarayıcı yığınını
// çektirmek gereksiz; bu modül yalnız dize karşılaştırması yapar.
//
// ÖLÇÜLDÜ (005, tur başı): eklenti-kosum.mjs:133 tam dize karşılaştırması yapıyordu
// (`s.durum === "ölçülemedi"`), Y16 ise ASCII "olculemedi" yazıyordu → Y16 SAYILMIYORDU.
// Basılan satır "ZORUNLU OLCULEMEDI: 4 → Y4, Y11, Y12, Y13" idi; doğrusu 5 (Y16 dâhil).

/** Kanonik yazım. Yeni kod bunu kullanır. */
export const OLCULEMEDI = "ölçülemedi";

/** Türkçe aksanları soyup küçültür — yazımdan bağımsız karşılaştırma için. */
function sadelestir(s) {
  return String(s == null ? "" : s)
    .replace(/[İIı]/g, "i")
    .replace(/[Öö]/g, "o")
    .replace(/[Üü]/g, "u")
    .replace(/[Çç]/g, "c")
    .replace(/[Şş]/g, "s")
    .replace(/[Ğğ]/g, "g")
    .toLowerCase()
    .trim();
}

/** Yazımdan bağımsız: bu durum "ölçülemedi" mi? */
export function olculemediMi(durum) {
  return sadelestir(durum) === "olculemedi";
}

/**
 * Sessiz normalleştirme YOK: değer "ölçülemedi" anlamına geliyor ama kanonik yazıma
 * BİREBİR eşit değilse sapmayı döndürür ki koşucu yüksek sesle bağırsın (G22).
 * @returns {null|{okunan:string, kanonik:string}}
 */
export function yazimSapmasi(durum) {
  if (!olculemediMi(durum)) return null;
  if (durum === OLCULEMEDI) return null;
  return { okunan: String(durum), kanonik: OLCULEMEDI };
}
