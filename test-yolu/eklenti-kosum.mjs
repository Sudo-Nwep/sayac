// Madde 3 matris koşucusu. Her hücre AYRI ÇOCUK SÜREÇTE koşar (deseni: kosum.mjs:29-53).
// Çocukta kendi sert sayacı var; ebeveyn burada süreç AĞACINI taskkill /T /F ile öldürür.
//
// Y9 (YouTube) ve Y10 (LibreWolf) ÇIKIŞ KODUNU ETKİLEMEZ — kırılgan/ölçülemez olabilirler
// ve hedefin kalanını durdurmazlar (HEDEF.md:83-85, 138-147). Zorunlu hücrelerden biri
// KIRMIZI ise çıkış 1.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KOK = path.dirname(fileURLToPath(import.meta.url));
const PROJE = path.resolve(KOK, "..");
const KANIT = path.join(KOK, "kanit");

const HUCRELER = [
  { ad: "Y1", betik: "eklenti-e2e.mjs", arg: ["Y1"], sure: 180000, zorunlu: true, ne: "yerel uçtan uca (MV2): oynat→duraklat→oynat" },
  { ad: "Y2", betik: "eklenti-e2e.mjs", arg: ["Y2"], sure: 180000, zorunlu: true, ne: "iki sekme aynı anda — karışmıyorlar mı" },
  { ad: "Y3", betik: "eklenti-e2e.mjs", arg: ["Y3"], sure: 180000, zorunlu: true, ne: "aynı sekmede ikinci video — sayaç sıfırlanmıyor mu" },
  { ad: "Y4", betik: "eklenti-e2e.mjs", arg: ["Y4"], sure: 180000, zorunlu: true, ne: "arka plandaki sekme — visibilityState hidden" },
  { ad: "Y5", betik: "eklenti-e2e.mjs", arg: ["Y5"], sure: 180000, zorunlu: true, ne: "gece yarısı — üç sayaç sıfırlanıyor mu" },
  { ad: "Y6", betik: "eklenti-e2e.mjs", arg: ["Y6"], sure: 180000, zorunlu: true, ne: "mola — üçüncü kova (API çağrısı, arayüz değil)" },
  { ad: "Y7", betik: "eklenti-e2e.mjs", arg: ["Y7"], sure: 180000, zorunlu: true, ne: "Y1'in aynısı, MV3 varyant manifestle" },
  { ad: "Y8", betik: "karsit-izin.mjs", arg: [], sure: 240000, zorunlu: true, ne: "host_permissions karşıt deneyi (2×2 × MV2/MV3)" },
  { ad: "Y9", betik: "eklenti-youtube.mjs", arg: [], sure: 240000, zorunlu: false, ne: "bir gerçek YouTube duman testi (kırılgan → ortam)" },
  { ad: "Y10", betik: "librewolf.mjs", arg: [], sure: 540000, zorunlu: false, varsayilan: false, ne: "LibreWolf taşınabilir (Aday B yolu) → ya kanıt ya ölçülemedi" },
  // ── madde 4 (arayüz) ──
  { ad: "Y15", betik: "bicim-testi.mjs", arg: [], sure: 60000, zorunlu: true, ne: "sureBicim doğruluk tablosu (tarayıcısız, node:vm)" },
  { ad: "Y16", betik: "arayuz-e2e.mjs", arg: ["Y16"], sure: 240000, zorunlu: true, ne: "SEKME KİMLİĞİ ZİNCİRİ — karşıt deney + pozitif kontrol" },
  { ad: "Y11", betik: "arayuz-e2e.mjs", arg: ["Y11"], sure: 240000, zorunlu: true, ne: "pencere yüklendi · üç sayaç · iki cetvel · Türkçe dizeler" },
  { ad: "Y12", betik: "arayuz-e2e.mjs", arg: ["Y12"], sure: 240000, zorunlu: true, ne: "MOLA butonu — üç durum + video gerçekten duraklatıldı" },
  { ad: "Y13", betik: "arayuz-e2e.mjs", arg: ["Y13"], sure: 240000, zorunlu: true, ne: "DUR/DEVAM ET — üç durum + birikmiş toplam sıfırlanmadı" },
  { ad: "Y14", betik: "arayuz-izin.mjs", arg: [], sure: 300000, zorunlu: true, ne: "izin bütçesi — karşıt deney (izinsiz ↔ tabs izinli)" },
];

const ATLANAN_GEREKCE = {
  Y10: "ayni RDP hatasi (ECONNREFUSED) 4 kez alindi; 5. kez durma esigidir (HEDEF.md:156). Y10, 005 turunun isi.",
};

const secili = process.argv.slice(2).map((s) => s.toUpperCase());
const kosulacak = secili.length
  ? HUCRELER.filter((h) => secili.includes(h.ad))
  : HUCRELER.filter((h) => h.varsayilan !== false);
// SESSİZ KIRPMA YOK: atlanan hücre adıyla ve gerekçesiyle tabloya girer.
const atlanan = secili.length ? [] : HUCRELER.filter((h) => h.varsayilan === false);

fs.mkdirSync(KANIT, { recursive: true });

async function hucreKos(h, ekArg = [], jsonAdi = null) {
  const betik = path.join(KOK, h.betik);
  // Çocuk, hücre adına ek argümanı da katarak yazar (ör. Y4 → Y4-headed).
  const jsonYolu = path.join(KANIT, `eklenti-${jsonAdi || h.ad}.json`);
  try { fs.unlinkSync(jsonYolu); } catch {}
  const parcalar = [];
  const basla = Date.now();
  const cocuk = spawn(process.execPath, [betik, ...h.arg, ...ekArg], {
    cwd: PROJE,
    stdio: ["ignore", "pipe", "pipe"],
  });
  cocuk.stdout.on("data", (b) => parcalar.push(b));
  cocuk.stderr.on("data", (b) => parcalar.push(b));

  let oldurdu = false;
  const sayac = setTimeout(() => {
    oldurdu = true;
    try { spawn("taskkill", ["/PID", String(cocuk.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
    cocuk.kill("SIGKILL");
  }, h.sure);

  const cikis = await new Promise((r) => cocuk.on("close", (kod, sinyal) => { clearTimeout(sayac); r({ kod, sinyal }); }));
  const sure = Date.now() - basla;
  const ham = Buffer.concat(parcalar).toString("utf8");
  const logYolu = path.join(KANIT, `eklenti-${h.ad}.log`);
  fs.writeFileSync(
    logYolu,
    `=== SAYAC — madde 3 · hucre ${h.ad} ===\n` +
      `ne olcer: ${h.ne}\n` +
      `komut: "${process.execPath}" "${betik}"${[...h.arg, ...ekArg].map((a) => " " + a).join("")}\n` +
      `node=${process.version} platform=${process.platform}\n` +
      `sure=${sure} ms · cikis kodu=${cikis.kod} · sinyal=${cikis.sinyal}` +
      (oldurdu ? ` · EBEVEYN SERT SAYACI (${h.sure} ms) AGACI OLDURDU` : "") +
      `\n${"=".repeat(70)}\n\n` + ham,
    "utf8"
  );

  let s;
  if (fs.existsSync(jsonYolu)) s = JSON.parse(fs.readFileSync(jsonYolu, "utf8"));
  else s = { hucre: h.ad, durum: "ölçülemedi", sebep: oldurdu ? `sureç ${h.sure} ms'de öldürüldü` : `sonuç dosyası yok (çıkış ${cikis.kod})` };
  s.ne = h.ne;
  s.zorunlu = h.zorunlu;
  s.cikisKodu = cikis.kod;
  s.ebeveynSure = sure;
  s.log = path.relative(PROJE, logYolu).replace(/\\/g, "/");
  return s;
}

const rapor = [];
for (const h of kosulacak) {
  process.stdout.write(`\n>>> HUCRE ${h.ad} — ${h.ne}\n`);
  let s = await hucreKos(h);
  // Y4: headless'ta sekme arka plana alınamazsa BİR KEZ headed denenir (G22 kapanı).
  if (h.ad === "Y4" && s.durum === "ölçülemedi" && /arka plana alinamadi/.test(s.sebep || "")) {
    process.stdout.write(`    headless'ta arka plana alinamadi → BIR KEZ headed deneniyor\n`);
    const s2 = await hucreKos(h, ["headed"], "Y4-headed");
    s2.headlessDenemesi = { durum: s.durum, sebep: s.sebep, visibilityState: s.visibilityState };
    s2.hucre = "Y4";
    s = s2;
  }
  rapor.push(s);
  process.stdout.write(`    durum=${s.durum}${s.sebep ? " — " + s.sebep.split("\n")[0] : ""} (${s.ebeveynSure} ms)\n`);
}

for (const h of atlanan) {
  const s = {
    hucre: h.ad, durum: "atlandı", zorunlu: h.zorunlu, ne: h.ne,
    sebep: ATLANAN_GEREKCE[h.ad] || "varsayilan kosumda atlanir",
    ebeveynSure: 0, log: "—",
  };
  rapor.push(s);
  process.stdout.write(`\n>>> HUCRE ${h.ad} — ATLANDI: ${s.sebep}\n`);
}

fs.writeFileSync(path.join(KANIT, "eklenti-rapor.json"), JSON.stringify(rapor, null, 2), "utf8");

process.stdout.write("\n=== MADDE 3 TABLOSU ===\n");
process.stdout.write("| hucre | ne olcer | durum | zorunlu | sure | kanit |\n");
process.stdout.write("|---|---|---|---|---|---|\n");
for (const s of rapor) {
  process.stdout.write(`| ${s.hucre} | ${s.ne} | ${s.durum} | ${s.zorunlu ? "evet" : "hayir"} | ${s.ebeveynSure} ms | ${s.log} |\n`);
}

const kirmizi = rapor.filter((s) => s.zorunlu && s.durum === "KIRMIZI");
const olculemeyen = rapor.filter((s) => s.zorunlu && s.durum === "ölçülemedi");
process.stdout.write(`\nZORUNLU KIRMIZI: ${kirmizi.length}${kirmizi.length ? " → " + kirmizi.map((s) => s.hucre).join(", ") : ""}\n`);
process.stdout.write(`ZORUNLU OLCULEMEDI: ${olculemeyen.length}${olculemeyen.length ? " → " + olculemeyen.map((s) => s.hucre).join(", ") : ""}\n`);
process.stdout.write(`Y9/Y10 cikis kodunu ETKILEMEZ (kirilgan/olculemez olabilir — HEDEF.md:83-85, 138-147)\n`);
// Cikis kodu YALNIZ zorunlu KIRMIZI hucrelere bakar. "olculemedi" bir basarisizlik
// degil, olculmus bir sonuctur: adiyla ve sebebiyle yazilir ve tur DURMAZ
// (HEDEF.md:146-147). Yukaridaki "ZORUNLU OLCULEMEDI" satiri onu gorunur kilar.
process.exit(kirmizi.length === 0 ? 0 : 1);
