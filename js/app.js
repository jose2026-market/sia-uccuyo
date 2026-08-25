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
  "buenos aires": [-60.7, -36.7],
  "ciudad autonoma de buenos aires": [-58.38, -34.6],
  caba: [-58.38, -34.6],
  "capital federal": [-58.38, -34.6],
  "buenos aires f d": [-58.38, -34.6],
  "buenos aires fd": [-58.38, -34.6],
  cordoba: [-64.19, -31.42],
  "santa fe": [-60.7, -31.6],
  tucuman: [-65.22, -26.82],
  salta: [-65.41, -24.79],
  catamarca: [-65.78, -28.47],
  chaco: [-60.45, -26.8],
  chubut: [-68.0, -43.8],
  corrientes: [-58.83, -27.47],
  "entre rios": [-59.0, -32.0],
  formosa: [-58.18, -26.18],
  jujuy: [-65.3, -23.32],
  "la pampa": [-64.3, -36.6],
  "la rioja": [-66.86, -29.41],
  misiones: [-54.57, -26.92],
  neuquen: [-68.06, -38.95],
  "rio negro": [-67.2, -40.8],
  "santa cruz": [-69.2, -48.8],
  "santiago del estero": [-64.26, -27.78],
  "tierra del fuego": [-67.0, -54.3],
};

const AR_PROVINCE_LABELS = {
  "buenos aires": "Buenos Aires",
  "ciudad autonoma de buenos aires": "CABA",
  caba: "CABA",
  "capital federal": "CABA",
  "buenos aires f d": "CABA",
  "buenos aires fd": "CABA",
  catamarca: "Catamarca",
  chaco: "Chaco",
  chubut: "Chubut",
  cordoba: "Córdoba",
  corrientes: "Corrientes",
  "entre rios": "Entre Ríos",
  formosa: "Formosa",
  jujuy: "Jujuy",
  "la pampa": "La Pampa",
  "la rioja": "La Rioja",
  mendoza: "Mendoza",
  misiones: "Misiones",
  neuquen: "Neuquén",
  "rio negro": "Río Negro",
  salta: "Salta",
  "san juan": "San Juan",
  "san luis": "San Luis",
  "santa cruz": "Santa Cruz",
  "santa fe": "Santa Fe",
  "santiago del estero": "Santiago del Estero",
  "tierra del fuego": "Tierra del Fuego",
  tucuman: "Tucumán",
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const tt = (key, fallback, vars) =>
  window.I18N && window.I18N.t ? window.I18N.t(key, vars) : fallback;

const COUNTRY_LABELS = {
  AR: "Argentina",
  CL: "Chile",
  ES: "España",
  UY: "Uruguay",
  BR: "Brasil",
  US: "Estados Unidos",
  MX: "México",
  PE: "Perú",
  CO: "Colombia",
  FR: "Francia",
  IT: "Italia",
  DE: "Alemania",
  PY: "Paraguay",
  BO: "Bolivia",
  EC: "Ecuador",
  VE: "Venezuela",
  GB: "Reino Unido",
  PT: "Portugal",
  CA: "Canadá",
  CN: "China",
};

const RANK_LIMIT = 6;
let map, markersLayer, visitas = [], libro = [];
let rankOpen = { libro: false };

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
  /* Apps Script redirige y a veces falla CORS: JSONP primero, luego fetch. */
  return fetchJsonp(url).then(function (data) {
    if (data && data.ok === false && data.error === "invalid_site") throw new Error("invalid_site");
    return data;
  }, function () {
    return fetchJson(url);
  });
}

function applyState(data) {
  if (!data || data.ok === false) throw new Error((data && data.error) || "bad-state");
  visitas = Array.isArray(data.visitas) ? data.visitas : [];
  libro = Array.isArray(data.libro) ? data.libro : [];
  renderRanking();
  drawMarkers();
  renderLibro();
  var t = totals(visitas);
  var c = $("#c-visitas");
  if (c) c.textContent = formatNum(t.todas);
  updateNumeros();
  return data;
}

function loadSharedState() {
  return fetchApps("state").then(applyState);
}

function totals(rows) {
  var t = { todas: 0 };
  (rows || []).forEach(function (r) {
    t.todas += Number(r.n) || 0;
  });
  return t;
}

function formatNum(n) {
  return String(Number(n) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function setNum(id, n) {
  var el = $(id);
  if (el) el.textContent = formatNum(n);
}

function visitScopeStats(rows) {
  var CUYO = { "san luis": 1, "san juan": 1, mendoza: 1 };
  var out = { mundo: 0, pais: 0, region: 0, provincia: 0, nPaises: 0, nRegiones: 0, nAr: 0, nCuyo: 0 };
  var countries = {};
  var regions = {};
  var arRegs = {};
  var cuyoRegs = {};
  var noPais = foldName(tt("sec.vis.nopais", "Sin país"));
  var noReg = foldName(tt("sec.vis.noregion", "Sin provincia / región"));
  (rows || []).forEach(function (r) {
    var n = Number(r.n) || 0;
    var p = originParts(r);
    out.mundo += n;
    var ck = countryKey(p);
    if (foldName(p.country) !== noPais) countries[ck || foldName(p.country)] = 1;
    var rk = foldName(p.region);
    if (rk && rk !== noReg) regions[(ck || "x") + "|" + rk] = 1;
    var isAr = p.code === "AR" || foldName(p.country) === "argentina";
    if (isAr) {
      out.pais += n;
      if (rk && rk !== noReg) arRegs[rk] = 1;
      if (CUYO[rk]) {
        out.region += n;
        cuyoRegs[rk] = 1;
      }
      if (rk === "san luis") out.provincia += n;
    }
  });
  out.nPaises = Object.keys(countries).length;
  out.nRegiones = Object.keys(regions).length;
  out.nAr = Object.keys(arRegs).length;
  out.nCuyo = Object.keys(cuyoRegs).length;
  return out;
}

function updateNumeros() {
  var s = visitScopeStats(visitas);
  setNum("#c-visitas", s.mundo);
  setNum("#c-vis-prov", s.provincia);
  setNum("#c-vis-reg", s.region);
  setNum("#c-vis-reg-n", s.nCuyo);
  setNum("#c-vis-pais", s.pais);
  setNum("#c-vis-pais-n", s.nAr);
  setNum("#c-vis-mundo", s.mundo);
  setNum("#c-vis-mundo-paises", s.nPaises);
  setNum("#c-vis-mundo-reg", s.nRegiones);
}

function foldName(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function provinceLabel(s) {
  var k = foldName(s);
  return AR_PROVINCE_LABELS[k] || "";
}

function countryLabelFromName(s) {
  var k = foldName(s);
  var map = {
    argentina: "Argentina",
    chile: "Chile",
    espana: "España",
    spain: "España",
    uruguay: "Uruguay",
    brasil: "Brasil",
    brazil: "Brasil",
    "estados unidos": "Estados Unidos",
    "united states": "Estados Unidos",
    mexico: "México",
    peru: "Perú",
    colombia: "Colombia",
    francia: "Francia",
    france: "Francia",
    italia: "Italia",
    alemania: "Alemania",
    germany: "Alemania",
    paraguay: "Paraguay",
    bolivia: "Bolivia",
    ecuador: "Ecuador",
    venezuela: "Venezuela",
    "reino unido": "Reino Unido",
    portugal: "Portugal",
    canada: "Canadá",
    china: "China",
  };
  return map[k] || "";
}

function coordsFor(row) {
  if (row.lat && row.lon) return [row.lat, row.lon];
  var reg = foldName(row.region || row.lugar || "");
  var best = "";
  for (var k in AR_REGIONS) {
    if (reg === k || (k && reg.indexOf(k) >= 0)) {
      if (k.length > best.length) best = k;
    }
  }
  if (best) {
    var a = AR_REGIONS[best];
    return [a[1], a[0]];
  }
  var parts = originParts(row);
  if (CENTROIDS[parts.code]) {
    var c = CENTROIDS[parts.code];
    return [c[1], c[0]];
  }
  return [-34.6, -64.0];
}

function stripTipoGlue(s) {
  return String(s || "")
    .replace(/\s*(interna|externa|internal|external)\s*$/i, "")
    .replace(/([a-záéíóúñ])(interna|externa|internal|external)$/i, "$1")
    .trim();
}

function originParts(row) {
  var code = String(row.country || "").trim().toUpperCase();
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) code = "";
  var country = stripTipoGlue(row.countryName || "");
  var region = stripTipoGlue(row.region || "");
  var city = stripTipoGlue(row.city || "");
  var named = countryLabelFromName(country);
  var asProvince = provinceLabel(country);

  if (named) country = named;
  if (asProvince) {
    if (!provinceLabel(region)) region = asProvince;
    country = "Argentina";
    code = "AR";
  }
  if (COUNTRY_LABELS[code]) country = COUNTRY_LABELS[code];

  if ((!country || !region) && row.lugar) {
    var bits = String(row.lugar).split(",").map(function (s) { return stripTipoGlue(s); }).filter(Boolean);
    var last = bits.length ? bits[bits.length - 1] : "";
    var prev = bits.length >= 2 ? bits[bits.length - 2] : "";
    if (!country) {
      if (countryLabelFromName(last)) country = countryLabelFromName(last);
      else if (provinceLabel(last)) {
        country = "Argentina";
        code = "AR";
        if (!region) region = provinceLabel(last);
      } else country = last;
    }
    if (!region) {
      if (provinceLabel(prev)) region = provinceLabel(prev);
      else if (provinceLabel(last)) region = provinceLabel(last);
      else region = prev;
    }
  }
  if (provinceLabel(region)) region = provinceLabel(region);
  if (!region && provinceLabel(city)) region = provinceLabel(city);
  if ((code === "AR" || countryLabelFromName(country) === "Argentina") && !country) {
    country = "Argentina";
    code = "AR";
  }
  if (!country && COUNTRY_LABELS[code]) country = COUNTRY_LABELS[code];
  if (!country) country = tt("sec.vis.nopais", "Sin país");
  if (!region) region = tt("sec.vis.noregion", "Sin provincia / región");
  return { code: code, country: country, region: region };
}

function filteredVisitas() {
  return visitas;
}

function groupRanking(rows, keyFn, labelFn) {
  var bag = {};
  rows.forEach(function (r) {
    var parts = originParts(r);
    var key = keyFn(r, parts);
    if (!bag[key]) {
      bag[key] = {
        id: key,
        n: 0,
        lat: 0,
        lon: 0,
        label: labelFn(r, parts),
        sample: r,
      };
    }
    bag[key].n += Number(r.n) || 0;
    if (r.lat && r.lon) {
      bag[key].lat = r.lat;
      bag[key].lon = r.lon;
      bag[key].sample = r;
    }
  });
  return Object.keys(bag)
    .map(function (k) { return bag[k]; })
    .sort(function (a, b) { return (b.n || 0) - (a.n || 0); });
}

function setCountLabel(id, n) {
  var el = $(id);
  if (!el) return;
  el.textContent = n ? "(" + n + ")" : "";
}

function renderCollapsedList(ul, items, kind) {
  if (!ul) return;
  if (!items.length) {
    ul.innerHTML = '<li class="empty">' + escapeHtml(tt("sec.vis.empty", "Todavía no hay orígenes en el mapa compartido.")) + "</li>";
    return;
  }
  ul.innerHTML = items.map(function (r) {
    var sub = r.sub ? '<span class="sub">' + escapeHtml(r.sub) + "</span>" : "";
    return (
      '<li data-kind="' + kind + '" data-id="' + escapeHtml(r.id) + '">' +
      '<span class="origin-copy"><strong>' + escapeHtml(r.label) + "</strong>" + sub +
      "</span><b>" + (r.n || 0) + "</b></li>"
    );
  }).join("");
  $$("li[data-id]", ul).forEach(function (li) {
    li.addEventListener("click", function () {
      $$(".origin-list li").forEach(function (x) { x.classList.remove("on"); });
      li.classList.add("on");
      var row = items.find(function (v) { return v.id === li.dataset.id; });
      if (row && map) {
        var ll = coordsFor(row.sample || row);
        map.setView(ll, kind === "paises" ? 4 : 6);
      }
    });
  });
}

function countryKey(parts) {
  if (parts.code && COUNTRY_LABELS[parts.code]) return parts.code;
  return String(parts.country || "").toLowerCase();
}

function renderRanking() {
  var rows = filteredVisitas();
  var paises = groupRanking(
    rows,
    function (_r, p) { return "pais:" + countryKey(p); },
    function (_r, p) { return p.country; }
  );
  var regiones = groupRanking(
    rows,
    function (_r, p) { return "reg:" + countryKey(p) + "|" + String(p.region || "").toLowerCase(); },
    function (_r, p) { return p.region; }
  ).map(function (item) {
    var parts = originParts(item.sample || {});
    item.sub = parts.country;
    return item;
  });
  renderCollapsedList($("#ranking-paises"), paises, "paises");
  renderCollapsedList($("#ranking-regiones"), regiones, "regiones");
  setCountLabel("#n-paises", paises.length);
  setCountLabel("#n-regiones", regiones.length);
  var t = totals(visitas);
  if ($("#n-todas")) $("#n-todas").textContent = formatNum(t.todas);
  if ($("#n-libro")) $("#n-libro").textContent = formatNum(libro.length);
  updateNumeros();
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
  visitas.forEach(function (r) {
    var ll = coordsFor(r);
    var m = L.circleMarker(ll, {
      radius: 7 + Math.min(Number(r.n) || 1, 12),
      color: "#064A31",
      weight: 2,
      fillColor: "#064A31",
      fillOpacity: 0.55,
    }).bindPopup("<strong>" + escapeHtml(r.lugar) + "</strong><br>" + (r.n || 0));
    markersLayer.addLayer(m);
  });
}

function renderLibro() {
  var box = $("#libro");
  if (!box) return;
  var rows = libro.slice().reverse();
  if (!rows.length) {
    box.innerHTML = '<article class="note empty">' + escapeHtml(tt("sec.vis.bookempty", "Todavía no hay mensajes. Los que se escriban se leen acá, en esta misma página.")) + "</article>";
    var noneBtn = document.querySelector('[data-rank-more="libro"]');
    if (noneBtn) noneBtn.hidden = true;
    if ($("#n-libro")) $("#n-libro").textContent = "0";
    return;
  }
  var shown = rankOpen.libro ? rows : rows.slice(0, RANK_LIMIT);
  box.innerHTML = shown.map(function (n) {
    var lugar = n.lugar ? " · " + escapeHtml(n.lugar) : "";
    var inst = escapeHtml(n.institucion || tt("sec.vis.anon", "Institución"));
    return (
      '<article class="note"><strong>' + inst + "</strong><br><small>" +
      escapeHtml(n.cuando) + lugar +
      "</small><p>" + escapeHtml(n.mensaje) + "</p></article>"
    );
  }).join("");
  var btn = document.querySelector('[data-rank-more="libro"]');
  if (btn) {
    var extra = rows.length - RANK_LIMIT;
    if (extra <= 0) {
      btn.hidden = true;
      rankOpen.libro = false;
    } else {
      btn.hidden = false;
      btn.textContent = rankOpen.libro
        ? tt("sec.vis.less", "Ver menos")
        : tt("sec.vis.more", "Ver más ({n})", { n: extra });
    }
  }
  if ($("#n-libro")) $("#n-libro").textContent = String(rows.length);
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
  if (provinceLabel(countryName) && !countryLabelFromName(countryName)) {
    if (!region) region = provinceLabel(countryName);
    countryName = "Argentina";
    country = "AR";
  }
  if (countryLabelFromName(countryName)) countryName = countryLabelFromName(countryName);
  if ((!country || country.length !== 2) && countryName === "Argentina") country = "AR";
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

async function pingVisitgeo(g) {
  var extra =
    "country=" + encodeURIComponent(g.country || "") +
    "&countryName=" + encodeURIComponent(g.countryName || "") +
    "&region=" + encodeURIComponent(g.region || "") +
    "&city=" + encodeURIComponent(g.city || "") +
    "&tipo=" + encodeURIComponent(g.tipo || "externa") +
    "&lat=" + encodeURIComponent(g.lat || 0) +
    "&lon=" + encodeURIComponent(g.lon || 0);
  return fetchApps("visitgeo", extra).then(applyState);
}

async function geolocalizar() {
  var banner = $("#banner-you");
  var g = {
    country: "",
    countryName: "",
    region: "",
    city: "",
    lat: 0,
    lon: 0,
    tipo: "externa",
    lugar: tt("sec.vis.nopais", "Sin país"),
  };
  try {
    var res = await fetch("https://ipapi.co/json/", { method: "GET" });
    if (res.ok) {
      var raw = await res.json();
      if (raw && !raw.error) g = geoPayload(raw);
    }
  } catch (_geoErr) {}

  if (banner) {
    banner.classList.add("show");
    banner.innerHTML = tt("sec.vis.you", "Estás visitando desde {lugar}. Se suma 1 al contador de visitas (país y región estimados; no se guarda la IP).", {
      lugar: g.lugar,
    });
  }
  if ($("#campo-lugar")) $("#campo-lugar").value = g.lugar;
  if (map && g.lat && g.lon) map.setView([g.lat, g.lon], 5);

  if (sessionStorage.getItem(GEO_SESSION_KEY)) return;
  try {
    await pingVisitgeo(g);
    sessionStorage.setItem(GEO_SESSION_KEY, "1");
  } catch (_be) {
    if (banner) {
      banner.classList.add("show");
      banner.textContent = tt(
        "sec.vis.nobackend",
        "No se pudo guardar la visita en el backend compartido. Recargá la página en unos segundos."
      );
    }
  }
}

function maybeCountVisit() {
  var hash = String(location.hash || "").replace(/^#/, "");
  var section = $("#visitas");
  var visible = hash === "visitas";
  if (!visible && section && typeof section.getBoundingClientRect === "function") {
    var r = section.getBoundingClientRect();
    visible = r.top < window.innerHeight && r.bottom > 0;
  }
  if (visible) geolocalizar();
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
    el.textContent = formatNum(pair[1]);
  });
  updateNumeros();
}

function initScopeTabs() {
  $$(".scope-tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var scope = btn.getAttribute("data-scope");
      $$(".scope-tab").forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      $$("[data-scope-panel]").forEach(function (panel) {
        panel.classList.toggle("on", panel.getAttribute("data-scope-panel") === scope);
      });
    });
  });
}

function initForm() {
  $("#form-visita").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var fd = new FormData(ev.currentTarget);
    var extra =
      "institucion=" + encodeURIComponent(String(fd.get("institucion") || "").trim()) +
      "&mensaje=" + encodeURIComponent(String(fd.get("mensaje") || "").trim()) +
      "&lugar=" + encodeURIComponent(String(fd.get("lugar") || "").trim());
    var ok = $("#ok-visita");
    fetchApps("libro", extra)
      .then(applyState)
      .then(function () {
        ev.currentTarget.reset();
        if (ok) {
          ok.hidden = false;
          ok.textContent = tt("sec.vis.ok", "Mensaje publicado más abajo, en el libro de esta página.");
        }
        var book = $("#libro");
        if (book && book.scrollIntoView) book.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch(function (err) {
        if (!ok) return;
        ok.hidden = false;
        ok.textContent = tt(
          "sec.vis.nobackend",
          "No se pudo guardar el mensaje en el backend compartido."
        );
      });
  });
  $$("[data-rank-more]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-rank-more");
      rankOpen[key] = !rankOpen[key];
      if (key === "libro") renderLibro();
      else renderRanking();
    });
  });
}

function initPwa() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
  var installBtn = $("#btn-install");
  var shareBtn = $("#btn-share");
  var hint = $("#app-hint");
  var deferred;
  window.addEventListener("beforeinstallprompt", function (ev) {
    ev.preventDefault();
    deferred = ev;
    if (installBtn) installBtn.hidden = false;
  });
  if (installBtn) {
    installBtn.addEventListener("click", function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.finally(function () {
        deferred = null;
        installBtn.hidden = true;
      });
    });
  }
  window.addEventListener("appinstalled", function () {
    if (installBtn) installBtn.hidden = true;
  });
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var url = "https://jose2026-market.github.io/sia-uccuyo/";
      var title = tt("app.sharetext", "Semillero IA — Universidad Católica de Cuyo");
      if (navigator.share) {
        navigator.share({ title: "Semillero IA", text: title, url: url }).catch(function () {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          if (hint) hint.textContent = tt("app.copied", "Enlace copiado. Pegalo en WhatsApp o mail para compartir la app.");
        }).catch(function () {
          window.prompt(title, url);
        });
        return;
      }
      window.prompt(title, url);
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initNav();
  initMap();
  initCounters();
  initScopeTabs();
  initForm();
  initPwa();
  loadSharedState()
    .catch(function () {
      var banner = $("#banner-you");
      if (!banner) return;
      banner.classList.add("show");
      banner.textContent = tt(
        "sec.vis.nobackend",
        "No se pudo leer el backend compartido. Recargá la página."
      );
    })
    .then(function () {
      maybeCountVisit();
      var vis = $("#visitas");
      if (vis && "IntersectionObserver" in window) {
        var ioVis = new IntersectionObserver(function (entries) {
          if (entries.some(function (e) { return e.isIntersecting; })) maybeCountVisit();
        }, { threshold: 0.15 });
        ioVis.observe(vis);
      }
    });
  window.addEventListener("hashchange", maybeCountVisit);
  $$("[data-inscripcion]").forEach(function (a) { a.href = INSCRIPCION; });
  $$("[data-observatorio]").forEach(function (a) { a.href = OBSERVATORIO; });
});

window.addEventListener("sia:langchange", function () {
  renderRanking();
  renderLibro();
  updateNumeros();
});
