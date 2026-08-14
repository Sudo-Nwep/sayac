// Madde 4 arayüz hücreleri: Y11 · Y12 · Y13 · Y16. Argümanla seçilir.
//   node test-yolu/arayuz-e2e.mjs Y11
import {
  tarayiciliHucre, hazirBekle, faz, fazKontrol, fazYaz, anlik,
  cetvelB, bekle, hataMetni, TOLERANS_MS, FAZ_MS, YERLESME_MS,
} from "./ortak/hucre.mjs";

const HUCRE = (process.argv[2] || "Y11").toUpperCase();

//  KOŞUMDAN NCE SABİTLENEN BEŞ EŞİK  türetmeleriyle, keyfi degil 
// lçüm görüldükten sonra GEVŞETİLMEZ. Sapma bir bulgudur: önce sebebi ölçülür.
export const GORUNUM_TOLERANS_MS = 1500; // 1000 (saniyeye asagı yuvarlama) + 250 (yoklama) + 250 (okuma araligi)
export const VIDEO_ILERLEME_EPS = 0.05;  // saniye  duraklı videonun currentTime'i ilerlememeli
export const CANLILIK_ESIK_MS = 2000;    // KAPALI fazında arka planın anMs'i en az bu kadar ilerlemeli
export const CERCEVE_BEKLEME_MS = 8000;  // moz-extension çerçevesi + #btn-mola görünene kadar
export const RAPOR_BEKLEME_MS = 8000;    // pencere sondasının ilk raporu sunucuya düxene kadar

// On bir sabit Türkçe dize  ARAYUZ.md'ye BİREBİR yazılacak, testte BİREBİR karxılaxtırılacak.
export const DIZELER = {
  baslik: "Sayaç",
  mfBaslik: "Sayaç",
  etIzleniyor: "İzleniyor",
  etDuraklatildi: "Duraklatıldı",
  etMola: "Mola",
  etDurum: "Durum:",
  btnMolaAcik: "MOLA",
  btnMolaKapat: "MOLAYI BİTİR",
  btnAnaAcik: "DUR",
  btnAnaKapali: "DEVAM ET",
  uyariKelepce: "Hedef sekme belirlenemedi.",
};

function bitir(sonuc, sorunlar) {
  sonuc.sorunlar = sorunlar;
  sonuc.durum = sorunlar.length === 0 ? "YESIL" : "KIRMIZI";
}

// "S:DD:SS" ->  ms. Biçim tutmuyorsa null.
function cozumle(s) {
  const m = /^(\d+):(\d{2}):(\d{2})$/.exec(String(s == null ? "" : s));
  if (!m) return null;
  return Number(m[1]) * 3600000 + Number(m[2]) * 60000 + Number(m[3]) * 1000;
}

async function pencereOku(cerceve) {
  return await cerceve.evaluate(() => {
    const t = (id) => {
      const e = document.getElementById(id);
      return e ? e.textContent : null;
    };
    return {
      baslik: t("baslik"),
      title: document.title,
      etIzleniyor: t("etiket-izleniyor"),
      etDuraklatildi: t("etiket-duraklatildi"),
      etMola: t("etiket-mola"),
      etDurum: t("etiket-durum"),
      izleniyor: t("sayac-izleniyor"),
      duraklatildi: t("sayac-duraklatildi"),
      mola: t("sayac-mola"),
      durumAdi: t("durum-adi"),
      btnMola: t("btn-mola"),
      btnAna: t("btn-ana"),
      uyari: t("uyari"),
      hedefSekmeId: typeof window.hedefSekmeId === "number" ? window.hedefSekmeId : null,
    };
  });
}

function raporlar(sunucu, filtre) {
  const h = sunucu.olaylar.filter((o) => o.deney === "pencere");
  return filtre ? h.filter(filtre) : h;
}

async function raporBekle(sunucu, filtre, sureMs) {
  const bitisAn = Date.now() + sureMs;
  while (Date.now() < bitisAn) {
    const r = raporlar(sunucu, filtre);
    if (r.length) return r[r.length - 1];
    await bekle(200);
  }
  return null;
}

/** Ortak açılıx: test sayfası ->  hazır bekle ->  video kaynaxı ->  WAR iframe ->  çerçeve. */
async function pencereKur(context, sunucu, yaz) {
  const sayfa = context.pages()[0] || (await context.newPage());
  await sayfa.goto(sunucu.url, { waitUntil: "load", timeout: 30000 });
  const h = await hazirBekle(sayfa);
  if (!h.hazir) return { sayfa, hata: `eklenti hazir olmadi: ${h.sebep}` };
  yaz(`ilk anlik goruntu: ${JSON.stringify(h.ilk)}`);
  await sayfa.evaluate(() => window.kaynakVer("v1"));

  let adres = null;
  const b1 = Date.now() + 10000;
  while (Date.now() < b1) {
    adres = await sayfa
      .evaluate(() => document.documentElement.getAttribute("data-sayac-pencere"))
      .catch(() => null);
    if (adres) break;
    await bekle(200);
  }
  if (!adres) return { sayfa, hata: "data-sayac-pencere adresi gelmedi (10 sn)" };
  yaz(`pencere adresi (sondadan OKUNDU, sabitlenmedi): ${adres}`);

  await sayfa.evaluate((u) => {
    const f = document.createElement("iframe");
    f.id = "sayac-pencere";
    f.src = u;
    f.setAttribute("width", "300");
    f.setAttribute("height", "300");
    document.body.appendChild(f);
  }, adres);

  let cerceve = null;
  const b2 = Date.now() + CERCEVE_BEKLEME_MS;
  while (Date.now() < b2) {
    cerceve = sayfa.frames().find((f) => f.url().startsWith("moz-extension://")) || null;
    if (cerceve) break;
    await bekle(200);
  }
  if (!cerceve) {
    return { sayfa, adres, hata: `moz-extension:// cercevesi ${CERCEVE_BEKLEME_MS} ms icinde bulunamadi` };
  }
  try {
    await cerceve.waitForSelector("#btn-mola", { timeout: CERCEVE_BEKLEME_MS });
  } catch (e) {
    return { sayfa, adres, cerceve, hata: "#btn-mola gorunmedi: " + hataMetni(e) };
  }
  yaz("CERCEVE BULUNDU ve #btn-mola gorunur  birincil yol acik");
  return { sayfa, adres, cerceve };
}

const SEKME = (o) => o.baglam === "sekme";

/**
 * OLCULDU (Y16, ilk kosum): WAR iframe baglamında `API.tabs` UNDEFINED'dır
 * ("can't access property \"query\", API.tabs is undefined") ->  ürünün penceresi hedef
 * sekmeyi çözemez, kelepçesi devreye girer ve yoklama baglamaz. Bu yüzden buton ve
 * sayaç ölçümleri iframe'de DEĞİL, pencerenin KENDİ SEKMESİNDE yapılır.
 *
 * Kelepçe (kendi.id === hedef.id) tetiklenmesin diye: pencere sekmesi açılır ->  video
 * sekmesi öne alınır ->  pencere YENİDEN YUKLENİR (hedefBul yalnız açılısta kosar).
 *
 * a️ Bu baglamda `sender.tab` VARDIR; arkaplan.js:73-78 onceligi geregi arka plan
 * pencerenin KENDİ sekmesini yanıtlar. Yani okunan rakamlar pencerenin yasadigi
 * sekmeye aittir  hedefledigi sekmeye degil. Y16 bunu ölçtü, ARAYUZ.md'ye öyle yazılır.
 */
async function pencereSekmeKur(context, sunucu, yaz) {
  const t = await pencereKur(context, sunucu, yaz);
  if (t.hata && !t.adres) return { hata: t.hata };
  const { sayfa, adres } = t;

  // context.pages() taramasi yeni sayfayi yakalamiyor (ilk kosumda olculdu: sayfa
  // gercekten aciliyor ve rapor dusuyor, ama url() taramasi bosa cikiyor).
  // Dogru yol: window.open'DAN ONCE "page" olayina abone ol.
  // YOL 1  Playwright'in KENDI actigi sekme. goto("moz-extension://⬦") waitUntil:"load"
  // ile 20 sn zaman asimina ugruyordu (Y16 ilk kosumda olculdu); "commit" deneniyor.
  // Tutarsa sekme uzerinde tam denetim olur: video sekmesi one alinip pencere yeniden
  // yuklenebilir, boylece urunun kelepcesi (kendi.id === hedef.id) tetiklenmez.
  try {
    const pw = await context.newPage();
    await pw.goto(adres, { waitUntil: "commit", timeout: 10000 });
    await pw.waitForSelector("#btn-mola", { timeout: CERCEVE_BEKLEME_MS });
    yaz(`YOL 1 tuttu  Playwright pencereyi kendi sekmesinde acti: ${pw.url()}`);
    await sayfa.bringToFront();
    await bekle(400);
    await pw.reload({ waitUntil: "commit", timeout: 10000 });
    await pw.waitForSelector("#btn-mola", { timeout: CERCEVE_BEKLEME_MS });
    const u1 = await pw.textContent("#uyari").catch(() => null);
    yaz(`  #uyari="${u1}" ->  ${u1 ? "KELEPCE TETIKLENDI" : "canli"}`);
    if (!u1) return { sayfa, adres, pencereSayfa: pw };
    await pw.close().catch(() => {});
    yaz("  YOL 1'de kelepce tetiklendi (pencere sekmesi aktif kaldi)  YOL 2 deneniyor");
  } catch (e) {
    yaz(`YOL 1 tutmadi  birebir hata: ${hataMetni(e)}`);
  }

  // YOL 2  sayfadan window.open (MV2 web_accessible_resources ust duzey gezinmeye izin verir)
  const bekleyen = context
    .waitForEvent("page", { timeout: CERCEVE_BEKLEME_MS })
    .catch(() => null);
  const acRet = await sayfa.evaluate((u) => {
    try {
      window.__acilan = window.open(u, "_blank");
      return window.__acilan ? "pencere nesnesi dondu" : "null  engellendi";
    } catch (e) {
      return "istisna: " + (e && e.message ? e.message : String(e));
    }
  }, adres);
  yaz(`window.open donusu: ${acRet}`);
  const pencereSayfa = await bekleyen; // Playwright bagla(ya)mayabilir  olculuyor
  if (!pencereSayfa) {
    yaz(`YOL 2: Playwright sayfaya BAGLANAMADI (context 'page' olayi yok). context.pages(): ${JSON.stringify(context.pages().map((p) => p.url()))}`);
    yaz("  ->  sayfa yine de KOSUYOR; olcum ve tiklama sondanin kendi kanalindan yapilacak");
  }

  // Srünün kelepçesi (kendi.id === hedef.id) tetiklenmesin diye: video sekmesini öne al,
  // sonra pencereyi A!AN sayfadan yeniden gezindir (cross-origin location.href ATAMASI
  // izinlidir; location.reload() degildir). hedefBul yalnız açılısta kosar.
  const ilkRapor = await raporBekle(sunucu, SEKME, RAPOR_BEKLEME_MS);
  yaz(`pencere sekmesi kostu mu: ${ilkRapor ? "EVET (sonda raporu dustu)" : "HAYIR"}`);
  await sayfa.bringToFront();
  await bekle(1500); // odak yerlessin
  // Yenileme İÇERİDEN yaptırılır: disaridan location.href atamasi pencere sekmesine
  // odagi geri veriyordu ve urunun hedefBul()'u yarisi kaybediyordu (olculdu).
  sunucu.komutVer("__yenile");
  yaz("pencere sondaya ICERIDEN yeniletildi (__yenile komutu)");

  const canliRapor = await raporBekle2(sunucu, (o) => SEKME(o) && o.sDurum && o.sDurum !== "" && o.sUyari === "", RAPOR_BEKLEME_MS + 4000);
  if (!canliRapor) {
    const son = raporlar(sunucu, SEKME).slice(-1)[0];
    return {
      sayfa, adres, pencereSayfa,
      hata: `urunun kelepcesi tetiklendi  pencere hedef sekmeyi cozemedi. Son rapor: #uyari="${son ? son.sUyari : "rapor yok"}" getCurrent=${son ? son.getCurrent : "?"} sorguId=${son ? son.sorguId : "?"}`,
    };
  }
  yaz(`PENCERE CANLI · pencereHedef=${canliRapor.pencereHedef} · bgSekmeId=${canliRapor.bgSekmeId} · getCurrent=${canliRapor.getCurrent} sorguId=${canliRapor.sorguId} · bicimTipi=${canliRapor.bicimTipi} · yoklamaVar=${canliRapor.yoklamaVar} · DOM=${canliRapor.sIzleniyor}/${canliRapor.sDuraklatildi}/${canliRapor.sMola} durum="${canliRapor.sDurum}"`);
  // KAPI (olculmus): canli baglamda bile pencere BIR sekmeyi hedefliyor, arka plan
  // BASKA sekmeyi yanitliyor (arkaplan.js:73-78 golgelemesi). O konfigurasyonda
  // arayuzden okunan her rakam YANLIS KABLOLANMIS bir duzeni olcer; kirmizi yazmak
  // urunu suclamak olurdu (G22). Bu yuzden hucre OLCULEMEDI diye kapanir.
  if (String(canliRapor.pencereHedef) !== String(canliRapor.bgSekmeId)) {
    return {
      sayfa, adres, pencereSayfa, canliRapor,
      hata:
        `pencere sekme ${canliRapor.pencereHedef} numarali sekmeyi HEDEFLIYOR ama arka plan ` +
        `sekme ${canliRapor.bgSekmeId} icin yanit veriyor (arkaplan.js:73-78 golgelemesi). ` +
        `Bu baglamda arayuzden okunan rakam urunun amacladigi yolu OLCMEZ.`,
    };
  }
  return { sayfa, adres, pencereSayfa, canliRapor };
}

// Belirli bir koxulu saxlayan rapor gelene kadar bekle (raporBekle yalnız SON raporu döner).
async function raporBekle2(sunucu, kosul, sureMs) {
  const bitisAn = Date.now() + sureMs;
  while (Date.now() < bitisAn) {
    const r = raporlar(sunucu, kosul);
    if (r.length) return r[r.length - 1];
    await bekle(200);
  }
  return null;
}

function say(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

async function yeniRapor(sunucu, filtre, sonTur, sureMs = 8000) {
  const bitisAn = Date.now() + sureMs;
  while (Date.now() < bitisAn) {
    const r = raporlar(sunucu, filtre);
    const son = r[r.length - 1];
    if (son && Number(son.tur) > sonTur && son.bgAn && son.bgAn !== "yok") return son;
    await bekle(200);
  }
  return null;
}

/** Pencere sekmesi için faz ölçümü  'lar arka planın KENDİ saatinden (bgAn). */
async function pencereFaz(sunucu, ad, komut, sureMs = FAZ_MS) {
  if (komut) await komut();
  await bekle(YERLESME_MS);
  const mevcut = raporlar(sunucu, SEKME).slice(-1)[0];
  const r1 = await yeniRapor(sunucu, SEKME, mevcut ? Number(mevcut.tur) : 0);
  if (!r1) return { ad, hata: "r1 sonda raporu gelmedi" };
  await bekle(sureMs);
  const r2 = await yeniRapor(sunucu, SEKME, Number(r1.tur));
  if (!r2) return { ad, hata: "r2 sonda raporu gelmedi" };
  return {
    ad,
    dAn: say(r2.bgAn) - say(r1.bgAn),
    d: {
      izleniyor: say(r2.bgIzleniyor) - say(r1.bgIzleniyor),
      duraklatildi: say(r2.bgDuraklatildi) - say(r1.bgDuraklatildi),
      mola: say(r2.bgMola) - say(r1.bgMola),
    },
    r1,
    r2,
    g2: { durumAdi: r2.bgDurum, sekmeId: say(r2.bgSekmeId), toplam: { izleniyor: say(r2.bgIzleniyor), duraklatildi: say(r2.bgDuraklatildi), mola: say(r2.bgMola) } },
  };
}

function pencereFazYaz(yaz, fz, ilerleyen) {
  if (fz.hata) return yaz(`  FAZ ${fz.ad}: HATA  ${fz.hata}`);
  yaz(
    `  FAZ ${fz.ad.padEnd(20)} an=${String(fz.dAn).padStart(5)} ms | izleniyor=${String(fz.d.izleniyor).padStart(5)} duraklatildi=${String(fz.d.duraklatildi).padStart(5)} mola=${String(fz.d.mola).padStart(5)} | durum=${fz.g2.durumAdi} sekme=${fz.g2.sekmeId}` +
      (ilerleyen ? ` | ilerleyen: ${ilerleyen}` : " | ucu de durmali")
  );
  yaz(`      PENCERE DOM: ${fz.r2.sIzleniyor} / ${fz.r2.sDuraklatildi} / ${fz.r2.sMola} · durum="${fz.r2.sDurum}" · btnMola="${fz.r2.sBtnMola}" btnAna="${fz.r2.sBtnAna}"`);
}

// Yedek Yol B: çerçeve sürülemezse pencere sondasının raporundan ne ölçülebiliyorsa ölç.
async function yedekYolB(sunucu, sonuc, yaz, sebep) {
  yaz("YEDEK YOL B  cerceve surulemedi: " + sebep);
  const r = await raporBekle(sunucu, (o) => o.baglam === "iframe", RAPOR_BEKLEME_MS);
  sonuc.yedekYolB = { sebep, rapor: r || null };
  if (!r) {
    yaz("  pencere sondasi raporu da dusmedi  bu hucrede hicbir kanal olcemedi");
    return null;
  }
  yaz(`  sonda raporu (pencerenin KENDI baglamindan): ${JSON.stringify(r)}`);
  return r;
}

//  Y11
async function y11(ctx) {
  const { context, sunucu, yaz, sonuc } = ctx;
  const k = await pencereSekmeKur(context, sunucu, yaz);
  if (k.hata) {
    // YEDEK YOL B — pencere CANLI bağlama sokulamadı, ama iframe bağlamında YÜKLENDİ.
    // Ölçülebilen kutular burada ölçülür; ölçülemeyen kutular adıyla yazılır.
    const r = await yedekYolB(sunucu, sonuc, yaz, k.hata);
    sonuc.durum = "ölçülemedi";
    sonuc.sebep = `pencere CANLI baglamda acilamadi: ${k.hata}`;
    if (!r) return;

    // Kriter 6 — on bir Türkçe dize, iframe bağlamının DOM'undan, BİREBİR.
    // Bu bağlamda #uyari BOŞ DEĞİL, kelepçe metni olmalıdır (API.tabs undefined).
    const et = String(r.sEtiketler || "").split("|");
    const olcum = [
      ["baslik", DIZELER.baslik, r.sBaslik],
      ["etIzleniyor", DIZELER.etIzleniyor, et[0]],
      ["etDuraklatildi", DIZELER.etDuraklatildi, et[1]],
      ["etMola", DIZELER.etMola, et[2]],
      ["etDurum", DIZELER.etDurum, et[3]],
      ["btnMola", DIZELER.btnMolaAcik, r.sBtnMola],
      ["btnAna", DIZELER.btnAnaAcik, r.sBtnAna],
      ["uyari(kelepce)", DIZELER.uyariKelepce, r.sUyari],
      ["mfBaslik", DIZELER.mfBaslik, r.mfBaslik],
    ];
    sonuc.dizeler = olcum.map(([alan, bek, oku]) => ({ alan, beklenen: bek, okunan: oku, ok: bek === oku }));
    const tutan = sonuc.dizeler.filter((d) => d.ok).length;
    yaz(`DIZELER (iframe baglami): ${tutan}/${olcum.length} birebir esit`);
    for (const d of sonuc.dizeler) if (!d.ok) yaz(`  dize ${d.alan}: beklenen "${d.beklenen}" · okunan "${d.okunan}"`);

    const popupTamam = typeof r.mfPopup === "string" && r.mfPopup.endsWith("/pencere.html");
    sonuc.manifestBildirimi = { mfPopup: r.mfPopup, mfBaslik: r.mfBaslik, popupTamam };
    yaz(`MANIFEST BILDIRIMI (pencerenin kendi icinden): default_popup="${r.mfPopup}" (".../pencere.html" mi: ${popupTamam}) · default_title="${r.mfBaslik}"`);

    // Ürünün bozulma kelepçesi — sessizce yanlış sekmeye bakmadı.
    const sifir = r.sIzleniyor === "0:00:00" && r.sDuraklatildi === "0:00:00" && r.sMola === "0:00:00";
    sonuc.kelepce = { uyari: r.sUyari, sayaclar: [r.sIzleniyor, r.sDuraklatildi, r.sMola], calisti: r.sUyari === DIZELER.uyariKelepce && sifir, sebep: r.sorguHata };
    yaz(`URUN KELEPCESI: #uyari="${r.sUyari}" · sayaclar=${JSON.stringify(sonuc.kelepce.sayaclar)} → ${sonuc.kelepce.calisti ? "CALISTI (sessizce yanlis sekmeye BAKMADI)" : "CALISMADI"}`);
    yaz(`  sebep (olculdu): ${r.sorguHata}`);

    sonuc.olculemeyen = {
      "kriter 2 — iki cetvelin ortusmesi": "pencere canli sayi gostermedigi icin olculemedi",
      "kriter 3 — MOLA butonunun uc durumu": "butona tiklanamadi (asagidaki dort yol da olculerek dustu)",
      "kriter 4 — DUR/DEVAM ET'in uc durumu": "ayni sebep",
      "kriter 5 — MOLA videoyu duraklatti mi (arayuzden)": "ayni sebep; DAVRANIS olcumu Y6'da",
    };
    return;
  }
  const sorunlar = [];
  await k.sayfa.evaluate(() => window.oynat("v1"));
  yaz("pencere sekmesinde sayaclar birikiyor, ~3 sn bekleniyor");
  await bekle(3000);

  // İKİ BAĞIMSIZ CETVEL  aynı raporda: bg* = arka planın söyledixi, s* = pencerenin DOM'u.
  const mevcut = raporlar(sunucu, SEKME).slice(-1)[0];
  const rN = await yeniRapor(sunucu, SEKME, mevcut ? Number(mevcut.tur) - 1 : 0);
  if (!rN) { sonuc.durum = "ölçülemedi"; sonuc.sebep = "sonda raporu gelmedi"; return; }
  const rN1 = await yeniRapor(sunucu, SEKME, Number(rN.tur));
  if (!rN1) { sonuc.durum = "ölçülemedi"; sonuc.sebep = "ikinci sonda raporu gelmedi"; return; }

  yaz(`CETVEL A (arka plan, sekme ${rN.bgSekmeId}): izleniyor=${rN.bgIzleniyor} duraklatildi=${rN.bgDuraklatildi} mola=${rN.bgMola} durum=${rN.bgDurum}`);
  yaz(`CETVEL B (pencere DOM):                    ${rN.sIzleniyor} / ${rN.sDuraklatildi} / ${rN.sMola} · durum="${rN.sDurum}"`);

  const kovalar = [
    ["izleniyor", rN.sIzleniyor, "bgIzleniyor"],
    ["duraklatildi", rN.sDuraklatildi, "bgDuraklatildi"],
    ["mola", rN.sMola, "bgMola"],
  ];
  const ortusme = [];
  for (const [ad, metin, alan] of kovalar) {
    const gorunenMs = cozumle(metin);
    if (gorunenMs === null) { sorunlar.push(`${ad}: "${metin}" S:DD:SS bicimine uymuyor`); continue; }
    const t1 = say(rN[alan]);
    const t2 = say(rN1[alan]);
    const fark = t1 - gorunenMs; // İŞARETLİ  mutlak deger gercek hatayi gizler
    const tamam = gorunenMs <= t2 && fark >= 0 && fark <= GORUNUM_TOLERANS_MS;
    ortusme.push({ kova: ad, gorunen: metin, gorunenMs, t1, t2, isaretliFark: fark, tamam });
    yaz(`  ORTUSME ${ad.padEnd(13)} gorunen=${metin} (${gorunenMs} ms) · t1=${t1} t2=${t2} · isaretli fark (t1-gorunen)=${fark} ms · ${tamam ? "TAMAM" : "SAPMA"}`);
    if (!tamam) sorunlar.push(`${ad}: gorunen=${gorunenMs} t1=${t1} t2=${t2} isaretliFark=${fark} (kabul: gorunen<=t2 ve 0<=fark<=${GORUNUM_TOLERANS_MS})`);
  }
  sonuc.ortusme = ortusme;

  if (rN.sDurum !== rN.bgDurum) sorunlar.push(`#durum-adi="${rN.sDurum}" ile arka planin durumAdi="${rN.bgDurum}" farkli`);

  // On bir Türkçe dize  pencerenin DOM'undan, BİREBİR
  // Dizeler pencerenin KENDI DOM'undan, sonda raporu uzerinden okunur: Playwright
  // moz-extension:// sayfasina baglanamiyor (dort yol olculerek dustu, ARAYUZ.md).
  const et = String(rN.sEtiketler || "").split("|");
  const dizeSonuc = [
    ["baslik", DIZELER.baslik, rN.sBaslik],
    ["etIzleniyor", DIZELER.etIzleniyor, et[0]],
    ["etDuraklatildi", DIZELER.etDuraklatildi, et[1]],
    ["etMola", DIZELER.etMola, et[2]],
    ["etDurum", DIZELER.etDurum, et[3]],
    ["btnMola", DIZELER.btnMolaAcik, rN.sBtnMola],
    ["btnAna", DIZELER.btnAnaAcik, rN.sBtnAna],
    ["uyari", "", rN.sUyari],
    ["mfBaslik", DIZELER.mfBaslik, rN.mfBaslik],
  ].map(([alan, bek, oku]) => ({ alan, beklenen: bek, okunan: oku, ok: bek === oku }));
  for (const d of dizeSonuc) {
    if (!d.ok) sorunlar.push(`dize ${d.alan}: beklenen "${d.beklenen}" okunan "${d.okunan}"`);
  }
  sonuc.dizeler = dizeSonuc;
  yaz(`DIZELER: ${dizeSonuc.filter((d) => d.ok).length}/${dizeSonuc.length} birebir esit`);

  // Manifest bildirimi  pencerenin KENDİ içinden. Firefox default_popup'i MUTLAK
  // moz-extension:// adresine cozer; sonek karsilastirilir (olcum tanimi, gevsetme degil).
  const popupTamam = typeof rN.mfPopup === "string" && rN.mfPopup.endsWith("/pencere.html");
  sonuc.manifestBildirimi = { mfPopup: rN.mfPopup, mfBaslik: rN.mfBaslik, popupTamam };
  yaz(`MANIFEST BILDIRIMI (pencerenin kendi icinden): default_popup="${rN.mfPopup}" default_title="${rN.mfBaslik}"`);
  if (!popupTamam) sorunlar.push(`mfPopup="${rN.mfPopup}", ".../pencere.html" bekleniyordu`);
  if (rN.mfBaslik !== DIZELER.mfBaslik) sorunlar.push(`mfBaslik="${rN.mfBaslik}", "${DIZELER.mfBaslik}" bekleniyordu`);

  sonuc.simgeyeTiklama = "ölçülemedi  Playwright Firefox'ta tarayici kromuna (arac cubugu paneli) erisemez; gercek panel denemesi Y16d'dedir, sonucu orada yazili";
  sonuc.baglamNotu = "Olcumler pencerenin KENDI sekmesinde yapildi; arkaplan.js:73-78 onceligi geregi arka plan o sekmeyi yanitlar. WAR iframe baglaminda API.tabs UNDEFINED oldugu icin (Y16'da olculdu) pencere orada calisamaz.";
  bitir(sonuc, sorunlar);
}

//  Y12
async function y12(ctx) {
  const { context, sunucu, yaz, sonuc } = ctx;
  const k = await pencereSekmeKur(context, sunucu, yaz);
  if (k.hata) {
    await yedekYolB(sunucu, sonuc, yaz, k.hata);
    sonuc.durum = "ölçülemedi";
    sonuc.sebep = `MOLA butonuna tiklanamadi: ${k.hata}`;
    return;
  }
  const sorunlar = [];
  const f1 = await pencereFaz(sunucu, "mola oncesi", null);
  pencereFazYaz(yaz, f1, "duraklatildi");
  if (f1.hata) sorunlar.push(`[mola oncesi] ${f1.hata}`);
  else sorunlar.push(...fazKontrol(f1, "duraklatildi").map((s) => `[mola oncesi] ${s}`));

  // MOLA A!IK  pencerede GER!EK tıklama
  const f2 = await pencereFaz(sunucu, "mola acik", () => sunucu.komutVer("btn-mola"));
  pencereFazYaz(yaz, f2, "mola");
  if (f2.hata) sorunlar.push(`[mola acik] ${f2.hata}`);
  else {
    sorunlar.push(...fazKontrol(f2, "mola").map((s) => `[mola acik] ${s}`));
    if (f2.g2.durumAdi !== "MOLA") sorunlar.push(`[mola acik] durumAdi="${f2.g2.durumAdi}", "MOLA" olmaliydi`);
    if (f2.r2.sBtnMola !== DIZELER.btnMolaKapat) sorunlar.push(`[mola acik] btnMola="${f2.r2.sBtnMola}", "${DIZELER.btnMolaKapat}" olmaliydi`);
    if (f2.r2.sDurum !== "MOLA") sorunlar.push(`[mola acik] #durum-adi="${f2.r2.sDurum}", "MOLA" olmaliydi`);
  }

  // MOLA KAPALI  ikinci tıklama. mola-aç/mola-kapat İKİ AYRI olaydır; toggle degil.
  const f3 = await pencereFaz(sunucu, "mola kapali", () => sunucu.komutVer("btn-mola"));
  pencereFazYaz(yaz, f3, "duraklatildi");
  if (f3.hata) sorunlar.push(`[mola kapali] ${f3.hata}`);
  else {
    sorunlar.push(...fazKontrol(f3, "duraklatildi").map((s) => `[mola kapali] ${s}`));
    if (f3.g2.durumAdi !== "DURAKLATILDI") sorunlar.push(`[mola kapali] durumAdi="${f3.g2.durumAdi}", "DURAKLATILDI" olmaliydi  ikinci tiklama mola-kapat gondermedi mi?`);
    if (f3.r2.sBtnMola !== DIZELER.btnMolaAcik) sorunlar.push(`[mola kapali] btnMola="${f3.r2.sBtnMola}", "${DIZELER.btnMolaAcik}" olmaliydi`);
  }

  sonuc.kumulatif = {
    molaOncesi: f1.g2 ? f1.g2.toplam : null,
    molaAcik: f2.g2 ? f2.g2.toplam : null,
    molaKapali: f3.g2 ? f3.g2.toplam : null,
  };
  yaz(`KUMULATIF: ${JSON.stringify(sonuc.kumulatif)}`);
  sonuc.videoDuraklatma =
    "ölçülemedi  pencere kendi sekmesinde yasiyor ve o sekmede <video> YOK. " +
    "Urunun videoyu gercekten duraklattigi Y6'da (mesaj API'si yolu, video'lu sekme) " +
    "cetvelB.paused ile olculur; o ARAYUZ degil DAVRANIS olcumudur.";
  sonuc.olcumler = [f1, f2, f3].map((f) => ({ ad: f.ad, dAn: f.dAn, d: f.d, durum: f.g2 && f.g2.durumAdi, pencereDom: f.r2 ? [f.r2.sIzleniyor, f.r2.sDuraklatildi, f.r2.sMola, f.r2.sBtnMola] : null }));
  bitir(sonuc, sorunlar);
}

//  Y13
async function y13(ctx) {
  const { context, sunucu, yaz, sonuc } = ctx;
  const k = await pencereSekmeKur(context, sunucu, yaz);
  if (k.hata) {
    await yedekYolB(sunucu, sonuc, yaz, k.hata);
    sonuc.durum = "ölçülemedi";
    sonuc.sebep = `DUR/DEVAM ET butonuna tiklanamadi: ${k.hata}`;
    return;
  }
  const sorunlar = [];
  const f1 = await pencereFaz(sunucu, "kapatmadan once", null);
  pencereFazYaz(yaz, f1, "duraklatildi");
  if (f1.hata) { sonuc.durum = "ölçülemedi"; sonuc.sebep = f1.hata; return; }
  sorunlar.push(...fazKontrol(f1, "duraklatildi").map((s) => `[oncesi] ${s}`));
  const T1 = f1.g2.toplam;
  const btnOnce = f1.r2.sBtnAna;

  // KAPALI  S!SNSN DE tam 0 olmasi beklenir
  const f2 = await pencereFaz(sunucu, "kapali", () => sunucu.komutVer("btn-ana"));
  pencereFazYaz(yaz, f2, null);
  if (f2.hata) { sonuc.durum = "ölçülemedi"; sonuc.sebep = f2.hata; return; }
  sorunlar.push(...fazKontrol(f2, null).map((s) => `[kapali] ${s}`));
  if (f2.g2.durumAdi !== "KAPALI") sorunlar.push(`[kapali] durumAdi="${f2.g2.durumAdi}", "KAPALI" olmaliydi`);
  if (f2.r2.sBtnAna !== DIZELER.btnAnaKapali) sorunlar.push(`[kapali] btnAna="${f2.r2.sBtnAna}", "${DIZELER.btnAnaKapali}" olmaliydi`);

  // a️ CANLILIK KANITI  "her sey durdu" ile "baglanti koptu" AYNI rakami (=0) verir.
  const yaziDegisti = btnOnce === DIZELER.btnAnaAcik && f2.r2.sBtnAna === DIZELER.btnAnaKapali;
  const canli = f2.dAn > CANLILIK_ESIK_MS;
  yaz(`CANLILIK: an=${f2.dAn} ms (esik ${CANLILIK_ESIK_MS}) ->  ${canli ? "arka plan CANLI" : "OLCULEMEDI"} · buton "${btnOnce}" ->  "${f2.r2.sBtnAna}" ->  ${yaziDegisti ? "DEGISTI" : "degismedi"}`);
  sonuc.canlilik = { dAn: f2.dAn, esik: CANLILIK_ESIK_MS, canli, butonOnce: btnOnce, butonSonra: f2.r2.sBtnAna, yaziDegisti };
  if (!canli || !yaziDegisti) {
    sonuc.durum = "ölçülemedi";
    sonuc.sebep = `KAPALI fazinda canlilik kanitlanamadi (an=${f2.dAn}, yaziDegisti=${yaziDegisti})  =0 tek basina yesil sayilmaz`;
    yaz("KUTU OLCULEMEDI: " + sonuc.sebep);
    return;
  }

  // TEKRAR A!IK  ana-kapat tek toggle'dir
  const f3 = await pencereFaz(sunucu, "tekrar acik", () => sunucu.komutVer("btn-ana"));
  pencereFazYaz(yaz, f3, "duraklatildi");
  if (f3.hata) sorunlar.push(`[tekrar acik] ${f3.hata}`);
  else {
    sorunlar.push(...fazKontrol(f3, "duraklatildi").map((s) => `[tekrar acik] ${s}`));
    if (f3.g2.durumAdi !== "DURAKLATILDI") sorunlar.push(`[tekrar acik] durumAdi="${f3.g2.durumAdi}", "DURAKLATILDI" olmaliydi (pencere sekmesinde video yok)`);
    if (f3.r2.sBtnAna !== DIZELER.btnAnaAcik) sorunlar.push(`[tekrar acik] btnAna="${f3.r2.sBtnAna}", "${DIZELER.btnAnaAcik}" olmaliydi`);
  }

  const T2 = f3.g2 ? f3.g2.toplam : null;
  const sifirlanmadi = T2 ? T2.duraklatildi >= T1.duraklatildi : null;
  yaz(`KUMULATIF T1=${JSON.stringify(T1)} ->  T2=${JSON.stringify(T2)} (sifirlanmadi mi: ${sifirlanmadi})`);
  sonuc.kumulatif = { T1, T2, sifirlanmadi };
  if (T2 && !sifirlanmadi) sorunlar.push(`kumulatif SIFIRLANDI: ${T1.duraklatildi} ->  ${T2.duraklatildi}`);

  sonuc.olcumler = [f1, f2, f3].map((f) => ({ ad: f.ad, dAn: f.dAn, d: f.d, durum: f.g2 && f.g2.durumAdi, pencereDom: f.r2 ? [f.r2.sIzleniyor, f.r2.sDuraklatildi, f.r2.sMola, f.r2.sBtnAna] : null }));
  bitir(sonuc, sorunlar);
}

//  Y16
async function y16(ctx) {
  const { context, sunucu, yaz, sonuc } = ctx;
  const k = await pencereKur(context, sunucu, yaz);
  await k.sayfa.evaluate(() => window.oynat("v1")).catch(() => {});
  await bekle(2500); // gerçek sekmenin toplam'ı sıfırdan farklılaxsın

  const adimlar = {};

  //  16a  karsit deney (WAR iframe baglamı) 
  const rIframe = await raporBekle(sunucu, (o) => o.baglam === "iframe", RAPOR_BEKLEME_MS);
  const sonda = await anlik(k.sayfa);
  if (!rIframe) {
    adimlar["16a"] = { durum: "ölçülemedi", sebep: "iframe baglamindan pencere sondasi raporu dusmedi" };
  } else {
    const g1 = rIframe.probe1Gonderilen, d1 = rIframe.probe1Donen;
    const g2 = rIframe.probe2Gonderilen, d2 = rIframe.probe2Donen;
    const esles1 = g1 === d1, esles2 = g2 === d2;
    adimlar["16a"] = {
      durum: "ölçüldü",
      probe1: { gonderilen: g1, donen: d1, esit: esles1, izleniyor: rIframe.probe1Izleniyor },
      probe2: { gonderilen: g2, donen: d2, esit: esles2, izleniyor: rIframe.probe2Izleniyor },
      gercekSekmeId: sonda ? String(sonda.sekmeId) : "yok",
      gercekIzleniyor: sonda ? String(sonda.toplam.izleniyor) : "yok",
      golgeleme: !(esles1 && esles2),
    };
    yaz(`16a KARSIT DENEY: 999999 ${d1} (esit=${esles1}, toplam.izleniyor=${rIframe.probe1Izleniyor}) · 888888 ${d2} (esit=${esles2}, toplam.izleniyor=${rIframe.probe2Izleniyor})`);
    yaz(`    gercek sekme: sekmeId=${adimlar["16a"].gercekSekmeId} toplam.izleniyor=${adimlar["16a"].gercekIzleniyor}`);
    yaz(`    GOLGELEME: ${adimlar["16a"].golgeleme ? "VAR  sender.tab onceligi msg.sekmeId'yi ezdi" : "YOK  msg.sekmeId yolu gecerli"}`);
    // tabs.query'nin O BAGLAMDA neden bos dondugu OLCULUR, tahmin edilmez.
    yaz(`    tabs yuzeyi: tabsTipi=${rIframe.tabsTipi} · sorguUzunluk=${rIframe.sorguUzunluk} · sorguId=${rIframe.sorguId} · urlTipi=${rIframe.urlTipi} · sorguHata="${rIframe.sorguHata}"`);
    yaz(`    ham iframe raporu: ${JSON.stringify(rIframe)}`);
    adimlar["16a"].hamRapor = rIframe;
  }

  //  16b  üç kimlik yan yana 
  const p = k.cerceve ? await pencereOku(k.cerceve).catch(() => null) : null;
  adimlar["16b"] = {
    durum: rIframe || p ? "ölçüldü" : "ölçülemedi",
    pencereHedef: p ? String(p.hedefSekmeId) : rIframe ? rIframe.pencereHedef : "yok",
    sorguId: rIframe ? rIframe.sorguId : "yok",
    sondaSekmeId: sonda ? String(sonda.sekmeId) : "yok",
  };
  yaz(`16b UC KIMLIK: pencereHedef=${adimlar["16b"].pencereHedef} · tabs.query sorguId=${adimlar["16b"].sorguId} · sonda sekmeId=${adimlar["16b"].sondaSekmeId}`);

  //  16c  pozitif kontrol: pencere KENDİ sekmesinde 
  // a️ page.goto("moz-extension://⬦") Playwright'ta 20 sn'de ZAMAN AŞIMINA UĞRUYOR
  // (ilk kosumda ölçüldü). Bu yüzden gezinme SAYFANIN KENDİSİNDEN yapılır:
  // MV2'de web_accessible_resources üst düzey gezinmeye izin verir.
  try {
    await k.sayfa.evaluate((u) => window.open(u, "_blank"), k.adres);
    const rSekme = await raporBekle(sunucu, (o) => o.baglam === "sekme", RAPOR_BEKLEME_MS);
    if (!rSekme) {
      adimlar["16c"] = { durum: "ölçülemedi", sebep: "kendi sekmesinden sonda raporu dusmedi" };
    } else {
      const ayirtEdici = rSekme.probe1Gonderilen !== rSekme.probe1Donen;
      const uyari = rSekme.sUyari;
      const sifir = rSekme.sIzleniyor === "0:00:00" && rSekme.sDuraklatildi === "0:00:00" && rSekme.sMola === "0:00:00";
      adimlar["16c"] = {
        durum: "ölçüldü",
        ayirtEdici,
        probe1Gonderilen: rSekme.probe1Gonderilen,
        probe1Donen: rSekme.probe1Donen,
        getCurrent: rSekme.getCurrent,
        sorguId: rSekme.sorguId,
        uyariMetni: uyari,
        kelepceCalisti: uyari === DIZELER.uyariKelepce && sifir,
        sayaclar: [rSekme.sIzleniyor, rSekme.sDuraklatildi, rSekme.sMola],
        hamRapor: rSekme,
      };
      yaz(`16c POZITIF KONTROL (kendi sekmesi): 999999 ${rSekme.probe1Donen} · ayirt edici mi=${ayirtEdici} · getCurrent=${rSekme.getCurrent} sorguId=${rSekme.sorguId}`);
      yaz(`    ham rapor: ${JSON.stringify(rSekme)}`);
      yaz(`    URUN KELEPCESI: #uyari="${uyari}" · sayaclar=${JSON.stringify(adimlar["16c"].sayaclar)} ->  ${adimlar["16c"].kelepceCalisti ? "CALISTI" : "CALISMADI"}`);
    }
    // Açılan pencere sekmesi kapatılır (G23)  window.open ile açıldıxı için
    // Playwright tutamacı context.pages() içinden bulunur.
    const acilan = context.pages().find((p) => p.url().startsWith("moz-extension://"));
    if (acilan) await acilan.close().catch(() => {});
  } catch (e) {
    adimlar["16c"] = { durum: "ölçülemedi", sebep: "birebir hata: " + hataMetni(e) };
    yaz("16c DUSTU  " + adimlar["16c"].sebep);
  }

  //  16d  gerçek açılır pencere, TEK DENEME 
  if (k.cerceve) {
    try {
      await k.cerceve.click("#sonda-ac-pencere", { timeout: 5000 });
      const rPanel = await raporBekle(sunucu, (o) => o.baglam === "panel", RAPOR_BEKLEME_MS);
      const sonIframe = raporlar(sunucu, (o) => o.baglam === "iframe").slice(-1)[0];
      if (rPanel) {
        adimlar["16d"] = {
          durum: "ölçüldü", baglam: "panel",
          probe1Gonderilen: rPanel.probe1Gonderilen, probe1Donen: rPanel.probe1Donen,
          pencereHedef: rPanel.pencereHedef, sorguId: rPanel.sorguId,
          getCurrent: rPanel.getCurrent, sBtnMola: rPanel.sBtnMola, sDurum: rPanel.sDurum,
        };
        yaz(`16d PANEL ACILDI: 999999 ${rPanel.probe1Donen} · pencereHedef=${rPanel.pencereHedef} sorguId=${rPanel.sorguId}`);
      } else {
        adimlar["16d"] = {
          durum: "ölçülemedi",
          sebep: "panel baglamindan rapor dusmedi",
          openPopup: sonIframe ? sonIframe.openPopup : "rapor yok",
        };
        yaz(`16d OLCULEMEDI  openPopup birebir sonuc: ${adimlar["16d"].openPopup}`);
      }
    } catch (e) {
      adimlar["16d"] = { durum: "ölçülemedi", sebep: "birebir hata: " + hataMetni(e) };
      yaz("16d DUSTU  " + adimlar["16d"].sebep);
    }
  } else {
    adimlar["16d"] = { durum: "ölçülemedi", sebep: "cerceve yok, tiklanamadi" };
  }

  //  KARAR TABLOSU (004 görev tanımı, Y16) 
  sonuc.adimlar = adimlar;
  const a = adimlar["16a"], b = adimlar["16b"], c = adimlar["16c"];
  let durum, cumle;

  if (!a || a.durum !== "ölçüldü") {
    durum = "ölçülemedi";
    cumle = `16a ölçülemedi: ${a ? a.sebep : "adım koxmadı"}`;
  } else if (!c || c.durum !== "ölçüldü") {
    durum = "ölçülemedi";
    cumle = `pozitif kontrol (16c) koxulamadı: ${c ? c.sebep : "adım koxmadı"}  deneyin ayırt edicilixi ölçülemedi, bu yüzden 16a'nın sonucu tek baxına yazılmaz`;
  } else if (!c.ayirtEdici) {
    durum = "ölçülemedi";
    cumle = `karxıt deney AYIRT EDİCİ !IKMADI  kendi sekmesinde de gönderilen kimlik geri döndü (999999 ${c.probe1Donen}). lçülen dexerler kayıtlı, ama kimlik zinciri hakkında hüküm verilemez.`;
  } else if (!c.kelepceCalisti) {
    durum = "KIRMIZI";
    cumle = `ürünün bozulma kelepçesi !ALIŞMADI: kendi sekmesinde #uyari="${c.uyariMetni}" (beklenen "${DIZELER.uyariKelepce}"), sayaçlar=${JSON.stringify(c.sayaclar)}`;
  } else if (!a.golgeleme && b.sorguId === b.sondaSekmeId) {
    durum = "YESIL";
    cumle = `WAR iframe baglamında arka plan kimlisi msg.sekmeId'den aldı (999999 ${a.probe1.donen}, 888888 ${a.probe2.donen}); pencerenin tabs.query ile buldusu kimlik ${b.sorguId}, sondanın gördüsü ${b.sondaSekmeId}  esit. BU BAĞLAMDA OLCULDU.`;
  } else if (!a.golgeleme && b.sorguId !== b.sondaSekmeId) {
    durum = "KIRMIZI";
    cumle = `pencere YANLIŞ sekmeye bakıyor: tabs.query ${b.sorguId}, sondanın gördüxü ${b.sondaSekmeId}`;
  } else if (a.golgeleme && b.sorguId === "yok") {
      // "yok" YANLIS KIMLIK DEGILDIR - API hic yok demektir (olculdu: WAR iframe'de
      // API.tabs undefined). Kirmizi yazmak yanlis soruyu sormak olurdu (G22).
      durum = "olculemedi";
      cumle =
        `OLCULEMEDI - iki katman birden: (1) arkaplan.js:73-78 onceligi msg.sekmeId'yi golgeliyor ` +
        `(gonderilen 999999 -> donen ${a.probe1.donen}); (2) WAR iframe baglaminda API.tabs UNDEFINED ` +
        `("${a.hamRapor ? a.hamRapor.sorguHata : "?"}") oldugu icin pencere kimlik BILE cozemiyor ve ` +
        `urunun kelepcesi devreye giriyor. Olculen: tabs.query -> ${b.sorguId}, sonda -> ${b.sondaSekmeId}. ` +
        `Pencerenin kimlik cozumu bu baglamda SINANAMAZ.`;
    } else if (a.golgeleme && b.sorguId !== b.sondaSekmeId) {
    durum = "KIRMIZI";
    cumle = `gölgeleme VAR ve tek sekmeli düzende tabs.query yanlıx kimlik verdi: sorguId=${b.sorguId}, sonda=${b.sondaSekmeId}`;
  } else {
    durum = "ölçülemedi";
    cumle = `L!SLEMEDİ  arkaplan.js:73-78 onceligi msg.sekmeId'yi gölgeliyor: gönderilen 999999, dönen ${a.probe1.donen}. Bu baglamda pencerenin kimlik çözümü sınanamaz. lçülen: tabs.query ${b.sorguId}, sonda ${b.sondaSekmeId}. Y11-Y13 bu yüzden buton ve sayaç DAVRANIŞINI ölçer, kimlik çözümünü ölçmez.`;
  }

  sonuc.karar = cumle;
  sonuc.durum = durum;
  if (durum !== "YESIL") sonuc.sebep = cumle;
  yaz("");
  yaz(`Y16 KARAR: ${durum}`);
  yaz(`  ${cumle}`);
  if (adimlar["16d"].durum === "ölçüldü") yaz("  16d: gercek panel baglami da OLCULDU  yukaridaki rakamlar panelde de dogrulandi.");
  else yaz(`  16d: gercek arac cubugu paneli baglami OLCULEMEDI  ${adimlar["16d"].sebep}${adimlar["16d"].openPopup ? " · openPopup: " + adimlar["16d"].openPopup : ""}`);
}

//  daxıtım
const TANIM = {
  Y11: y11,
  Y12: y12,
  Y13: y13,
  Y16: y16,
};

const t = TANIM[HUCRE];
if (!t) {
  process.stdout.write(`bilinmeyen hucre: ${HUCRE}\n`);
  process.exit(2);
}
await tarayiciliHucre({
  hucre: HUCRE,
  hazirlik: { manifestSurumu: 2, pencereErisimi: true },
  headless: true,
  calistir: t,
});
