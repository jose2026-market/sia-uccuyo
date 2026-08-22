# SIA-UCCuyo

Sitio público del Semillero de Inteligencia Artificial de la Universidad Católica de Cuyo (Observatorio de IA).

**Sitio:** https://jose2026-market.github.io/sia-uccuyo/

Identidad visual según el Manual de Normas UCCuyo 1.0 (2017).

## Backend compartido (mapa, ranking, contadores y libro)

GitHub Pages es estático. Para que **todas las visitas vean el mismo mapa, el mismo ranking, los mismos contadores y el mismo libro**, hay que publicar `backend/Code.gs` como aplicación web de Google Apps Script:

1. Abrí [script.google.com](https://script.google.com) → Nuevo proyecto.
2. Pegá el contenido de `backend/Code.gs`.
3. Implementar → Nueva implementación → Aplicación web.
   - Ejecutar como: yo
   - Quién tiene acceso: Cualquiera
4. Copiá la URL que termina en `/exec` y pegala en `js/config.js` → `APPS_SCRIPT_URL`.
5. Volvé a publicar este repositorio (commit + push a `main`).

El backend **no guarda la dirección IP**. Solo país, región, ciudad estimada (redondeada) y los datos del libro de visitas que la persona escribe.
