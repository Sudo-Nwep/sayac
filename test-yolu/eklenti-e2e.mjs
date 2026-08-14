// Yerel uçtan uca hücreler: Y1..Y7. Argümanla seçilir.
//   node test-yolu/eklenti-e2e.mjs Y1 [headed]
import {
  tarayiciliHucre, hazirBekle, faz, fazKontrol, fazYaz, anlik, yeniAnlik,
  cetvelB, bekle, hataMetni, FAZ_MS, TOLERANS_MS,
} from "./ortak/hucre.mjs";

const HUCRE = (process.argv[2] || "Y1").toUpperCase();
const HEADED = process.argv[3] === "headed";

function bitir(sonuc, sorunlar) {
  sonuc.sorunlar = sorunlar;
  sonuc.durum = sorunlar.length === 0 ? "YESIL" : "KIRMIZI";
}

async function sayfaAc(context, url, yaz, etiket) {
  const sayfa = context.pages()[0] && etiket === "A" ? context.pages()[0] : await context.newPage();
  await sayfa.goto(url, { waitUntil: "load", timeout: 30000 });
  const h = await hazirBekle(sayfa);
  yaz(`sayfa ${etiket}: ${url} · hazir=${h.hazir}${h.hazir ? "" : " — " + h.sebep}`);
  if (h.hazir) yaz(`   ilk anlik goruntu: ${JSON.stringify(h.ilk)}`);
  return { sayfa, hazir: h };
}

// ---------------------------------------------------------------- Y1 / Y7
async function y1(ctx, mvSurum) {
  const { context, sunucu, yaz, sonuc } = ctx;
  const { sayfa, hazir } = await sayfaAc(context, sunucu.url, yaz, "A");
  if (!hazir.hazir) {
    sonuc.sebep = `eklenti hazir olmadi: ${hazir.sebep}`;
    return;
  }
  await sayfa.evaluate(() => window.kaynakVer("v1"));
  const sorunlar = [];

  const f1 = await faz(sayfa, "oynat", () => sayfa.evaluate(() => window.oynat("v1")));
  fazYaz(yaz, f1, "izleniyor");
  sorunlar.push(...fazKontrol(f1, "izleniyor").map((s) => `[oynat] ${s}`));
  if (f1.cetvelB && f1.cetvelB.paused !== false)
    sorunlar.push(`[oynat] CETVEL B: video.paused=${f1.cetvelB.paused}, false olmaliydi`);

  const f2 = await faz(sayfa, "duraklat", () => sayfa.evaluate(() => window.duraklat("v1")));
  fazYaz(yaz, f2, "duraklatildi");
  sorunlar.push(...fazKontrol(f2, "duraklatildi").map((s) => `[duraklat] ${s}`));
  if (f2.cetvelB && f2.cetvelB.paused !== true)
    sorunlar.push(`[duraklat] CETVEL B: video.paused=${f2.cetvelB.paused}, true olmaliydi`);

  const f3 = await faz(sayfa, "tekrar oynat", () => sayfa.evaluate(() => window.oynat("v1")));
  fazYaz(yaz, f3, "izleniyor");
  sorunlar.push(...fazKontrol(f3, "izleniyor").map((s) => `[tekrar oynat] ${s}`));

  sonuc.olcumler = [f1, f2, f3].map((f) => ({ ad: f.ad, dAn: f.dAn, d: f.d, durum: f.g2 && f.g2.durumAdi, cetvelB: f.cetvelB }));
  sonuc.manifestSurumu = mvSurum;
  bitir(sonuc, sorunlar);
}

// ---------------------------------------------------------------- Y2
async function y2(ctx) {
  const { context, sunucu, yaz, sonuc } = ctx;
  const a = await sayfaAc(context, sunucu.url, yaz, "A");
  if (!a.hazir.hazir) { sonuc.sebep = `A hazir olmadi: ${a.hazir.sebep}`; return; }
  await a.sayfa.evaluate(() => window.kaynakVer("v1"));
  await a.sayfa.evaluate(() => window.oynat("v1"));
  yaz("A oynatiliyor — B acilmadan once 3000 ms birikiyor (farkli sureler)");
  await bekle(3000);

  const b = await sayfaAc(context, sunucu.url, yaz, "B");
  if (!b.hazir.hazir) { sonuc.sebep = `B hazir olmadi: ${b.hazir.sebep}`; return; }
  await b.sayfa.evaluate(() => window.kaynakVer("v1"));
  // B DURAKLI kalir: ayni anda A izleniyor, B duraklatildi olmali.
  await bekle(500);

  const sorunlar = [];
  const [fa, fb] = await Promise.all([
    faz(a.sayfa, "A: oynuyor", null),
    faz(b.sayfa, "B: durakli", null),
  ]);
  fazYaz(yaz, fa, "izleniyor");
  fazYaz(yaz, fb, "duraklatildi");
  sorunlar.push(...fazKontrol(fa, "izleniyor").map((s) => `[A] ${s}`));
  sorunlar.push(...fazKontrol(fb, "duraklatildi").map((s) => `[B] ${s}`));

  const idA = fa.g2 && fa.g2.sekmeId;
  const idB = fb.g2 && fb.g2.sekmeId;
  yaz(`sekmeId A=${idA} · B=${idB} · farkli mi: ${idA !== idB}`);
  if (idA === idB) sorunlar.push(`sekmeId'ler ayni (${idA}) — sekme basina ayrilma yok`);

  const tA = fa.g2 && fa.g2.toplam;
  const tB = fb.g2 && fb.g2.toplam;
  yaz(`KUMULATIF A: ${JSON.stringify(tA)}`);
  yaz(`KUMULATIF B: ${JSON.stringify(tB)}`);
  if (tA && tB) {
    const fark = tA.izleniyor - tB.izleniyor;
    yaz(`A.izleniyor - B.izleniyor = ${fark} ms (A ~3000 ms once oynamaya basladi)`);
    if (tB.izleniyor !== 0) sorunlar.push(`B.izleniyor=${tB.izleniyor}, 0 olmaliydi (B hic oynamadi)`);
    if (fark <= 0) sorunlar.push(`A ve B toplamlari ayrismadi (fark=${fark})`);
  }
  sonuc.sekmeler = { A: { sekmeId: idA, toplam: tA }, B: { sekmeId: idB, toplam: tB } };
  sonuc.olcumler = [fa, fb].map((f) => ({ ad: f.ad, dAn: f.dAn, d: f.d, sekmeId: f.g2 && f.g2.sekmeId, cetvelB: f.cetvelB }));
  bitir(sonuc, sorunlar);
}

// ---------------------------------------------------------------- Y3
async function y3(ctx) {
  const { context, sunucu, yaz, sonuc } = ctx;
  const { sayfa, hazir } = await sayfaAc(context, sunucu.url, yaz, "A");
  if (!hazir.hazir) { sonuc.sebep = `hazir olmadi: ${hazir.sebep}`; return; }
  const sorunlar = [];

  await sayfa.evaluate(() => window.kaynakVer("v1"));
  const f1 = await faz(sayfa, "ilk video oynuyor", () => sayfa.evaluate(() => window.oynat("v1")));
  fazYaz(yaz, f1, "izleniyor");
  sorunlar.push(...fazKontrol(f1, "izleniyor").map((s) => `[ilk video] ${s}`));
  const onceki = f1.g2 && f1.g2.toplam;
  yaz(`ONCESI kumulatif: ${JSON.stringify(onceki)}`);

  // Video degistir: ilkini duraklat, IKINCI <video> yarat ve onu oynat.
  await sayfa.evaluate(() => window.duraklat("v1"));
  await sayfa.evaluate(() => window.ikinciVideo("v2"));
  await sayfa.evaluate(() => window.kaynakVer("v2"));
  yaz("ayni sekmede IKINCI <video> yaratildi (v2) — yakalama fazi onu da gormeli");

  const f2 = await faz(sayfa, "ikinci video oynuyor", () => sayfa.evaluate(() => window.oynat("v2")), { videoId: "v2" });
  fazYaz(yaz, f2, "izleniyor");
  sorunlar.push(...fazKontrol(f2, "izleniyor").map((s) => `[ikinci video] ${s}`));
  const sonraki = f2.g2 && f2.g2.toplam;
  yaz(`SONRASI kumulatif: ${JSON.stringify(sonraki)}`);

  if (onceki && sonraki) {
    yaz(`ONCESI.izleniyor=${onceki.izleniyor} → SONRASI.izleniyor=${sonraki.izleniyor} (sifirlanmadi mi: ${sonraki.izleniyor > onceki.izleniyor})`);
    if (sonraki.izleniyor <= onceki.izleniyor)
      sorunlar.push(`yeni videoda sayac SIFIRLANDI: ${onceki.izleniyor} → ${sonraki.izleniyor}`);
  }
  sonuc.oncesiSonrasi = { oncesi: onceki, sonrasi: sonraki };
  sonuc.olcumler = [f1, f2].map((f) => ({ ad: f.ad, dAn: f.dAn, d: f.d, cetvelB: f.cetvelB }));
  bitir(sonuc, sorunlar);
}

// ---------------------------------------------------------------- Y4
async function y4(ctx) {
  const { context, sunucu, yaz, sonuc } = ctx;
  const a = await sayfaAc(context, sunucu.url, yaz, "A");
  if (!a.hazir.hazir) { sonuc.sebep = `hazir olmadi: ${a.hazir.sebep}`; return; }
  await a.sayfa.evaluate(() => window.kaynakVer("v1"));
  await a.sayfa.evaluate(() => window.oynat("v1"));

  const on = await cetvelB(a.sayfa);
  yaz(`arkaya almadan once visibilityState=${on.visibilityState}`);

  // ── ÜÇ YOL, SIRAYLA — ilki "hidden" verince dur. Taklit YASAK: visibilityState
  // ezilmez, visibilitychange elle dispatch edilmez. Her yolun ÖLÇÜLEN değeri yazılır.
  const yollar = [];
  const gorunurlukOku = () =>
    a.sayfa.evaluate(() => document.visibilityState).catch((e) => "okunamadi: " + hataMetni(e));

  // Y4a — AYNI PENCEREDE ikinci sekme (sayfadan window.open).
  // Firefox varsayılanı browser.link.open_newwindow=3 → yeni SEKME, odak ona geçer.
  // Bu düzenek bu depoda çalışıyor: arayuz-e2e.mjs:186 ve arayuz-izin.mjs:60.
  let gorunurluk = "denenmedi";
  try {
    const acRet = await a.sayfa.evaluate((u) => {
      try {
        window.__y4 = window.open(u, "_blank");
        return window.__y4 ? "pencere nesnesi dondu" : "null — engellendi";
      } catch (e) {
        return "istisna: " + (e && e.message ? e.message : String(e));
      }
    }, sunucu.url + "?bos=1");
    await bekle(1200);
    gorunurluk = await gorunurlukOku();
    yollar.push({ yol: "Y4a window.open (ayni pencerede sekme)", komut: 'window.open(url,"_blank")', donus: acRet, olculenVisibilityState: gorunurluk });
    yaz(`Y4a window.open → ${acRet} · OLCULEN visibilityState="${gorunurluk}"`);
  } catch (e) {
    yollar.push({ yol: "Y4a window.open (ayni pencerede sekme)", birebirHata: hataMetni(e), olculenVisibilityState: "olculemedi" });
    yaz(`Y4a DUSTU — birebir hata: ${hataMetni(e)}`);
  }

  // Y4b — sondadan tabs.create({active:true}). İzin YALNIZ test kopyasına verildi
  // (eklenti-testi.mjs ekIzinler); eklenti/manifest.json DEĞİŞMEDİ.
  if (gorunurluk !== "hidden") {
    try {
      await a.sayfa.evaluate((u) => {
        document.documentElement.setAttribute("data-sayac-sekme-ac", u);
      }, sunucu.url + "?bos=2");
      await bekle(2000);
      gorunurluk = await gorunurlukOku();
      const komutSonuc = await a.sayfa
        .evaluate(() => document.documentElement.getAttribute("data-sayac-sekme-sonuc") || "yanit yok")
        .catch(() => "okunamadi");
      yollar.push({ yol: "Y4b sonda tabs.create({active:true})", komut: "data-sayac-sekme-ac ozniteligi", donus: komutSonuc, olculenVisibilityState: gorunurluk });
      yaz(`Y4b tabs.create → ${komutSonuc} · OLCULEN visibilityState="${gorunurluk}"`);
    } catch (e) {
      yollar.push({ yol: "Y4b sonda tabs.create({active:true})", birebirHata: hataMetni(e), olculenVisibilityState: "olculemedi" });
      yaz(`Y4b DUSTU — birebir hata: ${hataMetni(e)}`);
    }
  } else {
    yollar.push({ yol: "Y4b sonda tabs.create({active:true})", atlandi: "Y4a zaten hidden verdi" });
  }

  // Y4c — eski yol: ayrı pencere + bringToFront. headed tekrarı eklenti-kosum.mjs:102-108
  // kelepçesiyle yapılır; sebep dizesindeki "arka plana alinamadi" ifadesi KORUNUR.
  if (gorunurluk !== "hidden") {
    try {
      const b = await context.newPage();
      await b.goto("about:blank", { waitUntil: "load", timeout: 15000 });
      await b.bringToFront();
      await bekle(600);
      gorunurluk = await gorunurlukOku();
      yollar.push({ yol: "Y4c newPage + bringToFront", komut: "context.newPage() + bringToFront()", olculenVisibilityState: gorunurluk });
      yaz(`Y4c newPage+bringToFront → OLCULEN visibilityState="${gorunurluk}"`);
    } catch (e) {
      yollar.push({ yol: "Y4c newPage + bringToFront", birebirHata: hataMetni(e), olculenVisibilityState: "olculemedi" });
      yaz(`Y4c DUSTU — birebir hata: ${hataMetni(e)}`);
    }
  } else {
    yollar.push({ yol: "Y4c newPage + bringToFront", atlandi: "onceki yol zaten hidden verdi" });
  }

  yaz(`OLCULEN document.visibilityState (A sekmesi) = "${gorunurluk}" · headless=${!HEADED}`);
  sonuc.visibilityState = gorunurluk;
  sonuc.yollar = yollar;

  if (gorunurluk !== "hidden") {
    // Kutu ÖLÇÜLEMEDİ — ama boş bırakılmaz: ölçülebilen kısım yine kaydedilir.
    // İkinci sekme yaratıldı ve öne alındı; A sekmesi ön planda DEĞİL. Sayaç bu
    // koşulda ilerliyor mu — bu ölçülebilir ve ölçülüyor.
    const kismi = await faz(a.sayfa, "onde olmayan sekmede oynuyor", null);
    fazYaz(yaz, kismi, "izleniyor");
    const kismiSorun = fazKontrol(kismi, "izleniyor");
    sonuc.durum = "ölçülemedi";
    sonuc.sebep = `sekme arka plana alinamadi — olculen visibilityState: "${gorunurluk}" (headless=${!HEADED})`;
    sonuc.kismiOlcum = {
      not: "visibilityState 'hidden' YAPILAMADI; asagidaki rakam yalnizca 'A sekmesi one alinmis DEGIL' kosulunda olculdu — 'arka plandaki sekme' kanIti DEGILDIR",
      ad: kismi.ad, dAn: kismi.dAn, d: kismi.d, cetvelB: kismi.cetvelB, sorunlar: kismiSorun,
    };
    sonuc.onSekmeSayisi = context.pages().length;
    yaz("KUTU OLCULEMEDI: " + sonuc.sebep);
    yaz(`  KISMI OLCUM (kanit DEGIL): one alinmamis sekmede Δizleniyor=${kismi.d.izleniyor} Δan=${kismi.dAn} · tolerans sorunu: ${kismiSorun.length ? kismiSorun.join("; ") : "yok"}`);
    return;
  }

  const sorunlar = [];
  const f = await faz(a.sayfa, "arka planda oynuyor", null);
  fazYaz(yaz, f, "izleniyor");
  sorunlar.push(...fazKontrol(f, "izleniyor").map((s) => `[arka plan] ${s}`));
  const son = await a.sayfa.evaluate(() => document.visibilityState).catch(() => "okunamadi");
  yaz(`olcum sonunda visibilityState hala = "${son}"`);
  if (son !== "hidden") sorunlar.push(`olcum sirasinda sekme one geldi (visibilityState=${son})`);
  sonuc.olcumler = [{ ad: f.ad, dAn: f.dAn, d: f.d, cetvelB: f.cetvelB, visibilityState: son }];
  bitir(sonuc, sorunlar);
}

// ---------------------------------------------------------------- Y5
async function y5(ctx) {
  const { context, sunucu, yaz, sonuc } = ctx;
  const { sayfa, hazir } = await sayfaAc(context, sunucu.url, yaz, "A");
  if (!hazir.hazir) { sonuc.sebep = `hazir olmadi: ${hazir.sebep}`; return; }
  const sorunlar = [];

  await sayfa.evaluate(() => window.kaynakVer("v1"));
  const f1 = await faz(sayfa, "devir oncesi oynuyor", () => sayfa.evaluate(() => window.oynat("v1")));
  fazYaz(yaz, f1, "izleniyor");
  sorunlar.push(...fazKontrol(f1, "izleniyor").map((s) => `[devir oncesi] ${s}`));

  const once = f1.g2;
  yaz(`ONCESI: toplam=${JSON.stringify(once.toplam)} gunBasiMs=${once.gunBasiMs} (${new Date(once.gunBasiMs).toISOString()}) anMs=${once.anMs} (${new Date(once.anMs).toISOString()})`);

  // Gun donumunu bekle: gunBasiMs DEGISMELI. Gercek 00:00 BEKLENMEZ — kayma sondadadir.
  yaz("gun donumu bekleniyor (gunBasiMs degisimi)...");
  const bitisSuresi = Date.now() + 40000;
  let sonra = null;
  while (Date.now() < bitisSuresi) {
    const g = await anlik(sayfa);
    if (g && g.gunBasiMs > once.gunBasiMs) { sonra = g; break; }
    await bekle(200);
  }
  if (!sonra) {
    sonuc.durum = "ölçülemedi";
    sonuc.sebep = "40 sn icinde gunBasiMs degismedi — gun donumu yakalanamadi";
    yaz("KUTU OLCULEMEDI: " + sonuc.sebep);
    return;
  }
  yaz(`SONRASI: toplam=${JSON.stringify(sonra.toplam)} gunBasiMs=${sonra.gunBasiMs} (${new Date(sonra.gunBasiMs).toISOString()}) anMs=${sonra.anMs}`);
  yaz(`gunBasiMs degisimi: ${sonra.gunBasiMs - once.gunBasiMs} ms (86400000 = 1 gun)`);
  yaz(`kelepceSayisi: once=${once.kelepceSayisi} sonra=${sonra.kelepceSayisi}`);

  if (!(sonra.toplam.izleniyor < once.toplam.izleniyor))
    sorunlar.push(`sifirlama olmadi: once.izleniyor=${once.toplam.izleniyor} sonra=${sonra.toplam.izleniyor}`);
  if (sonra.toplam.duraklatildi !== 0 || sonra.toplam.mola !== 0)
    sorunlar.push(`diger kovalar sifirlanmadi: ${JSON.stringify(sonra.toplam)}`);

  // Sifirdan devam ediyor mu?
  const f2 = await faz(sayfa, "devir sonrasi oynuyor", null);
  fazYaz(yaz, f2, "izleniyor");
  sorunlar.push(...fazKontrol(f2, "izleniyor").map((s) => `[devir sonrasi] ${s}`));
  if (f2.g2 && f2.g2.durumAdi !== "İZLENİYOR")
    sorunlar.push(`devir sonrasi durum "${f2.g2.durumAdi}", "İZLENİYOR" olmaliydi`);

  sonuc.geceYarisi = {
    oncesi: { toplam: once.toplam, gunBasiMs: once.gunBasiMs, anMs: once.anMs, durumAdi: once.durumAdi },
    sonrasi: { toplam: sonra.toplam, gunBasiMs: sonra.gunBasiMs, anMs: sonra.anMs, durumAdi: sonra.durumAdi },
    gunBasiFarki: sonra.gunBasiMs - once.gunBasiMs,
    kelepceSayisi: sonra.kelepceSayisi,
  };
  sonuc.olcumler = [f1, f2].map((f) => ({ ad: f.ad, dAn: f.dAn, d: f.d, cetvelB: f.cetvelB }));
  bitir(sonuc, sorunlar);
}

// ---------------------------------------------------------------- Y6
async function y6(ctx) {
  const { context, sunucu, yaz, sonuc } = ctx;
  const { sayfa, hazir } = await sayfaAc(context, sunucu.url, yaz, "A");
  if (!hazir.hazir) { sonuc.sebep = `hazir olmadi: ${hazir.sebep}`; return; }
  const sorunlar = [];

  await sayfa.evaluate(() => window.kaynakVer("v1"));
  const f1 = await faz(sayfa, "mola oncesi oynuyor", () => sayfa.evaluate(() => window.oynat("v1")));
  fazYaz(yaz, f1, "izleniyor");
  sorunlar.push(...fazKontrol(f1, "izleniyor").map((s) => `[mola oncesi] ${s}`));

  // ARAYUZ DEGIL — urunun mesaj API'sine "mola-aç" olayi gonderiliyor.
  const f2 = await faz(sayfa, "mola acik", async () => {
    await sayfa.evaluate(() => window.sayacKomut("mola-aç"));
    await bekle(400);
  });
  fazYaz(yaz, f2, "mola");
  sorunlar.push(...fazKontrol(f2, "mola").map((s) => `[mola acik] ${s}`));
  if (f2.g2 && f2.g2.durumAdi !== "MOLA")
    sorunlar.push(`mola acikken durum "${f2.g2.durumAdi}", "MOLA" olmaliydi`);

  // ⚠️ MADDE 4'TE EKLENDİ — kontrol GÜÇLENDİRİLDİ, gevşetilmedi:
  // MOLA artık oynayan videoyu GERÇEKTEN duraklatır (SAYAC_TEKLIF.md:50-51).
  // Sayfa gerçeğinden okunur, ürünün raporundan değil (K09).
  if (f2.cetvelB && f2.cetvelB.paused !== true)
    sorunlar.push(`[mola acik] video.paused=${f2.cetvelB.paused}, true olmaliydi — URUN videoyu duraklatmadi`);
  sonuc.videoDuraklatma = f2.cetvelB ? { paused: f2.cetvelB.paused, currentTime: f2.cetvelB.currentTime } : null;

  // ⚠️ BEKLENEN KOVA DEGISTI — tolerans DEGISMEDI.
  // Tur 003'te "mola-aç" yalnizca KAYDEDILIYORDU (EKLENTI.md:230-233), video oynamaya
  // devam ediyordu, bu yuzden mola kapaninca ilerleyen kova "izleniyor" idi.
  // Madde 4'te urun videoyu duraklatiyor → mola kapaninca gorunen durum DURAKLATILDI
  // olur ve ilerleyen kova "duraklatildi"dir. Kaynak: SAYAC_TEKLIF.md:50-51 + :55.
  // Ayrica durumAdi kontrolu EKLENDI (once yoktu) → hucre guclendi.
  const f3 = await faz(sayfa, "mola kapali", async () => {
    await sayfa.evaluate(() => window.sayacKomut("mola-kapat"));
    await bekle(400);
  });
  fazYaz(yaz, f3, "duraklatildi");
  sorunlar.push(...fazKontrol(f3, "duraklatildi").map((s) => `[mola kapali] ${s}`));
  if (f3.g2 && f3.g2.durumAdi !== "DURAKLATILDI")
    sorunlar.push(`[mola kapali] durum "${f3.g2.durumAdi}", "DURAKLATILDI" olmaliydi (video devam ETTIRILMEZ karari)`);
  if (f3.cetvelB && f3.cetvelB.paused !== true)
    sorunlar.push(`[mola kapali] video.paused=${f3.cetvelB.paused} — karar geregi hala true olmaliydi`);

  // ── DUR / DEVAM ET davranisi (madde 4, kriter 4) ──
  // Arayuz butonuna Playwright ile tiklanamadi (dort yol olculerek dustu, ARAYUZ.md).
  // Bu yuzden ayni davranis mesaj API'si yolundan olculur. ARAYUZ DEGIL, DAVRANIS.
  await sayfa.evaluate(() => window.oynat("v1"));
  await bekle(400);
  const f4 = await faz(sayfa, "ana kapali", async () => {
    await sayfa.evaluate(() => window.sayacKomut("ana-kapat"));
    await bekle(400);
  });
  fazYaz(yaz, f4, null); // UCU DE tam 0 beklenir
  sorunlar.push(...fazKontrol(f4, null).map((s) => `[ana kapali] ${s}`));
  if (f4.g2 && f4.g2.durumAdi !== "KAPALI")
    sorunlar.push(`[ana kapali] durum "${f4.g2.durumAdi}", "KAPALI" olmaliydi`);
  // CANLILIK: "her sey durdu" ile "baglanti koptu" ayni rakami verir → Δan olculur.
  const canli = f4.dAn > 2000;
  yaz(`  CANLILIK (ana kapali): Δan=${f4.dAn} ms → ${canli ? "arka plan CANLI" : "OLCULEMEDI"}`);
  if (!canli) sorunlar.push(`[ana kapali] canlilik kanitlanamadi: Δan=${f4.dAn} ms (>2000 gerekir)`);

  const T1 = f4.g2 ? f4.g2.toplam : null;
  const f5 = await faz(sayfa, "ana tekrar acik", async () => {
    await sayfa.evaluate(() => window.sayacKomut("ana-kapat")); // TEK toggle
    await bekle(400);
  });
  fazYaz(yaz, f5, "izleniyor");
  sorunlar.push(...fazKontrol(f5, "izleniyor").map((s) => `[ana tekrar acik] ${s}`));
  if (f5.g2 && f5.g2.durumAdi !== "İZLENİYOR")
    sorunlar.push(`[ana tekrar acik] durum "${f5.g2.durumAdi}", "İZLENİYOR" olmaliydi`);
  const T2 = f5.g2 ? f5.g2.toplam : null;
  if (T1 && T2) {
    yaz(`  KUMULATIF T1=${JSON.stringify(T1)} → T2=${JSON.stringify(T2)} (sifirlanmadi mi: ${T2.izleniyor >= T1.izleniyor})`);
    sonuc.anaKapatKumulatif = { T1, T2, sifirlanmadi: T2.izleniyor >= T1.izleniyor };
    if (T2.izleniyor < T1.izleniyor) sorunlar.push(`[ana tekrar acik] kumulatif SIFIRLANDI: ${T1.izleniyor} → ${T2.izleniyor}`);
  }

  sonuc.olcumler = [f1, f2, f3, f4, f5].map((f) => ({ ad: f.ad, dAn: f.dAn, d: f.d, durum: f.g2 && f.g2.durumAdi, cetvelB: f.cetvelB }));
  bitir(sonuc, sorunlar);
}

// ---------------------------------------------------------------- dagitim
const KAYMA_Y5 = (() => {
  const now = Date.now();
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  let hedef = d.getTime() + 86400000 - 25000; // bugun 23:59:35
  if (hedef <= now) hedef += 86400000;
  return hedef - now;
})();

const TANIM = {
  Y1: { hazirlik: { manifestSurumu: 2 }, calistir: (c) => y1(c, 2) },
  Y2: { hazirlik: { manifestSurumu: 2 }, calistir: y2 },
  Y3: { hazirlik: { manifestSurumu: 2 }, calistir: y3 },
  // ekIzinler YALNIZ test kopyasina girer (eklenti-testi.mjs); eklenti/manifest.json
  // DEGISMEZ. Y4b'nin tabs.create'i icin gerekli.
  Y4: { hazirlik: { manifestSurumu: 2, ekIzinler: ["tabs"] }, calistir: y4 },
  Y5: { hazirlik: { manifestSurumu: 2, kaymaMs: KAYMA_Y5 }, calistir: y5 },
  Y6: { hazirlik: { manifestSurumu: 2 }, calistir: y6 },
  Y7: { hazirlik: { manifestSurumu: 3 }, calistir: (c) => y1(c, 3) },
};

const t = TANIM[HUCRE];
if (!t) {
  process.stdout.write(`bilinmeyen hucre: ${HUCRE}\n`);
  process.exit(2);
}
await tarayiciliHucre({
  hucre: HUCRE + (HEADED ? "-headed" : ""),
  hazirlik: t.hazirlik,
  headless: !HEADED,
  calistir: t.calistir,
});
