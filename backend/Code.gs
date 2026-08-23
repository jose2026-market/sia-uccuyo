var SITE = "semillero";

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

function publicState(st) {
  return { ok: true, visitas: st.visitas, libro: publicLibro(st.libro) };
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

    if (action === "state") {
      return jsonOut(publicState(st), callback);
    }

    if (action === "visitgeo") {
      var country = String(p.countryName || p.country || "").trim();
      var region = String(p.region || "").trim();
      var city = String(p.city || "").trim();
      var bits = [];
      if (city) bits.push(city);
      if (region) bits.push(region);
      if (country) bits.push(country);
      var lugar = bits.join(", ") || "Origen no determinado";
      var tipo = String(p.tipo || "").trim();
      if (tipo !== "interna" && tipo !== "externa") {
        tipo = /san luis|san juan|mendoza/i.test(region + " " + city) ? "interna" : "externa";
      }
      upsertVisit(st, {
        lugar: lugar,
        lat: Number(p.lat) || 0,
        lon: Number(p.lon) || 0,
        tipo: tipo,
        country: String(p.country || ""),
        countryName: String(p.countryName || country),
        region: region,
        city: city
      });
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
      if (!row.nombre || !row.institucion) {
        return jsonOut({ ok: false, error: "incomplete" }, callback);
      }
      st.libro.push(row);
      if (p.lugar) {
        upsertVisit(st, {
          lugar: String(p.lugar),
          lat: Number(p.lat) || 0,
          lon: Number(p.lon) || 0,
          tipo: row.tipo
        });
      }
      saveState(st);
      return jsonOut(publicState(st), callback);
    }

    return jsonOut({ ok: false, error: "unknown_action" }, callback);
  } finally {
    lock.releaseLock();
  }
}
