// Y10 — LibreWolf denemesi. Aday A (playwright-webextext) BURADA UYGULANAMAZ:
// Playwright'ın Firefox'u Juggler protokollü YAMALI bir yapıdır, stok bir Gecko ikilisi
// o yolla sürülemez (TEST_YOLU.md:289-290). Bu yüzden YEDEK yol kullanılır:
// Mozilla web-ext Node API'si + firefox:"<librewolf yolu>".
//
// Playwright eli YOKTUR → sayfa "otomatik kip"te kendi kendini sürer, kanıt sondanın
// aynı kökene attığı işaretlerden okunur (kanal ②).
//
// SINIRLAR: sistem geneline kurulum YOK (.msi/.exe kurucu, PATH, kayıt defteri yok).
// Taşınabilir zip os.tmpdir() altına açılır. Tek deneme, indirmeye 5 dakika (G24).
// Başarısızsa kutu "ölçülemedi" + sebep yazılır ve tur DURMAZ.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import webExt from "web-ext";
import { sunucuBaslat } from "./ortak/sunucu-eklenti.mjs";
import { testKopyasiHazirla } from "./ortak/eklenti-testi.mjs";
import { gecici, sil } from "./ortak/eklenti-hazirla.mjs";
import { KANIT, bekle, hataMetni, TOLERANS_MS } from "./ortak/hucre.mjs";

// Adres koşum anında resmî dağıtım sayfasından alındı (librewolf.net/installation/windows/).
const LW_SURUM = "153.0.4-1";
const LW_URL = `https://dl.librewolf.net/librewolf/${LW_SURUM}/librewolf-${LW_SURUM}-windows-x86_64-portable.zip`;
const INDIRME_BUTCE_MS = 300000; // 5 dk — G24
const SERT_SURE_MS = 480000;

const satirlar = [];
const t0 = Date.now();
function yaz(s = "") {
  const l = `[+${String(Date.now() - t0).padStart(6, "0")}ms] ${s}`;
  satirlar.push(l);
  process.stdout.write(l + "\n");
}

const sonuc = {
  hucre: "Y10",
  durum: "ölçülemedi",
  sebep: "",
  yol: "Aday B — Mozilla web-ext RDP (Aday A uygulanamaz: Playwright'ın Firefox'u yamalı)",
  surum: LW_SURUM,
  url: LW_URL,
  ikili: "",
  adim: "",
  olcum: null,
};

let indirmeDizin = null;
let eklentiDizin = null;
let lwProfil = null;
let sunucu = null;
let runner = null;
let bitti = false;

const zamanAsimi = new Promise((_, red) =>
  setTimeout(() => { if (!bitti) red(new Error(`SERT SAYAC: ${SERT_SURE_MS} ms doldu`)); }, SERT_SURE_MS)
);

async function indir() {
  sonuc.adim = "indirme";
  indirmeDizin = await gecici("librewolf");
  // Önbellek: aynı zip'i tekrar indirmemek için os.tmpdir() altında sabit yol.
  // Sistem geneline kurulum DEĞİL — yalnız geçici dosya.
  const onbellekDizin = path.join(os.tmpdir(), "sayac-librewolf-onbellek");
  fs.mkdirSync(onbellekDizin, { recursive: true });
  const zip = path.join(onbellekDizin, `librewolf-${LW_SURUM}-x86_64-portable.zip`);
  if (fs.existsSync(zip) && fs.statSync(zip).size > 100 * 1024 * 1024) {
    yaz(`onbellekten kullaniliyor: ${zip} (${fs.statSync(zip).size} bayt)`);
  } else {
    yaz(`indiriliyor (tek deneme, ${INDIRME_BUTCE_MS} ms butce): ${LW_URL}`);
    const y = await fetch(LW_URL, { signal: AbortSignal.timeout(INDIRME_BUTCE_MS), redirect: "follow" });
    yaz(`HTTP ${y.status} ${y.statusText} · content-length=${y.headers.get("content-length")}`);
    if (!y.ok) throw new Error(`indirme HTTP ${y.status} ${y.statusText}`);
    const buf = Buffer.from(await y.arrayBuffer());
    await fsp.writeFile(zip, buf);
    yaz(`indirildi: ${zip} (${buf.length} bayt)`);
  }

  sonuc.adim = "acma";
  // Windows 10+ yerleşik bsdtar zip açar. Sistem geneline kurulum YOK.
  const t = spawnSync("tar", ["-xf", zip, "-C", indirmeDizin], { encoding: "utf8", windowsHide: true, timeout: 120000 });
  if (t.status !== 0) throw new Error(`zip acilamadi: tar cikis=${t.status} ${t.stderr || ""}`);
  const bulunan = [];
  (function tara(d, derinlik) {
    if (derinlik > 4) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) tara(p, derinlik + 1);
      else if (e.name.toLowerCase() === "librewolf.exe") bulunan.push(p);
    }
  })(indirmeDizin, 0);
  if (!bulunan.length) throw new Error("acilan arsivde librewolf.exe bulunamadi");
  sonuc.ikili = bulunan[0];
  yaz(`ikili bulundu: ${sonuc.ikili} (${fs.statSync(bulunan[0]).size} bayt)`);

  // TEŞHİS + SERTLEŞTİRME AŞMA: LibreWolf uzak hata ayıklayıcıyı KAPALI gönderir
  // (sertleştirme). web-ext RDP'ye bağlanamazsa ECONNREFUSED gelir — ilk koşuda tam
  // olarak bu oldu. LibreWolf'un kendi belgelenmiş geçersiz kılma dosyası kullanılır.
  const kurulum = path.dirname(bulunan[0]);
  yaz(`kurulum dizini: ${kurulum}`);
  yaz(`kurulum icerigi (ust duzey): ${JSON.stringify(fs.readdirSync(kurulum).slice(0, 40))}`);
  const dagitim = path.join(kurulum, "distribution");
  if (fs.existsSync(dagitim)) {
    yaz(`distribution/: ${JSON.stringify(fs.readdirSync(dagitim))}`);
    const pol = path.join(dagitim, "policies.json");
    if (fs.existsSync(pol)) {
      const metin = fs.readFileSync(pol, "utf8");
      yaz(`policies.json (${metin.length} bayt): ${metin.slice(0, 600)}`);
      sonuc.policies = metin.slice(0, 2000);
    }
  }
  const cfgVar = fs.readdirSync(kurulum).filter((f) => f.endsWith(".cfg"));
  yaz(`kurulumda .cfg dosyalari: ${JSON.stringify(cfgVar)}`);

  // ⚠️ librewolf.overrides.cfg PROFIL dizininden okunur, kurulum dizininden DEGIL
  // (librewolf.cfg:759-763 → "Moved to patches/profile-directory.patch"). Ilk deneme
  // kurulum dizinine yazdigi icin yok sayildi. Dosya artik profile yaziliyor (asagida).
  //
  // Ikinci sertlestirme katmani: distribution/policies.json → "HttpsOnlyMode": "enabled"
  // http://127.0.0.1 adresini https'e yukseltir ve olcum sunucusuna ulasilamaz.
  // GECICI kopyadaki policies.json yamalanir; sistem geneline dokunulmaz.
  const pol = path.join(dagitim, "policies.json");
  if (fs.existsSync(pol)) {
    const p = JSON.parse(fs.readFileSync(pol, "utf8"));
    const oncekiHttps = p.policies.HttpsOnlyMode;
    p.policies.HttpsOnlyMode = "disabled";
    delete p.policies.WebsiteFilter;
    if (p.policies.LocalNetworkAccess) p.policies.LocalNetworkAccess.EnablePrompting = false;
    await fsp.writeFile(pol, JSON.stringify(p, null, 2), "utf8");
    yaz(`policies.json yamalandi (gecici kopya): HttpsOnlyMode "${oncekiHttps}" → "disabled" · WebsiteFilter silindi · LocalNetworkAccess.EnablePrompting=false`);
    sonuc.policyYamasi = { HttpsOnlyMode: `${oncekiHttps} → disabled`, WebsiteFilter: "silindi" };
  }
  return bulunan[0];
}

async function profilHazirla() {
  const profil = await gecici("librewolf-profil");
  const override = path.join(profil, "librewolf.overrides.cfg");
  await fsp.writeFile(
    override,
    "// Sayac test kosusu — GECICI profile yazildi, sistem geneline DOKUNULMADI.\n" +
      "// LibreWolf sertlestirmesi RDP'yi kapatir (librewolf.cfg:547).\n" +
      'pref("devtools.debugger.remote-enabled", true);\n' +
      'pref("devtools.debugger.prompt-connection", false);\n' +
      'pref("devtools.chrome.enabled", true);\n' +
      'pref("xpinstall.signatures.required", false);\n' +
      'pref("dom.security.https_only_mode", false);\n' +
      'pref("dom.security.https_only_mode_pbm", false);\n' +
      'pref("media.autoplay.default", 0);\n',
    "utf8"
  );
  yaz(`librewolf.overrides.cfg PROFILE yazildi: ${override}`);
  sonuc.overrideYazildi = override;
  return profil;
}

function olc(kayitlar) {
  // Playwright eli yok → kanıt sondanın işaretlerinden okunur.
  // Ardışık ve AYNI durumdaki iki işaret arasında ilgili kova Δan kadar ilerlemeli.
  const s = kayitlar
    .filter((k) => k.an && k.durum)
    .map((k) => ({
      an: Number(k.an), durum: k.durum, sekme: k.sekme,
      izleniyor: Number(k.izleniyor), duraklatildi: Number(k.duraklatildi), mola: Number(k.mola),
    }))
    .sort((a, b) => a.an - b.an);
  const kova = { "İZLENİYOR": "izleniyor", "DURAKLATILDI": "duraklatildi", "MOLA": "mola" };
  let gecen = 0, kalan = 0;
  const ornekler = [];
  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1], b = s[i];
    if (a.durum !== b.durum || a.sekme !== b.sekme) continue;
    const dAn = b.an - a.an;
    if (dAn <= 0) continue;
    const k = kova[a.durum];
    if (!k) continue;
    const d = { izleniyor: b.izleniyor - a.izleniyor, duraklatildi: b.duraklatildi - a.duraklatildi, mola: b.mola - a.mola };
    const dogru = Math.abs(d[k] - dAn) <= TOLERANS_MS &&
      Object.keys(d).every((x) => x === k || d[x] === 0);
    if (dogru) gecen++; else kalan++;
    if (ornekler.length < 6) ornekler.push({ durum: a.durum, dAn, d, dogru });
  }
  const durumlar = [...new Set(s.map((x) => x.durum))];
  return { isaretSayisi: s.length, gecen, kalan, durumlar, ornekler, sonToplam: s.length ? { izleniyor: s[s.length - 1].izleniyor, duraklatildi: s[s.length - 1].duraklatildi, mola: s[s.length - 1].mola } : null };
}

try {
  yaz("Y10 — LibreWolf (tasinabilir) uzerinde eklenti yukleme denemesi");
  yaz("YOL: Aday B (web-ext Node API). Aday A uygulanamaz — Playwright'in Firefox'u yamali.");
  await Promise.race([
    (async () => {
      const ikili = await indir();

      sonuc.adim = "sunucu + test kopyasi";
      sunucu = await sunucuBaslat(yaz);
      const hz = await testKopyasiHazirla({ port: sunucu.port, etiket: "Y10", aralikMs: 250, yaz });
      eklentiDizin = hz.dizin;

      sonuc.adim = "web-ext ile yukleme";
      const url = sunucu.url + "?otomatik=1";
      yaz(`web-ext ile aciliyor · startUrl=${url}`);
      lwProfil = await profilHazirla();
      runner = await webExt.cmd.run(
        {
          firefox: ikili,
          sourceDir: eklentiDizin,
          // Profil BIZIM: overrides.cfg'nin okunabilmesi icin dogrudan kullanilmali.
          firefoxProfile: lwProfil,
          profileCreateIfMissing: true,
          keepProfileChanges: true,
          noReload: true,
          noInput: true,
          startUrl: [url],
          args: ["--headless"],
          pref: {
            "media.autoplay.default": 0,
            "xpinstall.signatures.required": false,
            // LibreWolf sertlestirmesi: RDP kapali gelir. Profil prefleri + .cfg birlikte.
            "devtools.debugger.remote-enabled": true,
            "devtools.debugger.prompt-connection": false,
          },
        },
        { shouldExitProgram: false }
      );
      const alt = runner.extensionRunners || [];
      const eslesme = [];
      for (const r of alt) {
        if (r.reloadableExtensions) {
          for (const [kaynak, addonId] of r.reloadableExtensions.entries()) eslesme.push(`${r.getName()} → addonId=${addonId} (${kaynak})`);
        }
      }
      yaz(`EKLENTI YUKLENDI — cmd.run cozuldu: ${runner.constructor.name}; RDP: ${eslesme.join(" | ") || "(addonId yok)"}`);
      sonuc.yuklemeKanit = eslesme.join(" | ");
      if (!eslesme.length) throw new Error("web-ext addonId dondurmedi — eklenti yuklenmedi");

      sonuc.adim = "olcum";
      // Otomatik kip zaman cizelgesi: 0 oynat · 2500 duraklat · 5000 oynat · 7500 dur.
      const bitisSuresi = Date.now() + 30000;
      while (Date.now() < bitisSuresi) {
        if (sunucu.olaylar.filter((o) => o.an).length > 40) break;
        await bekle(500);
      }
      const kayitlar = sunucu.olaylar.filter((o) => o.an);
      yaz(`sondadan gelen isaret sayisi: ${kayitlar.length}`);
      if (!kayitlar.length) throw new Error("sondadan hic isaret gelmedi (sifir bayt) — icerik betigi enjekte olmadi");
      const o = olc(kayitlar);
      sonuc.olcum = o;
      yaz(`OLCUM: isaret=${o.isaretSayisi} · gorulen durumlar=${JSON.stringify(o.durumlar)} · gecen cift=${o.gecen} · kalan cift=${o.kalan}`);
      yaz(`son toplam: ${JSON.stringify(o.sonToplam)}`);
      for (const e of o.ornekler) yaz(`   ornek: durum=${e.durum} Δan=${e.dAn} Δ=${JSON.stringify(e.d)} → ${e.dogru ? "TAMAM" : "SAPMA"}`);
      sonuc.durum = o.gecen > 0 && o.kalan === 0 && o.durumlar.length >= 2 ? "YESIL" : "KIRMIZI";
      if (sonuc.durum === "KIRMIZI") sonuc.sebep = `gecen=${o.gecen} kalan=${o.kalan} durumlar=${JSON.stringify(o.durumlar)}`;
      sonuc.adim = "bitti";
    })(),
    zamanAsimi,
  ]);
} catch (e) {
  sonuc.sebep = `[adim: ${sonuc.adim}] ${hataMetni(e)}`;
  sonuc.durum = "ölçülemedi";
  yaz("DUSTU — BIREBIR HATA: " + sonuc.sebep);
} finally {
  bitti = true;
  if (runner) await runner.exit().catch((e) => yaz("runner.exit: " + hataMetni(e)));
  if (sunucu) await sunucu.kapat().catch(() => {});
  if (eklentiDizin) await sil(eklentiDizin);
  if (lwProfil) await sil(lwProfil);
  if (indirmeDizin) await sil(indirmeDizin);
  if (sonuc.durum === "ölçülemedi") {
    yaz("");
    yaz("KUTU OLCULEMEDI — sebep yukarida. Secilen yolun LibreWolf'a uygulanmasi:");
    yaz("  · Aday A (playwright-webextext) UYGULANAMAZ — Playwright'in Firefox'u Juggler");
    yaz("    protokollu yamali bir yapidir; stok Gecko ikilisi o yolla surulemez.");
    yaz("  · Aday B (web-ext Node API) UYGULANABILIR — firefox:'<librewolf yolu>' ile");
    yaz("    herhangi bir Gecko ikilisine yonlenir (TEST_YOLU.md:126-128).");
    yaz("  'Kurulabilir' iddiasi KANITSIZ YAZILMAZ (HEDEF.md:146-147).");
  }
  fs.mkdirSync(KANIT, { recursive: true });
  fs.writeFileSync(path.join(KANIT, "eklenti-Y10.json"), JSON.stringify(sonuc, null, 2), "utf8");
  yaz(`SONUC ${sonuc.durum}${sonuc.sebep ? " — " + sonuc.sebep : ""}`);
  setTimeout(() => process.exit(0), 300).unref(); // Y10 cikis kodunu ETKILEMEZ
}
