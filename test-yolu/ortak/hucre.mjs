// Ortak hücre iskelesi: sert sayaç · iki bağımsız cetvel · TOLERANS · her koşulda temizlik.
//
// ⚠️ TOLERANS KOŞUMDAN ÖNCE YAZILMIŞTIR ve ölçüm görüldükten sonra GEVŞETİLMEZ.
// Sapma bir bulgudur: önce sebebi ölçülür, eşik sabit kalır.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { firefox } from "playwright";
import pwext from "playwright-webextext";
import { sunucuBaslat } from "./sunucu-eklenti.mjs";
import { testKopyasiHazirla, PROJE } from "./eklenti-testi.mjs";
import { gecici, sil } from "./eklenti-hazirla.mjs";

const { withExtension } = pwext;
export const TEST_YOLU = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const KANIT = path.join(TEST_YOLU, "kanit");
export const SERT_SURE_MS = 120000;

// --- TOLERANS (koşumdan önce sabit) ---
export const TOLERANS_MS = 250; // ilerleyen kovanın Δan'dan sapma tavanı
export const FAZ_MS = 2500; // her fazın süresi
export const YERLESME_MS = 400; // durum değişimi sonrası ilk anlık görüntüden önce

export const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

export function hataMetni(e) {
  if (!e) return "";
  return e instanceof Error ? `${e.name}: ${e.message}` : String(e);
}

export async function anlik(sayfa) {
  const s = await sayfa
    .evaluate(() => document.documentElement.getAttribute("data-sayac-durum"))
    .catch(() => null);
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Çağrıdan SONRA alınmış taze bir anlık görüntü döndürür (anMs ilerlemeli).
export async function yeniAnlik(sayfa, zamanAsimi = 8000) {
  const ilk = await anlik(sayfa);
  const ref = ilk ? ilk.anMs : 0;
  const bitis = Date.now() + zamanAsimi;
  while (Date.now() < bitis) {
    const g = await anlik(sayfa);
    if (g && g.anMs > ref) return g;
    await bekle(50);
  }
  return null;
}

// CETVEL B — sayfanın kendi gerçeği. Üründen bağımsız ikinci kanal (K09).
export async function cetvelB(sayfa, videoId = "v1") {
  return await sayfa
    .evaluate((vid) => {
      const v = document.getElementById(vid);
      return {
        video: vid,
        paused: v ? v.paused : null,
        currentTime: v ? Number(v.currentTime.toFixed(3)) : null,
        readyState: v ? v.readyState : null,
        visibilityState: document.visibilityState,
        icerikBetigi: document.documentElement.getAttribute("data-sayac-icerik"),
      };
    }, videoId)
    .catch((e) => ({ hata: hataMetni(e) }));
}

// Geçici eklenti yükleme YARIŞI: içerik betiği enjekte olmadan ölçüme başlanırsa
// sayaç sessizce 0 kalır ve test "yanlış" sonuç verir. Bu yüzden İKİ çapa beklenir.
export async function hazirBekle(sayfa, zamanAsimi = 20000) {
  const bitis = Date.now() + zamanAsimi;
  let icerik = null;
  while (Date.now() < bitis) {
    icerik = await sayfa
      .evaluate(() => document.documentElement.getAttribute("data-sayac-icerik"))
      .catch(() => null);
    if (icerik === "1") break;
    await bekle(100);
  }
  if (icerik !== "1") return { hazir: false, sebep: `data-sayac-icerik gelmedi (okunan: ${icerik})` };
  while (Date.now() < bitis) {
    const g = await anlik(sayfa);
    if (g) return { hazir: true, ilk: g };
    await bekle(100);
  }
  return { hazir: false, sebep: "ilk data-sayac-durum anlık görüntüsü gelmedi" };
}

// Bir faz ölçer: komut → yerleşme → g1 → FAZ_MS → g2. Δ'lar arka planın KENDİ saatinden.
export async function faz(sayfa, ad, komut, opt = {}) {
  const videoId = opt.videoId || "v1";
  const sureMs = opt.sureMs || FAZ_MS;
  if (komut) await komut();
  await bekle(YERLESME_MS);
  const g1 = await yeniAnlik(sayfa);
  if (!g1) return { ad, hata: "g1 anlık görüntüsü alınamadı" };
  await bekle(sureMs);
  const g2 = await yeniAnlik(sayfa);
  if (!g2) return { ad, hata: "g2 anlık görüntüsü alınamadı" };
  const b = await cetvelB(sayfa, videoId);
  return {
    ad,
    dAn: g2.anMs - g1.anMs,
    d: {
      izleniyor: g2.toplam.izleniyor - g1.toplam.izleniyor,
      duraklatildi: g2.toplam.duraklatildi - g1.toplam.duraklatildi,
      mola: g2.toplam.mola - g1.toplam.mola,
    },
    g1,
    g2,
    cetvelB: b,
  };
}

// TOLERANS kontrolü. ilerleyen = null ise ÜÇÜ DE tam 0 beklenir.
export function fazKontrol(fz, ilerleyen) {
  if (fz.hata) return [fz.hata];
  const sorunlar = [];
  for (const k of ["izleniyor", "duraklatildi", "mola"]) {
    if (k === ilerleyen) {
      const sapma = Math.abs(fz.d[k] - fz.dAn);
      if (sapma > TOLERANS_MS)
        sorunlar.push(`${k}: Δ=${fz.d[k]} Δan=${fz.dAn} sapma=${sapma} > ${TOLERANS_MS} ms`);
    } else if (fz.d[k] !== 0) {
      sorunlar.push(`${k}: Δ=${fz.d[k]} — tam 0 olmalıydı`);
    }
  }
  const toplamD = fz.d.izleniyor + fz.d.duraklatildi + fz.d.mola;
  const beklenen = ilerleyen ? fz.dAn : 0;
  if (Math.abs(toplamD - beklenen) > TOLERANS_MS)
    sorunlar.push(`invaryant: ΣΔkova=${toplamD} beklenen=${beklenen} sapma=${Math.abs(toplamD - beklenen)} > ${TOLERANS_MS} ms`);
  return sorunlar;
}

export function fazYaz(yaz, fz, ilerleyen) {
  if (fz.hata) {
    yaz(`  FAZ ${fz.ad}: HATA — ${fz.hata}`);
    return;
  }
  yaz(
    `  FAZ ${fz.ad.padEnd(22)} Δan=${String(fz.dAn).padStart(5)} ms | ` +
      `Δizleniyor=${String(fz.d.izleniyor).padStart(5)} Δduraklatildi=${String(fz.d.duraklatildi).padStart(5)} Δmola=${String(fz.d.mola).padStart(5)} ` +
      `| durum=${fz.g2.durumAdi} sekme=${fz.g2.sekmeId}` +
      (ilerleyen ? ` | ilerleyen: ${ilerleyen}` : " | üçü de durmalı")
  );
  yaz(`      CETVEL B (sayfa gerçeği): ${JSON.stringify(fz.cetvelB)}`);
}

/**
 * Tarayıcılı hücre iskelesi. finally'de context · sunucu · profil · geçici eklenti
 * HER KOŞULDA kapatılır (G23).
 */
export async function tarayiciliHucre({ hucre, hazirlik = {}, headless = true, calistir }) {
  const t0 = Date.now();
  const satirlar = [];
  const yaz = (s) => {
    const l = `[+${String(Date.now() - t0).padStart(6, "0")}ms] ${s}`;
    satirlar.push(l);
    process.stdout.write(l + "\n");
  };

  const sonuc = {
    hucre,
    durum: "ölçülemedi",
    sebep: "",
    tolerans: { TOLERANS_MS, FAZ_MS, YERLESME_MS },
    olcumler: [],
    sorunlar: [],
    sureMs: 0,
  };

  let sunucu = null;
  let context = null;
  let profil = null;
  let eklentiDizini = null;
  let bitti = false;

  const zamanAsimi = new Promise((_, red) =>
    setTimeout(() => {
      if (!bitti) red(new Error(`SERT SAYAC: ${SERT_SURE_MS} ms doldu`));
    }, SERT_SURE_MS)
  );

  try {
    yaz(`hucre=${hucre} · TOLERANS=${TOLERANS_MS} ms · FAZ=${FAZ_MS} ms (koşumdan ÖNCE sabit)`);
    yaz(`firefox ikilisi: ${firefox.executablePath()}`);
    sunucu = await sunucuBaslat(yaz);
    const hz = await testKopyasiHazirla({ port: sunucu.port, etiket: hucre, yaz, ...hazirlik });
    eklentiDizini = hz.dizin;
    sonuc.manifest = hz.manifest;
    profil = await gecici(`profil-${hucre}`);
    yaz(`tek kullanimlik profil: ${profil}`);

    const ff = withExtension(firefox, eklentiDizini);
    const acilis = async () => {
      context = await ff.launchPersistentContext(profil, {
        headless,
        firefoxUserPrefs: { "media.autoplay.default": 0 },
      });
      yaz(`EKLENTI YUKLENDI — launchPersistentContext cozuldu (${context.constructor.name}) headless=${headless}`);
    };

    await Promise.race([
      (async () => {
        await acilis();
        await calistir({ context, sunucu, yaz, sonuc, profil, eklentiDizini });
      })(),
      zamanAsimi,
    ]);
  } catch (e) {
    sonuc.durum = sonuc.durum === "ölçülemedi" ? "ölçülemedi" : sonuc.durum;
    sonuc.sebep = sonuc.sebep || hataMetni(e);
    yaz("HATA: " + hataMetni(e) + (e && e.stack ? "\n" + e.stack : ""));
  } finally {
    bitti = true;
    if (context) await context.close().catch((e) => yaz("context kapatma: " + hataMetni(e)));
    if (sunucu) {
      sonuc.isaretSayisi = sunucu.olaylar.length;
      await sunucu.kapat().catch(() => {});
    }
    if (eklentiDizini) await sil(eklentiDizini);
    if (profil) await sil(profil);
    sonuc.sureMs = Date.now() - t0;
    fs.mkdirSync(KANIT, { recursive: true });
    // ⚠️ Kanıt DÜZ yazılır: .gitignore'daki `!test-yolu/kanit/*.log` muafiyeti
    // `*` ile `/` geçemez — alt klasör açılırsa kanıt sessizce yutulur.
    fs.writeFileSync(path.join(KANIT, `eklenti-${hucre}.json`), JSON.stringify(sonuc, null, 2), "utf8");
    yaz(`SONUC ${sonuc.durum}${sonuc.sebep ? " — " + sonuc.sebep : ""}`);
    setTimeout(() => process.exit(sonuc.durum === "KIRMIZI" ? 1 : 0), 300).unref();
  }
  return sonuc;
}
