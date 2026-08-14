// Y10 — LibreWolf'a kurulabilirlik. BEŞ ADIM, her biri ayrı "deneme" olarak kaydedilir.
//
// ⚠️ EMNİYET (005 kritik yasak 1): Mustafa'nın LibreWolf'u AÇIK olabilir ve o onun
// tarayıcısıdır. Bu dosya LibreWolf başlatan HER çağrıda üç şartı birden uygular:
//   ① TAŞINABİLİR geçici kopya ikilisi (C:\Program Files\LibreWolf\ DEĞİL)
//   ② -no-remote bayrağı VE MOZ_NO_REMOTE=1 ortam değişkeni
//   ③ kendi tek kullanımlık -profile dizini
// Başlatmadan önce ve bittikten sonra kurulu LibreWolf PID kümesi ölçülür.
//
// ⚠️ RDP: `web-ext` RDP yolu BU TURDA HİÇ DENENMEZ (ECONNREFUSED sayacı 4/5,
// HEDEF.md:156). A1 bilerek RDP'ye VARMADAN kesilir — düz Playwright kullanılır ve
// playwright-webextext'in installAddons'ı (RDP oradadır) hiç çağrılmaz.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { firefox } from "playwright";
import webExt from "web-ext";
import { sunucuBaslat } from "./ortak/sunucu-eklenti.mjs";
import { testKopyasiHazirla } from "./ortak/eklenti-testi.mjs";
import { gecici, sil } from "./ortak/eklenti-hazirla.mjs";
import { KANIT, bekle, hataMetni, TOLERANS_MS } from "./ortak/hucre.mjs";
import { OLCULEMEDI } from "./ortak/durum.mjs";

const LW_SURUM = "153.0.4-1";
const LW_URL = `https://dl.librewolf.net/librewolf/${LW_SURUM}/librewolf-${LW_SURUM}-windows-x86_64-portable.zip`;
const INDIRME_BUTCE_MS = 300000;
const SERT_SURE_MS = 520000; // eklenti-kosum.mjs:26 → 540000 ms icinde kalir
const GECKO_ID = "sayac@sayac.local"; // eklenti/manifest.json:8'den OLCULDU
const KURULU_LW = "C:\\Program Files\\LibreWolf";

const satirlar = [];
const t0 = Date.now();
function yaz(s = "") {
  const l = `[+${String(Date.now() - t0).padStart(6, "0")}ms] ${s}`;
  satirlar.push(l);
  process.stdout.write(l + "\n");
}

const sonuc = {
  hucre: "Y10",
  durum: OLCULEMEDI,
  sebep: "",
  surum: LW_SURUM,
  url: LW_URL,
  ikili: "",
  denemeler: [],
  artefakt: {},
  kuruluPidOnce: [],
  kuruluPidSonra: [],
};

function kuruluPidler() {
  try {
    const c = spawnSync(
      "powershell",
      ["-NoProfile", "-Command",
       `Get-CimInstance Win32_Process -Filter "Name='librewolf.exe'" | Where-Object { $_.ExecutablePath -like '${KURULU_LW}\\*' } | Select-Object -ExpandProperty ProcessId`],
      { encoding: "utf8", timeout: 30000, windowsHide: true }
    );
    return String(c.stdout || "").trim().split(/\s+/).filter(Boolean).map(Number).sort((a, b) => a - b);
  } catch {
    return ["olculemedi"];
  }
}

function ekle(d) {
  sonuc.denemeler.push(d);
  yaz(`── DENEME ${d.yol} · adim=${d.adim}`);
  if (d.komut) yaz(`   komut: ${d.komut}`);
  yaz(`   sonuc: ${d.sonuc}`);
  if (d.birebirHata) yaz(`   BIREBIR HATA: ${d.birebirHata}`);
}

// ── Y10-0: hazırlık ve ARTEFAKT OKUMASI (ölçüm, iddia değil) ──────────────────
let indirmeDizin = null;
async function hazirla() {
  indirmeDizin = await gecici("librewolf");
  const onbellekDizin = path.join(os.tmpdir(), "sayac-librewolf-onbellek");
  fs.mkdirSync(onbellekDizin, { recursive: true });
  const zip = path.join(onbellekDizin, `librewolf-${LW_SURUM}-x86_64-portable.zip`);
  if (fs.existsSync(zip) && fs.statSync(zip).size > 100 * 1024 * 1024) {
    yaz(`onbellekten kullaniliyor: ${zip} (${fs.statSync(zip).size} bayt)`);
  } else {
    yaz(`indiriliyor (tek deneme, ${INDIRME_BUTCE_MS} ms butce): ${LW_URL}`);
    const y = await fetch(LW_URL, { signal: AbortSignal.timeout(INDIRME_BUTCE_MS), redirect: "follow" });
    if (!y.ok) throw new Error(`indirme HTTP ${y.status} ${y.statusText}`);
    await fsp.writeFile(zip, Buffer.from(await y.arrayBuffer()));
    yaz(`indirildi: ${zip} (${fs.statSync(zip).size} bayt)`);
  }
  const t = spawnSync("tar", ["-xf", zip, "-C", indirmeDizin], { encoding: "utf8", windowsHide: true, timeout: 180000 });
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
  yaz(`TASINABILIR ikili: ${sonuc.ikili} (${fs.statSync(bulunan[0]).size} bayt)`);

  // ARTEFAKTTAN OKU — hangi yolun mümkün olduğu tahmine değil ÖLÇÜME bağlanır (G11).
  const kurulum = path.dirname(bulunan[0]);
  const cfgYolu = path.join(kurulum, "librewolf.cfg");
  if (fs.existsSync(cfgYolu)) {
    const satir = fs.readFileSync(cfgYolu, "utf8").split("\n");
    const imza = satir.filter((l) => l.includes("xpinstall.signatures.required")).map((l) => l.trim());
    const ekl = satir.filter((l) => /^\s*(default)?[Pp]ref\("extensions\./.test(l)).map((l) => l.trim());
    sonuc.artefakt.imzaSatirlari = imza;
    sonuc.artefakt.extensionsSatirlari = ekl;
    yaz(`librewolf.cfg → xpinstall.signatures.required satirlari (${imza.length}):`);
    for (const l of imza) yaz(`   ${l}`);
    yaz(`librewolf.cfg → extensions.* satirlari (${ekl.length}):`);
    for (const l of ekl.slice(0, 12)) yaz(`   ${l}`);
  } else {
    sonuc.artefakt.imzaSatirlari = ["librewolf.cfg YOK"];
  }
  const polYolu = path.join(kurulum, "distribution", "policies.json");
  if (fs.existsSync(polYolu)) {
    sonuc.artefakt.policiesUzunluk = fs.statSync(polYolu).size;
    const p = JSON.parse(fs.readFileSync(polYolu, "utf8"));
    sonuc.artefakt.policyAnahtarlari = Object.keys(p.policies || {});
    yaz(`policies.json (${sonuc.artefakt.policiesUzunluk} bayt) anahtarlari: ${sonuc.artefakt.policyAnahtarlari.join(", ")}`);
  }
  return { ikili: bulunan[0], kurulum };
}

async function profilKur(etiket) {
  const profil = await gecici(`lw-profil-${etiket}`);
  const prefler = [
    'user_pref("xpinstall.signatures.required", false);',
    'user_pref("extensions.autoDisableScopes", 0);',
    'user_pref("extensions.enabledScopes", 15);',
    'user_pref("extensions.startupScanScopes", 15);',
    'user_pref("dom.security.https_only_mode", false);',
    'user_pref("dom.security.https_only_mode_pbm", false);',
    'user_pref("media.autoplay.default", 0);',
    'user_pref("browser.shell.checkDefaultBrowser", false);',
    'user_pref("browser.startup.homepage_override.mstone", "ignore");',
  ].join("\n");
  await fsp.writeFile(path.join(profil, "user.js"), prefler + "\n", "utf8");
  // Override PROFIL dizininden okunur — 004'te olculdu (EKLENTI.md:299).
  await fsp.writeFile(
    path.join(profil, "librewolf.overrides.cfg"),
    'pref("xpinstall.signatures.required", false);\n' +
      'pref("extensions.autoDisableScopes", 0);\n' +
      'pref("extensions.enabledScopes", 15);\n' +
      'pref("extensions.startupScanScopes", 15);\n' +
      'pref("dom.security.https_only_mode", false);\n' +
      'pref("media.autoplay.default", 0);\n',
    "utf8"
  );
  return profil;
}

function policyYamala(kurulum, ek) {
  const polYolu = path.join(kurulum, "distribution", "policies.json");
  if (!fs.existsSync(polYolu)) return "policies.json yok";
  const p = JSON.parse(fs.readFileSync(polYolu, "utf8"));
  const onceki = p.policies.HttpsOnlyMode;
  p.policies.HttpsOnlyMode = "disabled";
  delete p.policies.WebsiteFilter;
  if (p.policies.LocalNetworkAccess) p.policies.LocalNetworkAccess.EnablePrompting = false;
  if (ek) Object.assign(p.policies, ek);
  fs.writeFileSync(polYolu, JSON.stringify(p, null, 2), "utf8");
  return `HttpsOnlyMode "${onceki}" → "disabled" · WebsiteFilter silindi${ek ? " · ExtensionSettings eklendi" : ""}`;
}

function extensionsJsonOku(profil) {
  const y = path.join(profil, "extensions.json");
  if (!fs.existsSync(y)) return { yol: y, var: false, not: "extensions.json hic yazilmadi" };
  try {
    const ej = JSON.parse(fs.readFileSync(y, "utf8"));
    const hepsi = ej.addons || [];
    const k = hepsi.find((a) => a.id === GECKO_ID);
    if (k) {
      return {
        yol: y, var: true, bulundu: true,
        kayit: { id: k.id, active: k.active, location: k.location, signedState: k.signedState, appDisabled: k.appDisabled, userDisabled: k.userDisabled, type: k.type },
      };
    }
    return { yol: y, var: true, bulundu: false, idListesi: hepsi.map((a) => a.id) };
  } catch (e) {
    return { yol: y, var: true, hata: hataMetni(e) };
  }
}

/** BAŞLAT → YOKLA → ÖLDÜR (G24). Emniyet: -no-remote + MOZ_NO_REMOTE=1 + kendi profil. */
async function lwBaslatYoklaOldur({ ikili, profil, url, sunucu, sureMs = 60000 }) {
  const argv = ["-no-remote", "-profile", profil, "-headless", url];
  const komut = `"${ikili}" ${argv.join(" ")}   (env MOZ_NO_REMOTE=1)`;
  yaz(`BASLAT: ${komut}`);
  const c = spawn(ikili, argv, {
    env: { ...process.env, MOZ_NO_REMOTE: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const cikti = [];
  c.stdout.on("data", (b) => cikti.push(b));
  c.stderr.on("data", (b) => cikti.push(b));
  // ⚠️ Isaret sayimi BU BASLATMADAN ITIBAREN yapilir. Kumulatif saymak, onceki adimin
  // isaretleriyle esigi hemen doldurup tarayiciyi ~1 sn'de oldururdu (005'te olculdu:
  // Faz 4 ilk kosumda boyle gecersiz sayildi).
  const taban = sunucu.olaylar.filter((o) => o.an).length;
  const bitis = Date.now() + sureMs;
  let isaret = 0;
  while (Date.now() < bitis) {
    isaret = sunucu.olaylar.filter((o) => o.an).length - taban;
    if (isaret > 12) break;
    await bekle(1000);
  }
  yaz(`YOKLA: ${sureMs} ms icinde BU BASLATMADAN gelen isaret sayisi = ${isaret} (taban ${taban})`);
  try {
    spawnSync("taskkill", ["/PID", String(c.pid), "/T", "/F"], { windowsHide: true, timeout: 20000 });
  } catch {}
  c.kill("SIGKILL");
  await bekle(800);
  return { komut, isaret, cikti: Buffer.concat(cikti).toString("utf8").slice(0, 1500) };
}

/** Sondanın işaretlerinden ölçüm — Playwright eli yok (librewolf.mjs eski olc() deseni). */
function olc(kayitlar) {
  const s = kayitlar
    .filter((k) => k.an && k.durum)
    .map((k) => ({ an: Number(k.an), durum: k.durum, sekme: k.sekme, izleniyor: Number(k.izleniyor), duraklatildi: Number(k.duraklatildi), mola: Number(k.mola) }))
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
    const dogru = Math.abs(d[k] - dAn) <= TOLERANS_MS && Object.keys(d).every((x) => x === k || d[x] === 0);
    if (dogru) gecen++; else kalan++;
    if (ornekler.length < 6) ornekler.push({ durum: a.durum, dAn, d, dogru });
  }
  return { isaretSayisi: s.length, gecen, kalan, durumlar: [...new Set(s.map((x) => x.durum))], ornekler, sonToplam: s.length ? { izleniyor: s[s.length - 1].izleniyor, duraklatildi: s[s.length - 1].duraklatildi, mola: s[s.length - 1].mola } : null };
}

// ═══════════════════════════════════════════════════════════════════════════════
let sunucu = null, eklentiDizin = null, xpiDizin = null;
const profiller = [];
let bitti = false;
const zamanAsimi = new Promise((_, red) =>
  setTimeout(() => { if (!bitti) red(new Error(`SERT SAYAC: ${SERT_SURE_MS} ms doldu`)); }, SERT_SURE_MS)
);

try {
  sonuc.kuruluPidOnce = kuruluPidler();
  yaz(`EMNIYET — kurulu LibreWolf (${KURULU_LW}) PID kumesi ONCE: [${sonuc.kuruluPidOnce.join(",")}] (adet ${sonuc.kuruluPidOnce.length})`);
  yaz("Bu kumeye DOKUNULMAYACAK. Tum LibreWolf cagrilari: tasinabilir kopya + -no-remote + MOZ_NO_REMOTE=1 + kendi profil.");

  await Promise.race([
    (async () => {
      const { ikili, kurulum } = await hazirla();
      sunucu = await sunucuBaslat(yaz);
      const hz = await testKopyasiHazirla({ port: sunucu.port, etiket: "Y10", aralikMs: 250, yerelEslesme: true, yaz });
      eklentiDizin = hz.dizin;

      // ── Y10-A1: Aday A, RDP'ye VARMADAN ──────────────────────────────────────
      // playwright-webextext KULLANILMAZ. Duz Playwright: installAddons (RDP) hic
      // cagrilmaz. Kriter 2'nin cekirdegi budur.
      {
        const profil = await profilKur("A1");
        profiller.push(profil);
        const komut = `firefox.launchPersistentContext(profil, { executablePath: "${ikili}", args: ["-no-remote"], headless: true })`;
        let ctx = null;
        try {
          ctx = await firefox.launchPersistentContext(profil, {
            executablePath: ikili,
            args: ["-no-remote"],
            headless: true,
            timeout: 45000,
            env: { ...process.env, MOZ_NO_REMOTE: "1" },
          });
          ekle({ yol: "Aday A / A1 (duz Playwright, RDP YOK)", adim: "launchPersistentContext", komut, executablePath: ikili, sonuc: "COZULDU — 'Aday A LibreWolf'a uygulanamaz' iddiasi CURUDU", birebirHata: "" });
          sonuc.a1Cozuldu = true;
        } catch (e) {
          ekle({ yol: "Aday A / A1 (duz Playwright, RDP YOK)", adim: "launchPersistentContext", komut, executablePath: ikili, sonuc: "FIRLATTI — iddia OLCULEREK dogrulandi. RDP'ye HIC dokunulmadi, ECONNREFUSED sayaci ARTMADI.", birebirHata: hataMetni(e) });
          sonuc.a1Cozuldu = false;
        } finally {
          if (ctx) await ctx.close().catch(() => {});
        }
      }

      // ── Y10-A2: YALNIZ A1 çözülürse ─────────────────────────────────────────
      if (sonuc.a1Cozuldu) {
        const profil = await profilKur("A2");
        profiller.push(profil);
        try {
          const pwext = (await import("playwright-webextext")).default;
          const ff = pwext.withExtension(firefox, eklentiDizin);
          const ctx = await ff.launchPersistentContext(profil, {
            executablePath: ikili, args: ["-no-remote"], headless: true, timeout: 45000,
          });
          ekle({ yol: "Aday A / A2 (withExtension, RDP devrede)", adim: "launchPersistentContext + installAddons", komut: "withExtension(firefox, testKopyasi).launchPersistentContext(...)", sonuc: "COZULDU — eklenti RDP ile yuklendi", birebirHata: "" });
          await ctx.close().catch(() => {});
        } catch (e) {
          ekle({ yol: "Aday A / A2 (withExtension, RDP devrede)", adim: "installAddons (RDP)", komut: "withExtension(firefox, testKopyasi).launchPersistentContext(...)", sonuc: "FIRLATTI — YENI YOL, esik tetiklenmez (005 kritik yasak 2)", birebirHata: hataMetni(e) });
        }
      } else {
        ekle({ yol: "Aday A / A2 (withExtension, RDP devrede)", adim: "atlandi", komut: "-", sonuc: "A1 firlattigi icin girilmedi — RDP'ye HIC dokunulmadi", birebirHata: "" });
      }

      // ── Y10-B: RDP'siz asıl yol — profile imzasız XPI sideload ───────────────
      {
        xpiDizin = await gecici("lw-xpi");
        const yapim = await webExt.cmd.build(
          { sourceDir: eklentiDizin, artifactsDir: xpiDizin, overwriteDest: true, filename: "sayac.xpi" },
          { showReadyMessage: false }
        );
        yaz(`XPI uretildi: ${yapim.extensionPath} (${fs.statSync(yapim.extensionPath).size} bayt)`);
        const profil = await profilKur("B");
        profiller.push(profil);
        const eklDizin = path.join(profil, "extensions");
        await fsp.mkdir(eklDizin, { recursive: true });
        const hedef = path.join(eklDizin, `${GECKO_ID}.xpi`);
        await fsp.copyFile(yapim.extensionPath, hedef);
        const yama = policyYamala(kurulum, null);
        yaz(`policies.json yamalandi (gecici kopya): ${yama}`);
        yaz(`XPI dusuruldu: ${hedef}`);

        const r = await lwBaslatYoklaOldur({ ikili, profil, url: sunucu.url + "?otomatik=1", sunucu, sureMs: 60000 });
        const ej = extensionsJsonOku(profil);
        yaz(`ARTEFAKT extensions.json: ${JSON.stringify(ej)}`);
        const kayitVar = ej.bulundu && ej.kayit;
        ekle({
          yol: "Y10-B (RDP YOK — profile imzasiz XPI sideload)",
          adim: kayitVar ? "extensions.json kaydi VAR" : "extensions.json kaydi YOK",
          komut: r.komut,
          sonuc: kayitVar
            ? `KAYIT: ${JSON.stringify(ej.kayit)} · sondadan isaret=${r.isaret}`
            : `${ej.not || "kayit yok"} · dosyadaki id listesi: ${JSON.stringify(ej.idListesi || [])} · sondadan isaret=${r.isaret}`,
          birebirHata: r.isaret === 0 ? "sondadan SIFIR BAYT geldi — icerik betigi enjekte olmadi" : "",
          extensionsJson: ej,
        });
        sonuc.bIsaret = r.isaret;
        if (r.isaret > 0) {
          const o = olc(sunucu.olaylar.filter((x) => x.an));
          sonuc.olcum = o;
          yaz(`OLCUM: isaret=${o.isaretSayisi} durumlar=${JSON.stringify(o.durumlar)} gecen=${o.gecen} kalan=${o.kalan}`);
          for (const e of o.ornekler) yaz(`   ornek: durum=${e.durum} Δan=${e.dAn} Δ=${JSON.stringify(e.d)} → ${e.dogru ? "TAMAM" : "SAPMA"}`);
          if (o.gecen > 0 && o.kalan === 0 && o.durumlar.length >= 2) {
            sonuc.durum = "YESIL";
            sonuc.sebep = "";
          }
        }
      }

      // ── Y10-C: B tutmazsa tek deneme — kurumsal politika ────────────────────
      if (sonuc.durum !== "YESIL") {
        const profil = await profilKur("C");
        profiller.push(profil);
        const xpi = path.join(xpiDizin, "sayac.xpi");
        const yama = policyYamala(kurulum, {
          ExtensionSettings: {
            "*": { installation_mode: "allowed" },
            [GECKO_ID]: { installation_mode: "force_installed", install_url: "file:///" + xpi.replace(/\\/g, "/") },
          },
        });
        yaz(`policies.json yamalandi: ${yama}`);
        const oncekiIsaret = sunucu.olaylar.filter((o) => o.an).length;
        const r = await lwBaslatYoklaOldur({ ikili, profil, url: sunucu.url + "?otomatik=1", sunucu, sureMs: 60000 });
        const yeniIsaret = sunucu.olaylar.filter((o) => o.an).length - oncekiIsaret;
        const ej = extensionsJsonOku(profil);
        yaz(`ARTEFAKT extensions.json: ${JSON.stringify(ej)}`);
        ekle({
          yol: "Y10-C (RDP YOK — policies.json ExtensionSettings force_installed)",
          adim: ej.bulundu ? "extensions.json kaydi VAR" : "extensions.json kaydi YOK",
          komut: r.komut,
          sonuc: ej.bulundu
            ? `KAYIT: ${JSON.stringify(ej.kayit)} · yeni isaret=${yeniIsaret}`
            : `${ej.not || "kayit yok"} · id listesi: ${JSON.stringify(ej.idListesi || [])} · yeni isaret=${yeniIsaret}`,
          birebirHata: yeniIsaret === 0 ? "sondadan SIFIR BAYT geldi" : "",
          extensionsJson: ej,
        });
        if (yeniIsaret > 0) {
          const o = olc(sunucu.olaylar.filter((x) => x.an));
          sonuc.olcum = o;
          if (o.gecen > 0 && o.kalan === 0 && o.durumlar.length >= 2) sonuc.durum = "YESIL";
        }
      }

      // ── FAZ 4 (KOŞULLU, TEK DENEME) — gerçek araç çubuğu paneli ─────────────
      // Ön koşul: Y10 gerçek bir tarayıcı kanalı açtı (LibreWolf eklentiyi yükledi).
      if (sonuc.durum === "YESIL") {
        const profil = await profilKur("panel");
        profiller.push(profil);
        const hz2 = await testKopyasiHazirla({
          port: sunucu.port, etiket: "Y10-panel", aralikMs: 250, yerelEslesme: true,
          pencereErisimi: true, yaz: () => {},
        });
        const yapim2 = await webExt.cmd.build(
          { sourceDir: hz2.dizin, artifactsDir: xpiDizin, overwriteDest: true, filename: "sayac-panel.xpi" },
          { showReadyMessage: false }
        );
        const eklDizin2 = path.join(profil, "extensions");
        await fsp.mkdir(eklDizin2, { recursive: true });
        await fsp.copyFile(yapim2.extensionPath, path.join(eklDizin2, `${GECKO_ID}.xpi`));
        const r2 = await lwBaslatYoklaOldur({
          ikili, profil, url: sunucu.url + "?otomatik=1&panel=1", sunucu, sureMs: 45000,
        });
        const panelRapor = sunucu.olaylar.filter((o) => o.deney === "pencere" && o.baglam === "panel");
        const sonPanelSonuc = sunucu.olaylar.filter((o) => o.panelSonuc).slice(-1)[0];
        const sonPanel = panelRapor.length ? panelRapor[panelRapor.length - 1] : null;
        sonuc.faz4 = {
          panelRaporSayisi: panelRapor.length,
          isaret: r2.isaret,
          panelSonuc: sonPanelSonuc ? sonPanelSonuc.panelSonuc : "rapor dusmedi",
          // ⚠️ ASIL ÖLÇÜM: gerçek panelde `sender.tab` var mı? Karşıt deney orada da koşar.
          // dönen === gönderilen (999999) → sender.tab YOK → msg.sekmeId yolu GEÇERLİ.
          karsitDeney: sonPanel
            ? {
                baglam: sonPanel.baglam,
                ust: sonPanel.ust,
                getCurrent: sonPanel.getCurrent,
                tabsTipi: sonPanel.tabsTipi,
                sorguId: sonPanel.sorguId,
                pencereHedef: sonPanel.pencereHedef,
                probe1Gonderilen: sonPanel.probe1Gonderilen,
                probe1Donen: sonPanel.probe1Donen,
                probe2Gonderilen: sonPanel.probe2Gonderilen,
                probe2Donen: sonPanel.probe2Donen,
                bgSekmeId: sonPanel.bgSekmeId,
                sIzleniyor: sonPanel.sIzleniyor,
                sDurum: sonPanel.sDurum,
                sBtnMola: sonPanel.sBtnMola,
                sBtnAna: sonPanel.sBtnAna,
                sUyari: sonPanel.sUyari,
              }
            : null,
          hamRaporlar: panelRapor.slice(-2),
        };
        if (sonPanel) {
          const golge = sonPanel.probe1Gonderilen !== sonPanel.probe1Donen;
          yaz(`FAZ 4 KARSIT DENEY (GERCEK PANEL): 999999 -> ${sonPanel.probe1Donen} · 888888 -> ${sonPanel.probe2Donen}`);
          yaz(`   golgeleme: ${golge ? "VAR" : "YOK — msg.sekmeId yolu GECERLI"} · getCurrent=${sonPanel.getCurrent} · sorguId=${sonPanel.sorguId} · pencereHedef=${sonPanel.pencereHedef}`);
          yaz(`   panel DOM: ${sonPanel.sIzleniyor} durum="${sonPanel.sDurum}" btnMola="${sonPanel.sBtnMola}" btnAna="${sonPanel.sBtnAna}" uyari="${sonPanel.sUyari}"`);
          sonuc.faz4.golgeleme = golge;
        }
        ekle({
          yol: "FAZ 4 — gercek arac cubugu paneli (browserAction.openPopup)",
          adim: panelRapor.length ? "panel baglamindan rapor DUSTU" : "panel baglamindan rapor DUSMEDI",
          komut: r2.komut,
          sonuc: panelRapor.length
            ? `PANEL ACILDI — ${panelRapor.length} rapor; sender.tab olcumu icin rapor icerigi kanit dosyasinda`
            : `OLCULEMEDI — panel baglamindan rapor gelmedi (isaret=${r2.isaret})`,
          birebirHata: "",
        });
        await sil(hz2.dizin);
      } else {
        ekle({ yol: "FAZ 4 — gercek arac cubugu paneli", adim: "atlandi", komut: "-", sonuc: "on kosul saglanmadi: Y10 kanali acilmadi", birebirHata: "" });
      }

      // ── Denenmeyen yollar — GEREKÇELERİYLE (G25: denemeden "olculemedi" yazmak muafiyet) ──
      ekle({ yol: "web-ext RDP", adim: "DENENMEDI", komut: "-", sonuc: "005 kritik yasak 2: ayni ECONNREFUSED 4 kez alindi, 5. kez durma esigi (HEDEF.md:156). Bilerek denenmedi.", birebirHata: "" });
      ekle({ yol: "about:debugging ile elle yukleme", adim: "DENENMEDI", komut: "-", sonuc: "Makine kanali yok — ELLE gezinme gerektirir. Otomatiklestirilemedigi icin OLCULEMEDI; 'calismiyor' DEGIL.", birebirHata: "" });
      ekle({ yol: "AMO imzalatma", adim: "DENENMEDI", komut: "-", sonuc: "Ag + hesap gerektirir, kapsam disi (SAYAC_TEKLIF.md).", birebirHata: "" });
    })(),
    zamanAsimi,
  ]);
} catch (e) {
  sonuc.sebep = hataMetni(e);
  yaz("HATA: " + sonuc.sebep);
} finally {
  bitti = true;
  if (sunucu) await sunucu.kapat().catch(() => {});
  if (eklentiDizin) await sil(eklentiDizin);
  if (xpiDizin) await sil(xpiDizin);
  for (const p of profiller) await sil(p);
  if (indirmeDizin) await sil(indirmeDizin);

  sonuc.kuruluPidSonra = kuruluPidler();
  yaz("");
  yaz(`EMNIYET — kurulu LibreWolf PID kumesi ONCE : [${sonuc.kuruluPidOnce.join(",")}]`);
  yaz(`EMNIYET — kurulu LibreWolf PID kumesi SONRA: [${sonuc.kuruluPidSonra.join(",")}]`);
  const ayni = JSON.stringify(sonuc.kuruluPidOnce) === JSON.stringify(sonuc.kuruluPidSonra);
  yaz(`KUME AYNI MI: ${ayni ? "EVET — Mustafa'nin tarayicisina DOKUNULMADI" : "HAYIR ← INCELE"}`);
  sonuc.kumeAyni = ayni;

  if (sonuc.durum !== "YESIL") {
    sonuc.durum = OLCULEMEDI;
    if (!sonuc.sebep) {
      sonuc.sebep =
        "Denenen yollarin hicbiri eklentiyi yukleyemedi. Her yolun birebir sonucu denemeler[] icinde. " +
        "Aday A / A1 sonucu kriter 2'yi kapatir; web-ext RDP bilerek denenmedi (esik 4/5).";
    }
    yaz("");
    yaz("KUTU OLCULEMEDI — her denemenin birebir sonucu yukarida ve kanit/eklenti-Y10.json icinde.");
  }
  fs.mkdirSync(KANIT, { recursive: true });
  fs.writeFileSync(path.join(KANIT, "eklenti-Y10.json"), JSON.stringify(sonuc, null, 2), "utf8");
  yaz(`SONUC ${sonuc.durum}${sonuc.sebep ? " — " + sonuc.sebep : ""}`);
  setTimeout(() => process.exit(0), 300).unref();
}
