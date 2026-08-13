// Madde 3'ün işaret sunucusu + test sayfası. YENİ dosya — madde 1'in sunucu.mjs'ine
// dokunulmadı (o dosya donmuştur ve kendi kendine oynatan sayfa bu tura uygun değil).
//
// Test betiğinin KENDİ süreci içinde koşar; ayrı kabuk süreci başlatılmaz (G24).
// finally içinde server.close().
import http from "node:http";

export const SAYFA = `<!doctype html>
<html lang="tr">
<head><meta charset="utf-8"><title>Sayac test sayfasi</title></head>
<body>
<h1>Sayac — test sayfasi</h1>
<div id="videolar">
  <video id="v1" width="160" height="120" muted playsinline></video>
</div>
<pre id="durum">hazir</pre>
<script>
(function () {
  var tikler = {};
  function el(id) { return document.getElementById(id); }
  function d(s) { el("durum").textContent = s; }

  // canvas.captureStream ile GERCEK oynatma olayi uretilir; dosya gerekmez.
  window.kaynakVer = function (id) {
    var v = el(id);
    if (!v) return "video yok: " + id;
    var c = document.createElement("canvas");
    c.width = 32; c.height = 32;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#f2c14e";
    ctx.fillRect(0, 0, 32, 32);
    if (tikler[id]) clearInterval(tikler[id]);
    tikler[id] = setInterval(function () { ctx.fillRect(0, 0, 32, 32); }, 100);
    v.srcObject = c.captureStream(10);
    v.muted = true;
    return "tamam";
  };

  window.oynat = function (id) {
    var v = el(id);
    if (!v) return "video yok: " + id;
    var p = v.play();
    if (p && p.catch) p.catch(function (e) { d("oynatma reddi: " + e); });
    return "tamam";
  };

  window.duraklat = function (id) {
    var v = el(id);
    if (!v) return "video yok: " + id;
    v.pause();
    return "tamam";
  };

  // Ayni sekmede IKINCI video (kutu: yeni video acilinca sayac sifirlanmaz)
  window.ikinciVideo = function (id) {
    if (el(id)) return "zaten var";
    var v = document.createElement("video");
    v.id = id;
    v.width = 160; v.height = 120;
    v.muted = true;
    v.setAttribute("playsinline", "");
    el("videolar").appendChild(v);
    return "tamam";
  };

  // Sondaya komut gecirme kanali: icerik betigi sandbox'ta oldugu icin
  // window uzerinden cagrilamaz; DOM ozniteligi ile gecilir.
  window.sayacKomut = function (olay) {
    document.documentElement.setAttribute("data-sayac-komut", olay);
    return "tamam";
  };

  // OTOMATIK KIP — Playwright eli olmayan hucre icin (LibreWolf / web-ext).
  if (location.search.indexOf("otomatik=1") !== -1) {
    var gecen = 0;
    var bekle = setInterval(function () {
      gecen += 200;
      var hazir = document.documentElement.getAttribute("data-sayac-icerik") === "1";
      if (!hazir && gecen < 8000) return;
      clearInterval(bekle);
      d(hazir ? "otomatik: icerik hazir" : "otomatik: ZAMAN ASIMI, yine de suruluyor");
      window.kaynakVer("v1");
      window.oynat("v1");
      setTimeout(function () { window.duraklat("v1"); d("otomatik: duraklatildi"); }, 2500);
      setTimeout(function () { window.oynat("v1"); d("otomatik: tekrar oynatiliyor"); }, 5000);
      setTimeout(function () { window.duraklat("v1"); d("otomatik: bitti"); }, 7500);
    }, 200);
  }
})();
</script>
</body>
</html>`;

export async function sunucuBaslat(yaz = () => {}) {
  const olaylar = [];
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, "http://127.0.0.1");
    if (u.pathname === "/sayac.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(SAYFA);
      return;
    }
    // Üç işaret ucu. ACAO farkı karşıt deney (Y8) için gereklidir:
    // istek sunucuya ULAŞIR ama izin yoksa fetch YANIT tarafında düşer.
    if (u.pathname === "/olay" || u.pathname === "/olay-acao") {
      const kayit = Object.fromEntries(u.searchParams);
      kayit.uc = u.pathname;
      kayit.ms = Date.now();
      olaylar.push(kayit);
      res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
      res.end();
      return;
    }
    if (u.pathname === "/olay-kapali") {
      const kayit = Object.fromEntries(u.searchParams);
      kayit.uc = u.pathname;
      kayit.ms = Date.now();
      olaylar.push(kayit);
      res.writeHead(204); // ACAO YOK — bilerek
      res.end();
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("yok");
  });

  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  yaz(`isaret sunucusu ayakta: http://127.0.0.1:${port}`);

  return {
    port,
    olaylar,
    url: `http://127.0.0.1:${port}/sayac.html`,
    async kapat() {
      await new Promise((r) => server.close(r));
      yaz("isaret sunucusu kapatildi");
    },
  };
}
