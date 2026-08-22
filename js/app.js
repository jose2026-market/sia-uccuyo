const INSCRIPCION =
  "https://docs.google.com/forms/d/e/1FAIpQLSeCe_VWfR8P3kE1a_nYzqikue500G44iFqgBQCtiICVm6OCzg/viewform?usp=dialog";
const OBSERVATORIO = "https://claudiomlarrea.github.io/observatorio-ia/";
const GEO_SESSION_KEY = "sia_visitgeo_once";

const CENTROIDS = {
  AR: [-64.0, -34.6],
  CL: [-71.5, -35.7],
  ES: [-3.7, 40.4],
  UY: [-56.0, -32.5],
  BR: [-51.9, -14.2],
  US: [-98.6, 39.8],
  MX: [-102.5, 23.6],
  PE: [-75.0, -9.2],
  CO: [-74.3, 4.6],
  FR: [2.2, 46.2],
  IT: [12.6, 41.9],
  DE: [10.5, 51.2],
};
const AR_REGIONS = {
  "san luis": [-66.34, -33.3],
  "san juan": [-68.54, -31.54],
  mendoza: [-68.85, -32.89],
  "buenos aires": [-58.38, -34.6],
  cordoba: [-64.19, -31.42],
  córdoba: [-64.19, -31.42],
  "santa fe": [-60.7, -31.6],
  tucuman: [-65.22, -26.82],
  tucumán: [-65.22, -26.82],
  salta: [-65.41, -24.79],
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const tt = (key, fallback, vars) =>
  window.I18N && window.I18N.t ? window.I18N.t(key, vars) : fallback;

let map, markersLayer, visitas = [], libro = [], filtro = "todas";

function cfg() {
  return window.SIA_CONFIG || {};
}

function appsUrl(action, extra) {
  var base = (cfg().APPS_SCRIPT_URL || "").trim();
  if (!base) return "";
  var qs =
    (base.indexOf("?") >= 0 ? "&" : "?") +
    "action=" + encodeURIComponent(action) +
    "&site=" + encodeURIComponent(cfg().SITE || "semillero") +
    "&_=" + Date.now();
  if (extra) qs += "&" + extra;
  return base + qs;
}

function fetchJson(url) {
  return fetch(url, { method: "GET", cache: "no-store" }).then(function (r) {
    if (!r.ok) throw new Error("network");
    return r.json();
  });
}

function fetchJsonp(url) {
  return new Promise(function (resolve, reject) {
    var name = "_siaCb_" + Math.floor(Math.random() * 1e9);
    var done = false;
    var script = document.createElement("script");
    window[name] = function (data) {
      if (done) return;
      done = true;
      delete window[name];
      if (script.parentNode) script.parentNode.removeChild(script);
      resolve(data);
    };
    script.async = true;
    script.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + "callback=" + encodeURIComponent(name);
    script.onerror = function () {
      if (done) return;
      done = true;
      delete window[name];
      if (script.parentNode) script.parentNode.removeChild(script);
      reject(new Error("jsonp"));
    };
    document.body.appendChild(script);
    setTimeout(function () { if (!done) script.onerror(); }, 20000);
  });
}

function fetchApps(action, extra) {
  var url = appsUrl(action, extra);
  if (!url) return Promise.reject(new Error("no-backend"));
  return fetchJson(url).then(function (data) { return data; }, function () {
    return fetchJsonp(url);
  });
}

function applyState(data) {
  if (!data || data.ok === false) return;
  visitas = Array.isArray(data.visitas) ? data.visitas : visitas;
  libro = Array.isArray(data.libro) ? data.libro : libro;
  renderRanking();
  drawMarkers();
  renderLibro();
  var t = totals(visitas);
  var c = $("#c-visitas");
  if (c) c.textContent = String(t.todas);
}

function loadSharedState() {
  return fetchApps("state")
    .then(applyState)
    .catch(function () {
      var url = (cfg().STATE_URL || "data/state.json") + "?t=" + Date.now();
      return fetchJson(url).then(applyState);
    });
}

function totals(rows) {
  var t = { todas: 0, interna: 0, externa: 0 };
  (rows || []).forEach(function (r) {
    t.todas += Number(r.n) || 0;
    t[r.tipo === "interna" ? "interna" : "externa"] += Number(r.n) || 0;
  });
  return t;
}

function coordsFor(row) {
  if (row.lat && row.lon) return [row.lat, row.lon];
  var reg = String(row.region || row.lugar || "").toLowerCase();
  for (var k in AR_REGIONS) {
    if (reg.indexOf(k) >= 0) {
      var a = AR_REGIONS[k];
      return [a[1], a[0]];
    }
  }
  var cc = String(row.country || "").toUpperCase();
  if (CENTROIDS[cc]) {
    var c = CENTROIDS[cc];
    return [c[1], c[0]];
  }
  return [-34.6, -64.0];
}

function renderRanking() {
  var ul = $("#origenes");
  if (!ul) return;
  var rows = visitas
    .filter(function (r) { return filtro === "todas" || r.tipo === filtro; })
    .sort(function (a, b) { return (b.n || 0) - (a.n || 0); });
  ul.innerHTML = rows.map(function (r) {
    var tag = r.tipo === "interna" ? "interna" : "externa";
    return (
      '<li data-id="' + r.id + '">' +
      "<span><strong>" + escapeHtml(r.lugar) + "</strong><br>" +
      '<span class="tag ' + (tag === "externa" ? "ext" : "int") + '">' +
      tt("tag." + tag, tag) + "</span></span><b>" + (r.n || 0) + "</b></li>"
    );
  }).join("");
  $$("#origenes li").forEach(function (li) {
    li.addEventListener("click", function () {
      $$("#origenes li").forEach(function (x) { x.classList.remove("on"); });
      li.classList.add("on");
      var row = visitas.find(function (v) { return v.id === li.dataset.id; });
      if (row && map) {
        var ll = coordsFor(row);
        map.setView(ll, 6);
      }
    });
  });
  var t = totals(visitas);
  $("#n-todas").textContent = t.todas;
  $("#n-ext").textContent = t.externa;
  $("#n-int").textContent = t.interna;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function drawMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();
  visitas
    .filter(function (r) { return filtro === "todas" || r.tipo === filtro; })
    .forEach(function (r) {
      var color = r.tipo === "interna" ? "#064A31" : "#7D1B1C";
      var ll = coordsFor(r);
      var m = L.circleMarker(ll, {
        radius: 7 + Math.min(Number(r.n) || 1, 12),
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.55,
      }).bindPopup("<strong>" + escapeHtml(r.lugar) + "</strong><br>" + (r.n || 0));
      markersLayer.addLayer(m);
    });
}

function renderLibro() {
  var box = $("#libro");
  if (!box) return;
  var rows = libro.slice().reverse();
  box.innerHTML = rows.map(function (n) {
    var lugar = n.lugar ? " · " + escapeHtml(n.lugar) : "";
    return (
      '<article class="note"><strong>' + escapeHtml(n.nombre) + "</strong> · " +
      escapeHtml(n.institucion) + "<br><small>" + escapeHtml(n.cuando) + " · " +
      escapeHtml(n.motivo) + " · " + tt("tag." + (n.tipo === "interna" ? "interna" : "externa"), n.tipo) +
      lugar +
      "</small><p>" + escapeHtml(n.mensaje) + "</p></article>"
    );
  }).join("");
}

function geoPayload(geo) {
  /* ipapi.co incluye "ip" en el JSON: se descarta y nunca se envía al backend. */
  var country = String(geo.country_code || "").trim();
  var countryName = String(geo.country_name || "").trim();
  var region = String(geo.region || "").trim();
  var city = String(geo.city || "").trim();
  var lat = Number(geo.latitude);
  var lon = Number(geo.longitude);
  if (!isFinite(lat) || !isFinite(lon)) {
    lat = 0;
    lon = 0;
  } else {
    lat = Math.round(lat * 100) / 100;
    lon = Math.round(lon * 100) / 100;
  }
  var campus = /san luis|san juan|mendoza/i.test(city + " " + region);
  var tipo = campus ? "interna" : "externa";
  var bits = [city, region, countryName].filter(Boolean);
  return {
    country: country,
    countryName: countryName,
    region: region,
    city: city,
    lat: lat,
    lon: lon,
    tipo: tipo,
    lugar: bits.join(", ") || countryName || "Origen no determinado",
  };
}

async function geolocalizar() {
  var banner = $("#banner-you");
  try {
    var res = await fetch("https://ipapi.co/json/", { method: "GET" });
    if (!res.ok) throw new Error("geo");
    var raw = await res.json();
    var g = geoPayload(raw);
    banner.classList.add("show");
    banner.innerHTML = tt("sec.vis.you", "Estás visitando desde {lugar} · se registra como visita {tipo} (país y región estimados; no se guarda la IP).", {
      lugar: g.lugar,
      tipo: tt("tag." + g.tipo, g.tipo),
    });
    if ($("#campo-lugar")) $("#campo-lugar").value = g.lugar;
    if ($("#campo-tipo")) $("#campo-tipo").value = g.tipo;
    if (map && g.lat && g.lon) map.setView([g.lat, g.lon], 5);
    if (!sessionStorage.getItem(GEO_SESSION_KEY)) {
      var extra =
        "country=" + encodeURIComponent(g.country) +
        "&countryName=" + encodeURIComponent(g.countryName) +
        "&region=" + encodeURIComponent(g.region) +
        "&city=" + encodeURIComponent(g.city) +
        "&tipo=" + encodeURIComponent(g.tipo) +
        "&lat=" + encodeURIComponent(g.lat) +
        "&lon=" + encodeURIComponent(g.lon);
      try {
        await fetchApps("visitgeo", extra).then(applyState);
      } catch (_be) {
        /* El mapa sigue mostrando el estado compartido (Apps Script o data/state.json). */
      }
      sessionStorage.setItem(GEO_SESSION_KEY, "1");
    }
  } catch (_err) {
    banner.classList.add("show");
    banner.textContent = tt(
      "sec.vis.nogeo",
      "No se pudo estimar el origen. El mapa y el ranking siguen siendo los compartidos. Podés registrar la visita en el libro."
    );
  }
}

function initMap() {
  map = L.map("map", { scrollWheelZoom: false }).setView([-33.3, -66.3], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
    maxZoom: 18,
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  drawMarkers();
  setTimeout(function () { map.invalidateSize(); }, 250);
}

function initNav() {
  var links = $$("nav.menu a");
  var sidebar = $(".sidebar");
  $("#burger")?.addEventListener("click", function () { sidebar.classList.toggle("open"); });
  links.forEach(function (a) {
    a.addEventListener("click", function () { sidebar.classList.remove("open"); });
  });
  var io = new IntersectionObserver(function (entries) {
    var vis = entries.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) {
      return b.intersectionRatio - a.intersectionRatio;
    })[0];
    if (!vis) return;
    links.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + vis.target.id);
    });
  }, { rootMargin: "-35% 0px -50% 0px", threshold: [0.1, 0.3, 0.6] });
  $$("section.panel, .hero").forEach(function (s) { io.observe(s); });
}

function initCounters() {
  [["#c-inscriptos", 6], ["#c-lineas", 6], ["#c-niveles", 5]].forEach(function (pair) {
    var el = $(pair[0]);
    if (!el) return;
    el.textContent = String(pair[1]);
  });
}

function initForm() {
  $("#form-visita").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var fd = new FormData(ev.currentTarget);
    var extra =
      "nombre=" + encodeURIComponent(String(fd.get("nombre") || "").trim()) +
      "&institucion=" + encodeURIComponent(String(fd.get("institucion") || "").trim()) +
      "&tipo=" + encodeURIComponent(String(fd.get("tipo") || "externa")) +
      "&motivo=" + encodeURIComponent(String(fd.get("motivo") || "Visita")) +
      "&mensaje=" + encodeURIComponent(String(fd.get("mensaje") || "").trim()) +
      "&lugar=" + encodeURIComponent(String(fd.get("lugar") || "").trim());
    fetchApps("libro", extra)
      .then(applyState)
      .then(function () {
        ev.currentTarget.reset();
        $("#ok-visita").hidden = false;
      })
      .catch(function () {
        $("#ok-visita").hidden = false;
        $("#ok-visita").textContent = tt(
          "sec.vis.nobackend",
          "Falta publicar el backend (backend/Code.gs). El libro compartido se activa con esa URL /exec."
        );
      });
  });
  $$(".filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      filtro = btn.dataset.filtro;
      $$(".filter").forEach(function (b) { b.classList.toggle("on", b === btn); });
      renderRanking();
      drawMarkers();
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initNav();
  initMap();
  initCounters();
  initForm();
  loadSharedState().then(geolocalizar);
  $$("[data-inscripcion]").forEach(function (a) { a.href = INSCRIPCION; });
  $$("[data-observatorio]").forEach(function (a) { a.href = OBSERVATORIO; });
});

window.addEventListener("sia:langchange", function () {
  renderRanking();
  renderLibro();
});
