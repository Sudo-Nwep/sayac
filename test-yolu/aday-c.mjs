// ADAY C — Playwright'ın KENDİ Firefox desteği.
// İki somut yoklama yapılır; "desteklenmiyor" varsayım değil ÖLÇÜM olarak kaydedilir:
//   Yoklama 1 — API yüzeyi: playwright sürümü + firefox.executablePath() + launch/
//               launchPersistentContext seçeneklerinde eklenti yükleme parametresi var mı
//               (playwright-core types.d.ts taranır).
//   Yoklama 2 — profile düşürme, İKİ BİÇİM (tek biçimle eleme yapılmaz):
//               2a) <profil>\extensions\<gecko.id>.xpi
//               2b) <profil>\extensions\<gecko.id>\  (paketlenmemiş dizin)
//               Kanıt <profil>\extensions.json içinden okunur (G11: artefakta bak).
//   Ayrıca preflerin profile GERÇEKTEN yazıldığı prefs.js'ten doğrulanır (K05).
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { firefox } from "playwright";
import webExt from "web-ext";
import { sil } from "./ortak/eklenti-hazirla.mjs";
import { kos } from "./ortak/kosucu.mjs";

const GECKO_ID = "sinama@sayac.local";

const PREFLER = {
  "xpinstall.signatures.required": false,
  "extensions.autoDisableScopes": 0,
  "extensions.enabledScopes": 15,
  "extensions.startupScanScopes": 15,
  "media.autoplay.default": 0,
  "media.autoplay.blocking_policy": 0,
};

function extensionsJsonOku(profil) {
  const y = path.join(profil, "extensions.json");
  if (!fs.existsSync(y)) return { yol: y, var: false, addons: null };
  try {
    const ej = JSON.parse(fs.readFileSync(y, "utf8"));
    return { yol: y, var: true, addons: ej.addons || [] };
  } catch (e) {
    return { yol: y, var: true, addons: null, hata: String(e) };
  }
}

await kos({
  aday: "c",
  adayAdi: "Playwright kendi Firefox destegi (profile dusurme)",
  calistir: async (ctx) => {
    const ikili = firefox.executablePath();
    ctx.sonuc.ikili = ikili;

    // ---------- YOKLAMA 1 — API yüzeyi ----------
    const pwSurum = JSON.parse(
      fs.readFileSync("node_modules/playwright/package.json", "utf8")
    ).version;
    const tipler = fs.readFileSync(
      "node_modules/playwright-core/types/types.d.ts",
      "utf8"
    );
    const aranan = [
      "loadExtension",
      "extensionPath",
      "addonPath",
      "installTemporaryAddon",
      "firefoxExtensions",
      "webExtensions",
      "--load-extension",
    ];
    const bulunan = aranan.filter((a) => tipler.includes(a));
    ctx.sonuc.yoklama1 =
      `playwright=${pwSurum} · executablePath=${ikili} (diskte=${fs.existsSync(ikili)}) · ` +
      `playwright-core/types/types.d.ts (${tipler.length} bayt) icinde eklenti yukleme ` +
      `parametresi aramasi ${JSON.stringify(aranan)} → bulunan=${JSON.stringify(bulunan)}`;
    ctx.yaz("YOKLAMA1 :: " + ctx.sonuc.yoklama1);

    // ---------- YOKLAMA 2 — profile düşürme ----------
    const artefakt = await ctx.gecici(`xpi-c-${ctx.manifest}`);
    const profil = await ctx.gecici(`profil-c-${ctx.manifest}`);
    ctx.temizle.push({ ad: "profil dizini", kapat: async () => sil(profil) });
    ctx.temizle.push({ ad: "xpi dizini", kapat: async () => sil(artefakt) });

    const yapim = await webExt.cmd.build(
      {
        sourceDir: ctx.eklentiDizini,
        artifactsDir: artefakt,
        overwriteDest: true,
        filename: "sinama.xpi",
      },
      { showReadyMessage: false }
    );
    ctx.yaz(
      `XPI uretildi: ${yapim.extensionPath} (${fs.statSync(yapim.extensionPath).size} bayt)`
    );

    // 1) Profili Playwright'ın kendi eliyle bir kez yarat ve kapat.
    let aktif = null;
    ctx.temizle.push({
      ad: "playwright context",
      kapat: async () => {
        if (aktif) await aktif.close().catch(() => {});
      },
    });
    aktif = await firefox.launchPersistentContext(profil, {
      headless: true,
      firefoxUserPrefs: PREFLER,
    });
    await aktif.close();
    aktif = null;
    ctx.yaz("profil olusturuldu, tarayici kapatildi");

    // K05 — istediğimiz prefleri profile GERÇEKTEN yazdık mı? İddia değil, ölçüm.
    const prefsYolu = path.join(profil, "prefs.js");
    const prefsMetni = fs.existsSync(prefsYolu)
      ? fs.readFileSync(prefsYolu, "utf8")
      : "";
    const prefDogrulama = Object.keys(PREFLER).map(
      (p) => `${p}=${prefsMetni.includes(`"${p}"`) ? "prefs.js'te VAR" : "prefs.js'te YOK"}`
    );
    ctx.sonuc.prefDogrulama = prefDogrulama.join(" · ");
    ctx.yaz("PREF DOGRULAMA :: " + ctx.sonuc.prefDogrulama);

    const eklDizin = path.join(profil, "extensions");
    await fsp.mkdir(eklDizin, { recursive: true });

    const denemeler = [
      {
        ad: "2a XPI",
        kur: async () => {
          const h = path.join(eklDizin, `${GECKO_ID}.xpi`);
          await fsp.copyFile(yapim.extensionPath, h);
          return `${h} (var=${fs.existsSync(h)}, ${fs.statSync(h).size} bayt)`;
        },
        kaldir: async () => sil(path.join(eklDizin, `${GECKO_ID}.xpi`)),
      },
      {
        ad: "2b paketlenmemis dizin",
        kur: async () => {
          const h = path.join(eklDizin, GECKO_ID);
          await fsp.cp(ctx.eklentiDizini, h, { recursive: true });
          return `${h} (var=${fs.existsSync(path.join(h, "manifest.json"))})`;
        },
        kaldir: async () => sil(path.join(eklDizin, GECKO_ID)),
      },
    ];

    const kanitlar = [];
    let tutan = null;

    for (const d of denemeler) {
      const nereye = await d.kur();
      ctx.yaz(`${d.ad} dusuruldu: ${nereye}`);

      aktif = await firefox.launchPersistentContext(profil, {
        headless: true,
        firefoxUserPrefs: PREFLER,
      });
      const sayfa = aktif.pages()[0] || (await aktif.newPage());
      await sayfa.goto(ctx.sunucu.url, { waitUntil: "load", timeout: 30000 });

      // 15 sn: ya extensions.json'a düşsün ya arka plan işareti gelsin.
      let kayit = null;
      const bitis = Date.now() + 15000;
      while (Date.now() < bitis && !kayit) {
        const ej = extensionsJsonOku(profil);
        kayit = (ej.addons || []).find((a) => a.id === GECKO_ID) || null;
        if (!kayit && ctx.sunucu.olaylar.some((o) => o.kutu === "2")) break;
        if (!kayit) await new Promise((r) => setTimeout(r, 500));
      }

      const ej = extensionsJsonOku(profil);
      if (kayit) {
        kanitlar.push(
          `${d.ad}: extensions.json icinde BULUNDU → ` +
            JSON.stringify({
              id: kayit.id,
              active: kayit.active,
              location: kayit.location,
              signedState: kayit.signedState,
              appDisabled: kayit.appDisabled,
              userDisabled: kayit.userDisabled,
            })
        );
        if (kayit.active) tutan = d.ad;
      } else {
        kanitlar.push(
          `${d.ad}: ${ej.yol} icinde "${GECKO_ID}" YOK. Dosyadaki id listesi: ` +
            JSON.stringify((ej.addons || []).map((a) => a.id))
        );
      }
      ctx.yaz(kanitlar[kanitlar.length - 1]);

      if (tutan) break;
      // Son deneme değilse kapat; SON denemede tarayıcıyı AÇIK bırak — kutu 3'te
      // sayfanın kendi durumu okunacak. Bu, H'nin adaydan mı cetvelden mi geldiğini
      // ayırt eden kanıttır (G22).
      if (d !== denemeler[denemeler.length - 1]) {
        await aktif.close();
        aktif = null;
        await d.kaldir();
      }
    }

    // --- KUTU 1 ---
    ctx.sonuc.kutu1 = tutan ? "E" : "H";
    ctx.sonuc.kutu1Kanit = kanitlar.join("  ||  ");
    ctx.yaz("KUTU1 " + ctx.sonuc.kutu1);

    // --- KUTU 2 ---
    const k2 = await ctx.sunucu.bekle(2, tutan ? 15000 : 5000);
    ctx.sonuc.kutu2 = k2 ? "E" : "H";
    ctx.sonuc.kutu2Kanit = k2
      ? "işaret sunucusuna düşen istek: " + JSON.stringify(k2)
      : "/olay?kutu=2 isteği hiç gelmedi (sıfır bayt) — arka plan betiği koşmadı";
    ctx.yaz("KUTU2 " + ctx.sonuc.kutu2 + " :: " + ctx.sonuc.kutu2Kanit);

    // --- KUTU 3 ---
    const k3 = await ctx.sunucu.bekle(3, tutan ? 30000 : 10000);
    ctx.sonuc.kutu3 = k3 ? "E" : "H";
    const sayfaDurumu = aktif
      ? await (aktif.pages()[0] || (await aktif.newPage()))
          .evaluate(
            () =>
              document.documentElement.getAttribute("data-baslangic") +
              " / " +
              (document.getElementById("durum") || {}).textContent
          )
          .catch((e) => "okunamadi: " + e.message)
      : "context kapali";
    ctx.sonuc.kutu3Kanit = k3
      ? "işaret sunucusuna düşen istek: " + JSON.stringify(k3)
      : "/olay?kutu=3 isteği hiç gelmedi (sıfır bayt). Sayfa durumu: " +
        sayfaDurumu +
        " — sayfa oynatmayı yaptı, işareti taşıyacak eklenti yoktu (cetvel çalışıyor, H adayın)";
    ctx.sonuc.uretim = k3 ? k3.uretim || "bilinmiyor" : "-";
    ctx.yaz("KUTU3 " + ctx.sonuc.kutu3 + " :: " + ctx.sonuc.kutu3Kanit);
  },
});
