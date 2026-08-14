// Y15 — sureBicim doğruluk tablosu. Tarayıcısız, saniyeler sürer.
//
// ÜRÜNÜN KENDİ BAYTLARI node:vm ile yüklenir: kopya değil, gerçek eklenti/bicim.js.
// Tablo koddan ÖNCE yazıldı (004 görev tanımı, Faz 1).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const KOK = path.dirname(fileURLToPath(import.meta.url));
const PROJE = path.resolve(KOK, "..");
const KANIT = path.join(KOK, "kanit");
const DOSYA = path.join(PROJE, "eklenti", "bicim.js");

const TABLO = [
  [0, "0:00:00"],
  [999, "0:00:00"],
  [1000, "0:00:01"],
  [59999, "0:00:59"],
  [60000, "0:01:00"],
  [3599999, "0:59:59"],
  [3600000, "1:00:00"],
  [86399000, "23:59:59"],
  [86400000, "24:00:00"],
  [-1, "0:00:00"],
  [NaN, "0:00:00"],
  [null, "0:00:00"],
  ["abc", "0:00:00"],
];

const satirlar = [];
const yaz = (s = "") => {
  satirlar.push(s);
  process.stdout.write(s + "\n");
};

const sonuc = { hucre: "Y15", durum: "ölçülemedi", sebep: "", satirlar: [], gecen: 0, kalan: 0 };

try {
  const kaynak = fs.readFileSync(DOSYA, "utf8");
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(kaynak, ctx, { filename: "eklenti/bicim.js" });
  const f = ctx.sureBicim;
  if (typeof f !== "function") throw new Error("sureBicim tanımlı değil (typeof " + typeof f + ")");

  yaz("=".repeat(66));
  yaz("Y15 — sureBicim doğruluk tablosu · kaynak: eklenti/bicim.js (" + kaynak.length + " bayt)");
  yaz("node:vm ile ÜRÜNÜN KENDİ baytları yüklendi — kopya değil");
  yaz("=".repeat(66));
  yaz("| girdi | beklenen | okunan | sonuç |");
  yaz("|---|---|---|---|");

  for (const [girdi, beklenen] of TABLO) {
    let okunan;
    try {
      okunan = f(girdi);
    } catch (e) {
      okunan = "İSTİSNA: " + (e && e.message ? e.message : String(e));
    }
    const gecti = okunan === beklenen;
    if (gecti) sonuc.gecen++;
    else sonuc.kalan++;
    const g = typeof girdi === "string" ? `"${girdi}"` : String(girdi);
    yaz(`| ${g} | ${beklenen} | ${okunan} | ${gecti ? "geçti" : "KALDI"} |`);
    sonuc.satirlar.push({ girdi: g, beklenen, okunan, gecti });
  }

  yaz("");
  yaz(`GECEN: ${sonuc.gecen} · KALAN: ${sonuc.kalan} · TOPLAM: ${TABLO.length}`);
  sonuc.durum = sonuc.kalan === 0 ? "YESIL" : "KIRMIZI";
  if (sonuc.kalan) sonuc.sebep = `${sonuc.kalan} satır tutmadı`;

  // Ürün sözleşmesi: bicim.js document/window'a DOKUNMAZ — vm'de koşması bunun kanıtı,
  // ayrıca kaynağı da tara (G22: yokluk ölçümü tek başına yetmez, ikisi birden).
  const yasakli = ["document", "window", "fetch", "localStorage", "browser.", "chrome."];
  // YORUMLAR AYIKLANIR: tarama düzyazıyı değil KODU ölçmeli. İlk koşumda bu satır
  // yoktu ve "bu dosya document'a dokunmaz" yorumunun kendisi ihlal sayıldı (G22:
  // yanlış soruyu soran kontrol). Ham sayı da basılır ki fark görünür kalsın.
  const kod = kaynak.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const bulunan = yasakli.filter((y) => kod.includes(y));
  const hamBulunan = yasakli.filter((y) => kaynak.includes(y));
  yaz(`saflık taraması ${JSON.stringify(yasakli)}`);
  yaz(`   kodda (yorumlar ayıklanmış) bulunan=${JSON.stringify(bulunan)}`);
  yaz(`   ham dosyada bulunan=${JSON.stringify(hamBulunan)} ← yorum metni; ihlal değil`);
  sonuc.saflik = { yasakli, bulunan, hamBulunan };
  if (bulunan.length) {
    sonuc.durum = "KIRMIZI";
    sonuc.sebep = (sonuc.sebep ? sonuc.sebep + "; " : "") + `saflık ihlali: ${bulunan.join(", ")}`;
  }
} catch (e) {
  sonuc.sebep = e && e.message ? e.message : String(e);
  yaz("HATA: " + sonuc.sebep);
} finally {
  fs.mkdirSync(KANIT, { recursive: true });
  fs.writeFileSync(path.join(KANIT, "eklenti-Y15.json"), JSON.stringify(sonuc, null, 2), "utf8");
  yaz(`SONUC ${sonuc.durum}${sonuc.sebep ? " — " + sonuc.sebep : ""}`);
  process.exit(sonuc.durum === "YESIL" ? 0 : 1);
}
