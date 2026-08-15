// SIR TARAMASI — takip edilen dosyalarda sızmış kimlik bilgisi arar.
//
// ⚠️ DESEN TABANLI, ENTROPİ TABANLI DEĞİL. Sebep ÖLÇÜLDÜ: bu depoda takip edilen
// ~103 dosyanın yarısı kanıt dosyasıdır ve içleri 64 karakterlik SHA-256 hex, UUID
// (ör. moz-extension://<uuid>) ve uzun rasgele görünen dizelerle doludur. Entropi ya da
// salt uzunluk kuralı TEMİZ AĞAÇTA çıkış 1 verirdi ve kontrol ilk günden okunmaz olurdu
// (G22 — yanlış soruyu soran kontrol).
//
// ⚠️ Bulgu ASLA tam hâliyle yazılmaz: ilk 4 karakter + … + uzunluk. Log'a maskelenmemiş
// bir eşleşme düşerse bir sonraki tarama KENDİ LOG'U yüzünden kırmızı olur.
//
// Yeni bağımlılık YOK — saf Node yerleşikleri.
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KOK = path.dirname(fileURLToPath(import.meta.url));
const PROJE = path.resolve(KOK, "..");
// Kanıt DÜZ yazılır: .gitignore:30 `*.log` her log'u yutar, muafiyet yalnız
// :55 !test-yolu/kanit/*.log ve :56 !mantik/kanit/*.log — ve muafiyetteki `*` `/` GEÇMEZ.
// arac/kanit/ açmak ya kanıtı yutardı ya .gitignore değişikliği gerektirirdi.
const LOG = path.join(PROJE, "test-yolu", "kanit", "sir-tarama.log");
const LOG_KANIT = path.join(PROJE, "test-yolu", "kanit", "sir-tarama-kanit.log");

const satirlar = [];
const yaz = (s = "") => {
  satirlar.push(s);
  process.stdout.write(s + "\n");
};

function maskele(e) {
  const s = String(e);
  return `${s.slice(0, 4)}…(${s.length} karakter)`;
}

// ── Bilinen sır önekleri ────────────────────────────────────────────────────────
const DESENLER = [
  ["GitHub klasik token", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/g],
  ["GitHub ince token", /\bgithub_pat_[A-Za-z0-9_]{22,}\b/g],
  ["Anthropic anahtari", /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g],
  ["OpenAI benzeri anahtar", /\bsk-[A-Za-z0-9]{32,}\b/g],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g],
  ["AWS erisim anahtari", /\bAKIA[A-Z0-9]{16}\b/g],
  ["Google API anahtari", /\bAIza[A-Za-z0-9_-]{35}\b/g],
  ["GitLab token", /\bglpat-[A-Za-z0-9_-]{20,}\b/g],
  ["Ozel anahtar blogu", new RegExp("-{5}BEGIN [A-Z ]*PRIVATE" + " KEY-{5}", "g")],
];

// ── DAR atama kuralı ────────────────────────────────────────────────────────────
const ANAHTAR =
  /\b(?:password|passwd|secret|api[_-]?key|apikey|token|auth[_-]?token|access[_-]?key|client[_-]?secret)\b\s*[:=]\s*["']?([A-Za-z0-9_-]{16,})["']?/gi;

const YER_TUTUCU = ["{{", "<", "xxx", "your", "ornek", "example", "changeme", "placeholder"];

/** Beş daraltmanın HEPSİ sağlanmazsa eşleşme SAYILMAZ. */
function atamaDegeriSir(v) {
  if (v.length < 16) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(v)) return false;
  if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) return false; // harf VE rakam
  if (/^[0-9a-fA-F]+$/.test(v)) return false; // saf hex → SHA-256/SHA-1/MD5 elenir
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v)) return false; // UUID
  const kucuk = v.toLowerCase();
  if (YER_TUTUCU.some((y) => kucuk.includes(y))) return false;
  return true;
}

function takipEdilenler() {
  const c = spawnSync("git", ["ls-files", "-z"], { cwd: PROJE, encoding: "buffer", timeout: 60000, windowsHide: true });
  if (c.status !== 0) throw new Error(`git ls-files cikis=${c.status}: ${String(c.stderr || "")}`);
  return String(c.stdout || "").split("\0").filter(Boolean);
}

function tara() {
  const dosyalar = takipEdilenler();
  const bulgular = [];
  const ikililer = [];
  let taranan = 0;

  for (const rel of dosyalar) {
    const tam = path.join(PROJE, rel);
    let ham;
    try {
      ham = fs.readFileSync(tam);
    } catch {
      continue; // silinmiş ama indekste — atla
    }
    if (ham.includes(0)) {
      ikililer.push(rel); // SESSİZ ATLAMA YOK: adıyla basılır
      continue;
    }
    taranan++;
    const metin = ham.toString("utf8");
    const satirDizi = metin.split("\n");
    for (let i = 0; i < satirDizi.length; i++) {
      const satir = satirDizi[i];
      for (const [ad, re] of DESENLER) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(satir)) !== null) {
          bulgular.push({ dosya: rel, satir: i + 1, desen: ad, maske: maskele(m[0]) });
        }
      }
      ANAHTAR.lastIndex = 0;
      let a;
      while ((a = ANAHTAR.exec(satir)) !== null) {
        if (atamaDegeriSir(a[1])) {
          bulgular.push({ dosya: rel, satir: i + 1, desen: "dar atama kurali", maske: maskele(a[1]) });
        }
      }
    }
  }
  return { dosyaSayisi: dosyalar.length, taranan, ikililer, bulgular };
}

function ignoreDogrula() {
  const adlar = [".env", "bildirim.json", "node_modules"];
  const sonuc = [];
  for (const ad of adlar) {
    const c = spawnSync("git", ["check-ignore", "-v", ad], { cwd: PROJE, encoding: "utf8", timeout: 30000, windowsHide: true });
    const satir = String(c.stdout || "").trim();
    sonuc.push({ ad, satir, tamam: c.status === 0 && satir.length > 0 });
  }
  return sonuc;
}

function logYaz(baslik, yol = LOG) {
  fs.mkdirSync(path.dirname(yol), { recursive: true });
  fs.writeFileSync(
    yol,
    `=== SAYAC — ${baslik} ===\nnode=${process.version} platform=${process.platform}\n` +
      "=".repeat(72) + "\n\n" + satirlar.join("\n") + "\n",
    "utf8"
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
function gercekTarama() {
  yaz("=".repeat(72));
  yaz("SIR TARAMASI — desen tabanli (entropi tabanli DEGIL, gerekcesi kaynakta)");
  yaz("=".repeat(72));
  const r = tara();
  yaz(`takip edilen dosya : ${r.dosyaSayisi}`);
  yaz(`taranan metin dosya: ${r.taranan}`);
  yaz(`atlanan ikili      : ${r.ikililer.length}${r.ikililer.length ? " → " + r.ikililer.join(", ") : ""}`);
  yaz(`taranan desen ailesi: ${DESENLER.length} + 1 dar atama kurali`);
  yaz("");
  const ig = ignoreDogrula();
  yaz("git check-ignore -v dogrulamasi (git-rehberi §2.4'un gercek dogrulamasi):");
  for (const s of ig) yaz(`   ${s.ad.padEnd(14)} → ${s.tamam ? s.satir : "SATIR DONMEDI ← EKSIK"}`);
  const igTamam = ig.every((s) => s.tamam);
  yaz("");
  if (r.bulgular.length === 0) {
    yaz("BULGU: 0 — temiz");
  } else {
    yaz(`BULGU: ${r.bulgular.length}`);
    for (const b of r.bulgular) yaz(`   ${b.dosya}:${b.satir} — ${b.desen} — ${b.maske}`);
    yaz("(eslesmenin tamami HICBIR yere yazilmaz — maskelenmistir)");
  }
  const kod = r.bulgular.length === 0 && igTamam ? 0 : 1;
  yaz("");
  yaz(`SONUC: ${kod === 0 ? "TEMIZ" : "SIR/EKSIK IGNORE BULUNDU"} · cikis ${kod}`);
  return { kod, r, igTamam };
}

// ── --kanit: koruma KIRMIZIYA DONEBILIYOR mu? (G26/K04) ────────────────────────
function cocukTarama() {
  const c = spawnSync(process.execPath, [path.join(KOK, "sir-tarama.mjs")], {
    cwd: PROJE, encoding: "utf8", timeout: 120000, windowsHide: true,
  });
  return { kod: c.status, cikti: String(c.stdout || "") + String(c.stderr || "") };
}

function sha(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function kanit() {
  const kendi = path.join(KOK, "sir-tarama.mjs");
  const oncekiSha = sha(kendi);
  const ozgun = fs.readFileSync(kendi, "utf8");
  const bacaklar = [];

  yaz("=".repeat(72));
  yaz("SIR TARAMASI KANITI (G26/K04) — koruma KIRMIZIYA DONEBILDIGI gosterilmeden");
  yaz("yesil sayilmaz. Uc bacak; biri tutmazsa cikis 1.");
  yaz("=".repeat(72));
  yaz(`arac/sir-tarama.mjs SHA-256 once : ${oncekiSha}`);

  // Sahte sir CALISMA ZAMANINDA parcalardan kurulur — kaynakta butun halde YOKTUR.
  // Icinde SAHTE gecer; ghp_ + 36 alnum bicimini karsilar (5+10+10+11 = 36).
  const onek = ["g", "hp", "_"].join("");
  const govde = "SAHTE" + "0123456789" + "ABCDEFGHIJ" + "abcdefghijk";
  const sahteSir = onek + govde;

  try {
    // ── Bacak 1: yesil ──
    const b1 = cocukTarama();
    const b1ok = b1.kod === 0;
    bacaklar.push(b1ok);
    yaz("");
    yaz("BACAK 1 — temiz agac (agaca DOKUNULMADI)");
    yaz(`   cikis=${b1.kod} (beklenen 0) → ${b1ok ? "TAMAM" : "DUSTU"}`);
    const tar = /taranan metin dosya: (\d+)/.exec(b1.cikti);
    yaz(`   ${tar ? "taranan metin dosya: " + tar[1] : "taranan sayisi okunamadi"}`);

    // ── Bacak 2: kirmizi ──
    fs.writeFileSync(kendi, ozgun + "\n// " + sahteSir + "\n", "utf8");
    const b2 = cocukTarama();
    const kendiRel = path.relative(PROJE, kendi).replace(/\\/g, "/");
    const b2ok = b2.kod === 1 && b2.cikti.includes(kendiRel);
    bacaklar.push(b2ok);
    yaz("");
    yaz("BACAK 2 — sahte sir kendi kaynagimizin sonuna // yorumu olarak yazildi");
    yaz(`   cikis=${b2.kod} (beklenen 1) · bulgu kendi dosyasinda mi: ${b2.cikti.includes(kendiRel)} → ${b2ok ? "TAMAM" : "DUSTU"}`);
    const bl = b2.cikti.split("\n").filter((l) => l.includes(kendiRel) && l.includes("…"));
    for (const l of bl) yaz(`   ${l.trim()}`);
    yaz(`   (sahte sir MASKELENMIS bicimde gorunuyor; duz metin hicbir yere yazilmadi)`);

    // ── Bacak 3: negatif kontrol ──
    fs.writeFileSync(kendi, ozgun, "utf8");
    const hex = crypto.createHash("sha256").update("negatif-kontrol").digest("hex");
    const uuid = crypto.randomUUID();
    fs.writeFileSync(kendi, ozgun + `\n// ${hex}\n// moz-extension://${uuid}/pencere.html\n`, "utf8");
    const b3 = cocukTarama();
    const b3ok = b3.kod === 0;
    bacaklar.push(b3ok);
    yaz("");
    yaz("BACAK 3 — negatif kontrol: 64 karakterlik SHA-256 hex + moz-extension://<uuid>");
    yaz(`   cikis=${b3.kod} (beklenen 0) → ${b3ok ? "TAMAM — uzun dizeye kor korune ates etmiyor" : "DUSTU"}`);
  } finally {
    fs.writeFileSync(kendi, ozgun, "utf8"); // HER KOSULDA geri al
  }

  const sonrakiSha = sha(kendi);
  yaz("");
  yaz(`arac/sir-tarama.mjs SHA-256 sonra: ${sonrakiSha}`);
  yaz(`geri alindi (once = sonra): ${oncekiSha === sonrakiSha}`);
  const geriSonra = cocukTarama();
  yaz(`geri alma sonrasi gercek tarama cikis=${geriSonra.kod} (beklenen 0)`);
  const st = spawnSync("git", ["status", "--porcelain"], { cwd: PROJE, encoding: "utf8", timeout: 30000, windowsHide: true });
  const porcelain = String(st.stdout || "").trim();
  yaz(`git status --porcelain:`);
  for (const l of (porcelain ? porcelain.split("\n") : ["(bos)"])) yaz(`   ${l}`);
  // ASIL İNVARYANT: bozulan dosya DEĞİŞMİŞ olarak görünmemeli. Tam dize karşılaştırması
  // ("yalnız ?? DEVIR.md") bu turda henüz commit edilmemiş yeni dosyaları yanlış yorumlardı.
  const kendiDegismis = porcelain.split("\n").some((l) => /^\s*(M|A?M)/.test(l) && l.includes("sir-tarama.mjs"));
  const agacTemiz = !kendiDegismis;
  yaz(`arac/sir-tarama.mjs DEGISMIS olarak gorunuyor mu: ${kendiDegismis} (beklenen false)`);

  const gecti = bacaklar.every(Boolean) && oncekiSha === sonrakiSha && geriSonra.kod === 0 && agacTemiz;
  yaz("");
  yaz(`SONUC: ${gecti ? "✓ koruma gercekten kirmiziya donebiliyor" : "✗ KANIT DUSTU"}`);
  return gecti ? 0 : 1;
}

// ═══════════════════════════════════════════════════════════════════════════════
if (process.argv.includes("--kanit")) {
  const kod = kanit();
  logYaz("sir taramasi KANITI (arac/sir-tarama.mjs --kanit)", LOG_KANIT);
  process.exit(kod);
} else {
  const { kod } = gercekTarama();
  logYaz("sir taramasi (arac/sir-tarama.mjs)");
  process.exit(kod);
}
