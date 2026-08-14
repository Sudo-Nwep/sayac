// SONDA — ürüne ait DEĞİLDİR. Yalnız pencereErisimi:true olan test kopyalarına girer.
//
// Pencerenin KENDİ bağlamından ölçer ve işaret sunucusuna yollar. İki işi var:
//   ① Çerçeve Playwright ile adreslenemese bile pencerenin DOM'u, çözdüğü kimlik ve
//      manifest bildirimi YİNE ölçülebilsin (Yedek Yol B).
//   ② SEKME KİMLİĞİ KARŞIT DENEYİ: arka plana bilerek var olmayan iki kimlik gönderilir
//      ve yanıtın sekmeId'si okunur.
//        dönen = gönderilen  → sender.tab YOK → msg.sekmeId yolu geçerli
//        dönen ≠ gönderilen  → arkaplan.js:73-78 önceliği msg.sekmeId'yi GÖLGELİYOR
//      Hayaletin toplam'ı üç sıfır döner; gerçek sekmeninki dönmez → kimlik girdisinin
//      cevabı maddeten değiştirdiğinin kanıtı budur.
(function () {
  var API = typeof browser !== "undefined" ? browser : chrome;
  var sunucu = typeof SAYAC_TEST !== "undefined" ? SAYAC_TEST.sunucu : null;
  var sayac = 0;
  // 60 rapor ≈ 60 sn. İlk koşumda 15'ti ve sonda 16d'nin tıklamasından ÖNCE susuyordu;
  // openPopup sonucu "denenmedi" görünüyordu (ölçüm düzeneği kusuru, ürün değil).
  var EN_COK = 60;
  var openPopupSonuc = "denenmedi";

  function metin(id) {
    var e = document.getElementById(id);
    return e ? e.textContent : "yok";
  }

  function sor(sekmeId) {
    try {
      var p = API.runtime.sendMessage({ tur: "durum-iste", sekmeId: sekmeId });
      if (p && p.then) return p;
    } catch (e) {}
    return Promise.resolve(null);
  }

  function guvenli(fn, varsayilan) {
    try {
      var v = fn();
      return v === undefined || v === null ? varsayilan : v;
    } catch (e) {
      return "hata:" + (e && e.message ? e.message : String(e));
    }
  }

  async function olc() {
    var ust = window.top === window.self ? 1 : 0;

    var getCurrent = "yok";
    try {
      var kendi = await API.tabs.getCurrent();
      getCurrent = kendi && typeof kendi.id === "number" ? String(kendi.id) : "yok";
    } catch (e) {
      getCurrent = "hata:" + (e && e.message ? e.message : String(e));
    }

    var baglam = ust === 0 ? "iframe" : getCurrent === "yok" ? "panel" : "sekme";

    var sorguUzunluk = "yok", sorguId = "yok", urlTipi = "yok", sorguHata = "";
    try {
      var tablar = await API.tabs.query({ active: true, currentWindow: true });
      sorguUzunluk = String(tablar ? tablar.length : 0);
      if (tablar && tablar.length) {
        sorguId = typeof tablar[0].id === "number" ? String(tablar[0].id) : "yok";
        urlTipi = typeof tablar[0].url;
      }
    } catch (e) {
      sorguHata = e && e.message ? e.message : String(e);
    }

    // İZİN BÜTÇESİ karşıt deneyi: url süzgeci "tabs" izni olmadan çalışır mı?
    var urlSuzgec = "yok";
    try {
      var s = await API.tabs.query({ url: "*://*.youtube.com/*" });
      urlSuzgec = "sonuc:" + (s ? s.length : 0);
    } catch (e) {
      urlSuzgec = "hata:" + (e && e.message ? e.message : String(e));
    }

    // KARŞIT DENEY — iki hayalet kimlik
    var y1 = await sor(999999);
    var y2 = await sor(888888);

    // Bu sayfanın YAŞADIĞI sekme için arka planın söylediği — sekmeId GÖNDERİLMEDEN.
    // Sekme bağlamında sender.tab devreye girer; panelde {hata:"sekme kimligi yok"} döner.
    var y3 = null;
    try {
      var p3 = API.runtime.sendMessage({ tur: "durum-iste" });
      if (p3 && p3.then) y3 = await p3;
    } catch (e) {}

    var mf = guvenli(function () { return API.runtime.getManifest(); }, null);
    var eylem = mf ? mf.browser_action || mf.action || {} : {};

    return {
      deney: "pencere",
      tur: ++sayac,
      ust: ust,
      getCurrent: getCurrent,
      baglam: baglam,
      tabsTipi: typeof API.tabs,
      sorguUzunluk: sorguUzunluk,
      sorguId: sorguId,
      urlTipi: urlTipi,
      sorguHata: sorguHata,
      urlSuzgec: urlSuzgec,
      pencereHedef:
        typeof window.hedefSekmeId === "number" ? String(window.hedefSekmeId) : "yok",
      // Teşhis: pencere CANLI görünüp DOM'u 0:00:00 kalıyorsa sebep bu ikisinden biri.
      bicimTipi: typeof sureBicim,
      yoklamaVar: typeof window.yoklama !== "undefined" && window.yoklama !== null ? "1" : "0",
      probe1Gonderilen: "999999",
      probe1Donen: y1 && typeof y1.sekmeId === "number" ? String(y1.sekmeId) : "yok",
      probe1Izleniyor: y1 && y1.toplam ? String(y1.toplam.izleniyor) : "yok",
      probe2Gonderilen: "888888",
      probe2Donen: y2 && typeof y2.sekmeId === "number" ? String(y2.sekmeId) : "yok",
      probe2Izleniyor: y2 && y2.toplam ? String(y2.toplam.izleniyor) : "yok",
      bgSekmeId: y3 && typeof y3.sekmeId === "number" ? String(y3.sekmeId) : "yok",
      bgAn: y3 && typeof y3.anMs === "number" ? String(y3.anMs) : "yok",
      bgIzleniyor: y3 && y3.toplam ? String(y3.toplam.izleniyor) : "yok",
      bgDuraklatildi: y3 && y3.toplam ? String(y3.toplam.duraklatildi) : "yok",
      bgMola: y3 && y3.toplam ? String(y3.toplam.mola) : "yok",
      bgDurum: y3 && y3.durumAdi ? y3.durumAdi : y3 && y3.hata ? "hata:" + y3.hata : "yok",
      mfPopup: eylem.default_popup || "yok",
      mfBaslik: eylem.default_title || "yok",
      openPopup: openPopupSonuc,
      sIzleniyor: metin("sayac-izleniyor"),
      sDuraklatildi: metin("sayac-duraklatildi"),
      sMola: metin("sayac-mola"),
      sDurum: metin("durum-adi"),
      sBtnMola: metin("btn-mola"),
      sBtnAna: metin("btn-ana"),
      sUyari: metin("uyari"),
      sBaslik: metin("baslik"),
      sEtiketler:
        metin("etiket-izleniyor") + "|" + metin("etiket-duraklatildi") + "|" +
        metin("etiket-mola") + "|" + metin("etiket-durum"),
    };
  }

  function yolla(o) {
    if (!sunucu) return;
    var q = [];
    for (var k in o) q.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(o[k])));
    try {
      fetch(sunucu + "/olay?" + q.join("&")).catch(function () {});
    } catch (e) {}
  }

  // Komut kanalı: testin verdiği eleman kimliğine ÜRÜNÜN GERÇEK butonuna tıklar.
  // Tıklanan ürünün kendi butonudur; tıklayan test kodudur (page.click ile aynı kategori).
  async function komutYokla() {
    if (!sunucu) return;
    try {
      var y = await fetch(sunucu + "/pencere-komut");
      var j = await y.json();
      if (j && j.k === "__yenile") {
        // İÇERİDEN yenile: dışarıdan gezindirmek pencere sekmesine odağı geri veriyor
        // ve ürünün hedefBul()'u yarışı kaybediyordu (ölçüldü: getCurrent=3, sorguId=1
        // olmasına rağmen #uyari kelepçe metniydi).
        location.reload();
        return;
      }
      if (j && j.k) {
        var e = document.getElementById(j.k);
        if (e) {
          e.click();
          openPopupSonuc = "komut:" + j.k + " tiklandi";
        } else {
          openPopupSonuc = "komut:" + j.k + " ELEMAN YOK";
        }
      }
    } catch (e) {}
  }

  async function raporla() {
    try {
      yolla(await olc());
    } catch (e) {
      yolla({ deney: "pencere", tur: ++sayac, hata: String(e && e.message ? e.message : e) });
    }
  }

  // 16d'nin tıklama hedefi — YALNIZ iframe bağlamında eklenir.
  if (window.top !== window.self) {
    try {
      var b = document.createElement("button");
      b.id = "sonda-ac-pencere";
      b.type = "button";
      b.textContent = "sonda: openPopup";
      b.addEventListener("click", function () {
        // Gerçek kullanıcı eylemi içindeyiz — Firefox'un gesture koşulu karşılanıyor mu,
        // ÖLÇÜLMEMİŞTİR. Tek deneme.
        try {
          var r = API.browserAction
            ? API.browserAction.openPopup()
            : API.action
            ? API.action.openPopup()
            : null;
          if (r && r.then) {
            r.then(
              function () { openPopupSonuc = "cozuldu"; },
              function (e) { openPopupSonuc = "red:" + (e && e.message ? e.message : String(e)); }
            );
          } else {
            openPopupSonuc = "donus:" + String(r);
          }
        } catch (e) {
          openPopupSonuc = "istisna:" + (e && e.message ? e.message : String(e));
        }
      });
      document.body.appendChild(b);
    } catch (e) {}
  }

  setTimeout(raporla, 400);
  var t = setInterval(function () {
    if (sayac >= EN_COK) {
      clearInterval(t);
      return;
    }
    raporla();
  }, 1000);
  // Komut yoklaması ayrı ve daha sık — tıklama gecikmesi ölçümü bozmasın.
  setInterval(komutYokla, 250);
})();
