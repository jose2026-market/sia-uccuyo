var SITE = "semillero";
var FORM_ID = "1qHvn-2PLpb0zLi0j_g69Jv3CVsTcz7hZwHjl43bfq04";
var PROYECTOS_FALLBACK = 8;

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function getState() {
  var raw = PropertiesService.getScriptProperties().getProperty("SIA_STATE");
  if (!raw) {
    return { visitas: [], libro: [] };
  }
  try {
    var o = JSON.parse(raw);
    if (!o.visitas) {
      o.visitas = [];
    }
    if (!o.libro) {
      o.libro = [];
    }
    if (o.sinGeorref == null) {
      o.sinGeorref = 0;
    }
    return o;
  } catch (err) {
    return { visitas: [], libro: [] };
  }
}

function publicLibro(rows) {
  var out = [];
  var i;
  for (i = 0; i < (rows || []).length; i++) {
    var n = rows[i] || {};
    if (!isInstitutionalGuest(n.institucion, n.mensaje)) {
      continue;
    }
    out.push({
      institucion: n.institucion || "",
      tipo: n.tipo || "externa",
      motivo: n.motivo || "",
      mensaje: n.mensaje || "",
      lugar: n.lugar || "",
      cuando: n.cuando || ""
    });
  }
  return out;
}

function foldGuest(s) {
  s = String(s || "").toLowerCase();
  var from = "áéíóúüñàèìòùäëïöâêîôû";
  var to = "aeiouunaeiouaeioaeiou";
  var i;
  var out = "";
  for (i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    var idx = from.indexOf(ch);
    if (idx >= 0) ch = to.charAt(idx);
    if (ch === "0") ch = "o";
    if (ch === "1") ch = "i";
    if (ch === "3") ch = "e";
    if (ch === "4") ch = "a";
    if (ch === "@") ch = "a";
    if (ch === "$") ch = "s";
    if (!/[a-z]/.test(ch)) ch = " ";
    out += ch;
  }
  return out.replace(/(.)\1{2,}/g, "$1$1").replace(/\s+/g, " ").trim();
}

function isInstitutionalGuest(institucion, mensaje) {
  var inst = String(institucion || "").trim();
  var msg = String(mensaje || "").trim();
  var i;
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

function migrateLibro(st) {
  var kept = [];
  var i;
  for (i = 0; i < (st.libro || []).length; i++) {
    var n = st.libro[i];
    if (isInstitutionalGuest(n.institucion, n.mensaje)) {
      kept.push(n);
    }
  }
  st.libro = kept;
}

function isUnknownText(s) {
  s = String(s || "").toLowerCase()
    .replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i")
    .replace(/ó/g, "o").replace(/ú/g, "u").replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, " ").trim();
  return !s ||
    s === "origen no determinado" ||
    s === "sin pais" ||
    s === "sin provincia region" ||
    s === "unknown" ||
    s === "undetermined" ||
    s === "n a" ||
    s === "na" ||
    s === "null" ||
    s === "undefined" ||
    s === "xx" ||
    s === "zz";
}

function isUnlocatedRecord(r) {
  var code = String((r && r.country) || "").trim().toUpperCase();
  var name = String((r && r.countryName) || "").trim();
  var region = String((r && r.region) || "").trim();
  var lugar = String((r && r.lugar) || "").trim();
  if (/^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "ZZ") return false;
  if (name && !isUnknownText(name)) return false;
  if (region && !isUnknownText(region)) return false;
  if (lugar && !isUnknownText(lugar)) {
    var bits = lugar.split(",");
    var last = bits[bits.length - 1] ? bits[bits.length - 1].trim() : "";
    if (last && !isUnknownText(last)) return false;
  }
  return true;
}

function migrateUnknownVisits(st) {
  st.sinGeorref = Number(st.sinGeorref) || 0;
  var kept = [];
  var i;
  for (i = 0; i < st.visitas.length; i++) {
    var r = st.visitas[i];
    if (isUnlocatedRecord(r)) {
      st.sinGeorref += Number(r.n) || 0;
    } else {
      kept.push(r);
    }
  }
  st.visitas = kept;
}

function foldProject(s) {
  s = String(s || "").toLowerCase();
  var from = "áéíóúüñàèìòùäëïöâêîôû";
  var to = "aeiouunaeiouaeioaeiou";
  var i;
  var out = "";
  for (i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    var idx = from.indexOf(ch);
    if (idx >= 0) ch = to.charAt(idx);
    if (!/[a-z0-9]/.test(ch)) ch = " ";
    out += ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

function isEmptyProject(s) {
  var k = foldProject(s);
  return !k || k.length < 3 ||
    k === "n a" || k === "na" || k === "ninguno" || k === "ninguna" ||
    k === "sin proyecto" || k === "no se" || k === "a definir" || k === "s n";
}

function countFormProjects() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get("proyectos_n");
  if (hit != null && hit !== "") {
    var cached = Number(hit);
    if (cached >= 0) return cached;
  }
  var n = PROYECTOS_FALLBACK;
  try {
    var form = FormApp.openById(FORM_ID);
    var items = form.getItems();
    var projectItem = null;
    var i;
    for (i = 0; i < items.length; i++) {
      var title = String(items[i].getTitle() || "").toLowerCase();
      if (title.indexOf("proyecto") >= 0 || title.indexOf("ip:") >= 0) {
        projectItem = items[i];
        break;
      }
    }
    if (projectItem) {
      var seen = {};
      var responses = form.getResponses();
      for (i = 0; i < responses.length; i++) {
        var ir = responses[i].getResponseForItem(projectItem);
        if (!ir) continue;
        var val = ir.getResponse();
        var text = Object.prototype.toString.call(val) === "[object Array]" ? val.join(" ") : String(val || "");
        if (isEmptyProject(text)) continue;
        seen[foldProject(text)] = true;
      }
      var keys = Object.keys(seen);
      if (keys.length) n = keys.length;
    }
  } catch (err) {
    n = PROYECTOS_FALLBACK;
  }
  cache.put("proyectos_n", String(n), 300);
  return n;
}

function publicState(st) {
  return {
    ok: true,
    visitas: st.visitas,
    libro: publicLibro(st.libro),
    sinGeorref: Number(st.sinGeorref) || 0,
    proyectos: countFormProjects()
  };
}

function saveState(st) {
  PropertiesService.getScriptProperties().setProperty("SIA_STATE", JSON.stringify(st));
}

function jsonOut(obj, callback) {
  var body = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + body + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function slugOf(lugar) {
  return String(lugar || "origen").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isArProvince(s) {
  return /^(buenos aires|caba|capital federal|catamarca|chaco|chubut|cordoba|córdoba|corrientes|entre rios|entre ríos|formosa|jujuy|la pampa|la rioja|mendoza|misiones|neuquen|neuquén|rio negro|río negro|salta|san juan|san luis|santa cruz|santa fe|santiago del estero|tierra del fuego|tucuman|tucumán)$/i.test(String(s || "").trim());
}

function upsertVisit(st, rec) {
  var id = rec.id || slugOf(rec.lugar);
  var found = null;
  var i;
  for (i = 0; i < st.visitas.length; i++) {
    if (st.visitas[i].id === id) {
      found = st.visitas[i];
      break;
    }
  }
  if (found) {
    found.n = Number(found.n || 0) + 1;
    if (rec.tipo) found.tipo = rec.tipo;
    if (rec.lat) found.lat = rec.lat;
    if (rec.lon) found.lon = rec.lon;
    if (rec.country) found.country = rec.country;
    if (rec.countryName) found.countryName = rec.countryName;
    if (rec.region) found.region = rec.region;
    if (rec.city) found.city = rec.city;
  } else {
    st.visitas.push({
      id: id,
      lugar: rec.lugar,
      lat: rec.lat || 0,
      lon: rec.lon || 0,
      n: 1,
      tipo: rec.tipo || "externa",
      country: rec.country || "",
      countryName: rec.countryName || "",
      region: rec.region || "",
      city: rec.city || ""
    });
  }
}

function handleRequest(e) {
  var p = {};
  if (e && e.parameter) {
    p = e.parameter;
  }
  var action = String(p.action || "state");
  var callback = p.callback || "";
  if (p.site && String(p.site) !== SITE) {
    return jsonOut({ ok: false, error: "invalid_site" }, callback);
  }

    var lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
    var st = getState();
    var n0 = st.visitas.length;
    var u0 = Number(st.sinGeorref) || 0;
    var l0 = (st.libro || []).length;
    migrateUnknownVisits(st);
    migrateLibro(st);
    if (st.visitas.length !== n0 || Number(st.sinGeorref) !== u0 || (st.libro || []).length !== l0) {
      saveState(st);
    }

    if (action === "state") {
      return jsonOut(publicState(st), callback);
    }

    if (action === "visitgeo") {
      delete p.ip;
      delete p.IP;
      delete p.ipAddress;
      delete p.query;
      var countryCode = String(p.country || "").trim().toUpperCase();
      var country = String(p.countryName || "").trim();
      var region = String(p.region || "").trim();
      var city = String(p.city || "").trim();
      if (isArProvince(country) && !/^argentina$/i.test(country)) {
        if (!region) region = country;
        country = "Argentina";
        countryCode = "AR";
      }
      if (countryCode === "AR" && !country) country = "Argentina";
      if (isArProvince(countryCode)) {
        if (!region) region = String(p.country || "");
        country = "Argentina";
        countryCode = "AR";
      }
      if (isArProvince(region) && !countryCode) {
        country = "Argentina";
        countryCode = "AR";
      }
      var forcedUnknown = String(p.located || "") === "0";
      var rec = {
        lugar: "",
        lat: Number(p.lat) || 0,
        lon: Number(p.lon) || 0,
        tipo: "",
        country: countryCode,
        countryName: country,
        region: region,
        city: city
      };
      var bits = [];
      if (city) bits.push(city);
      if (region) bits.push(region);
      if (country) bits.push(country);
      rec.lugar = bits.join(", ");
      rec.tipo = String(p.tipo || "").trim();
      if (rec.tipo !== "interna" && rec.tipo !== "externa") {
        rec.tipo = /san luis|san juan|mendoza/i.test(region + " " + city) ? "interna" : "externa";
      }
      if (forcedUnknown || isUnlocatedRecord(rec) || isUnknownText(rec.lugar) || isUnknownText(country)) {
        st.sinGeorref = Number(st.sinGeorref) || 0;
        st.sinGeorref += 1;
        saveState(st);
        return jsonOut(publicState(st), callback);
      }
      upsertVisit(st, rec);
      saveState(st);
      return jsonOut(publicState(st), callback);
    }

    if (action === "libro") {
      var row = {
        nombre: String(p.nombre || "").trim().slice(0, 120),
        institucion: String(p.institucion || "").trim().slice(0, 160),
        tipo: p.tipo === "interna" ? "interna" : "externa",
        motivo: String(p.motivo || "Visita").trim().slice(0, 80),
        mensaje: String(p.mensaje || "").trim().slice(0, 800),
        lugar: String(p.lugar || "").trim().slice(0, 160),
        cuando: Utilities.formatDate(new Date(), "America/Argentina/Buenos_Aires", "yyyy-MM-dd")
      };
      if (!row.institucion || !row.mensaje) {
        return jsonOut({ ok: false, error: "incomplete" }, callback);
      }
      if (!isInstitutionalGuest(row.institucion, row.mensaje)) {
        return jsonOut({ ok: false, error: "rejected" }, callback);
      }
      st.libro.push(row);
      saveState(st);
      return jsonOut(publicState(st), callback);
    }

    return jsonOut({ ok: false, error: "unknown_action" }, callback);
  } finally {
    lock.releaseLock();
  }
}
