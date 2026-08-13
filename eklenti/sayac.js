// ÜRETİLEN DOSYA — ELLE DÜZENLEMEYİN.
// Kaynak: mantik/sayac.mjs
// Kaynak SHA-256: ad848d21f22916de80c2b5ab9f6c17a8872b93e83070860487438fed12ec38ac
// Yeniden üret: npm run eklenti:uret · Senkron kontrolü: npm run eklenti:kontrol
// Tek değişiklik: satır başındaki "export " önekleri soyuldu (7 yer).
// Başka hiçbir şey değiştirilmedi — doğruluğun tek kaynağı mantik/sayac.mjs'tir.

// Sayac — saf zaman mantigi cekirdegi.
//
// SAFLIK SOZLESMESI: bu dosyada gercek saate, zamanlayiciya, tarayiciya, aga ya da
// global duruma dokunan HICBIR sey yoktur. Zaman module PARAMETRE olarak girer.
// Bu iddia degil, olculen bir sarttir: mantik/kosucu.mjs Bolum A hem kaynagi statik
// tarar hem de ilgili global'leri erisildiginde firlatan sahtelerle degistirip tum
// senaryolari o tuzak altinda kosturur.
//
// Kurallarin kaynagi: Projects/SAYAC_TEKLIF.md + .claude/loop/HEDEF.md (madde 2).
// Kural uydurulmaz; her davranis MANTIK.md'de satiriyla dayanaklidir.
//
// Birim: milisaniye, tam sayi. Kayan nokta yok -> toplamlar birebir karsilastirilabilir.
// Bu modul TEK bir sayac birimini modeller. Sekme basina cogullama madde 3'un isidir;
// donen durum nesnesi degismez ve serilestirilebilir oldugu icin orada bedavaya gelir.

/** Dort gorunur durum adi. Baska yerde durum dizesi sabiti yazilmaz. */
const DURUMLAR = Object.freeze({
  IZLENIYOR: "İZLENİYOR",
  DURAKLATILDI: "DURAKLATILDI",
  MOLA: "MOLA",
  KAPALI: "KAPALI",
});

/** Olay dagarcigi — HEDEF.md madde 2'de birebir yazili alti ad. Genisletilmez (G20). */
const OLAY_TURLERI = Object.freeze([
  "oynat",
  "duraklat",
  "mola-aç",
  "mola-kapat",
  "ana-kapat",
  "gece-yarısı",
]);

function sifirToplam() {
  return { izleniyor: 0, duraklatildi: 0, mola: 0 };
}

function tamSayiMi(x) {
  return Number.isInteger(x);
}

/**
 * Gecen sureyi, o an GORUNEN duruma karsilik gelen kovaya ekler.
 * KAPALI ise hicbir kovaya eklenmez (SAYAC_TEKLIF.md:59 "hicbiri islemez").
 * Girdi toplami mutasyona ugramaz; yeni nesne doner.
 */
function kovayaEkle(toplam, ad, aralik) {
  const y = {
    izleniyor: toplam.izleniyor,
    duraklatildi: toplam.duraklatildi,
    mola: toplam.mola,
  };
  if (ad === DURUMLAR.IZLENIYOR) {
    y.izleniyor += aralik;
  } else if (ad === DURUMLAR.DURAKLATILDI) {
    y.duraklatildi += aralik;
  } else if (ad === DURUMLAR.MOLA) {
    y.mola += aralik;
  }
  return y;
}

/**
 * Baslangic durumu: ana anahtar ACIK, mola KAPALI, video DURAKLI, uc toplam 0.
 * @param {number} t0 baslangic zaman damgasi (ms, tam sayi)
 */
function baslangic(t0) {
  if (!tamSayiMi(t0)) {
    throw new TypeError(`baslangic: t0 tam sayi olmali, gelen: ${String(t0)}`);
  }
  return Object.freeze({
    t: t0,
    anaKapali: false,
    molada: false,
    videoOynuyor: false,
    toplam: Object.freeze(sifirToplam()),
  });
}

/**
 * Uc bagimsiz bayraktan TEK bir gorunur durum adi turetir — oncelik sirasi kesin.
 * "Ikisi ayni anda olamaz" (HEDEF.md:69) boylece bir test sonucu degil, YAPISAL
 * imkansizliktir: bu fonksiyon her zaman tam bir ad doner.
 * Turkce `i` tuzagi: sabit dizelerle karsilastirilir, buyuk/kucuk harf donusumu YOK.
 */
function durumAdi(durum) {
  if (durum.anaKapali) return DURUMLAR.KAPALI;
  if (durum.molada) return DURUMLAR.MOLA;
  if (durum.videoOynuyor) return DURUMLAR.IZLENIYOR;
  return DURUMLAR.DURAKLATILDI;
}

/**
 * durum.t -> t araligini ekleyip uc toplami dondurur. Durumu DEGISTIRMEZ.
 * t geriye giderse firlatir.
 */
function ozet(durum, t) {
  if (!tamSayiMi(t)) {
    throw new TypeError(`ozet: t tam sayi olmali, gelen: ${String(t)}`);
  }
  if (t < durum.t) {
    throw new RangeError(`ozet: t geriye gidemez (durum.t=${durum.t}, t=${t})`);
  }
  return kovayaEkle(durum.toplam, durumAdi(durum), t - durum.t);
}

/**
 * Bir olay uygular ve YENI bir durum dondurur. Girdi nesnesi degismez.
 *
 * Sira kesin — ONCE sure, SONRA gecis:
 *   1) durum.t -> olay.t araligi, MEVCUT gorunur duruma karsilik gelen kovaya eklenir.
 *   2) Sonra olay bayraklari degistirir.
 *
 * `oynat`/`duraklat` KIPTEN BAGIMSIZ kaydedilir: MOLA'ya basinca video duraklatilir
 * (SAYAC_TEKLIF.md:51), tarayici bir duraklatma olayi uretir, modul bunu yalnizca
 * KAYDEDER — videoyu kendisi duraklatmaz. Mola kapaninca dogru durum kayitli
 * bayraktan turetilir. Bu sayede "yeni video acilinca sifirlanmaz"
 * (SAYAC_TEKLIF.md:33) YAPISAL olarak saglanir: modulde "video degisti" diye bir
 * olay yoktur, dolayisiyla sifirlayacak bir yer de yoktur.
 *
 * `olay.hiz` alani BILEREK OKUNMAZ. "Gercek zaman sayilir, oynatma hizi hesaba
 * girmez" (SAYAC_TEKLIF.md:30-31) iddiasinin olculebilir olmasi icin sema o alani
 * tanir; okunsaydi hiz:1 ve hiz:4 senaryolarinin toplamlari ayrisirdi.
 */
function uygula(durum, olay) {
  if (olay === null || typeof olay !== "object") {
    throw new TypeError(`uygula: olay nesne olmali, gelen: ${String(olay)}`);
  }
  if (!tamSayiMi(olay.t)) {
    throw new TypeError(`uygula: olay.t tam sayi olmali, gelen: ${String(olay.t)}`);
  }
  if (!OLAY_TURLERI.includes(olay.tur)) {
    throw new RangeError(
      `uygula: bilinmeyen olay turu "${String(olay.tur)}" — izinli: ${OLAY_TURLERI.join(", ")}`
    );
  }
  if (olay.t < durum.t) {
    throw new RangeError(
      `uygula: olay geriye gidemez (durum.t=${durum.t}, olay.t=${olay.t})`
    );
  }

  // 1) once sure
  const aralik = olay.t - durum.t;
  let toplam = kovayaEkle(durum.toplam, durumAdi(durum), aralik);

  // 2) sonra gecis
  let anaKapali = durum.anaKapali;
  let molada = durum.molada;
  let videoOynuyor = durum.videoOynuyor;

  if (olay.tur === "oynat") {
    videoOynuyor = true;
  } else if (olay.tur === "duraklat") {
    videoOynuyor = false;
  } else if (olay.tur === "mola-aç") {
    molada = true;
  } else if (olay.tur === "mola-kapat") {
    molada = false;
  } else if (olay.tur === "ana-kapat") {
    // Tek anahtar, iki konum (SAYAC_TEKLIF.md:57 "DUR / DEVAM ET", :107 "ana anahtar").
    anaKapali = !anaKapali;
  } else if (olay.tur === "gece-yarısı") {
    // Uc sayac sifirlanir, BAYRAKLAR KORUNUR: video oynuyorsa IZLENIYOR sifirdan devam
    // eder (SAYAC_TEKLIF.md:36-37 — gecmis gun saklanmaz).
    toplam = sifirToplam();
  }

  return Object.freeze({
    t: olay.t,
    anaKapali,
    molada,
    videoOynuyor,
    toplam: Object.freeze(toplam),
  });
}

/**
 * Tablo kosucusunun kullandigi sarmalayici.
 * @returns {{toplam:{izleniyor:number,duraklatildi:number,mola:number}, durumAdi:string}}
 */
function calistir(t0, olaylar, tSon) {
  let durum = baslangic(t0);
  for (const olay of olaylar) {
    durum = uygula(durum, olay);
  }
  return { toplam: ozet(durum, tSon), durumAdi: durumAdi(durum) };
}
