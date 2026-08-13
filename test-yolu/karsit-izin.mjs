// Y8 — host izni KARŞIT DENEYİ (2×2, iki manifest sürümünde = 8 hücre).
//
// NEDEN GEREKLİ: tur 001 "host_permissions etkili oldu — izin olmadan geçemezdi" yazdı
// (001.result.md:23). Diskteki dosyalar bu cümleyi iki yönden şüpheli kılıyor:
//   ① Kanıt kanalı ayırt edici değil: basit bir GET'te tarayıcı isteği GÖNDERİR,
//      engelleme YANIT tarafında olur → sunucuya ulaşma izin kanıtı DEĞİLDİR.
//      Üstelik test-yolu/ortak/sunucu.mjs:77 yanıta "Access-Control-Allow-Origin: *"
//      koyuyor; bu tek başına çapraz kökenli okumaya izin verir.
//   ② MV3'te izin zaten HARİCEN verilmişti: playwright-webextext, content_scripts.matches
//      içindeki kökenleri profile önceden yazıyor (firefox_extension_preferences.js).
//
// Bu deney kanıtı doğru yere koyar: ölçülen şey fetch'in ÇÖZÜLÜP ÇÖZÜLMEDİĞİdir ve
// sonuç DOM kanalıyla dışarı taşınır (izin gerektirmez).
//
// Kullanılan eklenti ÜRÜN DEĞİLDİR — bu deney için geçici dizinde kurulan asgari bir
// sınama eklentisidir. Donmuş test-yolu/eklenti-mv2|mv3 klasörlerine yazılmaz.
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { firefox } from "playwright";
import pwext from "playwright-webextext";
import { sunucuBaslat } from "./ortak/sunucu-eklenti.mjs";
import { gecici, sil } from "./ortak/eklenti-hazirla.mjs";
import { KANIT, bekle, hataMetni } from "./ortak/hucre.mjs";

const { withExtension } = pwext;
const SERT_SURE_MS = 180000;

const satirlar = [];
const t0 = Date.now();
function yaz(s = "") {
  const l = `[+${String(Date.now() - t0).padStart(6, "0")}ms] ${s}`;
  satirlar.push(l);
  process.stdout.write(l + "\n");
}

const ARKAPLAN = `
var API = typeof browser !== "undefined" ? browser : chrome;
var SONUC = { durum: "bekliyor", hata: "", status: null };
try {
  fetch(IZIN_TEST.hedef).then(
    function (r) { SONUC = { durum: "gecti", hata: "", status: r.status }; },
    function (e) { SONUC = { durum: "dustu", hata: String(e && e.message ? e.message : e), status: null }; }
  );
} catch (e) {
  SONUC = { durum: "dustu", hata: "senkron istisna: " + e.message, status: null };
}
API.runtime.onMessage.addListener(function () { return Promise.resolve(SONUC); });
`;

const ICERIK = `
var API = typeof browser !== "undefined" ? browser : chrome;
function tur() {
  try {
    var p = API.runtime.sendMessage({});
    if (p && p.then) p.then(function (s) {
      document.documentElement.setAttribute("data-izin", JSON.stringify(s));
    }, function () {});
  } catch (e) {}
}
setInterval(tur, 200);
tur();
`;

async function eklentiKur({ mv, izin, hedef }) {
  const dizin = await gecici(`izin-mv${mv}-${izin ? "var" : "yok"}`);
  const m = {
    manifest_version: mv,
    name: "izin-deneyi",
    version: "0.1",
    browser_specific_settings: { gecko: { id: "izin@sayac.local" } },
    background: { scripts: ["ayar.js", "arkaplan.js"] },
    content_scripts: [
      { matches: ["http://127.0.0.1/*"], js: ["icerik.js"], run_at: "document_idle" },
    ],
  };
  if (mv === 2) m.background.persistent = true;
  if (izin) {
    if (mv === 3) m.host_permissions = ["http://127.0.0.1/*"];
    else m.permissions = ["http://127.0.0.1/*"];
  }
  await fsp.writeFile(path.join(dizin, "manifest.json"), JSON.stringify(m, null, 2) + "\n", "utf8");
  await fsp.writeFile(path.join(dizin, "ayar.js"), `var IZIN_TEST = { hedef: ${JSON.stringify(hedef)} };\n`, "utf8");
  await fsp.writeFile(path.join(dizin, "arkaplan.js"), ARKAPLAN, "utf8");
  await fsp.writeFile(path.join(dizin, "icerik.js"), ICERIK, "utf8");
  return { dizin, manifest: m };
}

async function hucreKos({ mv, izin, acao, sunucu }) {
  const uc = acao ? "/olay-acao" : "/olay-kapali";
  const hedef = `http://127.0.0.1:${sunucu.port}${uc}?deney=izin&mv=${mv}&izin=${izin ? "var" : "yok"}&acao=${acao ? "var" : "yok"}`;
  const { dizin, manifest } = await eklentiKur({ mv, izin, hedef });
  const profil = await gecici(`izin-profil-mv${mv}`);
  let context = null;
  const etiket = `MV${mv} · izin=${izin ? "VAR" : "YOK"} · ACAO=${acao ? "VAR" : "YOK"}`;
  try {
    const ff = withExtension(firefox, dizin);
    context = await ff.launchPersistentContext(profil, { headless: true });
    const sayfa = context.pages()[0] || (await context.newPage());
    await sayfa.goto(sunucu.url, { waitUntil: "load", timeout: 30000 });
    let g = null;
    const bitis = Date.now() + 20000;
    while (Date.now() < bitis) {
      const s = await sayfa.evaluate(() => document.documentElement.getAttribute("data-izin")).catch(() => null);
      if (s) {
        const o = JSON.parse(s);
        if (o.durum !== "bekliyor") { g = o; break; }
      }
      await bekle(200);
    }
    const ulasti = sunucu.olaylar.some((o) => o.uc === uc && o.mv === String(mv) && o.izin === (izin ? "var" : "yok") && o.acao === (acao ? "var" : "yok"));
    const satir = {
      etiket, mv, izin, acao,
      fetch: g ? g.durum : "ölçülemedi",
      hata: g ? g.hata : "20 sn icinde data-izin gelmedi",
      status: g ? g.status : null,
      sunucuyaUlasti: ulasti,
    };
    yaz(`${etiket.padEnd(38)} → fetch=${String(satir.fetch).padEnd(10)} sunucuya ulasti=${ulasti}${satir.hata ? " · " + satir.hata : ""}`);
    return satir;
  } catch (e) {
    yaz(`${etiket} → HUCRE HATASI: ${hataMetni(e)}`);
    return { etiket, mv, izin, acao, fetch: "ölçülemedi", hata: hataMetni(e), status: null, sunucuyaUlasti: false };
  } finally {
    if (context) await context.close().catch(() => {});
    await sil(dizin);
    await sil(profil);
  }
}

let sunucu = null;
let bitti = false;
const sonuc = { hucre: "Y8", durum: "ölçülemedi", sebep: "", tablo: [], yorum: "" };
const zamanAsimi = new Promise((_, red) =>
  setTimeout(() => { if (!bitti) red(new Error(`SERT SAYAC: ${SERT_SURE_MS} ms doldu`)); }, SERT_SURE_MS)
);

try {
  yaz("Y8 — host izni karsit deneyi · 2x2 x {MV2, MV3} = 8 hucre");
  yaz("OLCULEN: arka plandaki fetch COZULDU mu? (sunucuya ulasma degil)");
  sunucu = await sunucuBaslat(yaz);
  await Promise.race([
    (async () => {
      for (const mv of [2, 3]) {
        for (const izin of [true, false]) {
          for (const acao of [true, false]) {
            sonuc.tablo.push(await hucreKos({ mv, izin, acao, sunucu }));
          }
        }
      }
    })(),
    zamanAsimi,
  ]);

  const bul = (mv, izin, acao) => sonuc.tablo.find((s) => s.mv === mv && s.izin === izin && s.acao === acao);
  const mv2IzinYokAcaoVar = bul(2, false, true);
  const mv2IzinYokAcaoYok = bul(2, false, false);
  const mv2IzinVarAcaoYok = bul(2, true, false);

  const satirlarYorum = [];
  if (mv2IzinYokAcaoVar && mv2IzinYokAcaoVar.fetch === "gecti") {
    satirlarYorum.push(
      'ÇÜRÜTÜLDÜ: MV2 · izin YOK · ACAO VAR hücresinde fetch ÇÖZÜLDÜ. ' +
      'Yani "izin olmadan geçemezdi" cümlesi yanlıştır: ACAO başlığı tek başına ' +
      'çapraz kökenli okumaya yetiyor. Tur 001\'in sunucusu (sunucu.mjs:77) o başlığı ' +
      'koyuyordu → oradaki "E" izin gücünün kanıtı DEĞİLDİ.'
    );
  } else if (mv2IzinYokAcaoVar && mv2IzinYokAcaoVar.fetch === "dustu") {
    satirlarYorum.push(
      'DOĞRULANDI: MV2 · izin YOK · ACAO VAR hücresinde fetch DÜŞTÜ. ' +
      'Host izni gerçekten gerekli; tur 001\'in cümlesi ayakta kalıyor.'
    );
  } else {
    satirlarYorum.push("ölçülemedi: MV2 · izin YOK · ACAO VAR hücresi sonuç vermedi.");
  }
  if (mv2IzinVarAcaoYok && mv2IzinYokAcaoYok) {
    satirlarYorum.push(
      `İZNİN GERÇEK ETKİSİ (ACAO'suz uçta): izin VAR → fetch=${mv2IzinVarAcaoYok.fetch} · ` +
      `izin YOK → fetch=${mv2IzinYokAcaoYok.fetch}. ` +
      (mv2IzinVarAcaoYok.fetch === "gecti" && mv2IzinYokAcaoYok.fetch === "dustu"
        ? "Host izni CORS'u atlatıyor — ayırt edici hücre budur."
        : "Beklenen ayrım çıkmadı, rakamlar yukarıda.")
    );
  }
  sonuc.yorum = satirlarYorum.join(" | ");
  const olculemeyen = sonuc.tablo.filter((s) => s.fetch === "ölçülemedi").length;
  sonuc.durum = sonuc.tablo.length === 8 && olculemeyen === 0 ? "YESIL" : "ölçülemedi";
  if (olculemeyen) sonuc.sebep = `${olculemeyen} hücre ölçülemedi`;
} catch (e) {
  sonuc.sebep = hataMetni(e);
  yaz("HATA: " + hataMetni(e));
} finally {
  bitti = true;
  if (sunucu) await sunucu.kapat().catch(() => {});
  yaz("");
  yaz("=== Y8 TABLOSU ===");
  yaz("| manifest | host izni | ACAO | fetch | sunucuya ulasti |");
  yaz("|---|---|---|---|---|");
  for (const s of sonuc.tablo) {
    yaz(`| MV${s.mv} | ${s.izin ? "VAR" : "YOK"} | ${s.acao ? "VAR" : "YOK"} | **${s.fetch}** | ${s.sunucuyaUlasti} |`);
  }
  yaz("");
  yaz("YORUM: " + sonuc.yorum);
  fs.mkdirSync(KANIT, { recursive: true });
  fs.writeFileSync(path.join(KANIT, "eklenti-Y8.json"), JSON.stringify(sonuc, null, 2), "utf8");
  yaz(`SONUC ${sonuc.durum}${sonuc.sebep ? " — " + sonuc.sebep : ""}`);
  setTimeout(() => process.exit(sonuc.durum === "KIRMIZI" ? 1 : 0), 300).unref();
}
