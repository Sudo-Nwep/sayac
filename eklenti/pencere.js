// Sayaç — açılır pencere. Üç toplamı arka plandan HAZIR alır, yalnız BİÇİMLENDİRİR.
//
// Burada hiçbir süre aritmetiği yoktur (toplama/çıkarma yok) — doğruluğun tek kaynağı
// mantik/sayac.mjs'tir ve pencere ondan türeyen ozet() çıktısını olduğu gibi gösterir.
// Hiçbir ağ çağrısı, hiçbir depolama yazımı yoktur (SAYAC_TEKLIF.md:44).
//
// İzin bütçesi: browser.tabs.query yalnız SEKME KİMLİĞİ için çağrılır; "tabs" izni
// istenmez. Manifest'te permissions da host_permissions da yoktur.

var API = typeof browser !== "undefined" ? browser : chrome;

var hedefSekmeId = null; // klasik betik → window.hedefSekmeId (sonda bunu okur)
var sonDurumAdi = "";
var yoklama = null;

function el(id) {
  return document.getElementById(id);
}

function uyar(metin) {
  el("uyari").textContent = metin;
}

/**
 * Hedef sekmeyi bul — hiçbir izin istemeden.
 *
 * BOZULMA KELEPÇESİ (ürünün kendi savunması, test kancası DEĞİL):
 * Pencere kendi sekmesinde açılmışsa "aktif sekme" kendisidir; o hâlde sessizce
 * yanlış sekmeye bakmak yerine uyarı gösterilir ve yoklama BAŞLATILMAZ.
 * Gömülü bağlamda (WAR iframe) getCurrent() barındıran sekmeyi döndüreceği için
 * kelepçe yanlış tetiklenmesin diye o bağlamda hiç çağrılmaz.
 */
async function hedefBul() {
  var gomulu = window.top !== window.self;

  var kendi = null;
  if (!gomulu) {
    try {
      kendi = await API.tabs.getCurrent();
    } catch (e) {
      kendi = null; // gerçek açılır pencerede undefined/hata — beklenen
    }
  }

  var hedef = null;
  try {
    var tablar = await API.tabs.query({ active: true, currentWindow: true });
    if (tablar && tablar.length && typeof tablar[0].id === "number") hedef = tablar[0];
  } catch (e) {
    hedef = null;
  }

  if (kendi && hedef && kendi.id === hedef.id) return null; // kelepçe
  return hedef ? hedef.id : null;
}

function ciz(g) {
  if (!g) return;
  if (g.hata) {
    uyar(g.hata);
    return;
  }
  uyar("");
  el("sayac-izleniyor").textContent = sureBicim(g.toplam.izleniyor);
  el("sayac-duraklatildi").textContent = sureBicim(g.toplam.duraklatildi);
  el("sayac-mola").textContent = sureBicim(g.toplam.mola);
  sonDurumAdi = g.durumAdi;
  el("durum-adi").textContent = g.durumAdi;
  // MOLA iki AYRI olaydır (mola-aç / mola-kapat), ana anahtar tek toggle'dır.
  el("btn-mola").textContent = g.durumAdi === "MOLA" ? "MOLAYI BİTİR" : "MOLA";
  el("btn-ana").textContent = g.durumAdi === "KAPALI" ? "DEVAM ET" : "DUR";
}

function tur() {
  if (hedefSekmeId === null) return;
  try {
    var p = API.runtime.sendMessage({ tur: "durum-iste", sekmeId: hedefSekmeId });
    if (p && p.then) p.then(ciz, function (e) { uyar(String(e && e.message ? e.message : e)); });
  } catch (e) {
    uyar(String(e && e.message ? e.message : e));
  }
}

function olayGonder(olay) {
  if (hedefSekmeId === null) return;
  try {
    var p = API.runtime.sendMessage({ tur: "olay", olay: olay, sekmeId: hedefSekmeId });
    if (p && p.then) {
      p.then(
        function (c) {
          if (c && c.hata) uyar(c.hata); // yutma
          tur();
        },
        function (e) { uyar(String(e && e.message ? e.message : e)); }
      );
    }
  } catch (e) {
    uyar(String(e && e.message ? e.message : e));
  }
}

el("btn-mola").addEventListener("click", function () {
  olayGonder(sonDurumAdi === "MOLA" ? "mola-kapat" : "mola-aç");
});

el("btn-ana").addEventListener("click", function () {
  olayGonder("ana-kapat"); // çekirdekte iki konumlu TEK anahtar
});

(async function () {
  hedefSekmeId = await hedefBul();
  if (hedefSekmeId === null) {
    uyar("Hedef sekme belirlenemedi.");
    return; // yoklama BAŞLATILMAZ
  }
  tur();
  yoklama = setInterval(tur, 250);
})();
