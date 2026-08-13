// ADAY B — Mozilla web-ext RDP, YALNIZ Node API (CLI değil).
// G24: `web-ext run` CLI olarak koşulmaz — dönmeyen süreçtir. shouldExitProgram:false +
// finally { runner.exit() }.
import { firefox } from "playwright";
import webExt from "web-ext";
import { kos } from "./ortak/kosucu.mjs";

await kos({
  aday: "b",
  adayAdi: "Mozilla web-ext RDP (Node API)",
  calistir: async (ctx) => {
    const ikili = firefox.executablePath();
    ctx.sonuc.ikili = ikili;
    ctx.yaz(`firefox ikilisi: ${ikili}`);

    let runner = null;
    ctx.temizle.push({
      ad: "web-ext extensionRunner",
      kapat: async () => {
        if (runner) await runner.exit();
      },
    });

    // --- KUTU 1: yükleme çağrısı ---
    try {
      runner = await webExt.cmd.run(
        {
          firefox: ikili,
          sourceDir: ctx.eklentiDizini,
          noReload: true,
          noInput: true,
          startUrl: [ctx.sunucu.url],
          args: ["--headless"],
          pref: {
            "media.autoplay.default": 0,
            "media.autoplay.blocking_policy": 0,
            "xpinstall.signatures.required": false,
          },
          // firefoxProfile verilmedi → web-ext kendi TEK KULLANIMLIK temp profilini
          // yaratır (lib/firefox/index.js createProfile). Mustafa'nın profiline dokunulmaz.
        },
        { shouldExitProgram: false }
      );

      const alt = runner.extensionRunners || [];
      const eslesme = [];
      for (const r of alt) {
        if (r.reloadableExtensions) {
          for (const [kaynak, addonId] of r.reloadableExtensions.entries()) {
            eslesme.push(`${r.getName()} → addonId=${addonId} (${kaynak})`);
          }
        }
      }
      ctx.sonuc.kutu1 = eslesme.length ? "E" : "H";
      ctx.sonuc.kutu1Kanit = eslesme.length
        ? `cmd.run çözüldü: ${runner.constructor.name}; RDP installTemporaryAddon sonucu: ${eslesme.join(" | ")}`
        : `cmd.run çözüldü (${runner.constructor.name}) ama reloadableExtensions boş — addonId yok`;
      ctx.yaz("KUTU1 " + ctx.sonuc.kutu1 + " :: " + ctx.sonuc.kutu1Kanit);
    } catch (e) {
      ctx.sonuc.kutu1 = "H";
      ctx.sonuc.kutu1Kanit = "webExt.cmd.run istisnası: " + ctx.hataMetni(e);
      ctx.yaz("KUTU1 H :: " + ctx.sonuc.kutu1Kanit);
      return;
    }

    // --- KUTU 2: arka plan betiği koştu mu ---
    const k2 = await ctx.sunucu.bekle(2, 20000);
    ctx.sonuc.kutu2 = k2 ? "E" : "H";
    ctx.sonuc.kutu2Kanit = k2
      ? "işaret sunucusuna düşen istek: " + JSON.stringify(k2)
      : "20 sn içinde /olay?kutu=2 isteği gelmedi (sıfır bayt)";
    ctx.yaz("KUTU2 " + ctx.sonuc.kutu2 + " :: " + ctx.sonuc.kutu2Kanit);

    // --- KUTU 3: sayfadaki gerçek olay eklentiye ulaştı ve dışarı çıktı ---
    const k3 = await ctx.sunucu.bekle(3, 35000);
    ctx.sonuc.kutu3 = k3 ? "E" : "H";
    ctx.sonuc.kutu3Kanit = k3
      ? "işaret sunucusuna düşen istek: " + JSON.stringify(k3)
      : "35 sn içinde /olay?kutu=3 isteği gelmedi (sıfır bayt)";
    ctx.sonuc.uretim = k3 ? k3.uretim || "bilinmiyor" : "-";
    ctx.yaz("KUTU3 " + ctx.sonuc.kutu3 + " :: " + ctx.sonuc.kutu3Kanit);
  },
});
