// Her aday hücresinin ortak iskelesi.
// G24: sert 120 sn sayaç · G23: teşhis için başlatılan her şey finally'de kapatılır.
import fs from "node:fs";
import path from "node:path";
import { sunucuBaslat } from "./sunucu.mjs";
import { eklentiHazirla, gecici, sil, TEST_YOLU_KOK } from "./eklenti-hazirla.mjs";

export const SERT_SURE_MS = 120000;
export const KANIT_DIZINI = path.join(TEST_YOLU_KOK, "kanit");

export function hataMetni(e) {
  if (!e) return "";
  if (e instanceof Error) return `${e.name}: ${e.message}\n${e.stack || ""}`.trim();
  try {
    return typeof e === "string" ? e : JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export async function kos({ aday, adayAdi, calistir }) {
  const manifest = process.argv[2] === "mv3" ? "mv3" : "mv2";
  const t0 = Date.now();
  const yaz = (s) => {
    const satir = `[+${String(Date.now() - t0).padStart(6, "0")}ms] ${s}`;
    process.stdout.write(satir + "\n");
  };

  const sonuc = {
    aday,
    adayAdi,
    manifest,
    ikili: "",
    kutu1: "ölçülemedi",
    kutu1Kanit: "",
    kutu2: "ölçülemedi",
    kutu2Kanit: "",
    kutu3: "ölçülemedi",
    kutu3Kanit: "",
    uretim: "-",
    tani: "",
    hata: "",
    sureMs: 0,
  };

  const temizle = [];
  let sunucu = null;
  let eklentiDizini = null;
  let bittiFlag = false;

  const zamanAsimi = new Promise((_, red) =>
    setTimeout(() => {
      if (!bittiFlag) red(new Error(`SERT SAYAC: ${SERT_SURE_MS} ms doldu`));
    }, SERT_SURE_MS)
  );

  try {
    yaz(`aday=${aday} (${adayAdi}) manifest=${manifest}`);
    sunucu = await sunucuBaslat(yaz);
    eklentiDizini = await eklentiHazirla({ manifest, port: sunucu.port, aday });
    yaz(`eklenti gecici kopya: ${eklentiDizini}`);

    const ctx = {
      yaz,
      sonuc,
      sunucu,
      manifest,
      aday,
      eklentiDizini,
      gecici,
      temizle, // { ad, kapat: async () => {} } listesi
      hataMetni,
    };

    await Promise.race([calistir(ctx), zamanAsimi]);
  } catch (e) {
    sonuc.hata = hataMetni(e);
    yaz("HATA: " + sonuc.hata);
  } finally {
    bittiFlag = true;
    // G23 — teşhis için başlatılan her şey, her koşulda kapatılır.
    for (const t of temizle.reverse()) {
      try {
        yaz(`kapatiliyor: ${t.ad}`);
        await Promise.race([
          t.kapat(),
          new Promise((r) => setTimeout(r, 15000)),
        ]);
      } catch (e) {
        yaz(`kapatma hatasi (${t.ad}): ${hataMetni(e)}`);
      }
    }
    if (sunucu) {
      try {
        await sunucu.kapat();
      } catch {}
      sonuc.isaretler = sunucu.olaylar;
      const tani = sunucu.olaylar.filter((o) => o.tani).map((o) => o.tani);
      sonuc.tani = tani.length ? tani.join(",") : "icerik betigi hic yuklenmedi";
    }
    if (eklentiDizini) await sil(eklentiDizini);

    sonuc.sureMs = Date.now() - t0;
    fs.mkdirSync(KANIT_DIZINI, { recursive: true });
    fs.writeFileSync(
      path.join(KANIT_DIZINI, `aday-${aday}-${manifest}.json`),
      JSON.stringify(sonuc, null, 2),
      "utf8"
    );
    yaz("SONUC " + JSON.stringify(sonuc));
    // Kalan zamanlayıcılar süreci ayakta tutmasın.
    setTimeout(() => process.exit(0), 500).unref();
  }
}
