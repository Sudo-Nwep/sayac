// İşaret sunucusu — üç adayın da aynı cetvelle ölçülmesini sağlar.
// Test betiğinin KENDİ süreci içinde koşar; ayrı kabuk süreci başlatılmaz (G24).
import http from "node:http";

export const TEST_HTML = `<!doctype html>
<html lang="tr">
<head><meta charset="utf-8"><title>Sayac sinama sayfasi</title></head>
<body>
<h1>Sayac — sinama sayfasi</h1>
<video id="v" width="160" height="120" muted playsinline></video>
<pre id="durum">baslamadi</pre>
<script>
(function () {
  var v = document.getElementById("v");
  var d = document.getElementById("durum");
  var oynatildi = false;
  v.addEventListener("play", function () { oynatildi = true; d.textContent = "play olayi ucti"; });

  // Merdiven 1 — GERCEK oynatma olayi (canvas.captureStream, dosya gerekmez)
  function merdiven1() {
    try {
      var c = document.createElement("canvas");
      c.width = 32; c.height = 32;
      var ctx = c.getContext("2d");
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(0, 0, 32, 32);
      setInterval(function () { ctx.fillRect(0, 0, 32, 32); }, 100);
      var s = c.captureStream(10);
      v.srcObject = s;
      v.muted = true;
      v.setAttribute("data-uretim", "gercek");
      var p = v.play();
      if (p && p.catch) p.catch(function (e) { d.textContent = "oynatma reddi: " + e; });
    } catch (e) {
      d.textContent = "merdiven1 hatasi: " + e;
    }
  }

  // Merdiven 2 — 5 sn icinde gercek olay gelmediyse SENTETIK olay
  function merdiven2() {
    if (oynatildi) return;
    v.setAttribute("data-uretim", "sentetik");
    v.dispatchEvent(new Event("play"));
  }

  // Icerik betigi baglanana kadar bekle (en fazla 8 sn), sonra oynat.
  var gecen = 0;
  var t = setInterval(function () {
    gecen += 200;
    var hazir = document.documentElement.getAttribute("data-eklenti-hazir") === "1";
    if (hazir || gecen >= 8000) {
      clearInterval(t);
      document.documentElement.setAttribute("data-baslangic", hazir ? "eklenti-hazir" : "zaman-asimi");
      merdiven1();
      setTimeout(merdiven2, 5000);
    }
  }, 200);
})();
</script>
</body>
</html>`;

export async function sunucuBaslat(yaz = () => {}) {
  const olaylar = [];
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, "http://127.0.0.1");
    if (u.pathname === "/test.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(TEST_HTML);
      return;
    }
    if (u.pathname === "/olay") {
      const kayit = Object.fromEntries(u.searchParams);
      kayit.ms = Date.now();
      olaylar.push(kayit);
      yaz("ISARET <- " + JSON.stringify(kayit));
      res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
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
    url: `http://127.0.0.1:${port}/test.html`,
    // Belirli bir kutunun işareti gelene kadar bekle. Gelmezse null döner.
    async bekle(kutu, sureMs) {
      const bitis = Date.now() + sureMs;
      while (Date.now() < bitis) {
        const e = olaylar.find((o) => o.kutu === String(kutu));
        if (e) return e;
        await new Promise((r) => setTimeout(r, 200));
      }
      return null;
    },
    async kapat() {
      await new Promise((r) => server.close(r));
      yaz("isaret sunucusu kapatildi");
    },
  };
}
