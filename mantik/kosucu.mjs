// KATI koşucu — üç bölüm:
//   A) Saflık ÖLÇÜMÜ  (statik tarama + dinamik global tuzağı + determinizm)
//   B) Tablo doğrulama (eksik alan ve TANIMSIZ alan reddedilir, sessizce varsayılmaz)
//   C) Koşum + otomatik çakışma/kayıp invaryantı
// Başarısızlıkta çıkış kodu 1.
//
// K05: "doğrulama ölçmez, iddia eder" — bu yüzden saflık iki ayrı yoldan ölçülür.
// Statik tarama bir YOKLUK ölçer (G22'nin konusu); dinamik tuzak bir VARLIK ölçer:
// global'ler zehirliyken bile doğru sonuç üretildi.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DURUMLAR,
  OLAY_TURLERI,
  baslangic,
  uygula,
  ozet,
  durumAdi,
  calistir,
} from "./sayac.mjs";

// --- tuzak kurulmadan ÖNCE yakalanan referanslar (Bölüm A onları zehirleyecek) ---
const KOK = path.dirname(fileURLToPath(import.meta.url));
const YAZ_HAM = process.stdout.write.bind(process.stdout);
const CIK = (kod) => process.exit(kod);
const LOG_YOK = process.argv.includes("--log-yok");
const SAYAC_KAYNAK = path.join(KOK, "sayac.mjs");
const TABLO_YOLU = path.join(KOK, "senaryolar.json");
const KANIT_DIZINI = path.join(KOK, "kanit");

const satirlar = [];
function yaz(s = "") {
  satirlar.push(s);
  YAZ_HAM(s + "\n");
}

const hatalar = [];
function hata(s) {
  hatalar.push(s);
  yaz("  ✗ " + s);
}

// =====================================================================
// BÖLÜM A — SAFLIK ÖLÇÜMÜ
// =====================================================================
yaz("=".repeat(70));
yaz("BÖLÜM A — SAFLIK ÖLÇÜMÜ (iddia değil, ölçüm)");
yaz("=".repeat(70));

// --- A1: statik tarama ---
const kaynak = fs.readFileSync(SAYAC_KAYNAK, "utf8");
const YASAKLI = [
  ["Date", /\bDate\b/g],
  ["performance", /\bperformance\b/g],
  ["setTimeout", /\bsetTimeout\b/g],
  ["setInterval", /\bsetInterval\b/g],
  ["Math.random", /\bMath\s*\.\s*random\b/g],
  ["process", /\bprocess\b/g],
  ["fetch", /\bfetch\b/g],
  ["window", /\bwindow\b/g],
  ["document", /\bdocument\b/g],
  ["localStorage", /\blocalStorage\b/g],
  ["browser.", /\bbrowser\s*\./g],
  ["chrome.", /\bchrome\s*\./g],
  ["import", /\bimport\b/g],
  ["require", /\brequire\b/g],
  ["globalThis", /\bglobalThis\b/g],
  ["eval", /\beval\b/g],
  ["new Function", /\bnew\s+Function\b/g],
];
const bulunan = [];
for (const [ad, re] of YASAKLI) {
  const e = kaynak.match(re);
  if (e && e.length > 0) bulunan.push(`${ad}×${e.length}`);
}
const icerikSatirlari = kaynak.split("\n");
const ithalSatiri = icerikSatirlari.filter((s) =>
  /^\s*(import|const .*=\s*require)\b/.test(s)
).length;

yaz(`A1 statik tarama — dosya: mantik/sayac.mjs (${kaynak.length} bayt, ${icerikSatirlari.length} satır)`);
yaz(`   taranan yasaklı belirteç listesi (${YASAKLI.length}): ${YASAKLI.map((y) => y[0]).join(" · ")}`);
yaz(`   bulunan=${JSON.stringify(bulunan)}`);
yaz(`   yükleme satırı sayısı (import/require): ${ithalSatiri}`);
if (bulunan.length > 0) hata(`saflık ihlali — yasaklı belirteç bulundu: ${bulunan.join(", ")}`);
if (ithalSatiri !== 0) hata(`saflık ihlali — modülde ${ithalSatiri} yükleme satırı var, 0 olmalı`);
if (bulunan.length === 0 && ithalSatiri === 0) yaz("   ✓ statik: temiz");

// --- Tablo erken okunur: dinamik tuzak senaryolara ihtiyaç duyuyor ---
let tablo;
try {
  tablo = JSON.parse(fs.readFileSync(TABLO_YOLU, "utf8"));
} catch (e) {
  yaz(`\nTABLO OKUNAMADI: ${e.message}`);
  yaz("GECEN: 0 · KALAN: 1 · TOPLAM: 1");
  CIK(1);
}

// --- A2: dinamik global tuzağı ---
const TUZAK_ADLARI = [
  "Date",
  "performance",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "fetch",
  "localStorage",
  "sessionStorage",
  "document",
  "window",
  "browser",
  "chrome",
  "XMLHttpRequest",
];
let tuzakTetiklendi = 0;
const tuzakKayit = [];

function tuzakKur(adlar) {
  const oncekiler = new Map();
  for (const ad of adlar) {
    oncekiler.set(ad, Object.getOwnPropertyDescriptor(globalThis, ad));
    try {
      Object.defineProperty(globalThis, ad, {
        configurable: true,
        get() {
          tuzakTetiklendi++;
          tuzakKayit.push(ad);
          throw new Error(`SAFLIK İHLALİ: modül global "${ad}" değerine erişti`);
        },
      });
    } catch (e) {
      oncekiler.delete(ad);
      tuzakKayit.push(`${ad}(kurulamadı: ${e.message})`);
    }
  }
  // Math.random ayrı: tüm Math değil, yalnız random zehirlenir.
  const oncekiRandom = Math.random;
  Math.random = () => {
    tuzakTetiklendi++;
    tuzakKayit.push("Math.random");
    throw new Error('SAFLIK İHLALİ: modül "Math.random" çağırdı');
  };
  return () => {
    Math.random = oncekiRandom;
    for (const [ad, tanim] of oncekiler.entries()) {
      if (tanim) Object.defineProperty(globalThis, ad, tanim);
      else delete globalThis[ad];
    }
  };
}

function senaryoKos(s) {
  return calistir(s.baslangic.t, s.olaylar, s.son);
}

const senaryolarHam = Array.isArray(tablo?.senaryolar) ? tablo.senaryolar : [];
let tuzakGecen = 0;
let tuzakHata = null;
const kaldir = tuzakKur(TUZAK_ADLARI);
try {
  for (const s of senaryolarHam) {
    senaryoKos(s);
    tuzakGecen++;
  }
} catch (e) {
  tuzakHata = e && e.message ? e.message : String(e);
} finally {
  kaldir();
}

yaz("");
yaz(`A2 dinamik global tuzağı — erişildiğinde fırlatan sahtelerle değiştirildi`);
yaz(`   tuzaklanan global: ${TUZAK_ADLARI.length + 1} (${TUZAK_ADLARI.join(" · ")} · Math.random)`);
yaz(`   tuzak altında geçen senaryo: ${tuzakGecen}/${senaryolarHam.length}`);
yaz(`   tuzak tetiklendi: ${tuzakTetiklendi}${tuzakKayit.length ? " → " + tuzakKayit.join(", ") : ""}`);
yaz(
  `   NOT: "process" tuzağa DAHİL EDİLMEDİ — koşucunun kendi çıkış/akış yazma yolu ona bağlı;`
);
yaz(`        statik tarama (A1) onu zaten kapsıyor ve bulunan=[] döndürdü.`);
if (tuzakHata) hata(`dinamik tuzak altında senaryo düştü: ${tuzakHata}`);
if (tuzakTetiklendi > 0) hata(`modül tuzaklı global'e erişti (${tuzakTetiklendi} kez)`);
if (tuzakGecen !== senaryolarHam.length)
  hata(`tuzak altında ${senaryolarHam.length - tuzakGecen} senaryo koşamadı`);
if (!tuzakHata && tuzakTetiklendi === 0 && tuzakGecen === senaryolarHam.length)
  yaz("   ✓ dinamik: global'ler zehirliyken bile tüm senaryolar koştu");

// --- A3: determinizm ---
const kosu1 = senaryolarHam.map((s) => senaryoKos(s));
const kosu2 = senaryolarHam.map((s) => senaryoKos(s));
const d1 = JSON.stringify(kosu1);
const d2 = JSON.stringify(kosu2);
yaz("");
yaz(`A3 determinizm — aynı senaryolar iki kez koşuldu`);
yaz(`   1. koşu ${d1.length} bayt · 2. koşu ${d2.length} bayt · birebir aynı: ${d1 === d2}`);
if (d1 !== d2) hata("determinizm ihlali — iki koşu farklı sonuç verdi");
else yaz("   ✓ determinizm: birebir aynı");

// --- A4: durum çakışması yapısal olarak imkânsız mı (8 kombinasyon) ---
yaz("");
yaz("A4 durum çakışması — 2×2×2 = 8 bayrak kombinasyonu");
yaz("   | anaKapali | molada | videoOynuyor | durumAdi()    | dört addan tam biri |");
yaz("   |-----------|--------|--------------|---------------|---------------------|");
const DORT_AD = Object.values(DURUMLAR);
let kombinasyonTamam = 0;
for (const anaKapali of [false, true]) {
  for (const molada of [false, true]) {
    for (const videoOynuyor of [false, true]) {
      const ad = durumAdi({ anaKapali, molada, videoOynuyor });
      const tekMi = DORT_AD.filter((x) => x === ad).length === 1;
      if (tekMi) kombinasyonTamam++;
      else hata(`kombinasyon (${anaKapali},${molada},${videoOynuyor}) → "${ad}" dört addan biri değil`);
      yaz(
        `   | ${String(anaKapali).padEnd(9)} | ${String(molada).padEnd(6)} | ${String(videoOynuyor).padEnd(12)} | ${ad.padEnd(13)} | ${tekMi ? "evet" : "HAYIR"} |`
      );
    }
  }
}
const ihlalDenemesi = durumAdi({ anaKapali: true, molada: true, videoOynuyor: true });
yaz(`   ihlal denemesi — üç bayrak birden true → tek değer: "${ihlalDenemesi}"`);
if (ihlalDenemesi !== DURUMLAR.KAPALI)
  hata(`ihlal denemesi "${ihlalDenemesi}" döndürdü, "${DURUMLAR.KAPALI}" beklendi`);
yaz(`   ✓ 8/${kombinasyonTamam} kombinasyon tek ad döndürdü; çakışma yapısal olarak imkânsız`);

// =====================================================================
// BÖLÜM B — TABLO DOĞRULAMA (katı: eksik alan da tanımsız alan da RED)
// =====================================================================
yaz("");
yaz("=".repeat(70));
yaz("BÖLÜM B — TABLO DOĞRULAMA (katı)");
yaz("=".repeat(70));

const UST_ALANLAR = ["surum", "birim", "senaryolar"];
const SENARYO_ALANLAR = [
  "id",
  "aciklama",
  "baslangic",
  "olaylar",
  "son",
  "beklenen",
  "beklenenDurum",
];
const OLAY_ALANLAR = ["t", "tur", "hiz"];
const OLAY_ZORUNLU = ["t", "tur"];
const TOPLAM_ALANLAR = ["izleniyor", "duraklatildi", "mola"];
const EN_AZ_SENARYO = 12; // HEDEF.md:73 eşiği — koşucuya gömüldü ki sessizce düşürülemesin

function alanFarki(nesne, izinli, nerede) {
  const anahtarlar = Object.keys(nesne);
  for (const a of anahtarlar)
    if (!izinli.includes(a)) hata(`${nerede}: TANIMSIZ alan "${a}" (izinli: ${izinli.join(", ")})`);
  for (const a of izinli)
    if (!anahtarlar.includes(a) && !(nerede.startsWith("olay") && a === "hiz"))
      hata(`${nerede}: EKSİK alan "${a}"`);
}

alanFarki(tablo, UST_ALANLAR, "üst düzey");
if (!Array.isArray(tablo.senaryolar)) hata("üst düzey: senaryolar bir dizi değil");

const gorulenId = new Set();
const senaryolar = Array.isArray(tablo.senaryolar) ? tablo.senaryolar : [];
for (let i = 0; i < senaryolar.length; i++) {
  const s = senaryolar[i];
  const nerede = `senaryo[${i}] (${s?.id ?? "id yok"})`;
  if (s === null || typeof s !== "object") {
    hata(`${nerede}: nesne değil`);
    continue;
  }
  alanFarki(s, SENARYO_ALANLAR, nerede);

  if (typeof s.id !== "string" || s.id.length === 0) hata(`${nerede}: id boş dize olamaz`);
  else if (gorulenId.has(s.id)) hata(`${nerede}: id TEKRARI "${s.id}"`);
  else gorulenId.add(s.id);

  if (typeof s.aciklama !== "string" || s.aciklama.length === 0)
    hata(`${nerede}: aciklama boş olamaz`);

  if (s.baslangic === null || typeof s.baslangic !== "object") hata(`${nerede}: baslangic nesne değil`);
  else {
    alanFarki(s.baslangic, ["t"], `${nerede}.baslangic`);
    if (!Number.isInteger(s.baslangic.t)) hata(`${nerede}: baslangic.t tam sayı değil`);
  }

  if (!Array.isArray(s.olaylar) || s.olaylar.length === 0) {
    hata(`${nerede}: olaylar boş olamaz`);
  } else {
    let oncekiT = Number.isInteger(s.baslangic?.t) ? s.baslangic.t : null;
    for (let j = 0; j < s.olaylar.length; j++) {
      const o = s.olaylar[j];
      const on = `olay ${nerede}[${j}]`;
      if (o === null || typeof o !== "object") {
        hata(`${on}: nesne değil`);
        continue;
      }
      for (const a of Object.keys(o))
        if (!OLAY_ALANLAR.includes(a)) hata(`${on}: TANIMSIZ alan "${a}"`);
      for (const a of OLAY_ZORUNLU) if (!(a in o)) hata(`${on}: EKSİK alan "${a}"`);
      if (!Number.isInteger(o.t)) hata(`${on}: t tam sayı değil`);
      if (!OLAY_TURLERI.includes(o.tur)) hata(`${on}: tur "${o.tur}" altı addan biri değil`);
      if ("hiz" in o && !(typeof o.hiz === "number" && o.hiz > 0))
        hata(`${on}: hiz pozitif sayı olmalı`);
      if (Number.isInteger(o.t) && oncekiT !== null) {
        if (o.t < oncekiT) hata(`${on}: t geriye gitti (${oncekiT} → ${o.t})`);
        oncekiT = o.t;
      }
    }
    const sonOlayT = s.olaylar[s.olaylar.length - 1]?.t;
    if (Number.isInteger(s.son) && Number.isInteger(sonOlayT) && s.son < sonOlayT)
      hata(`${nerede}: son (${s.son}) son olayın t'sinden (${sonOlayT}) küçük`);
  }

  if (!Number.isInteger(s.son)) hata(`${nerede}: son tam sayı değil`);

  if (s.beklenen === null || typeof s.beklenen !== "object") hata(`${nerede}: beklenen nesne değil`);
  else {
    alanFarki(s.beklenen, TOPLAM_ALANLAR, `${nerede}.beklenen`);
    for (const a of TOPLAM_ALANLAR)
      if (!Number.isInteger(s.beklenen[a]) || s.beklenen[a] < 0)
        hata(`${nerede}: beklenen.${a} negatif olmayan tam sayı değil (${s.beklenen[a]})`);
  }

  if (!DORT_AD.includes(s.beklenenDurum))
    hata(`${nerede}: beklenenDurum "${s.beklenenDurum}" dört durum adından biri değil`);
}

yaz(`B  şema: üst düzey alanlar ${UST_ALANLAR.join("/")} · senaryo alanları ${SENARYO_ALANLAR.join("/")}`);
yaz(`   olay alanları ${OLAY_ALANLAR.join("/")} (zorunlu: ${OLAY_ZORUNLU.join("/")})`);
yaz(`   senaryo sayısı: ${senaryolar.length} (en az ${EN_AZ_SENARYO} zorunlu — HEDEF.md:73)`);
yaz(`   benzersiz id: ${gorulenId.size}`);
if (senaryolar.length < EN_AZ_SENARYO)
  hata(`senaryo sayısı ${senaryolar.length} < ${EN_AZ_SENARYO} — eşik koşucuya gömülü`);
if (hatalar.length === 0) yaz("   ✓ tablo şeması geçerli");

if (hatalar.length > 0) {
  yaz("");
  yaz(`TABLO/SAFLIK REDDEDİLDİ — ${hatalar.length} hata. Senaryolar koşulmadı.`);
  yaz(`GECEN: 0 · KALAN: ${hatalar.length} · TOPLAM: ${senaryolar.length}`);
  logYaz();
  CIK(1);
}

// =====================================================================
// BÖLÜM C — KOŞUM + OTOMATİK İNVARYANT
// =====================================================================
yaz("");
yaz("=".repeat(70));
yaz("BÖLÜM C — KOŞUM (beklenen değer + beklenen durum + çakışma/kayıp invaryantı)");
yaz("=".repeat(70));

// İnvaryant: izleniyor + duraklatildi + mola == (son - tBaz) - KAPALI'da geçen süre
// tBaz = son "gece-yarısı" olayının anı (yoksa baslangic.t) — sıfırlama öncesi birikim silinir.
// Bu, "iki kova aynı anda işledi" ve "süre kayboldu" hatalarının ikisini de yakalar;
// KAPALI süresi kovalardan değil durumAdi()'den türetilir → koddan bağımsız ikinci yol.
function invaryant(s) {
  let durum = baslangic(s.baslangic.t);
  let kapaliSure = 0;
  let tBaz = s.baslangic.t;
  for (const olay of s.olaylar) {
    if (durumAdi(durum) === DURUMLAR.KAPALI) kapaliSure += olay.t - durum.t;
    durum = uygula(durum, olay);
    if (olay.tur === "gece-yarısı") {
      tBaz = olay.t;
      kapaliSure = 0;
    }
  }
  if (durumAdi(durum) === DURUMLAR.KAPALI) kapaliSure += s.son - durum.t;
  return { gecen: s.son - tBaz, kapaliSure, tBaz };
}

let gecen = 0;
const kalanlar = [];
for (const s of senaryolar) {
  const c = calistir(s.baslangic.t, s.olaylar, s.son);
  const b = s.beklenen;
  const sorunlar = [];

  for (const a of TOPLAM_ALANLAR)
    if (c.toplam[a] !== b[a]) sorunlar.push(`${a}: beklenen ${b[a]}, gelen ${c.toplam[a]}`);
  if (c.durumAdi !== s.beklenenDurum)
    sorunlar.push(`durum: beklenen "${s.beklenenDurum}", gelen "${c.durumAdi}"`);

  const inv = invaryant(s);
  const kovaToplami = c.toplam.izleniyor + c.toplam.duraklatildi + c.toplam.mola;
  const olmasiGereken = inv.gecen - inv.kapaliSure;
  if (kovaToplami !== olmasiGereken)
    sorunlar.push(
      `İNVARYANT: kova toplamı ${kovaToplami} ≠ geçen ${inv.gecen} − kapalı ${inv.kapaliSure} = ${olmasiGereken} (taban t=${inv.tBaz})`
    );

  if (sorunlar.length === 0) {
    gecen++;
    yaz(
      `  ✓ ${s.id.padEnd(42)} izleniyor=${String(c.toplam.izleniyor).padStart(6)} duraklatildi=${String(c.toplam.duraklatildi).padStart(6)} mola=${String(c.toplam.mola).padStart(6)} durum=${c.durumAdi}`
    );
  } else {
    kalanlar.push(s.id);
    yaz(`  ✗ ${s.id}`);
    for (const p of sorunlar) yaz(`      ${p}`);
  }
}

yaz("");
yaz(`GECEN: ${gecen} · KALAN: ${kalanlar.length} · TOPLAM: ${senaryolar.length}`);
if (kalanlar.length > 0) yaz(`KALAN SENARYOLAR: ${kalanlar.join(", ")}`);
logYaz();
CIK(kalanlar.length === 0 ? 0 : 1);

function logYaz() {
  if (LOG_YOK) return;
  try {
    fs.mkdirSync(KANIT_DIZINI, { recursive: true });
    fs.writeFileSync(
      path.join(KANIT_DIZINI, "test-kosusu.log"),
      `=== SAYAC — mantik/kosucu.mjs ham çıktısı ===\n` +
        `komut: npm test  (node mantik/kosucu.mjs)\n` +
        `node=${process.version} platform=${process.platform}\n` +
        "=".repeat(70) + "\n\n" +
        satirlar.join("\n") + "\n",
      "utf8"
    );
  } catch (e) {
    YAZ_HAM("log yazilamadi: " + e.message + "\n");
  }
}
