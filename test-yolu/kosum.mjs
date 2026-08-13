// Matris koşucusu: her hücre AYRI çocuk süreçte koşar.
// Çocuk kendi 120 sn sert sayacını tutar; ebeveyn 180 sn'de süreç AĞACINI öldürür (G23/G24).
// Ham çıktı Node ile UTF-8 olarak kanit/*.log'a yazılır (PowerShell `>` UTF-16LE üretir).
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KOK = path.dirname(fileURLToPath(import.meta.url));
const KANIT = path.join(KOK, "kanit");
const EBEVEYN_SURE_MS = 180000;

const ADAYLAR = process.argv[2] ? [process.argv[2]] : ["a", "b", "c", "d"];
const MANIFESTLER = process.argv[3] ? [process.argv[3]] : ["mv2", "mv3"];

fs.mkdirSync(KANIT, { recursive: true });

async function hucre(aday, manifest) {
  const betik = path.join(KOK, `aday-${aday}.mjs`);
  if (!fs.existsSync(betik)) return null;
  const logYolu = path.join(KANIT, `aday-${aday}-${manifest}.log`);
  const jsonYolu = path.join(KANIT, `aday-${aday}-${manifest}.json`);
  try {
    fs.unlinkSync(jsonYolu);
  } catch {}

  const parcalar = [];
  const basla = Date.now();
  const cocuk = spawn(process.execPath, [betik, manifest], {
    cwd: path.resolve(KOK, ".."),
    stdio: ["ignore", "pipe", "pipe"],
  });
  cocuk.stdout.on("data", (b) => parcalar.push(b));
  cocuk.stderr.on("data", (b) => parcalar.push(b));

  let oldurdu = false;
  const sayac = setTimeout(() => {
    oldurdu = true;
    // Windows'ta süreç AĞACINI öldür — artık firefox kalmasın.
    try {
      spawn("taskkill", ["/PID", String(cocuk.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } catch {}
    cocuk.kill("SIGKILL");
  }, EBEVEYN_SURE_MS);

  const cikis = await new Promise((r) => {
    cocuk.on("close", (kod, sinyal) => {
      clearTimeout(sayac);
      r({ kod, sinyal });
    });
  });

  const sure = Date.now() - basla;
  const ham = Buffer.concat(parcalar).toString("utf8");
  const baslik =
    `=== SAYAC — Firefox eklenti test yolu olcumu ===\n` +
    `aday=${aday} manifest=${manifest}\n` +
    `komut: "${process.execPath}" "${betik}" ${manifest}\n` +
    `node=${process.version} platform=${process.platform}\n` +
    `sure=${sure} ms · cikis kodu=${cikis.kod} · sinyal=${cikis.sinyal}` +
    (oldurdu ? ` · EBEVEYN SERT SAYACI (${EBEVEYN_SURE_MS} ms) AGACI OLDURDU` : "") +
    `\n${"=".repeat(60)}\n\n`;
  fs.writeFileSync(logYolu, baslik + ham, "utf8");

  let sonuc;
  if (fs.existsSync(jsonYolu)) {
    sonuc = JSON.parse(fs.readFileSync(jsonYolu, "utf8"));
  } else {
    sonuc = {
      aday,
      manifest,
      kutu1: "ölçülemedi",
      kutu2: "ölçülemedi",
      kutu3: "ölçülemedi",
      hata: oldurdu
        ? `sureç ${EBEVEYN_SURE_MS} ms'de öldürüldü, sonuç dosyası yazılamadı`
        : `sonuç dosyası yok (çıkış kodu ${cikis.kod})`,
    };
  }
  sonuc.cikisKodu = cikis.kod;
  sonuc.ebeveynSure = sure;
  sonuc.log = path.relative(path.resolve(KOK, ".."), logYolu).replace(/\\/g, "/");
  return sonuc;
}

const rapor = [];
for (const aday of ADAYLAR) {
  for (const manifest of MANIFESTLER) {
    process.stdout.write(`\n>>> KOSU aday=${aday} manifest=${manifest}\n`);
    const s = await hucre(aday, manifest);
    if (!s) {
      process.stdout.write(`    (aday-${aday}.mjs yok, atlandi)\n`);
      continue;
    }
    rapor.push(s);
    process.stdout.write(
      `    kutu1=${s.kutu1} kutu2=${s.kutu2} kutu3=${s.kutu3} uretim=${s.uretim || "-"} (${s.ebeveynSure} ms)\n`
    );
  }
}

fs.writeFileSync(
  path.join(KANIT, "rapor.json"),
  JSON.stringify(rapor, null, 2),
  "utf8"
);

process.stdout.write("\n=== TABLO ===\n");
process.stdout.write(
  "| aday | manifest | yuklendi mi | eklenti baglandi mi | bir olay okunabildi mi | kanit |\n"
);
for (const s of rapor) {
  process.stdout.write(
    `| ${s.aday} | ${s.manifest} | ${s.kutu1} | ${s.kutu2} | ${s.kutu3} | ${s.log} |\n`
  );
}
