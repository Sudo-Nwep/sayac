// ADAY A — playwright-webextext (RDP üzerinden geçici eklenti).
// Kütüphanenin MV3 için koştuğu İKİ ŞART burada bilerek uygulanır:
//   1) manifest'te browser_specific_settings.gecko.id var (eklenti-mv3/manifest.json)
//   2) tarayıcı launchPersistentContext() ile açılır (launch() değil)
// Bu ikisi uygulanmadan MV3 satırı "tutmadı" diye kapatılmaz.
import { firefox } from "playwright";
import pwext from "playwright-webextext";
import { sil } from "./ortak/eklenti-hazirla.mjs";
import { kos } from "./ortak/kosucu.mjs";

const { withExtension } = pwext;

await kos({
  aday: "a",
  adayAdi: "playwright-webextext",
  calistir: async (ctx) => {
    const ikili = firefox.executablePath();
    ctx.sonuc.ikili = ikili;
    ctx.yaz(`firefox ikilisi: ${ikili}`);

    const profil = await ctx.gecici(`profil-a-${ctx.manifest}`);
    ctx.yaz(`tek kullanimlik profil: ${profil}`);
    ctx.temizle.push({ ad: "profil dizini", kapat: async () => sil(profil) });

    const ff = withExtension(firefox, ctx.eklentiDizini);
    let context = null;
    ctx.temizle.push({
      ad: "playwright BrowserContext",
      kapat: async () => {
        if (context) await context.close();
      },
    });

    // --- KUTU 1: yükleme çağrısı (installAddons → RDP installTemporaryAddon) ---
    try {
      context = await ff.launchPersistentContext(profil, {
        headless: true,
        firefoxUserPrefs: {
          "media.autoplay.default": 0,
          "media.autoplay.blocking_policy": 0,
        },
      });
      ctx.sonuc.kutu1 = "E";
      ctx.sonuc.kutu1Kanit =
        `launchPersistentContext çözüldü → ${context.constructor.name}; ` +
        `installAddons() istisna atmadı (RDP installTemporaryAddon başarılı), ` +
        `acik sayfa sayisi=${context.pages().length}`;
      ctx.yaz("KUTU1 E :: " + ctx.sonuc.kutu1Kanit);
    } catch (e) {
      ctx.sonuc.kutu1 = "H";
      ctx.sonuc.kutu1Kanit =
        "launchPersistentContext istisnası: " + ctx.hataMetni(e);
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

    // Sayfayı sür (aday A'da Playwright eli VAR — ama kanıt yine sunucudan okunur).
    const sayfa = context.pages()[0] || (await context.newPage());
    await sayfa.goto(ctx.sunucu.url, { waitUntil: "load", timeout: 30000 });
    ctx.yaz("sayfa acildi: " + ctx.sunucu.url);

    // --- KUTU 3 ---
    const k3 = await ctx.sunucu.bekle(3, 35000);
    ctx.sonuc.kutu3 = k3 ? "E" : "H";
    ctx.sonuc.kutu3Kanit = k3
      ? "işaret sunucusuna düşen istek: " + JSON.stringify(k3)
      : "35 sn içinde /olay?kutu=3 isteği gelmedi (sıfır bayt). " +
        "Sayfa durumu: " +
        (await sayfa
          .evaluate(
            () =>
              document.documentElement.getAttribute("data-baslangic") +
              " / " +
              (document.getElementById("durum") || {}).textContent
          )
          .catch((e) => "okunamadi: " + e.message));
    ctx.sonuc.uretim = k3 ? k3.uretim || "bilinmiyor" : "-";
    ctx.yaz("KUTU3 " + ctx.sonuc.kutu3 + " :: " + ctx.sonuc.kutu3Kanit);
  },
});
