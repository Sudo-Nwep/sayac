// Y9 — TEK gerçek YouTube duman testi. Kırılgan olduğu bilinir (HEDEF.md:83-85):
// düşerse "ortam" diye işaretlenir ve ÜRÜN KIRMIZIYA SAYILMAZ.
//
// Bu hücrede sonda YouTube kökeninde koşar → 127.0.0.1'e fetch hem çapraz kökenli hem
// karışık içeriktir (https sayfa → http uç). Bu yüzden YALNIZ DOM kanalı kullanılır;
// hiçbir izin gerektirmez. Ürüne veya test kopyasına YouTube host izni EKLENMEZ.
//
// Video kimliği prompta yazılmadı (uydurma yasak): ana sayfadan ilk /watch?v= bağlantısı
// bulunur. Bulunamazsa "ortam" + birebir hata metni.
import fs from "node:fs";
import path from "node:path";
import { firefox } from "playwright";
import pwext from "playwright-webextext";
import { testKopyasiHazirla } from "./ortak/eklenti-testi.mjs";
import { gecici, sil } from "./ortak/eklenti-hazirla.mjs";
import { KANIT, bekle, hataMetni, TOLERANS_MS, FAZ_MS, YERLESME_MS } from "./ortak/hucre.mjs";

const { withExtension } = pwext;
const SERT_SURE_MS = 170000;
const DENEME = 2;

const satirlar = [];
const t0 = Date.now();
function yaz(s = "") {
  const l = `[+${String(Date.now() - t0).padStart(6, "0")}ms] ${s}`;
  satirlar.push(l);
  process.stdout.write(l + "\n");
}

const sonuc = {
  hucre: "Y9",
  durum: "ölçülemedi",
  sebep: "",
  ortam: false,
  tolerans: { TOLERANS_MS, FAZ_MS },
  denemeler: [],
  olcumler: [],
};

async function anlik(sayfa) {
  const s = await sayfa.evaluate(() => document.documentElement.getAttribute("data-sayac-durum")).catch(() => null);
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
async function yeniAnlik(sayfa, zamanAsimi = 10000) {
  const ilk = await anlik(sayfa);
  const ref = ilk ? ilk.anMs : 0;
  const bitis = Date.now() + zamanAsimi;
  while (Date.now() < bitis) {
    const g = await anlik(sayfa);
    if (g && g.anMs > ref) return g;
    await bekle(100);
  }
  return null;
}
async function cetvelB(sayfa) {
  return await sayfa.evaluate(() => {
    const v = document.querySelector("video");
    return {
      videoVar: !!v,
      paused: v ? v.paused : null,
      currentTime: v ? Number(v.currentTime.toFixed(3)) : null,
      readyState: v ? v.readyState : null,
      visibilityState: document.visibilityState,
      icerikBetigi: document.documentElement.getAttribute("data-sayac-icerik"),
      url: location.href,
    };
  }).catch((e) => ({ hata: hataMetni(e) }));
}

async function onayGec(sayfa) {
  const denenen = [
    'button[aria-label*="Accept"]',
    'button[aria-label*="Kabul"]',
    'button:has-text("Tümünü kabul et")',
    'button:has-text("Accept all")',
    'button:has-text("Reject all")',
    'form[action*="consent"] button',
  ];
  for (const s of denenen) {
    try {
      const e = sayfa.locator(s).first();
      if (await e.count()) {
        await e.click({ timeout: 4000 });
        yaz(`onay penceresi: "${s}" tiklandi`);
        await sayfa.waitForLoadState("load", { timeout: 20000 }).catch(() => {});
        return true;
      }
    } catch { /* sonraki seçici */ }
  }
  return false;
}

async function denemeKos(no) {
  const dizin = (await testKopyasiHazirla({ port: 1, etiket: `Y9-${no}`, yerelEslesme: false, yaz })).dizin;
  const profil = await gecici(`profil-Y9-${no}`);
  let context = null;
  const kayit = { no, adim: "", hata: "", url: "" };
  try {
    const ff = withExtension(firefox, dizin);
    context = await ff.launchPersistentContext(profil, {
      headless: true,
      firefoxUserPrefs: { "media.autoplay.default": 0 },
    });
    yaz(`EKLENTI YUKLENDI — launchPersistentContext cozuldu (deneme ${no})`);
    const sayfa = context.pages()[0] || (await context.newPage());

    kayit.adim = "ana sayfa";
    await sayfa.goto("https://www.youtube.com/", { waitUntil: "domcontentloaded", timeout: 45000 });
    yaz(`ana sayfa acildi: ${sayfa.url()}`);
    if (/consent|sorry/.test(sayfa.url())) await onayGec(sayfa);

    kayit.adim = "izlenecek baglanti";
    // state:"attached" — headless'ta bagalantilar DOM'da olup "visible" sayilmayabilir.
    // Bulunamazsa sayfanin envanteri yazilir (tahmin degil, olcum).
    let href = null;
    // Kaynak sırası ÖLÇÜLDÜ (oturumsuz headless Firefox 153):
    //   ana sayfa → 0 watch bağlantısı (öneri akışı render edilmiyor)
    //   arama sonuçları → 6 · kanal videoları → 60
    // Video kimliği uydurulmuyor; YouTube'un kendi listesinden ilk bağlantı alınıyor.
    for (const kaynakUrl of [
      "https://www.youtube.com/results?search_query=lofi",
      "https://www.youtube.com/@YouTube/videos",
      "https://www.youtube.com/",
    ]) {
      if (sayfa.url() !== kaynakUrl) {
        await sayfa.goto(kaynakUrl, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
        if (/consent|sorry/.test(sayfa.url())) await onayGec(sayfa);
      }
      await sayfa
        .waitForSelector('a[href*="/watch?v="]', { timeout: 20000, state: "attached" })
        .catch(() => {});
      const envanter = await sayfa.evaluate(() => ({
        url: location.href,
        baslik: document.title,
        toplamBaglanti: document.querySelectorAll("a").length,
        watchBaglanti: document.querySelectorAll('a[href*="/watch?v="]').length,
        ornekHref: Array.from(document.querySelectorAll("a")).slice(0, 5).map((a) => a.getAttribute("href")),
        govdeUzunluk: document.body ? document.body.innerHTML.length : 0,
      }));
      yaz(`sayfa envanteri: ${JSON.stringify(envanter)}`);
      href = await sayfa.evaluate(() => {
        const a = document.querySelector('a[href*="/watch?v="]');
        return a ? a.href : null;
      });
      if (href) break;
    }
    if (!href) throw new Error('a[href*="/watch?v="] hicbir kaynak sayfada bulunamadi (envanter yukarida)');
    yaz(`bulunan video: ${href}`);
    kayit.url = href;

    kayit.adim = "izleme sayfasi";
    await sayfa.goto(href, { waitUntil: "domcontentloaded", timeout: 45000 });
    await sayfa.waitForSelector("video", { timeout: 30000 });

    kayit.adim = "icerik betigi capasi";
    const bitis = Date.now() + 25000;
    let hazir = false;
    while (Date.now() < bitis) {
      const v = await sayfa.evaluate(() => document.documentElement.getAttribute("data-sayac-icerik")).catch(() => null);
      if (v === "1" && (await anlik(sayfa))) { hazir = true; break; }
      await bekle(250);
    }
    if (!hazir) throw new Error("data-sayac-icerik / ilk anlik goruntu 25 sn icinde gelmedi");
    yaz("icerik betigi enjekte oldu ve ilk anlik goruntu geldi");

    kayit.adim = "oynatma";
    await sayfa.evaluate(async () => {
      const v = document.querySelector("video");
      v.muted = true;
      try { await v.play(); } catch (e) { /* oynatici kendi baslatabilir */ }
    });
    await bekle(YERLESME_MS + 600);
    let b = await cetvelB(sayfa);
    yaz(`CETVEL B (oynatma sonrasi): ${JSON.stringify(b)}`);
    if (b.paused !== false) throw new Error(`video oynatilamadi: paused=${b.paused} readyState=${b.readyState}`);

    kayit.adim = "olcum: oynuyor";
    const g1 = await yeniAnlik(sayfa);
    if (!g1) throw new Error("g1 anlik goruntusu alinamadi");
    await bekle(FAZ_MS);
    const g2 = await yeniAnlik(sayfa);
    if (!g2) throw new Error("g2 anlik goruntusu alinamadi");
    const b2 = await cetvelB(sayfa);
    const fOynuyor = {
      ad: "youtube: oynuyor",
      dAn: g2.anMs - g1.anMs,
      d: {
        izleniyor: g2.toplam.izleniyor - g1.toplam.izleniyor,
        duraklatildi: g2.toplam.duraklatildi - g1.toplam.duraklatildi,
        mola: g2.toplam.mola - g1.toplam.mola,
      },
      cetvelB: b2,
      sekmeId: g2.sekmeId,
    };
    yaz(`FAZ oynuyor    Δan=${fOynuyor.dAn} | Δizleniyor=${fOynuyor.d.izleniyor} Δduraklatildi=${fOynuyor.d.duraklatildi} Δmola=${fOynuyor.d.mola} | durum=${g2.durumAdi}`);

    kayit.adim = "olcum: duraklatildi";
    await sayfa.evaluate(() => document.querySelector("video").pause());
    await bekle(YERLESME_MS);
    const g3 = await yeniAnlik(sayfa);
    await bekle(FAZ_MS);
    const g4 = await yeniAnlik(sayfa);
    if (!g3 || !g4) throw new Error("duraklatma fazinda anlik goruntu alinamadi");
    const b4 = await cetvelB(sayfa);
    const fDurakli = {
      ad: "youtube: durakli",
      dAn: g4.anMs - g3.anMs,
      d: {
        izleniyor: g4.toplam.izleniyor - g3.toplam.izleniyor,
        duraklatildi: g4.toplam.duraklatildi - g3.toplam.duraklatildi,
        mola: g4.toplam.mola - g3.toplam.mola,
      },
      cetvelB: b4,
      sekmeId: g4.sekmeId,
    };
    yaz(`FAZ durakli    Δan=${fDurakli.dAn} | Δizleniyor=${fDurakli.d.izleniyor} Δduraklatildi=${fDurakli.d.duraklatildi} Δmola=${fDurakli.d.mola} | durum=${g4.durumAdi}`);

    const sorunlar = [];
    if (Math.abs(fOynuyor.d.izleniyor - fOynuyor.dAn) > TOLERANS_MS)
      sorunlar.push(`oynuyor: Δizleniyor=${fOynuyor.d.izleniyor} Δan=${fOynuyor.dAn} sapma>${TOLERANS_MS}`);
    if (fOynuyor.d.duraklatildi !== 0 || fOynuyor.d.mola !== 0)
      sorunlar.push(`oynuyor: diger kovalar 0 degil ${JSON.stringify(fOynuyor.d)}`);
    if (Math.abs(fDurakli.d.duraklatildi - fDurakli.dAn) > TOLERANS_MS)
      sorunlar.push(`durakli: Δduraklatildi=${fDurakli.d.duraklatildi} Δan=${fDurakli.dAn} sapma>${TOLERANS_MS}`);
    if (fDurakli.d.izleniyor !== 0 || fDurakli.d.mola !== 0)
      sorunlar.push(`durakli: diger kovalar 0 degil ${JSON.stringify(fDurakli.d)}`);

    sonuc.olcumler = [fOynuyor, fDurakli];
    sonuc.videoUrl = href;
    sonuc.sorunlar = sorunlar;
    sonuc.durum = sorunlar.length === 0 ? "YESIL" : "KIRMIZI";
    kayit.adim = "bitti";
    return true;
  } catch (e) {
    kayit.hata = hataMetni(e);
    yaz(`DENEME ${no} DUSTU (adim: ${kayit.adim}) — BIREBIR HATA: ${kayit.hata}`);
    return false;
  } finally {
    sonuc.denemeler.push(kayit);
    if (context) await context.close().catch(() => {});
    await sil(dizin);
    await sil(profil);
  }
}

let bitti = false;
const zamanAsimi = new Promise((_, red) =>
  setTimeout(() => { if (!bitti) red(new Error(`SERT SAYAC: ${SERT_SURE_MS} ms doldu`)); }, SERT_SURE_MS)
);

try {
  yaz("Y9 — gercek YouTube duman testi · temiz tek kullanimlik profil · oturum acma YOK");
  yaz(`TOLERANS=${TOLERANS_MS} ms · FAZ=${FAZ_MS} ms (kosumdan ONCE sabit)`);
  await Promise.race([
    (async () => {
      for (let i = 1; i <= DENEME; i++) {
        if (await denemeKos(i)) return;
        if (i < DENEME) yaz("tekrar deneniyor...");
      }
    })(),
    zamanAsimi,
  ]);
} catch (e) {
  sonuc.sebep = hataMetni(e);
  yaz("HATA: " + hataMetni(e));
} finally {
  bitti = true;
  if (sonuc.durum === "ölçülemedi") {
    sonuc.ortam = true;
    sonuc.sebep =
      sonuc.sebep ||
      `${DENEME} deneme de dustu — ORTAM. Birebir hatalar: ` +
        sonuc.denemeler.map((d) => `#${d.no} [${d.adim}] ${d.hata}`).join(" || ");
    yaz("");
    yaz("KUTU ORTAM olarak isaretlendi — URUN KIRMIZIYA SAYILMAZ (HEDEF.md:83-85)");
    yaz("SEBEP: " + sonuc.sebep);
  }
  fs.mkdirSync(KANIT, { recursive: true });
  fs.writeFileSync(path.join(KANIT, "eklenti-Y9.json"), JSON.stringify(sonuc, null, 2), "utf8");
  yaz(`SONUC ${sonuc.durum}${sonuc.ortam ? " (ortam)" : ""}`);
  setTimeout(() => process.exit(0), 300).unref(); // Y9 cikis kodunu ETKILEMEZ
}
