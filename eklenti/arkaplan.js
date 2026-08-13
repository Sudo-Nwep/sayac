// Sayaç — arka plan. Sekme başına bir durum örneği, TEK saat, gece yarısı nöbeti.
//
// Sayaç mantığı BURADA YAZILMAZ. Doğruluğun tek kaynağı mantik/sayac.mjs'tir; bu
// eklentinin kullandığı sürüm ondan üretilir (sayac.js) ve senkronluğu SHA-256 ile
// kanıtlanır: `npm run eklenti:kontrol`.
//
// Zaman damgasını YALNIZ burası basar. İçerik betiği "ne oldu" der, "ne zaman" demez —
// iki ayrı saat çakışırsa uygula() RangeError fırlatır (mantik/sayac.mjs:137-141).
//
// Ürün HİÇBİR ağ çağrısı yapmaz, hiçbir yere veri yazmaz (SAYAC_TEKLIF.md:44).

var API = typeof browser !== "undefined" ? browser : chrome;

var sekmeler = new Map(); // sekmeId -> sayac.js durumu (donmuş nesne)
var arkaPlanBaslangicMs = Date.now();
var sonGunBasi = gunBasi(Date.now());
var kelepceSayisi = 0; // saat geriye gitti / gece yarısı damgası kelepçelendi

// Yerel gün başlangıcı. ARGÜMANLI new Date(ms) — Date.now() kaymasından etkilenmez.
function gunBasi(ms) {
  var d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Saat geriye giderse (NTP düzeltmesi) kelepçele: uygula() geriye giden zamanda fırlatır.
function simdi(durum) {
  var t = Date.now();
  if (durum && t < durum.t) {
    kelepceSayisi++;
    console.warn("Sayac: saat geriye gitti, kelepce devrede —", durum.t - t, "ms");
    return durum.t;
  }
  return t;
}

// GÜN NÖBETİ — her mesajdan ÖNCE ve saniyede bir koşar.
// Sıra kritiktir: olay uygulanmadan önce koşmazsa, gece yarısından sonra damgalanan bir
// olay olay.t < durum.t ile RangeError fırlatır.
function gunNobeti() {
  var buGun = gunBasi(Date.now());
  if (buGun <= sonGunBasi) return false;
  sekmeler.forEach(function (d, id) {
    var t = buGun;
    if (t < d.t) {
      kelepceSayisi++;
      console.warn("Sayac: gece yarisi damgasi kelepcelendi —", d.t - t, "ms");
      t = d.t;
    }
    sekmeler.set(id, uygula(d, { tur: "gece-yarısı", t: t }));
  });
  sonGunBasi = buGun;
  return true;
}

// Nöbetin TEK görevi gün dönümünü yakalamaktır. Sayaçlar olay damgalarıyla ilerler,
// tık'a bağlı değildir — bu yüzden arka plan sekmesindeki zamanlayıcı kısıtlaması
// sayacı etkilemez.
setInterval(gunNobeti, 1000);

function sekmeDurum(sekmeId) {
  var d = sekmeler.get(sekmeId);
  if (!d) {
    d = baslangic(Date.now());
    sekmeler.set(sekmeId, d);
  }
  return d;
}

function mesajIsle(msg, sender) {
  gunNobeti();

  var sekmeId =
    sender && sender.tab && typeof sender.tab.id === "number"
      ? sender.tab.id
      : msg && typeof msg.sekmeId === "number"
      ? msg.sekmeId
      : null;

  if (!msg || typeof msg !== "object") return { hata: "bos istek" };

  if (msg.tur === "olay") {
    if (sekmeId === null) return { hata: "sekme kimligi yok" };
    if (OLAY_TURLERI.indexOf(msg.olay) === -1) {
      return { hata: "bilinmeyen olay: " + String(msg.olay) };
    }
    var d = sekmeDurum(sekmeId);
    var t = simdi(d);
    d = uygula(d, { tur: msg.olay, t: t });
    sekmeler.set(sekmeId, d);
    return { tamam: true, sekmeId: sekmeId, durumAdi: durumAdi(d), anMs: t };
  }

  if (msg.tur === "durum-iste") {
    if (sekmeId === null) return { hata: "sekme kimligi yok" };
    var s = sekmeDurum(sekmeId);
    var an = simdi(s);
    return {
      sekmeId: sekmeId,
      durumAdi: durumAdi(s),
      toplam: ozet(s, an), // CANLI okuma: son olaydan bu yana geçen süre dâhil
      anMs: an,
      arkaPlanBaslangicMs: arkaPlanBaslangicMs,
      gunBasiMs: sonGunBasi,
      kelepceSayisi: kelepceSayisi,
      sekmeSayisi: sekmeler.size
    };
  }

  return { hata: "bilinmeyen istek: " + String(msg.tur) };
}

API.runtime.onMessage.addListener(function (msg, sender) {
  return Promise.resolve(mesajIsle(msg, sender));
});

// Sekme kapanınca birikmiş süre silinir — geçmiş gün/oturum kaydı kapsam dışı
// (SAYAC_TEKLIF.md:81). "tabs" izni gerekmez.
if (API.tabs && API.tabs.onRemoved) {
  API.tabs.onRemoved.addListener(function (sekmeId) {
    sekmeler.delete(sekmeId);
  });
}
