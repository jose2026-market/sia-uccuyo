const INSCRIPCION =
  "https://docs.google.com/forms/d/e/1FAIpQLSeCe_VWfR8P3kE1a_nYzqikue500G44iFqgBQCtiICVm6OCzg/viewform?usp=dialog";
const OBSERVATORIO = "https://claudiomlarrea.github.io/observatorio-ia/";
const KEY_VISITAS = "sia-uccuyo-visitas-v1";
const KEY_LIBRO = "sia-uccuyo-libro-v1";

const SEED = [
  { id: "sl", lugar: "San Luis, Argentina", lat: -33.3017, lon: -66.3378, n: 18, tipo: "interna" },
  { id: "sj", lugar: "San Juan, Argentina", lat: -31.5375, lon: -68.5364, n: 11, tipo: "interna" },
  { id: "mz", lugar: "Mendoza, Argentina", lat: -32.8895, lon: -68.8458, n: 7, tipo: "interna" },
  { id: "ba", lugar: "Buenos Aires, Argentina", lat: -34.6037, lon: -58.3816, n: 9, tipo: "externa" },
  { id: "cba", lugar: "Córdoba, Argentina", lat: -31.4201, lon: -64.1888, n: 4, tipo: "externa" },
  { id: "cl", lugar: "Santiago, Chile", lat: -33.4489, lon: -70.6693, n: 2, tipo: "externa" },
  { id: "es", lugar: "Barcelona, España", lat: 41.3874, lon: 2.1686, n: 1, tipo: "externa" },
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function loadVisitas() {
  try {
    const raw = localStorage.getItem(KEY_VISITAS);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return SEED.map((x) => ({ ...x }));
}

function saveVisitas(rows) {
  localStorage.setItem(KEY_VISITAS, JSON.stringify(rows));
}

function loadLibro() {
  try {
    const raw = localStorage.getItem(KEY_LIBRO);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [
    {
      nombre: "Visita institucional (muestra)",
      institucion: "Universidad invitada",
      tipo: "externa",
      motivo: "Vinculación",
      mensaje: "Espacio de ejemplo. Las nuevas visitas de externos aparecen aquí.",
      cuando: "2026-08-20",
    },
  ];
}

function saveLibro(rows) {
  localStorage.setItem(KEY_LIBRO, JSON.stringify(rows));
}

function slugLugar(pais, region, ciudad) {
  const bits = [ciudad, region, pais].filter(Boolean);
  return bits.join(", ") || "Origen no determinado";
}

let map, markersLayer, visitas, filtro = "todas";

function totals(rows) {
  const t = { todas: 0, interna: 0, externa: 0 };
  for (const r of rows) {
    t.todas += r.n;
    t[r.tipo] += r.n;
  }
  return t;
}

function renderRanking() {
  const ul = $("#origenes");
  const rows = visitas
    .filter((r) => filtro === "todas" || r.tipo === filtro)
    .sort((a, b) => b.n - a.n);
  ul.innerHTML = rows
    .map(
      (r) => `<li data-id="${r.id}">
        <span><strong>${r.lugar}</strong><br><span class="tag ${r.tipo === "externa" ? "ext" : "int"}">${r.tipo}</span></span>
        <b>${r.n}</b>
      </li>`
    )
    .join("");
  $$("#origenes li").forEach((li) => {
    li.addEventListener("click", () => {
      $$("#origenes li").forEach((x) => x.classList.remove("on"));
      li.classList.add("on");
      const row = visitas.find((v) => v.id === li.dataset.id);
      if (row && map) map.setView([row.lat, row.lon], 6);
    });
  });
  const t = totals(visitas);
  $("#n-todas").textContent = t.todas;
  $("#n-ext").textContent = t.externa;
  $("#n-int").textContent = t.interna;
}

function drawMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();
  visitas
    .filter((r) => filtro === "todas" || r.tipo === filtro)
    .forEach((r) => {
      const color = r.tipo === "externa" ? "#7D1B1C" : "#064A31";
      const m = L.circleMarker([r.lat, r.lon], {
        radius: 7 + Math.min(r.n, 12),
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.55,
      }).bindPopup(`<strong>${r.lugar}</strong><br>${r.n} visita${r.n === 1 ? "" : "s"} · ${r.tipo}`);
      markersLayer.addLayer(m);
    });
}

function upsertVisita(lugar, lat, lon, tipo) {
  const id = lugar.toLowerCase().replace(/[^a-z0-9]+/gi, "-");
  const found = visitas.find((v) => v.id === id);
  if (found) {
    found.n += 1;
    found.tipo = tipo || found.tipo;
  } else {
    visitas.push({ id, lugar, lat, lon, n: 1, tipo: tipo || "externa" });
  }
  saveVisitas(visitas);
  renderRanking();
  drawMarkers();
}

function renderLibro() {
  const box = $("#libro");
  const rows = loadLibro().slice().reverse();
  box.innerHTML = rows
    .map(
      (n) => `<article class="note">
        <strong>${n.nombre}</strong> · ${n.institucion}
        <br><small>${n.cuando} · ${n.motivo} · visita ${n.tipo}</small>
        <p>${n.mensaje}</p>
      </article>`
    )
    .join("");
}

async function geolocalizar() {
  const banner = $("#banner-you");
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) throw new Error("geo");
    const data = await res.json();
    const lugar = slugLugar(data.country_name, data.region, data.city);
    const lat = Number(data.latitude) || -33.3;
    const lon = Number(data.longitude) || -66.34;
    const campus = /san luis|san juan|mendoza/i.test(`${data.city} ${data.region}`);
    const tipo = campus ? "interna" : "externa";
    banner.classList.add("show");
    banner.innerHTML = `Estás visitando desde <strong>${lugar}</strong> · se registra como visita <strong>${tipo}</strong> (estimación por IP, no se guarda tu dirección).`;
    upsertVisita(lugar, lat, lon, tipo);
    if (map) map.setView([lat, lon], 5);
    $("#campo-lugar").value = lugar;
    if (!campus) $("#campo-tipo").value = "externa";
  } catch (_) {
    banner.classList.add("show");
    banner.textContent =
      "No se pudo estimar el origen (hace falta conexión). Podés registrar la visita a mano en el libro de externos.";
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
  setTimeout(() => map.invalidateSize(), 250);
}

function initNav() {
  const links = $$("nav.menu a");
  const sidebar = $(".sidebar");
  const burger = $("#burger");
  burger?.addEventListener("click", () => sidebar.classList.toggle("open"));
  links.forEach((a) =>
    a.addEventListener("click", () => sidebar.classList.remove("open"))
  );
  const io = new IntersectionObserver(
    (entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!vis) return;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${vis.target.id}`));
    },
    { rootMargin: "-35% 0px -50% 0px", threshold: [0.1, 0.3, 0.6] }
  );
  $$("section.panel, .hero").forEach((s) => io.observe(s));
}

function initCounters() {
  const t = totals(visitas);
  const targets = {
    "#c-inscriptos": 6,
    "#c-lineas": 6,
    "#c-niveles": 5,
    "#c-visitas": t.todas,
  };
  Object.entries(targets).forEach(([sel, n]) => {
    const el = $(sel);
    if (!el) return;
    let i = 0;
    const step = Math.max(1, Math.round(n / 24));
    const tick = () => {
      i = Math.min(n, i + step);
      el.textContent = String(i);
      if (i < n) requestAnimationFrame(tick);
    };
    tick();
  });
}

function initForm() {
  $("#form-visita").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const row = {
      nombre: String(fd.get("nombre") || "").trim(),
      institucion: String(fd.get("institucion") || "").trim(),
      tipo: String(fd.get("tipo") || "externa"),
      motivo: String(fd.get("motivo") || "Visita"),
      mensaje: String(fd.get("mensaje") || "").trim(),
      cuando: new Date().toISOString().slice(0, 10),
    };
    if (!row.nombre || !row.institucion) return;
    const libro = loadLibro();
    libro.push(row);
    saveLibro(libro);
    renderLibro();
    const lugar = String(fd.get("lugar") || row.institucion);
    upsertVisita(lugar, -33.3, -66.34, row.tipo);
    ev.currentTarget.reset();
    $("#ok-visita").hidden = false;
  });
  $$(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      filtro = btn.dataset.filtro;
      $$(".filter").forEach((b) => b.classList.toggle("on", b === btn));
      renderRanking();
      drawMarkers();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  visitas = loadVisitas();
  initNav();
  initMap();
  renderRanking();
  renderLibro();
  initCounters();
  initForm();
  geolocalizar();
  $$("[data-inscripcion]").forEach((a) => (a.href = INSCRIPCION));
  $$("[data-observatorio]").forEach((a) => (a.href = OBSERVATORIO));
});
