// KANIT KOŞUSU — seçilen yolla (Aday A: playwright-webextext) boş sınama eklentisi
// yüklenir ve en az bir olay okunur. Ayrıca seçim gerekçesi olan "Playwright eli"
// iddia edilmez, ÖLÇÜLÜR (K05): sayfa durumu page.evaluate ile doğrudan okunur —
// madde 3 (sayaçlar rakamla) ve madde 4 (iki butonun üç durumu) bunu gerektirecek.
import fs from "node:fs";
import path from "node:path";
import { firefox } from "playwright";
import pwext from "playwright-webextext";
import { sunucuBaslat } from "./ortak/sunucu.mjs";
import { eklentiHazirla, gecici, sil, TEST_YOLU_KOK } from "./ortak/eklenti-hazirla.mjs";

const { withExtension } = pwext;
const MANIFEST = process.argv[2] === "mv3" ? "mv3" : "mv2";
const t0 = Date.now();
const satirlar = [];
const yaz = (s) => {
  const l = `[+${String(Date.now() - t0).padStart(6, "0")}ms] ${s}`;
  satirlar.push(l);
  process.stdout.write(l + "\n");
};

let sunucu = null;
let context = null;
let profil = null;
let eklenti = null;
let cikis = 0;

const sertSayac = setTimeout(() => {
  yaz("SERT SAYAC 120000 ms doldu");
  process.exit(3);
}, 120000);

try {
  yaz(`KANIT KOSUSU — secilen yol: playwright-webextext · manifest=${MANIFEST}`);
  yaz(`firefox ikilisi: ${firefox.executablePath()}`);

  sunucu = await sunucuBaslat(yaz);
  eklenti = await eklentiHazirla({ manifest: MANIFEST, port: sunucu.port, aday: "kanit" });
  profil = await gecici(`profil-kanit-${MANIFEST}`);
  yaz(`bos sinama eklentisi (gecici kopya): ${eklenti}`);
  yaz(`tek kullanimlik profil: ${profil}`);

  const ff = withExtension(firefox, eklenti);
  context = await ff.launchPersistentContext(profil, {
    headless: true,
    firefoxUserPrefs: { "media.autoplay.default": 0 },
  });
  yaz(`EKLENTI YUKLENDI — launchPersistentContext cozuldu (${context.constructor.name})`);

  const sayfa = context.pages()[0] || (await context.newPage());
  await sayfa.goto(sunucu.url, { waitUntil: "load", timeout: 30000 });
  yaz(`sayfa acildi: ${sunucu.url}`);

  const k2 = await sunucu.bekle(2, 20000);
  yaz(`OLAY 1/2 (arka plan): ${k2 ? JSON.stringify(k2) : "GELMEDI"}`);
  const k3 = await sunucu.bekle(3, 30000);
  yaz(`OLAY 2/2 (sayfa->icerik->arkaplan): ${k3 ? JSON.stringify(k3) : "GELMEDI"}`);

  // --- Seçim gerekçesi ölçümü: Playwright eli sayfayı sürebiliyor mu? ---
  const el = await sayfa.evaluate(() => {
    const v = document.querySelector("video");
    return {
      baslik: document.querySelector("h1").textContent,
      videoVar: !!v,
      currentTime: v ? Number(v.currentTime.toFixed(3)) : null,
      readyState: v ? v.readyState : null,
      paused: v ? v.paused : null,
      uretim: v ? v.getAttribute("data-uretim") : null,
      durum: (document.getElementById("durum") || {}).textContent,
    };
  });
  yaz("PLAYWRIGHT ELI (page.evaluate ile sayfa durumu): " + JSON.stringify(el));
  await sayfa.click("h1");
  yaz("PLAYWRIGHT ELI (page.click('h1') sorunsuz dondu) — madde 3/4 icin sayfa surulebilir");

  const gecti = !!k2 && !!k3;
  yaz(`SONUC: eklenti yuklendi=${!!context} · okunan olay sayisi=${[k2, k3].filter(Boolean).length}/2 · GECTI=${gecti}`);
  if (!gecti) cikis = 1;
} catch (e) {
  yaz("HATA: " + (e && e.stack ? e.stack : String(e)));
  cikis = 1;
} finally {
  clearTimeout(sertSayac);
  // G23 — teşhis için başlatılan her şey kapatılır.
  if (context) await context.close().catch((e) => yaz("context kapatma: " + e));
  if (sunucu) await sunucu.kapat().catch(() => {});
  if (eklenti) await sil(eklenti);
  if (profil) await sil(profil);
  yaz("temizlik bitti");
  fs.mkdirSync(path.join(TEST_YOLU_KOK, "kanit"), { recursive: true });
  fs.writeFileSync(
    path.join(TEST_YOLU_KOK, "kanit", `kanit-kosusu-${MANIFEST}.log`),
    `=== SAYAC — KANIT KOSUSU (secilen yol) ===\n` +
      `komut: node test-yolu/kanit-kosusu.mjs ${MANIFEST}\n` +
      `node=${process.version} platform=${process.platform}\n` +
      "=".repeat(60) + "\n\n" +
      satirlar.join("\n") + "\n",
    "utf8"
  );
  process.exit(cikis);
}
