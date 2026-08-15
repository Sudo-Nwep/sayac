// ÜRÜN XPI'sini üretir — README'nin "XPI'yi üret" adımının ÖLÇÜLMÜŞ hâli.
//
// Tur 005'te Y10, XPI'yi TEST KOPYASINDAN üretmişti (sonda enjekte edilmiş).
// Yani ürünün kendisinden paketleme ÖLÇÜLMEMİŞTİ. Bu betik o boşluğu kapatır.
//
// `web-ext`in YALNIZ cmd.build'i kullanılır — RDP yok, ağ çağrısı yok.
// Yeni bağımlılık yok: web-ext zaten devDependencies'te.
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import webExt from "web-ext";

const KOK = path.dirname(fileURLToPath(import.meta.url));
const PROJE = path.resolve(KOK, "..");
const EKLENTI = path.join(PROJE, "eklenti");
const CIKTI = path.join(PROJE, "web-ext-artifacts"); // .gitignore:47 — zaten yoksayılıyor
const LOG = path.join(PROJE, "test-yolu", "kanit", "paketle.log");

// KELEPÇE: XPI'de tam olarak bu yedi ÜRÜN dosyası olmalı.
// uret.mjs bir ÜRETİM ARACIDIR, ürün değildir — pakete girerse çıkış 1.
const BEKLENEN = [
  "arkaplan.js", "bicim.js", "icerik.js", "manifest.json",
  "pencere.html", "pencere.js", "sayac.js",
].sort();

const satirlar = [];
const yaz = (s = "") => {
  satirlar.push(s);
  process.stdout.write(s + "\n");
};

let kod = 0;
try {
  const mf = JSON.parse(fs.readFileSync(path.join(EKLENTI, "manifest.json"), "utf8"));
  const surum = mf.version;
  yaz("=".repeat(72));
  yaz(`URUN XPI PAKETLEME — eklenti/ (surum ${surum})`);
  yaz("=".repeat(72));

  const yapim = await webExt.cmd.build(
    {
      sourceDir: EKLENTI,
      artifactsDir: CIKTI,
      filename: `sayac-${surum}.xpi`,
      overwriteDest: true,
      ignoreFiles: ["uret.mjs"],
    },
    { showReadyMessage: false }
  );

  const xpi = yapim.extensionPath;
  const bayt = fs.statSync(xpi).size;
  const sha = crypto.createHash("sha256").update(fs.readFileSync(xpi)).digest("hex");
  yaz(`XPI      : ${xpi}`);
  yaz(`bayt     : ${bayt}`);
  yaz(`SHA-256  : ${sha}`);

  // Zip içeriği — Windows yerleşik bsdtar zip listeler.
  const t = spawnSync("tar", ["-tf", xpi], { encoding: "utf8", timeout: 60000, windowsHide: true });
  if (t.status !== 0) throw new Error(`zip listelenemedi: tar cikis=${t.status} ${t.stderr || ""}`);
  const icerik = String(t.stdout || "").split("\n").map((s) => s.trim()).filter(Boolean).sort();
  yaz(`zip icerigi (${icerik.length} dosya):`);
  for (const f of icerik) yaz(`   ${f}`);

  const uretVar = icerik.includes("uret.mjs");
  const ayni = JSON.stringify(icerik) === JSON.stringify(BEKLENEN);
  const fazla = icerik.filter((f) => !BEKLENEN.includes(f));
  const eksik = BEKLENEN.filter((f) => !icerik.includes(f));
  yaz("");
  yaz(`KELEPCE — beklenen 7 urun dosyasi: ${BEKLENEN.join(", ")}`);
  yaz(`   uret.mjs pakete girdi mi : ${uretVar} (beklenen false)`);
  yaz(`   fazla dosya              : ${fazla.length ? fazla.join(", ") : "yok"}`);
  yaz(`   eksik dosya              : ${eksik.length ? eksik.join(", ") : "yok"}`);
  yaz(`   liste tam esit mi        : ${ayni}`);
  if (!ayni || uretVar) kod = 1;

  yaz("");
  yaz(`SONUC: ${kod === 0 ? "TAMAM — paket urunun tam olarak yedi dosyasini iceriyor" : "KELEPCE DUSTU"} · cikis ${kod}`);
} catch (e) {
  kod = 1;
  yaz("HATA: " + (e && e.message ? e.message : String(e)));
} finally {
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.writeFileSync(
    LOG,
    `=== SAYAC — urun XPI paketleme (arac/paketle.mjs) ===\nnode=${process.version} platform=${process.platform}\n` +
      "=".repeat(72) + "\n\n" + satirlar.join("\n") + "\n",
    "utf8"
  );
  process.exit(kod);
}
