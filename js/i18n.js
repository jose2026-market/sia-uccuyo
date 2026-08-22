/**
 * i18n ES/EN — botones 3D «Página en español» / «Página en inglés».
 */
(function () {
  var STORAGE_KEY = "sia_lang";
  var dict = window.I18N_DICT || {};
  var lang = "es";

  function normalizeLang(code) {
    code = String(code || "").toLowerCase();
    if (code.indexOf("en") === 0) return "en";
    return "es";
  }

  function detectLang() {
    try {
      var q = String(new URLSearchParams(window.location.search).get("lang") || "").toLowerCase();
      if (q === "es" || q === "en") return q;
    } catch (_e0) {}
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "es" || saved === "en") return saved;
    } catch (_e) {}
    return normalizeLang(navigator.language || "es");
  }

  function t(key, vars) {
    var entry = dict[key];
    var text = entry && entry[lang] != null ? entry[lang] : entry && entry.es != null ? entry.es : key;
    if (vars && typeof vars === "object") {
      Object.keys(vars).forEach(function (k) {
        text = String(text).split("{" + k + "}").join(String(vars[k]));
      });
    }
    return text;
  }

  function apply() {
    document.documentElement.lang = lang === "en" ? "en" : "es-AR";
    if (dict["meta.title"]) document.title = t("meta.title");
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict["meta.description"]) metaDesc.setAttribute("content", t("meta.description"));

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = t(key);
      else el.textContent = t(key);
    });
    document.querySelectorAll("[data-lang]").forEach(function (btn) {
      var active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    try {
      window.dispatchEvent(new CustomEvent("sia:langchange", { detail: { lang: lang } }));
    } catch (_e2) {}
  }

  function setLang(next) {
    lang = normalizeLang(next);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_e) {}
    apply();
  }

  window.I18N = { t: t, getLang: function () { return lang; }, setLang: setLang, apply: apply };
  lang = detectLang();
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-lang]");
    if (!btn) return;
    e.preventDefault();
    setLang(btn.getAttribute("data-lang"));
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();
