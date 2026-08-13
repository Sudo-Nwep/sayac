// Mutasyon koşucusu — "sınama gerçekten ölçüyor mu?" sorusunu ÖLÇER.
//
// İki bağımsız bozma ailesi, ikisi de gerekli (biri diğerinin yerine geçmez):
//   A) KOD mutantları  → sayac.mjs bozulur; senaryolar gerçekten mantığa bağlı mı? (HEDEF.md:74)
//   B) TABLO bozmaları → senaryolar.json bozulur; koşucu KATI mı? (senaryo-tablosu tarifi ③)
//
// ⚠️ Her mutant AYRI ÇOCUK SÜREÇTE koşar. Sebep: ESM modül önbelleği aynı süreçte
// diskteki değişikliği yeniden yüklemez — bozulmuş dosyayı aynı süreçte yüklemek eski
// sürümü verir ve sınama YALANCI YEŞİL döner. Bu turun en somut teknik tuzağıdır.
//
// Geri alma dört ayaklı: finally → process.on("exit") → SHA-256 karşılaştırması →
// git status --porcelain (Faz 5'te elle).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KOK = path.dirname(fileURLToPath(import.meta.url));
const PROJE = path.resolve(KOK, "..");
const SAYAC = path.join(KOK, "sayac.mjs");
const TABLO = path.join(KOK, "senaryolar.json");
const KOSUCU = path.join(KOK, "kosucu.mjs");
const KANIT = path.join(KOK, "kanit");
const SERT_SURE_MS = 30000;

const satirlar = [];
function yaz(s = "") {
  satirlar.push(s);
  process.stdout.write(s + "\n");
}

function sha(yol) {
  return createHash("sha256").update(fs.readFileSync(yol)).digest("hex");
}

// --- güvenlik ağı: hangi dosyanın orijinali bellekte, süreç nasıl biterse bitsin geri yaz ---
const ORIJINAL = new Map();
ORIJINAL.set(SAYAC, fs.readFileSync(SAYAC, "utf8"));
ORIJINAL.set(TABLO, fs.readFileSync(TABLO, "utf8"));
function hepsiniGeriYaz() {
  for (const [yol, icerik] of ORIJINAL.entries()) {
    try {
      if (fs.readFileSync(yol, "utf8") !== icerik) fs.writeFileSync(yol, icerik, "utf8");
    } catch {
      /* geri yazma son çare — hata yutulur, hash karşılaştırması yakalar */
    }
  }
}
process.on("exit", hepsiniGeriYaz);

function kosucuyuKos() {
  const c = spawnSync(process.execPath, [KOSUCU, "--log-yok"], {
    cwd: PROJE,
    timeout: SERT_SURE_MS,
    killSignal: "SIGKILL",
    encoding: "buffer",
    windowsHide: true,
  });
  const ham =
    Buffer.concat([c.stdout || Buffer.alloc(0), c.stderr || Buffer.alloc(0)]).toString("utf8");
  if (c.error && c.error.code === "ETIMEDOUT" && c.pid) {
    // G23/G24 — sert sayaç dolduysa süreç AĞACINI öldür, artık node kalmasın.
    spawnSync("taskkill", ["/PID", String(c.pid), "/T", "/F"], { windowsHide: true });
  }
  return { kod: c.status, sinyal: c.signal, ham, zamanAsimi: !!c.error };
}

function kalanIdler(ham) {
  const m = ham.match(/KALAN SENARYOLAR: (.+)/);
  if (m) return m[1].trim().split(", ");
  const r = ham.match(/GECEN: \d+ · KALAN: (\d+)/);
  if (r && r[1] !== "0") return [`(şema reddi — ${r[1]} hata)`];
  return [];
}

function bozmaKos({ ad, tur, dosya, boz, kirmasiGereken, beklenenKod }) {
  const oncekiHash = sha(dosya);
  const orijinal = ORIJINAL.get(dosya);
  let sonuc;
  try {
    const bozuk = boz(orijinal);
    if (bozuk === orijinal) throw new Error("bozma etkisiz kaldı — hedef metin bulunamadı");
    fs.writeFileSync(dosya, bozuk, "utf8");
    sonuc = kosucuyuKos();
  } finally {
    fs.writeFileSync(dosya, orijinal, "utf8"); // ← her koşulda geri al
  }
  const sonrakiHash = sha(dosya);
  const kirilan = kalanIdler(sonuc.ham);

  const kodTamam =
    beklenenKod === "sifirDisi" ? sonuc.kod !== 0 && sonuc.kod !== null : sonuc.kod === beklenenKod;
  const hashTamam = oncekiHash === sonrakiHash;
  const kapsamTamam =
    !kirmasiGereken || kirmasiGereken.every((k) => kirilan.some((x) => x.startsWith(k)));
  const gecti = kodTamam && hashTamam && (tur === "tablo" || kirilan.length > 0) && kapsamTamam;

  yaz("");
  yaz(`── ${ad} ──`);
  yaz(`   tür        : ${tur === "kod" ? "KOD mutantı" : "TABLO bozması"} · dosya: ${path.relative(PROJE, dosya).replace(/\\/g, "/")}`);
  yaz(`   koşucu     : çıkış kodu ${sonuc.kod}${sonuc.sinyal ? ` (sinyal ${sonuc.sinyal})` : ""} · beklenen ${beklenenKod === "sifirDisi" ? "≠ 0" : beklenenKod} → ${kodTamam ? "TAMAM" : "BEKLENTİ DIŞI"}`);
  yaz(`   kırdığı    : ${kirilan.length ? kirilan.join(", ") : "HİÇBİRİ ← TEST BOŞLUĞU"}`);
  if (kirmasiGereken)
    yaz(`   kırmalıydı : ${kirmasiGereken.join(", ")} → ${kapsamTamam ? "TAMAM" : "EKSİK"}`);
  yaz(`   SHA-256 önce : ${oncekiHash}`);
  yaz(`   SHA-256 sonra: ${sonrakiHash}`);
  yaz(`   geri alındı : ${hashTamam ? "EVET (hash birebir aynı)" : "HAYIR ← KAYNAK BOZUK KALDI"}`);
  yaz(`   SONUÇ      : ${gecti ? "✓ mutant yakalandı" : "✗ YAKALANMADI"}`);
  return { ad, tur, gecti, kod: sonuc.kod, kirilan, hashTamam, zamanAsimi: sonuc.zamanAsimi };
}

// --- yardımcı: tabloyu nesne düzeyinde boz, metne çevir ---
function tabloBoz(metin, degistir) {
  const t = JSON.parse(metin);
  degistir(t);
  return JSON.stringify(t, null, 2) + "\n";
}
function senaryoBul(t, id) {
  const s = t.senaryolar.find((x) => x.id === id);
  if (!s) throw new Error(`senaryo bulunamadı: ${id}`);
  return s;
}

yaz("=".repeat(70));
yaz("MUTASYON KOŞUSU — sınama gerçekten ölçüyor mu?");
yaz("=".repeat(70));
yaz(`node=${process.version} · her mutant AYRI çocuk süreçte · sert sayaç ${SERT_SURE_MS} ms`);
yaz(`sayac.mjs        SHA-256 (başlangıç): ${sha(SAYAC)}`);
yaz(`senaryolar.json  SHA-256 (başlangıç): ${sha(TABLO)}`);

// ---------- A) KOD MUTANTLARI ----------
yaz("");
yaz("### A — KOD MUTANTLARI (sayac.mjs) — senaryolar gerçekten mantığa bağlı mı?");

const M1_ESKI =
  '  if (durum.molada) return DURUMLAR.MOLA;\n  if (durum.videoOynuyor) return DURUMLAR.IZLENIYOR;';
const M1_YENI =
  '  if (durum.videoOynuyor) return DURUMLAR.IZLENIYOR;\n  if (durum.molada) return DURUMLAR.MOLA;';
const M2_ESKI = "    toplam = sifirToplam();";
const M2_YENI =
  "    toplam = { izleniyor: toplam.izleniyor, duraklatildi: toplam.duraklatildi, mola: toplam.mola };";
const M3_ESKI = "  } else if (ad === DURUMLAR.MOLA) {\n    y.mola += aralik;\n  }\n  return y;";
const M3_YENI =
  "  } else if (ad === DURUMLAR.MOLA) {\n    y.mola += aralik;\n  } else {\n    y.duraklatildi += aralik;\n  }\n  return y;";
const M4_ESKI = "  const aralik = olay.t - durum.t;";
const M4_YENI =
  "  const aralik = (olay.t - durum.t) * (olay.hiz === undefined ? 1 : olay.hiz);";

const sonuclar = [];
sonuclar.push(
  bozmaKos({
    ad: "M1 — MOLA önceliği kaldırıldı (molada video oynuyorsa İZLENİYOR sayılır)",
    tur: "kod",
    dosya: SAYAC,
    boz: (s) => s.replace(M1_ESKI, M1_YENI),
    // M1 yalnizca (molada && videoOynuyor && !anaKapali) iken SIFIRDAN BUYUK aralik
    // varsa fark yaratir. S04/S08a duyarsizdir: mola sirasinda video DURAKLIDIR.
    // S18 de duyarsizdir: kosul saglanir ama sondaki gece-yarisi birikimi siler.
    kirmasiGereken: ["S05", "S06", "S11", "S17"],
    beklenenKod: "sifirDisi",
  })
);
sonuclar.push(
  bozmaKos({
    ad: "M2 — gece-yarısı sıfırlamayı atlıyor",
    tur: "kod",
    dosya: SAYAC,
    boz: (s) => s.replace(M2_ESKI, M2_YENI),
    kirmasiGereken: ["S10", "S11", "S18"],
    beklenenKod: "sifirDisi",
  })
);
sonuclar.push(
  bozmaKos({
    ad: "M3 — KAPALI'da geçen süre duraklatildi kovasına yazılıyor",
    tur: "kod",
    dosya: SAYAC,
    boz: (s) => s.replace(M3_ESKI, M3_YENI),
    kirmasiGereken: ["S07", "S08b", "S09"],
    beklenenKod: "sifirDisi",
  })
);
sonuclar.push(
  bozmaKos({
    ad: "M4 — oynatma hızı çarpan olarak kullanılıyor (gerçek zaman bozulur)",
    tur: "kod",
    dosya: SAYAC,
    boz: (s) => s.replace(M4_ESKI, M4_YENI),
    kirmasiGereken: ["S13b"],
    beklenenKod: "sifirDisi",
  })
);

// ---------- B) TABLO BOZMALARI ----------
yaz("");
yaz("### B — TABLO BOZMALARI (senaryolar.json) — koşucu gerçekten KATI mı?");

sonuclar.push(
  bozmaKos({
    ad: "T1 — beklenen değer değiştirildi (S01.beklenen.izleniyor: 10000 → 9999)",
    tur: "tablo",
    dosya: TABLO,
    boz: (m) => tabloBoz(m, (t) => (senaryoBul(t, "S01-yalniz-izleniyor").beklenen.izleniyor = 9999)),
    beklenenKod: 1,
  })
);
sonuclar.push(
  bozmaKos({
    ad: "T2 — zorunlu alan silindi (S03.beklenenDurum)",
    tur: "tablo",
    dosya: TABLO,
    boz: (m) => tabloBoz(m, (t) => delete senaryoBul(t, "S03-karisik-dizi").beklenenDurum),
    beklenenKod: 1,
  })
);
sonuclar.push(
  bozmaKos({
    ad: "T3 — alan adına yazım hatası (S05.beklenen → beklenenn)",
    tur: "tablo",
    dosya: TABLO,
    boz: (m) =>
      tabloBoz(m, (t) => {
        const s = senaryoBul(t, "S05-mola-kapaninca-kaldigi-yerden");
        s.beklenenn = s.beklenen;
        delete s.beklenen;
      }),
    beklenenKod: 1,
  })
);

// ---------- ÖZET ----------
hepsiniGeriYaz();
const sonSayac = sha(SAYAC);
const sonTablo = sha(TABLO);
const kodMutant = sonuclar.filter((s) => s.tur === "kod");
const tabloMutant = sonuclar.filter((s) => s.tur === "tablo");
const bosluk = kodMutant.filter((s) => s.kirilan.length === 0);
const dusen = sonuclar.filter((s) => !s.gecti);

yaz("");
yaz("=".repeat(70));
yaz("ÖZET");
yaz("=".repeat(70));
yaz(`kod mutantı   : ${kodMutant.length} · yakalanan: ${kodMutant.filter((s) => s.gecti).length}`);
yaz(`tablo bozması : ${tabloMutant.length} · yakalanan: ${tabloMutant.filter((s) => s.gecti).length}`);
yaz(`test boşluğu (hiçbir senaryoyu kırmayan mutant): ${bosluk.length}${bosluk.length ? " → " + bosluk.map((b) => b.ad).join("; ") : ""}`);
yaz(`sayac.mjs       SHA-256 (bitiş): ${sonSayac}`);
yaz(`senaryolar.json SHA-256 (bitiş): ${sonTablo}`);
yaz(`geri alma: sayac.mjs ${sonSayac === sha(SAYAC) ? "" : ""}${ORIJINAL.get(SAYAC) === fs.readFileSync(SAYAC, "utf8") ? "BİREBİR AYNI" : "FARKLI ← BOZUK"} · senaryolar.json ${ORIJINAL.get(TABLO) === fs.readFileSync(TABLO, "utf8") ? "BİREBİR AYNI" : "FARKLI ← BOZUK"}`);
yaz("");
yaz(`SONUÇ: ${sonuclar.length - dusen.length}/${sonuclar.length} bozma beklendiği gibi yakalandı`);
if (dusen.length) yaz(`YAKALANMAYAN: ${dusen.map((d) => d.ad).join(" | ")}`);

try {
  fs.mkdirSync(KANIT, { recursive: true });
  fs.writeFileSync(
    path.join(KANIT, "mutasyon.log"),
    `=== SAYAC — mantik/mutasyon.mjs ham çıktısı ===\n` +
      `komut: npm run mutasyon  (node mantik/mutasyon.mjs)\n` +
      `node=${process.version} platform=${process.platform}\n` +
      "=".repeat(70) + "\n\n" +
      satirlar.join("\n") + "\n",
    "utf8"
  );
} catch (e) {
  process.stdout.write("log yazilamadi: " + e.message + "\n");
}

process.exit(dusen.length === 0 ? 0 : 1);
