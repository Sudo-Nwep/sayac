// eklenti/sayac.js ÜRETİCİSİ — tek doğruluk kaynağı korunur.
//
// mantik/sayac.mjs'i OKUR (asla yazmaz), satır başındaki "export " öneklerini soyar ve
// klasik betik üretir (MV2 background.scripts klasik betik yükler, ESM değil).
// Böylece madde 2'nin 20 senaryosu + 7/7 mutasyonu ÜRÜNÜ korumaya devam eder.
//
// Kullanım:
//   node eklenti/uret.mjs             → üretir
//   node eklenti/uret.mjs --kontrol   → diskteki ile karşılaştırır, farklıysa çıkış 1
//   node eklenti/uret.mjs --kanit     → KONTROLÜN KENDİSİNİ bozarak sınar (G22)
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KOK = path.dirname(fileURLToPath(import.meta.url));
const PROJE = path.resolve(KOK, "..");
const KAYNAK = path.join(PROJE, "mantik", "sayac.mjs");
const HEDEF = path.join(KOK, "sayac.js");

function sha(metin) {
  return crypto.createHash("sha256").update(Buffer.from(metin, "utf8")).digest("hex");
}

// Satır sonu normalize edilir: git checkout'ta CRLF'e çevrilmesi ölçümü bozmasın.
// İçerik farkı yine yakalanır — tek bayt değişimi hash'i değiştirir (--kanit bunu ölçer).
function normalize(s) {
  return s.replace(/\r\n/g, "\n");
}

export function uret() {
  const kaynakHam = fs.readFileSync(KAYNAK, "utf8");
  const kaynak = normalize(kaynakHam);
  const kaynakSha = sha(kaynak);
  const satirlar = kaynak.split("\n");
  let soyulan = 0;
  const govde = satirlar
    .map((s) => {
      if (s.startsWith("export ")) {
        soyulan++;
        return s.slice("export ".length);
      }
      return s;
    })
    .join("\n");
  const baslik =
    "// ÜRETİLEN DOSYA — ELLE DÜZENLEMEYİN.\n" +
    "// Kaynak: mantik/sayac.mjs\n" +
    "// Kaynak SHA-256: " + kaynakSha + "\n" +
    "// Yeniden üret: npm run eklenti:uret · Senkron kontrolü: npm run eklenti:kontrol\n" +
    "// Tek değişiklik: satır başındaki \"export \" önekleri soyuldu (" + soyulan + " yer).\n" +
    "// Başka hiçbir şey değiştirilmedi — doğruluğun tek kaynağı mantik/sayac.mjs'tir.\n\n";
  return { metin: baslik + govde, kaynakSha, soyulan };
}

function yaz() {
  const { metin, kaynakSha, soyulan } = uret();
  fs.writeFileSync(HEDEF, metin, "utf8");
  console.log(`üretildi: eklenti/sayac.js (${metin.length} bayt)`);
  console.log(`kaynak   : mantik/sayac.mjs · SHA-256 ${kaynakSha}`);
  console.log(`soyulan  : ${soyulan} adet "export " öneki`);
  console.log(`üretilen : SHA-256 ${sha(metin)}`);
  return 0;
}

function kontrol(sessiz) {
  const { metin, kaynakSha, soyulan } = uret();
  if (!fs.existsSync(HEDEF)) {
    if (!sessiz) console.log(`KONTROL DÜŞTÜ: ${HEDEF} yok. \`npm run eklenti:uret\` koşun.`);
    return 1;
  }
  const diskte = normalize(fs.readFileSync(HEDEF, "utf8"));
  const beklenenSha = sha(metin);
  const diskSha = sha(diskte);
  const ayni = diskte === metin;
  if (!sessiz) {
    console.log(`kaynak    : mantik/sayac.mjs · SHA-256 ${kaynakSha} (soyulan ${soyulan} önek)`);
    console.log(`beklenen  : eklenti/sayac.js · SHA-256 ${beklenenSha}`);
    console.log(`diskteki  : eklenti/sayac.js · SHA-256 ${diskSha}`);
    console.log(`SENKRON   : ${ayni ? "EVET — iki SHA-256 birebir aynı" : "HAYIR — sürüklenme var"}`);
    if (!ayni) console.log("Düzeltme: npm run eklenti:uret");
  }
  return ayni ? 0 : 1;
}

// KONTROLÜN KENDİSİ BOZULARAK SINANIR (G22: kontrol gerçekten ölçüyor mu?).
function kanit() {
  const oncekiHam = fs.readFileSync(HEDEF, "utf8");
  const oncekiSha = sha(normalize(oncekiHam));
  console.log("=".repeat(66));
  console.log("KONTROLÜN KENDİSİ SINANIYOR — bir bayt bozulur, kontrol kırmızıya dönmeli");
  console.log("=".repeat(66));
  console.log(`SHA-256 önce : ${oncekiSha}`);
  let cikisKodu = null;
  try {
    // İçerik baytı değiştirilir (satır sonu değil): "İZLENİYOR" → "IZLENİYOR"
    const bozuk = oncekiHam.replace("İZLENİYOR", "IZLENİYOR");
    if (bozuk === oncekiHam) throw new Error("bozma etkisiz kaldı — hedef metin bulunamadı");
    fs.writeFileSync(HEDEF, bozuk, "utf8");
    const c = spawnSync(process.execPath, [path.join(KOK, "uret.mjs"), "--kontrol"], {
      cwd: PROJE,
      encoding: "buffer",
      timeout: 30000,
      windowsHide: true,
    });
    cikisKodu = c.status;
    const ham = Buffer.concat([c.stdout || Buffer.alloc(0), c.stderr || Buffer.alloc(0)]).toString("utf8");
    console.log(`bozuldu      : "İZLENİYOR" → "IZLENİYOR" (tek bayt)`);
    console.log(`kontrol çıkışı: ${cikisKodu} · beklenen 1 → ${cikisKodu === 1 ? "TAMAM" : "BEKLENTİ DIŞI"}`);
    console.log("kontrol çıktısı:");
    for (const s of ham.trim().split("\n")) console.log("   " + s);
  } finally {
    fs.writeFileSync(HEDEF, oncekiHam, "utf8"); // her koşulda geri al
  }
  const sonrakiSha = sha(normalize(fs.readFileSync(HEDEF, "utf8")));
  console.log(`SHA-256 sonra: ${sonrakiSha}`);
  console.log(`geri alındı  : ${oncekiSha === sonrakiSha ? "EVET (birebir aynı)" : "HAYIR ← BOZUK KALDI"}`);
  const tekrar = kontrol(true);
  console.log(`geri alma sonrası kontrol çıkışı: ${tekrar} (0 beklenir)`);
  const gecti = cikisKodu === 1 && oncekiSha === sonrakiSha && tekrar === 0;
  console.log(`SONUÇ: ${gecti ? "✓ kontrol gerçekten ölçüyor" : "✗ KONTROL BOŞ"}`);
  return gecti ? 0 : 1;
}

const arg = process.argv[2];
if (arg === "--kontrol") process.exit(kontrol(false));
else if (arg === "--kanit") process.exit(kanit());
else process.exit(yaz());
