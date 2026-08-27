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
let sinGeorref = 0;
let rankOpen = { libro: false };

const TZ_HINTS = {
  "America/Argentina/San_Luis": { country: "AR", region: "San Luis", city: "San Luis", lat: -33.3, lon: -66.34 },
  "America/Argentina/San_Juan": { country: "AR", region: "San Juan", city: "San Juan", lat: -31.54, lon: -68.54 },
  "America/Argentina/Mendoza": { country: "AR", region: "Mendoza", city: "Mendoza", lat: -32.89, lon: -68.85 },
  "America/Argentina/Cordoba": { country: "AR", region: "Córdoba", city: "Córdoba", lat: -31.42, lon: -64.19 },
  "America/Argentina/Salta": { country: "AR", region: "Salta", city: "Salta", lat: -24.79, lon: -65.41 },
  "America/Argentina/Jujuy": { country: "AR", region: "Jujuy", city: "San Salvador de Jujuy", lat: -24.19, lon: -65.3 },
  "America/Argentina/Tucuman": { country: "AR", region: "Tucumán", city: "San Miguel de Tucumán", lat: -26.82, lon: -65.22 },
  "America/Argentina/Catamarca": { country: "AR", region: "Catamarca", city: "San Fernando del Valle de Catamarca", lat: -28.47, lon: -65.78 },
  "America/Argentina/La_Rioja": { country: "AR", region: "La Rioja", city: "La Rioja", lat: -29.41, lon: -66.86 },
  "America/Argentina/Rio_Gallegos": { country: "AR", region: "Santa Cruz", city: "Río Gallegos", lat: -51.62, lon: -69.22 },
  "America/Argentina/Ushuaia": { country: "AR", region: "Tierra del Fuego", city: "Ushuaia", lat: -54.8, lon: -68.3 },
  "America/Argentina/ComodRivadavia": { country: "AR", region: "Chubut", city: "Comodoro Rivadavia", lat: -45.86, lon: -67.48 },
  "America/Argentina/Buenos_Aires": { country: "AR", region: "", city: "", lat: -34.6, lon: -64.0 },
  "America/Argentina/Argentina": { country: "AR", region: "", city: "", lat: -34.6, lon: -64.0 },
  "America/Santiago": { country: "CL", region: "", city: "", lat: -33.45, lon: -70.67 },
  "America/Montevideo": { country: "UY", region: "", city: "", lat: -34.9, lon: -56.16 },
  "America/Sao_Paulo": { country: "BR", region: "", city: "", lat: -23.55, lon: -46.63 },
  "America/Asuncion": { country: "PY", region: "", city: "", lat: -25.26, lon: -57.58 },
  "America/La_Paz": { country: "BO", region: "", city: "", lat: -16.5, lon: -68.15 },
  "America/Lima": { country: "PE", region: "", city: "", lat: -12.05, lon: -77.04 },
  "America/Bogota": { country: "CO", region: "", city: "", lat: 4.71, lon: -74.07 },
  "America/Guayaquil": { country: "EC", region: "", city: "", lat: -2.17, lon: -79.92 },
  "America/Caracas": { country: "VE", region: "", city: "", lat: 10.48, lon: -66.9 },
  "America/Mexico_City": { country: "MX", region: "", city: "", lat: 19.43, lon: -99.13 },
  "Europe/Madrid": { country: "ES", region: "", city: "", lat: 40.42, lon: -3.7 }
};

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

function foldGuest(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/[^a-z\s]/g, " ")
    .replace(/(.)\1{2,}/g, "$1$1")
    .replace(/\s+/g, " ")
    .trim();
}

function isInstitutionalGuest(institucion, mensaje) {
  var inst = String(institucion || "").trim();
  var msg = String(mensaje || "").trim();
  if (inst.length < 4 || msg.length < 20) return false;
  if (/https?:\/\/|www\.|t\.me\/|bit\.ly|javascript:|<script/i.test(inst + " " + msg)) return false;
  var letters = msg.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  var upper = msg.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, "");
  if (letters.length >= 20 && upper.length / letters.length > 0.72) return false;
  if (/(!|\?){3,}/.test(msg)) return false;
  var folded = foldGuest(inst + " " + msg);
  if (!folded) return false;
  var blocked = [
    "puta", "puto", "putas", "putos", "putita", "putito", "hdp", "lptm",
    "concha", "conchudo", "conchuda",
    "pija", "pijas", "verga", "vergas", "pito",
    "culo", "culos", "cagon", "cagona", "cagar", "cagada", "cago",
    "mierda", "mierdas", "carajo", "carajos",
    "forro", "forra", "forros",
    "boludo", "boluda", "boludos", "boludas",
    "pelotudo", "pelotuda", "pelotudos",
    "estupido", "estupida", "idiota", "idiotas", "imbecil", "imbeciles",
    "tarado", "tarada", "mogolico", "mogolica", "retrasado", "retrasada",
    "sorete", "soretes", "choto", "chota", "orto",
    "marica", "maricon", "trolo", "trola",
    "coger", "cogiendo", "cogida", "cogido",
    "fuck", "fucking", "shit", "asshole", "bitch", "bastard", "dick", "cunt",
    "whore", "slut", "nigger", "retard",
    "porno", "porn", "xxx", "nudes", "onlyfans",
    "matate", "suicidate", "nazi", "hitler"
  ];
  var i;
  for (i = 0; i < blocked.length; i++) {
    if (new RegExp("(^| )" + blocked[i] + "( |$)", "i").test(folded)) return false;
  }
  var phrases = [
    "hijo de puta", "la concha", "me chupa", "andate a", "kill yourself",
    "go to hell", "negro de mierda"
  ];
  for (i = 0; i < phrases.length; i++) {
    if (folded.indexOf(foldGuest(phrases[i])) >= 0) return false;
  }
  return true;
}

function setProyectos(n) {
  var el = $("#c-proyectos");
  if (!el) return;
  var v = Number(n);
  if (!(v > 0)) v = 8;
  el.textContent = formatNum(v);
}

function applyState(data) {
  if (!data || data.ok === false) throw new Error((data && data.error) || "bad-state");
  visitas = Array.isArray(data.visitas) ? data.visitas : [];
  libro = (Array.isArray(data.libro) ? data.libro : []).filter(function (n) {
    return isInstitutionalGuest(n && n.institucion, n && n.mensaje);
  });
  sinGeorref = Number(data.sinGeorref) || 0;
  if (data.proyectos != null) setProyectos(data.proyectos);
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
  var located = 0;
  var unknown = 0;
  (rows || []).forEach(function (r) {
    var n = Number(r.n) || 0;
    if (isUnlocatedRow(r)) unknown += n;
    else located += n;
  });
  unknown += Number(sinGeorref) || 0;
  return { todas: located + unknown, located: located, unlocated: unknown };
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
    if (isUnlocatedRow(r)) return;
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
  var t = totals(visitas);
  setNum("#c-visitas", t.todas);
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

function isUnknownLabel(s) {
  var k = foldName(s);
  return !k ||
    k === "origen no determinado" ||
    k === "sin pais" ||
    k === "sin provincia region" ||
    k === "unknown" ||
    k === "undetermined" ||
    k === "n a" ||
    k === "na" ||
    k === "null" ||
    k === "undefined" ||
    k === "xx" ||
    k === "zz";
}

function isUnlocatedRow(r) {
  if (!r) return true;
  var code = String(r.country || "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "ZZ") return false;
  if (r.countryName && !isUnknownLabel(r.countryName) && String(r.countryName).trim().length > 2) return false;
  if (r.region && (provinceLabel(r.region) || String(r.region).trim().length > 2) && !isUnknownLabel(r.region)) return false;
  if (r.lugar) {
    var bits = String(r.lugar).split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var last = bits.length ? bits[bits.length - 1] : "";
    if (countryLabelFromName(last) || provinceLabel(last)) return false;
    if (isUnknownLabel(r.lugar) || isUnknownLabel(last)) return true;
  }
  return true;
}

function locatedVisitas() {
  return (visitas || []).filter(function (r) { return !isUnlocatedRow(r); });
}

function coordsFor(row) {
  if (isUnlocatedRow(row)) return null;
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
  return null;
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
  if (isUnknownLabel(country)) {
    country = "";
    named = "";
    asProvince = "";
  }
  if (isUnknownLabel(region)) region = "";
  if (isUnknownLabel(city)) city = "";

  if (named) country = named;
  if (asProvince) {
    if (!provinceLabel(region)) region = asProvince;
    country = "Argentina";
    code = "AR";
  }
  if (COUNTRY_LABELS[code]) country = COUNTRY_LABELS[code];

  if ((!country || !region) && row.lugar && !isUnknownLabel(row.lugar)) {
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
  if (isUnknownLabel(country)) country = tt("sec.vis.nopais", "Sin país");
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
  bindOriginClicks(ul, items, kind);
}

function countryCoords(sample) {
  var parts = originParts(sample || {});
  if (CENTROIDS[parts.code]) {
    var c = CENTROIDS[parts.code];
    return [c[1], c[0]];
  }
  return coordsFor({
    country: parts.code,
    countryName: parts.country,
    region: "",
    city: "",
    lugar: parts.country,
    lat: 0,
    lon: 0
  });
}

function groupRegionsByCountry(regiones) {
  var bag = {};
  regiones.forEach(function (item) {
    var parts = originParts(item.sample || {});
    var ck = countryKey(parts);
    if (!bag[ck]) {
      bag[ck] = {
        key: ck,
        country: parts.country,
        n: 0,
        regions: [],
        sample: item.sample
      };
    }
    bag[ck].regions.push(item);
    bag[ck].n += Number(item.n) || 0;
  });
  return Object.keys(bag).map(function (k) { return bag[k]; }).sort(function (a, b) {
    if ((b.n || 0) !== (a.n || 0)) return (b.n || 0) - (a.n || 0);
    return String(a.country || "").localeCompare(String(b.country || ""), "es");
  }).map(function (g) {
    g.regions.sort(function (a, b) {
      if ((b.n || 0) !== (a.n || 0)) return (b.n || 0) - (a.n || 0);
      return String(a.label || "").localeCompare(String(b.label || ""), "es");
    });
    return g;
  });
}

function renderRegionGroups(ul, groups) {
  if (!ul) return;
  if (!groups.length) {
    ul.innerHTML = '<li class="empty">' + escapeHtml(tt("sec.vis.empty", "Todavía no hay orígenes en el mapa compartido.")) + "</li>";
    return;
  }
  var items = [];
  var html = groups.map(function (g) {
    var pid = "pais:" + g.key;
    items.push({
      id: pid,
      n: g.n,
      label: g.country,
      sample: g.sample,
      kind: "paises"
    });
    var head =
      '<li class="origin-group" data-kind="paises" data-id="' + escapeHtml(pid) + '">' +
      '<span class="origin-copy"><strong>' + escapeHtml(g.country) + "</strong></span>" +
      "<b>" + (g.n || 0) + "</b></li>";
    var kids = g.regions.map(function (r) {
      items.push(r);
      return (
        '<li class="origin-child" data-kind="regiones" data-id="' + escapeHtml(r.id) + '">' +
        '<span class="origin-copy"><strong>' + escapeHtml(r.label) + "</strong></span>" +
        "<b>" + (r.n || 0) + "</b></li>"
      );
    }).join("");
    return head + kids;
  }).join("");
  ul.innerHTML = html;
  bindOriginClicks(ul, items);
}

function bindOriginClicks(ul, items, kind) {
  $$("li[data-id]", ul).forEach(function (li) {
    li.addEventListener("click", function () {
      $$(".origin-list li").forEach(function (x) { x.classList.remove("on"); });
      li.classList.add("on");
      var row = items.find(function (v) { return v.id === li.dataset.id; });
      var zoomKind = (row && row.kind) || li.getAttribute("data-kind") || kind;
      if (row && map) {
        if (zoomKind === "mundo") {
          map.setView([12, -20], 2);
          return;
        }
        var ll = zoomKind === "paises" ? countryCoords(row.sample || row) : coordsFor(row.sample || row);
        if (ll) map.setView(ll, zoomKind === "paises" ? 4 : 6);
      }
    });
  });
}

function countryKey(parts) {
  if (parts.code && COUNTRY_LABELS[parts.code]) return parts.code;
  return String(parts.country || "").toLowerCase();
}

function renderRanking() {
  var rows = locatedVisitas();
  var noPais = foldName(tt("sec.vis.nopais", "Sin país"));
  var noReg = foldName(tt("sec.vis.noregion", "Sin provincia / región"));
  var paises = groupRanking(
    rows,
    function (_r, p) { return "pais:" + countryKey(p); },
    function (_r, p) { return p.country; }
  ).filter(function (item) {
    return foldName(item.label) !== noPais && !isUnknownLabel(item.label);
  });
  var regiones = groupRanking(
    rows,
    function (_r, p) { return "reg:" + countryKey(p) + "|" + String(p.region || "").toLowerCase(); },
    function (_r, p) { return p.region; }
  ).filter(function (item) {
    return foldName(item.label) !== noReg && !isUnknownLabel(item.label);
  });
  var t = totals(visitas);
  renderCollapsedList($("#ranking-mundo"), t.located ? [{
    id: "mundo",
    label: tt("sec.vis.mundo", "Mundo"),
    n: t.located,
    kind: "mundo"
  }] : [], "mundo");
  renderCollapsedList($("#ranking-paises"), paises, "paises");
  renderRegionGroups($("#ranking-regiones"), groupRegionsByCountry(regiones));
  setCountLabel("#n-mundo", t.located ? 1 : 0);
  setCountLabel("#n-paises", paises.length);
  setCountLabel("#n-regiones", regiones.length);
  if ($("#n-todas")) $("#n-todas").textContent = formatNum(t.todas);
  if ($("#n-libro")) $("#n-libro").textContent = formatNum(libro.length);
  var note = $("#geo-note");
  if (note) {
    if (t.unlocated) {
      note.hidden = false;
      note.textContent = tt("sec.vis.unlocated", "{n} visitas se contabilizan pero no se georreferenciaron (VPN, red privada o protección del navegador). No figuran como país.", { n: formatNum(t.unlocated) });
    } else {
      note.hidden = true;
      note.textContent = "";
    }
  }
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
    if (isUnlocatedRow(r)) return;
    var ll = coordsFor(r);
    if (!ll) return;
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

function firstGeoField(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    var v = obj[keys[i]];
    if (v == null) continue;
    var s = String(v).trim();
    if (s && s !== "-" && s.toLowerCase() !== "undefined") return s;
  }
  return "";
}

function normalizeGeo(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.error || raw.success === false) return null;
  var code = firstGeoField(raw, ["country_code", "countryCode", "country_code2"]).toUpperCase();
  var name = firstGeoField(raw, ["country_name", "countryName"]);
  if (!name) {
    var c = firstGeoField(raw, ["country"]);
    if (c.length > 2) name = c;
    else if (c.length === 2 && !code) code = c.toUpperCase();
  }
  if (name.length === 2 && !code) {
    code = name.toUpperCase();
    name = "";
  }
  if (code === "ARG") code = "AR";
  var lat = raw.latitude != null ? raw.latitude : raw.lat;
  var lon = raw.longitude != null ? raw.longitude : raw.lon;
  return {
    country_code: code,
    country_name: name,
    region: firstGeoField(raw, ["region", "regionName", "region_name", "subdivision", "principalSubdivision"]),
    city: firstGeoField(raw, ["city", "cityName", "city_name"]),
    latitude: lat,
    longitude: lon
  };
}

function geoPayload(geo) {
  /* Los JSON de geolocalización pueden traer "ip": se descarta y nunca se envía al backend. */
  var country = String(geo.country_code || "").trim().toUpperCase();
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
  if (provinceLabel(countryName) && !countryLabelFromName(countryName)) {
    if (!region) region = provinceLabel(countryName);
    countryName = "Argentina";
    country = "AR";
  }
  if (countryLabelFromName(countryName)) countryName = countryLabelFromName(countryName);
  if (COUNTRY_LABELS[country]) countryName = COUNTRY_LABELS[country];
  if ((!country || country.length !== 2) && countryName === "Argentina") country = "AR";
  if (country.length !== 2) country = "";
  if (provinceLabel(region)) region = provinceLabel(region);
  var campus = /san luis|san juan|mendoza/i.test(city + " " + region);
  var bits = [city, region, countryName].filter(Boolean);
  return {
    country: country,
    countryName: countryName,
    region: region,
    city: city,
    lat: lat,
    lon: lon,
    tipo: campus ? "interna" : "externa",
    lugar: bits.join(", "),
    source: "ip"
  };
}

function hasCountry(g) {
  if (!g) return false;
  var code = String(g.country || "").toUpperCase();
  if (/^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "ZZ") return true;
  return !!(g.countryName && !isUnknownLabel(g.countryName) && String(g.countryName).trim().length > 2);
}

function fetchGeoJson(url, ms) {
  var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || 4000);
  var opts = { method: "GET", cache: "no-store" };
  if (ctrl) opts.signal = ctrl.signal;
  return fetch(url, opts).then(function (res) {
    clearTimeout(timer);
    if (!res.ok) throw new Error("http");
    return res.json();
  }).catch(function () {
    clearTimeout(timer);
    return null;
  });
}

async function lookupIpOrigin() {
  var urls = [
    "https://get.geojs.io/v1/ip/geo.json",
    "https://ipwho.is/?fields=success,country,country_code,region,city,latitude,longitude",
    "https://freeipapi.com/api/json",
    "https://ipapi.co/json/"
  ];
  var best = null;
  for (var i = 0; i < urls.length; i++) {
    var raw = await fetchGeoJson(urls[i], 4000);
    var norm = normalizeGeo(raw);
    if (!norm) continue;
    var g = geoPayload(norm);
    if (!hasCountry(g)) continue;
    best = g;
    if (g.region) return g;
  }
  return best;
}

function timezoneHint() {
  var tz = "";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch (_e) {}
  return TZ_HINTS[tz] || null;
}

function localeHint() {
  var lang = String((navigator.languages && navigator.languages[0]) || navigator.language || "")
    .toLowerCase()
    .replace("_", "-");
  var map = {
    "es-ar": "AR",
    "es-cl": "CL",
    "es-uy": "UY",
    "es-py": "PY",
    "es-bo": "BO",
    "es-pe": "PE",
    "es-co": "CO",
    "es-mx": "MX",
    "es-ec": "EC",
    "es-ve": "VE",
    "pt-br": "BR"
  };
  var code = map[lang];
  if (!code) return null;
  return { country: code, countryName: COUNTRY_LABELS[code] || "", region: "", city: "", lat: 0, lon: 0 };
}

function applyHint(g, hint, source) {
  if (!hint) return g;
  if (!hasCountry(g)) {
    g.country = hint.country;
    g.countryName = COUNTRY_LABELS[hint.country] || hint.countryName || "";
    g.region = hint.region || "";
    g.city = hint.city || "";
    g.lat = hint.lat || 0;
    g.lon = hint.lon || 0;
    g.source = source;
    return g;
  }
  if (g.country === hint.country && !g.region && hint.region) {
    g.region = hint.region;
    if (!g.city && hint.city) g.city = hint.city;
    if (!(g.lat && g.lon) && hint.lat) {
      g.lat = hint.lat;
      g.lon = hint.lon;
    }
  }
  return g;
}

function finishOrigin(g) {
  if (COUNTRY_LABELS[g.country]) g.countryName = COUNTRY_LABELS[g.country];
  if (provinceLabel(g.region)) g.region = provinceLabel(g.region);
  if (!g.region && provinceLabel(g.city)) g.region = provinceLabel(g.city);
  var campus = /san luis|san juan|mendoza/i.test((g.city || "") + " " + (g.region || ""));
  g.tipo = campus ? "interna" : "externa";
  g.lugar = [g.city, g.region, g.countryName].filter(Boolean).join(", ");
  if (!(g.lat && g.lon)) {
    var ll = coordsFor({
      country: g.country,
      countryName: g.countryName,
      region: g.region,
      city: g.city,
      lugar: g.lugar,
      lat: g.lat,
      lon: g.lon
    });
    if (ll) {
      g.lat = ll[0];
      g.lon = ll[1];
    }
  }
  return g;
}

async function pingVisitgeo(g) {
  var located = hasCountry(g) ? "1" : "0";
  var extra =
    "country=" + encodeURIComponent(g.country || "") +
    "&countryName=" + encodeURIComponent(g.countryName || "") +
    "&region=" + encodeURIComponent(g.region || "") +
    "&city=" + encodeURIComponent(g.city || "") +
    "&tipo=" + encodeURIComponent(g.tipo || "externa") +
    "&lat=" + encodeURIComponent(g.lat || 0) +
    "&lon=" + encodeURIComponent(g.lon || 0) +
    "&located=" + located;
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
    lugar: "",
    source: ""
  };
  try {
    var ip = await lookupIpOrigin();
    if (ip) g = ip;
  } catch (_geoErr) {}
  g = applyHint(g, timezoneHint(), "timezone");
  if (!hasCountry(g)) g = applyHint(g, localeHint(), "locale");
  g = finishOrigin(g);

  if (banner) {
    banner.classList.add("show");
    if (hasCountry(g)) {
      var msg = "sec.vis.you";
      var fallback = "Estás visitando desde {lugar}. Se suma 1 al contador de visitas (país y región estimados; no se guarda la IP).";
      if (g.source === "timezone") {
        msg = "sec.vis.you.tz";
        fallback = "Origen estimado por zona horaria del dispositivo: {lugar}. Se suma 1 al contador. No se guarda la IP.";
      } else if (g.source === "locale") {
        msg = "sec.vis.you.locale";
        fallback = "Origen estimado por idioma del dispositivo: {lugar}. Se suma 1 al contador. No se guarda la IP.";
      }
      banner.innerHTML = tt(msg, fallback, { lugar: g.lugar });
    } else {
      banner.innerHTML = tt(
        "sec.vis.you.none",
        "Tu visita se contabiliza. No fue posible georreferenciar la red (VPN, red privada o protección del navegador). El ranking solo muestra orígenes estimados."
      );
    }
  }
  if ($("#campo-lugar") && g.lugar) $("#campo-lugar").value = g.lugar;
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

function refreshMap() {
  if (!map) return;
  setTimeout(function () { map.invalidateSize(); }, 280);
}

function initMap() {
  map = L.map("map", { scrollWheelZoom: false }).setView([-33.3, -66.3], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
    maxZoom: 18,
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  drawMarkers();
  refreshMap();
  window.addEventListener("resize", refreshMap);
  window.addEventListener("orientationchange", refreshMap);
}

function initNav() {
  var header = $("#site-header");
  var panel = $("#nav-panel");
  var overlay = $("#nav-overlay");
  var burger = $("#burger");
  var closeBtn = $("#nav-close");
  var headerBar = header && header.querySelector(".header-bar");
  var panelAnchor = headerBar && headerBar.querySelector(".header-cta");
  var mqNav = window.matchMedia("(max-width: 1100px)");
  var links = $$(".menu-root a, .drawer-cta a[href^='#']");
  var pillars = $$(".menu-root [data-pillar]");
  var PILLAR = {
    inicio: "inicio",
    equipo: "semillero",
    semillero: "semillero",
    numeros: "semillero",
    formacion: "formarse",
    convocatoria: "formarse",
    lineas: "formarse",
    visitas: "visitas",
    galeria: "comunidad",
    contacto: "contacto"
  };

  function placeNavPanel() {
    if (!panel) return;
    if (mqNav.matches) {
      if (overlay && overlay.parentNode) overlay.parentNode.insertBefore(panel, overlay);
      else document.body.appendChild(panel);
    } else if (headerBar && panelAnchor) {
      headerBar.insertBefore(panel, panelAnchor);
      setNav(false);
    }
  }

  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    if (header) header.classList.toggle("nav-open", open);
    if (overlay) overlay.hidden = !open;
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) {
      $$(".has-sub").forEach(function (x) {
        x.classList.remove("open");
        var subBtn = x.querySelector("button");
        if (subBtn) subBtn.setAttribute("aria-expanded", "false");
      });
      refreshMap();
    }
  }

  placeNavPanel();
  if (mqNav.addEventListener) mqNav.addEventListener("change", placeNavPanel);
  else if (mqNav.addListener) mqNav.addListener(placeNavPanel);

  if (burger) {
    burger.addEventListener("click", function (ev) {
      ev.stopPropagation();
      setNav(!document.body.classList.contains("nav-open"));
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", function (ev) {
    ev.stopPropagation();
    setNav(false);
  });
  if (overlay) overlay.addEventListener("click", function () { setNav(false); });
  if (panel) panel.addEventListener("click", function (ev) { ev.stopPropagation(); });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") setNav(false);
  });

  $$(".has-sub > button").forEach(function (btn) {
    btn.addEventListener("click", function (ev) {
      if (!mqNav.matches) return;
      ev.preventDefault();
      ev.stopPropagation();
      var li = btn.parentElement;
      var open = !li.classList.contains("open");
      $$(".has-sub").forEach(function (x) {
        x.classList.remove("open");
        var other = x.querySelector("button");
        if (other) other.setAttribute("aria-expanded", "false");
      });
      if (open) li.classList.add("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  links.forEach(function (a) {
    a.addEventListener("click", function () { setNav(false); });
  });
  $$(".foot-grid a[href^='#']").forEach(function (a) {
    a.addEventListener("click", function () { setNav(false); });
  });

  var io = new IntersectionObserver(function (entries) {
    var vis = entries.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) {
      return b.intersectionRatio - a.intersectionRatio;
    })[0];
    if (!vis) return;
    var id = vis.target.id;
    var pillar = PILLAR[id];
    $$(".menu-root a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + id);
    });
    pillars.forEach(function (li) {
      li.classList.toggle("active", li.getAttribute("data-pillar") === pillar);
    });
  }, { rootMargin: "-35% 0px -50% 0px", threshold: [0.1, 0.3, 0.6] });
  $$("section.panel, .hero").forEach(function (s) { io.observe(s); });
}
function initCounters() {
  setProyectos(8);
  [["#c-lineas", 6], ["#c-niveles", 5]].forEach(function (pair) {
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
    var institucion = String(fd.get("institucion") || "").trim();
    var mensaje = String(fd.get("mensaje") || "").trim();
    var lugar = String(fd.get("lugar") || "").trim();
    var ok = $("#ok-visita");
    if (!isInstitutionalGuest(institucion, mensaje)) {
      if (ok) {
        ok.hidden = false;
        ok.textContent = tt(
          "sec.vis.rejected",
          "El mensaje no se publicó. El libro es institucional: solo se aceptan textos formales, respetuosos y sin insultos ni spam."
        );
      }
      return;
    }
    var extra =
      "institucion=" + encodeURIComponent(institucion) +
      "&mensaje=" + encodeURIComponent(mensaje) +
      "&lugar=" + encodeURIComponent(lugar);
    fetchApps("libro", extra)
      .then(function (data) {
        if (!data || data.ok === false) {
          if (ok) {
            ok.hidden = false;
            ok.textContent = data && data.error === "rejected"
              ? tt("sec.vis.rejected", "El mensaje no se publicó. El libro es institucional: solo se aceptan textos formales, respetuosos y sin insultos ni spam.")
              : tt("sec.vis.nobackend", "No se pudo guardar el mensaje en el backend compartido.");
          }
          return;
        }
        applyState(data);
        ev.currentTarget.reset();
        if (ok) {
          ok.hidden = false;
          ok.textContent = tt("sec.vis.ok", "Mensaje publicado más abajo, en el libro de esta página.");
        }
        var book = $("#libro");
        if (book && book.scrollIntoView) book.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch(function () {
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
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(function () {});
  }
  var installBtn = $("#btn-install");
  var shareBtn = $("#btn-share");
  var hint = $("#app-hint");
  var deferred;
  var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent || "") ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (standalone) {
    document.documentElement.classList.add("is-standalone");
    if (installBtn) installBtn.hidden = true;
    if (hint) hint.hidden = true;
  } else if (ios) {
    if (installBtn) installBtn.hidden = false;
    if (hint) hint.textContent = tt("app.hint.ios", "En iPhone: botón Compartir → Agregar a pantalla de inicio. El ícono se llama Semillero IA.");
    if (installBtn) {
      installBtn.addEventListener("click", function () {
        if (hint) {
          hint.hidden = false;
          hint.textContent = tt("app.hint.ios", "En iPhone: botón Compartir → Agregar a pantalla de inicio. El ícono se llama Semillero IA.");
        }
      });
    }
  }
  window.addEventListener("beforeinstallprompt", function (ev) {
    ev.preventDefault();
    deferred = ev;
    if (installBtn) installBtn.hidden = false;
  });
  if (installBtn && !ios) {
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
  window.addEventListener("hashchange", function () {
    maybeCountVisit();
    if (String(location.hash || "").replace(/^#/, "") === "visitas") refreshMap();
  });
  $$("[data-inscripcion]").forEach(function (a) { a.href = INSCRIPCION; });
  $$("[data-observatorio]").forEach(function (a) { a.href = OBSERVATORIO; });
});

window.addEventListener("sia:langchange", function () {
  renderRanking();
  renderLibro();
  updateNumeros();
});
