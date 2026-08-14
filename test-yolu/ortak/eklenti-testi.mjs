// ÜRÜNÜN GEÇİCİ TEST KOPYASINI hazırlar. Kaynak klasör (eklenti/) ASLA kirletilmez.
//
// Ürüne test kancası koymak G20 ihlalidir (TEST_YOLU.md:228-229 aynı gerekçeyle bir
// adayı elemişti). Sonda, port, saat kayması ve 127.0.0.1 eşleşmesi YALNIZ bu kopyaya
// enjekte edilir — tur 001'in port.js deseni (eklenti-hazirla.mjs:13-27).
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gecici } from "./eklenti-hazirla.mjs";

const TEST_YOLU = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PROJE = path.resolve(TEST_YOLU, "..");
export const EKLENTI_KOK = path.join(PROJE, "eklenti");
const SONDA = path.join(TEST_YOLU, "sonda");

export async function testKopyasiHazirla({
  port,
  kaymaMs = 0,
  aralikMs = 250,
  manifestSurumu = 2,
  izinEkle = false,
  yerelEslesme = true,
  pencereErisimi = false,
  ekIzinler = [],
  etiket = "hucre",
  yaz = () => {},
}) {
  const dizin = await gecici(`ekl-${etiket}`);
  await fsp.cp(EKLENTI_KOK, dizin, { recursive: true });
  // Üretici test kopyasında işe yaramaz; eklentiye girmesin.
  await fsp.rm(path.join(dizin, "uret.mjs"), { force: true });

  await fsp.writeFile(
    path.join(dizin, "sonda-ayar.js"),
    "var SAYAC_TEST = " +
      JSON.stringify({ sunucu: `http://127.0.0.1:${port}`, kaymaMs, aralikMs }) +
      ";\n",
    "utf8"
  );
  await fsp.copyFile(path.join(SONDA, "sonda-arkaplan.js"), path.join(dizin, "sonda-arkaplan.js"));
  await fsp.copyFile(path.join(SONDA, "sonda-icerik.js"), path.join(dizin, "sonda-icerik.js"));

  const mYolu = path.join(dizin, "manifest.json");
  const m = JSON.parse(await fsp.readFile(mYolu, "utf8"));

  if (yerelEslesme) {
    m.content_scripts[0].matches = m.content_scripts[0].matches.concat(["http://127.0.0.1/*"]);
  }
  // Sonda arka planda EN ÖNCE (Date.now sarmalanmalı), içerik betiklerinde EN SON.
  m.background.scripts = ["sonda-ayar.js", "sonda-arkaplan.js", "sayac.js", "arkaplan.js"];
  m.content_scripts[0].js = ["sonda-ayar.js", "icerik.js", "sonda-icerik.js"];

  if (manifestSurumu === 3) {
    m.manifest_version = 3;
    delete m.background.persistent; // MV3'te bu alan yok
    // MV2'nin browser_action'ı MV3'te GEÇERSİZDİR — çevrilmezse manifest ayrıştırma
    // hatası verir ve Y7 düşer.
    if (m.browser_action) {
      m.action = m.browser_action;
      delete m.browser_action;
    }
  }
  if (izinEkle) {
    if (manifestSurumu === 3) m.host_permissions = ["http://127.0.0.1/*"];
    else m.permissions = ["http://127.0.0.1/*"];
  }
  if (ekIzinler.length) {
    m.permissions = (m.permissions || []).concat(ekIzinler);
  }

  // pencere.html'i test ölçümü için erişilebilir kıl — YALNIZ TEST KOPYASINDA.
  // Ürüne EKLENMEZ: gerçek açılır pencerenin buna ihtiyacı yok ve eklemek pencereyi
  // her web sayfasına açardı.
  if (pencereErisimi) {
    if (manifestSurumu === 3) {
      m.web_accessible_resources = [
        { resources: ["pencere.html"], matches: ["http://127.0.0.1/*"] },
      ];
    } else {
      m.web_accessible_resources = ["pencere.html"];
    }
    await fsp.copyFile(path.join(SONDA, "sonda-pencere.js"), path.join(dizin, "sonda-pencere.js"));
    const pYolu = path.join(dizin, "pencere.html");
    const html = await fsp.readFile(pYolu, "utf8");
    if (!html.includes("</body>")) {
      throw new Error(`pencere.html içinde </body> bulunamadı — sonda enjekte edilemez: ${pYolu}`);
    }
    await fsp.writeFile(
      pYolu,
      html.replace(
        "</body>",
        '\n<script src="sonda-ayar.js"></script>\n<script src="sonda-pencere.js"></script>\n</body>'
      ),
      "utf8"
    );
    yaz("pencere sondasi enjekte edildi (YALNIZ test kopyasina)");
  }

  await fsp.writeFile(mYolu, JSON.stringify(m, null, 2) + "\n", "utf8");
  yaz(`test kopyasi: ${dizin}`);
  yaz(`yamali manifest: ${JSON.stringify(m)}`);
  return { dizin, manifest: m };
}
