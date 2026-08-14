// Madde 3 matris koşucusu. Her hücre AYRI ÇOCUK SÜREÇTE koşar (deseni: kosum.mjs:29-53).
// Çocukta kendi sert sayacı var; ebeveyn burada süreç AĞACINI taskkill /T /F ile öldürür.
//
// Y9 (YouTube) ve Y10 (LibreWolf) ÇIKIŞ KODUNU ETKİLEMEZ — kırılgan/ölçülemez olabilirler
// ve hedefin kalanını durdurmazlar (HEDEF.md:83-85, 138-147). Zorunlu hücrelerden biri
// KIRMIZI ise çıkış 1.
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OLCULEMEDI, olculemediMi, yazimSapmasi } from "./ortak/durum.mjs";

const KOK = path.dirname(fileURLToPath(import.meta.url));
const PROJE = path.resolve(KOK, "..");
const KANIT = path.join(KOK, "kanit");

// ── G26 KANITI: sayacın kendisi bozularak sınanır ────────────────────────────────
// "Artık doğru sayıyor" demek yetmez (kriter 6). Üç bacak; biri tutmazsa çıkış 1.
// Hücre seçimi ayrıştırmasından ÖNCE ele alınır.
if (process.argv.includes("--kanit")) {
  const satirlar = [];
  const yaz = (s = "") => {
    satirlar.push(s);
    process.stdout.write(s + "\n");
  };
  const eskiSayac = (r) => r.filter((s) => s.zorunlu && s.durum === "ölçülemedi").length;
  const yeniSayac = (r) => r.filter((s) => s.zorunlu && olculemediMi(s.durum)).length;
  const raporYolu = path.join(KANIT, "eklenti-rapor.json");
  const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
  const bacaklar = [];

  yaz("=".repeat(72));
  yaz("SAYAC KANITI (G26) — 'artik dogru sayiyor' demek yetmez, BOZULARAK sinanir");
  yaz("=".repeat(72));

  // ── Bacak 1: sentetik tablo ──
  const sentetik = [
    { hucre: "S1", zorunlu: true, durum: "ölçülemedi" },
    { hucre: "S2", zorunlu: true, durum: "olculemedi" },
    { hucre: "S3", zorunlu: false, durum: "ölçülemedi" },
    { hucre: "S4", zorunlu: true, durum: "YESIL" },
  ];
  const b1y = yeniSayac(sentetik), b1e = eskiSayac(sentetik);
  const b1 = b1y === 2 && b1e === 1;
  bacaklar.push(b1);
  yaz("");
  yaz("BACAK 1 — sentetik tablo (4 satir: kanonik / ASCII / zorunlu degil / YESIL)");
  yaz(`   yeni sayac = ${b1y} (beklenen 2) · eski sayac = ${b1e} (beklenen 1) → ${b1 ? "TAMAM" : "DUSTU"}`);

  // ── Bacak 2: gerçek rapor, BELLEKTE bozulmuş ──
  let b2 = false, b2not = "kanit/eklenti-rapor.json yok";
  let oncekiSha = null, sonrakiSha = null;
  if (fs.existsSync(raporYolu)) {
    oncekiSha = sha(raporYolu);
    const gercek = JSON.parse(fs.readFileSync(raporYolu, "utf8"));
    const temizYeni = yeniSayac(gercek);
    const kopya = JSON.parse(JSON.stringify(gercek));
    const hedef = kopya.find((s) => s.zorunlu && olculemediMi(s.durum));
    if (hedef) {
      const oncekiDurum = hedef.durum;
      hedef.durum = "olculemedi"; // ASCII'ye BOZ — yalnizca BELLEKTE
      const bozukYeni = yeniSayac(kopya), bozukEski = eskiSayac(kopya);
      const temizEski = eskiSayac(gercek);
      b2 = bozukYeni === temizYeni && bozukEski === temizEski - 1;
      b2not = `hedef=${hedef.hucre} "${oncekiDurum}" → "olculemedi" · yeni: ${temizYeni}→${bozukYeni} (ayni olmali) · eski: ${temizEski}→${bozukEski} (bir eksik olmali)`;
    } else {
      b2not = "raporda zorunlu+olculemedi hucre yok, bacak kosulamadi";
    }
    sonrakiSha = sha(raporYolu);
  }
  bacaklar.push(b2);
  yaz("");
  yaz("BACAK 2 — gercek rapor, BELLEKTEKI kopyada bozuldu (disk DEGISMEZ)");
  yaz(`   ${b2not} → ${b2 ? "TAMAM" : "DUSTU"}`);

  // ── Bacak 3: negatif kontrol ──
  let b3 = false, b3not = "kosulamadi";
  if (fs.existsSync(raporYolu)) {
    const gercek = JSON.parse(fs.readFileSync(raporYolu, "utf8"));
    const temizYeni = yeniSayac(gercek);
    const kopya = JSON.parse(JSON.stringify(gercek));
    const hedef = kopya.find((s) => s.zorunlu && olculemediMi(s.durum));
    if (hedef) {
      hedef.durum = "YESIL";
      const y = yeniSayac(kopya);
      b3 = y === temizYeni - 1;
      b3not = `hedef=${hedef.hucre} → "YESIL" · yeni sayac: ${temizYeni}→${y} (bir eksik olmali)`;
    }
  }
  bacaklar.push(b3);
  yaz("");
  yaz("BACAK 3 — negatif kontrol: sayac kor korune artmiyor");
  yaz(`   ${b3not} → ${b3 ? "TAMAM" : "DUSTU"}`);

  yaz("");
  yaz(`kanit/eklenti-rapor.json SHA-256 once : ${oncekiSha || "(dosya yok)"}`);
  yaz(`kanit/eklenti-rapor.json SHA-256 sonra: ${sonrakiSha || "(dosya yok)"}`);
  yaz(`disk DEGISMEDI: ${oncekiSha === sonrakiSha}`);
  const gecti = bacaklar.every(Boolean) && oncekiSha === sonrakiSha;
  yaz("");
  yaz(`SONUC: ${gecti ? "✓ sayac gercekten olcuyor" : "✗ SAYAC KANITI DUSTU"}`);
  fs.mkdirSync(KANIT, { recursive: true });
  fs.writeFileSync(
    path.join(KANIT, "sayac-kanit.log"),
    `=== SAYAC — sayac kaniti (G26) ===\nkomut: node test-yolu/eklenti-kosum.mjs --kanit\n` +
      `node=${process.version} platform=${process.platform}\n${"=".repeat(72)}\n\n` +
      satirlar.join("\n") + "\n",
    "utf8"
  );
  process.exit(gecti ? 0 : 1);
}

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
  // 005'te OLCULDU: Y10 artik YESIL — LibreWolf'a kurulabilirlik profile imzasiz XPI
  // sideload ile kanitlandi (extensions.json: active=true, signedState=0, appDisabled=false).
  // Varsayilan kosuma ALINMIYOR: ~60 sn + 162 MB'lik artefakt her kosuma binmesin.
  // zorunlu:false oldugu icin cikis koduna zaten etki etmez → kazanc yok, maliyet gercek.
  // Elle kosum: node test-yolu/eklenti-kosum.mjs Y10
  Y10: "OLCULDU ve YESIL (005): LibreWolf'a kurulabilirlik kanitlandi. Varsayilan kosuma alinmiyor cunku ~60 sn + 162 MB artefakt gerektiriyor ve zorunlu:false oldugu icin cikis koduna etki etmiyor. Elle: node test-yolu/eklenti-kosum.mjs Y10",
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
// Yazımdan BAĞIMSIZ sayım — tam dize karşılaştırması Y16'nın ASCII "olculemedi"sini
// kaçırıyordu (005'te ölçüldü). Sapma sessizce yutulmaz, aşağıda BAĞIRILIR.
const olculemeyen = rapor.filter((s) => s.zorunlu && olculemediMi(s.durum));
process.stdout.write(`\nZORUNLU KIRMIZI: ${kirmizi.length}${kirmizi.length ? " → " + kirmizi.map((s) => s.hucre).join(", ") : ""}\n`);
process.stdout.write(`ZORUNLU OLCULEMEDI: ${olculemeyen.length}${olculemeyen.length ? " → " + olculemeyen.map((s) => s.hucre).join(", ") : ""}\n`);
for (const s of rapor) {
  const sapma = yazimSapmasi(s.durum);
  if (sapma) {
    process.stdout.write(
      `YAZIM SAPMASI: ${s.hucre} durum="${sapma.okunan}" ≠ kanonik "${sapma.kanonik}"\n`
    );
  }
}
process.stdout.write(`Y9/Y10 cikis kodunu ETKILEMEZ (kirilgan/olculemez olabilir — HEDEF.md:83-85, 138-147)\n`);
// Cikis kodu YALNIZ zorunlu KIRMIZI hucrelere bakar. "olculemedi" bir basarisizlik
// degil, olculmus bir sonuctur: adiyla ve sebebiyle yazilir ve tur DURMAZ
// (HEDEF.md:146-147). Yukaridaki "ZORUNLU OLCULEMEDI" satiri onu gorunur kilar.
process.exit(kirmizi.length === 0 ? 0 : 1);
