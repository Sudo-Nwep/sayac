// Y14 — İZİN BÜTÇESİ karşıt deneyi, ürünün KENDİ penceresiyle.
//
// Soru: arayüz yeni izin gerektirdi mi? Ölçüm, pencerenin kendi bağlamından:
//   A) ekIzinler: []        → tabsTipi · sorguUzunluk · sorguId · urlTipi · url süzgeci
//   B) ekIzinler: ["tabs"]  → aynı dört ölçüm
// C ve D (url süzgeci) A ve B koşumlarının İÇİNDE aynı sayfadan ölçülür — ek tarayıcı yok.
//
// ⚠️ tarayiciliHucre bir süreçte YALNIZ BİR KEZ çağrılabilir (hucre.mjs:234 process.exit).
// Bu yüzden bu hücre kendi süreç ömrünü yönetir — karsit-izin.mjs deseni.
import fs from "node:fs";
import path from "node:path";
import { firefox } from "playwright";
import pwext from "playwright-webextext";
import { sunucuBaslat } from "./ortak/sunucu-eklenti.mjs";
import { testKopyasiHazirla } from "./ortak/eklenti-testi.mjs";
import { gecici, sil } from "./ortak/eklenti-hazirla.mjs";
import { KANIT, bekle, hataMetni, hazirBekle } from "./ortak/hucre.mjs";

const { withExtension } = pwext;
const SERT_SURE_MS = 240000;

const satirlar = [];
const t0 = Date.now();
function yaz(s = "") {
  const l = `[+${String(Date.now() - t0).padStart(6, "0")}ms] ${s}`;
  satirlar.push(l);
  process.stdout.write(l + "\n");
}

const sonuc = { hucre: "Y14", durum: "ölçülemedi", sebep: "", tablo: [], yorum: "" };

async function kosu({ etiket, ekIzinler }) {
  let sunucu = null, context = null, profil = null, eklenti = null;
  const satir = { etiket, ekIzinler: JSON.stringify(ekIzinler), manifestIzinleri: "yok" };
  try {
    sunucu = await sunucuBaslat(() => {});
    const hz = await testKopyasiHazirla({
      port: sunucu.port, etiket: `Y14-${etiket}`, pencereErisimi: true, ekIzinler, yaz: () => {},
    });
    eklenti = hz.dizin;
    satir.manifestIzinleri = JSON.stringify(hz.manifest.permissions || null);
    profil = await gecici(`profil-Y14-${etiket}`);
    const ff = withExtension(firefox, eklenti);
    context = await ff.launchPersistentContext(profil, { headless: true });
    const sayfa = context.pages()[0] || (await context.newPage());
    await sayfa.goto(sunucu.url, { waitUntil: "load", timeout: 30000 });
    const h = await hazirBekle(sayfa);
    if (!h.hazir) throw new Error("eklenti hazir olmadi: " + h.sebep);

    let adres = null;
    const b1 = Date.now() + 10000;
    while (Date.now() < b1) {
      adres = await sayfa.evaluate(() => document.documentElement.getAttribute("data-sayac-pencere")).catch(() => null);
      if (adres) break;
      await bekle(200);
    }
    if (!adres) throw new Error("pencere adresi gelmedi");

    // Pencereyi KENDİ sekmesinde aç — ayrıcalıklı API yüzeyi orada ölçülür.
    await sayfa.evaluate((u) => window.open(u, "_blank"), adres);
    let r = null;
    const b2 = Date.now() + 20000;
    while (Date.now() < b2) {
      const hepsi = sunucu.olaylar.filter((o) => o.deney === "pencere" && o.baglam === "sekme");
      if (hepsi.length) { r = hepsi[hepsi.length - 1]; break; }
      await bekle(250);
    }
    if (!r) throw new Error("pencere sekmesinden sonda raporu dusmedi (20 sn)");

    satir.tabsTipi = r.tabsTipi;
    satir.sorguUzunluk = r.sorguUzunluk;
    satir.sorguId = r.sorguId;
    satir.urlTipi = r.urlTipi;
    satir.sorguHata = r.sorguHata || "";
    satir.urlSuzgec = r.urlSuzgec;
    satir.getCurrent = r.getCurrent;
    satir.pencereHedef = r.pencereHedef;
    satir.uyari = r.sUyari;
    yaz(`${etiket.padEnd(22)} manifest.permissions=${satir.manifestIzinleri}`);
    yaz(`   tabsTipi=${satir.tabsTipi} · sorguUzunluk=${satir.sorguUzunluk} · sorguId=${satir.sorguId} · urlTipi=${satir.urlTipi}`);
    yaz(`   url suzgeci (tabs.query({url:"*://*.youtube.com/*"})) → ${satir.urlSuzgec}`);
    yaz(`   getCurrent=${satir.getCurrent} · pencereHedef=${satir.pencereHedef} · #uyari="${satir.uyari}"`);
  } catch (e) {
    satir.hata = hataMetni(e);
    yaz(`${etiket} DUSTU — birebir hata: ${satir.hata}`);
  } finally {
    if (context) await context.close().catch(() => {});
    if (sunucu) await sunucu.kapat().catch(() => {});
    if (eklenti) await sil(eklenti);
    if (profil) await sil(profil);
  }
  return satir;
}

let bitti = false;
const zamanAsimi = new Promise((_, red) =>
  setTimeout(() => { if (!bitti) red(new Error(`SERT SAYAC: ${SERT_SURE_MS} ms doldu`)); }, SERT_SURE_MS)
);

try {
  yaz("Y14 — izin butcesi karsit deneyi (urunun KENDI penceresiyle)");
  yaz("OLCULEN: pencerenin kendi baglamindan tabs yuzeyi ve url suzgeci");
  await Promise.race([
    (async () => {
      sonuc.tablo.push(await kosu({ etiket: "A izinsiz", ekIzinler: [] }));
      sonuc.tablo.push(await kosu({ etiket: "B tabs izinli", ekIzinler: ["tabs"] }));
    })(),
    zamanAsimi,
  ]);

  const A = sonuc.tablo[0], B = sonuc.tablo[1];
  const parcalar = [];
  if (A && A.sorguId && A.sorguId !== "yok") {
    parcalar.push(`Arayuz YENI IZIN GEREKTIRMEDI: izinsiz manifestle tabs.query sekme kimligini DONDURDU (sorguId=${A.sorguId}).`);
  } else if (A) {
    parcalar.push(`Izinsiz manifestle tabs.query sekme kimligi DONDURMEDI (sorguId=${A.sorguId}, hata="${A.sorguHata}").`);
  }
  if (A && B) {
    parcalar.push(`IZNIN NE SATIN ALDIGI: urlTipi A=${A.urlTipi} → B=${B.urlTipi}; url suzgeci A=${A.urlSuzgec} → B=${B.urlSuzgec}.`);
  }
  sonuc.yorum = parcalar.join(" ");
  const eksik = sonuc.tablo.filter((s) => s.hata).length;
  sonuc.durum = sonuc.tablo.length === 2 && eksik === 0 ? "YESIL" : "ölçülemedi";
  if (eksik) sonuc.sebep = `${eksik} kosu dustu`;
} catch (e) {
  sonuc.sebep = hataMetni(e);
  yaz("HATA: " + sonuc.sebep);
} finally {
  bitti = true;
  yaz("");
  yaz("=== Y14 TABLOSU ===");
  yaz("| kosu | manifest.permissions | tabsTipi | sorguUzunluk | sorguId | urlTipi | url suzgeci |");
  yaz("|---|---|---|---|---|---|---|");
  for (const s of sonuc.tablo) {
    yaz(`| ${s.etiket} | ${s.manifestIzinleri} | ${s.tabsTipi || "-"} | ${s.sorguUzunluk || "-"} | ${s.sorguId || "-"} | ${s.urlTipi || "-"} | ${s.urlSuzgec || "-"} |`);
  }
  yaz("");
  yaz("YORUM: " + sonuc.yorum);
  fs.mkdirSync(KANIT, { recursive: true });
  fs.writeFileSync(path.join(KANIT, "eklenti-Y14.json"), JSON.stringify(sonuc, null, 2), "utf8");
  yaz(`SONUC ${sonuc.durum}${sonuc.sebep ? " — " + sonuc.sebep : ""}`);
  setTimeout(() => process.exit(sonuc.durum === "KIRMIZI" ? 1 : 0), 300).unref();
}
