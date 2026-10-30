# Wallet

App web personal, instalable en el móvil (PWA), para llevar las **suscripciones** y los **gastos puntuales** de dos cuentas, con análisis y sugerencias de ahorro. Los datos se guardan en el dispositivo y, de forma opcional, en un archivo del Google Drive del usuario.

- Usuario: Jorge (GitHub `illera03`). Escribe en español y la interfaz está en español de España.
- Producción: https://illera03.github.io/wallet/ (GitHub Pages, rama `main`, carpeta raíz).
- Uso principal: Android, como app instalada. También en el Mac con Brave.

## Reglas que no se negocian

1. **Los datos no van a ningún sitio salvo al Drive del usuario.** No hay servidor propio, ni analítica, ni CDN, ni Google Fonts. Las únicas peticiones externas permitidas son el login de Google (`accounts.google.com`) y la API de Drive (`www.googleapis.com`). No añadas librerías externas en tiempo de ejecución: todo va inline.
2. **Nunca sobrescribir datos al abrir.** La app solo escribe en `localStorage` cuando el usuario hace algo (`save()`). Antes de cada escritura guarda la versión anterior en copias automáticas (`wallet.v2.bak`, máximo 6). Esto se añadió después de que el usuario perdiera todos sus datos; no lo rompas.
3. **Nada de IA dentro de la app.** Las sugerencias son reglas en código y los mensajes de cancelación son plantillas.
4. **Interfaz sencilla.** El usuario ha pedido varias veces quitar información y tarjetas que «no aportan». Ante la duda, menos.

## Estructura

```
index.html            GENERADO por tools/build.py: no editar a mano
config.js             ID de cliente de Google (público por diseño); el usuario lo edita en GitHub
sw.js                 service worker: red primero (cache:'no-cache'), caché como respaldo; no toca peticiones a Google
manifest.webmanifest  datos para instalar la app
icon-*.png, apple-touch-icon.png
LEEME.md              guía de instalación para el usuario (GitHub Pages + Google Cloud)
src/
  body.html           cabecera, pestañas y contenedores (#view, #modalRoot, #toastRoot)
  styles.css          tokens de diseño (claro/oscuro) y estilos
  icons.js            GENERADO por tools/build_icons.py (SI = logos de marcas, LU = iconos Lucide)
  app.js              toda la app: estado, vistas, eventos
  sync.js             sincronización con Google Drive, pantalla de bienvenida, registro del service worker
tools/
  build.py            src/ -> index.html (todo inline en un archivo)
  build_icons.py      regenera src/icons.js desde npm (simple-icons, lucide-static, @iconify-json/simple-icons)
  test-sync.mjs       prueba de extremo a extremo con un Drive falso (Playwright)
```

Flujo de trabajo: editar `src/` → `python3 tools/build.py` → probar → commit y push (GitHub Pages publica en 1–2 minutos). Si cambias algo que el service worker deba volver a descargar en la instalación, sube `CACHE` en `sw.js`.

## Cómo está hecho `src/app.js`

JavaScript sin frameworks ni dependencias. Un objeto de estado global `S`, un objeto `ui` con el estado de la vista y `render()`, que repinta la cabecera, las pestañas y `#view` con plantillas de texto. Los eventos se gestionan por delegación: los elementos llevan `data-act="..."` y hay un `switch` en el listener de `click`. Las acciones que no conoce ese `switch` pasan a `window.extraAct` (definido en `sync.js`).

Secciones, en orden: helpers · catálogo (`CATS`, `CATALOG`) · estado (`load`/`save`/copias) · derivados · cabecera · Inicio · Suscripciones · Gastos · Análisis · Ajustes · modales · exportar · toast · render · eventos · arranque.

Puntos de enganche con `sync.js`: `save()` llama a `window.afterSave()` (sube a Drive con retardo), la cabecera usa `window.syncPill()`, y Ajustes empieza con `window.drivePanel()`.

### Modelo de datos (`S`, clave `localStorage` `wallet.v2`)

```js
{
  v: 2, _updated: <ms>,                     // _updated se fija en cada save(); la sincronización lo usa como versión
  accounts: [{ id:'a1'|'a2', name, color, icon }],          // siempre dos cuentas
  subs: [{ id, service /* id de CATALOG o null */, name, plan /* nota libre, hasta 600 caracteres */,
           account, amount /* null = falta el importe; 0 con amountSet = gratis */, amountSet,
           period /* semanal|quincenal|mensual|trimestral|semestral|anual */,
           next /* AAAA-MM-DD: próximo cobro o vencimiento */, start,
           status /* activa|prueba|cancelada */,
           renew /* auto|manual|fin: «fin» = cancelada al acabar el periodo, pasa sola a cancelada el día next */,
           endedOn, converted, cat, url /* enlace «Gestionar» */, color, logo /* dataURL PNG de 96px subido por el usuario */ }],
  tx: [{ id, date, desc, amount /* positivo */, cat, account, q /* id de gasto habitual, si se apuntó desde uno */ }],
  quick: [{ id, desc, amount, cat, account }],   // gastos habituales, se apuntan con un toque
  cats: { <id>: { n, i /* icono Lucide */, c /* color */, k /* sub|gasto|ambos */, dup /* avisar de duplicados */,
                  save /* es ahorro: no cuenta como gasto */, budget /* presupuesto mensual, opcional */ } },  // 'otros' no se puede borrar
  memo: { <conceptKey>: catId },   // categoría recordada por concepto
  alertDays, hMax, hMin,           // días de aviso; umbrales de gasto hormiga
  migDismissed
}
```

Otras claves de `localStorage`: `wallet.v2.bak` (copias automáticas), `wallet.v2.ui`, `wallet.v2.sync` (fileId, folderId, base, connected, chosen), `wallet.v2.clientId` (ID pegado en Ajustes, alternativa a `config.js`). En `sessionStorage`: `wallet.v2.token` (token de acceso de Google, una hora).

Fórmulas: `monthly(s) = amount / PERIODS[period].m` (la semanal usa 12/52). Las categorías con `save` no suman en gastos. Las suscripciones gratis y las que tienen `renew: 'fin'` no cuentan para los duplicados.

## Sincronización con Drive (`src/sync.js`)

- OAuth 2.0 para apps web de cliente (`response_type=token`, el token vuelve en el fragmento de la URL), con permiso `drive.file`: la app solo ve los archivos que crea ella. No usa Google Identity Services ni secreto de cliente.
- Archivo: `Mi unidad/Wallet/wallet-datos.json`, con `S` completo.
- Al abrir: si hay token, sincroniza; si no, hace una ida y vuelta silenciosa a Google con `prompt=none`, una vez por sesión.
- Resolución por documento completo usando `_updated` y `meta.base`. Si solo cambió un lado, gana ese lado. Si cambiaron los dos, un modal pregunta qué versión usar y la otra va a copias automáticas.
- Redirección registrada en Google Cloud: `https://illera03.github.io/wallet/` (con barra final). Origen: `https://illera03.github.io`.
- La app de Google Cloud está en modo «Prueba», con el Gmail del usuario como usuario de prueba.

## Diseño

Tokens en `:root` de `styles.css`, con modo oscuro tanto en `@media (prefers-color-scheme: dark)` como en `[data-theme="dark"]`. Fuentes del sistema (Bricolage Grotesque y Schibsted Grotesk solo si el usuario las tiene instaladas). Para los colores de las series de gráficos usa `--s-fix` (fijos), `--s-exp` (puntuales) y `--s-sav` (ahorro), que están validados para daltonismo. Gráficos en HTML y CSS, sin librerías, con tooltip global (`[data-tip]`). Formatos de España: `Intl` es-ES, fechas DD/MM/AAAA, coma decimal y CSV con «;».

Los logos de marcas vienen de Simple Icons (CC0); los servicios sin logo usan su inicial o un logo subido por el usuario. Real-Debrid, Disney+, Filmin, DIGI y El País no están en ninguna librería libre.

## Historial de decisiones (no deshacer sin preguntar)

- Se **quitó la importación de CSV** de movimientos bancarios: el usuario prefiere apuntar a mano suscripciones y gastos puntuales.
- Se **quitó todo lo relativo al plan anual**: los precios de referencia no eran fiables.
- Se quitó el gráfico de «Cobros previstos en los próximos 12 meses».
- En Inicio solo quedan: la tarjeta del mes (lo gastado, una barra y la comparación con un mes normal), Próximos cobros y Para revisar. «Apuntar rápido» y «Presupuestos» se quitaron de Inicio, pero las funciones siguen: los gastos habituales en la pestaña Gastos y los presupuestos en Ajustes → categorías.
- Análisis se divide en tres secciones (`ui.anView`: Resumen, Suscripciones, Gastos) para que las gráficas no se amontonen. Helpers de gráficos: `vbars`, `hbars`, `donut` (conic-gradient) y `lineChart` (SVG).
- El transporte (bus semanal de 13,15 €, recarga Barik de 15 €) no es una suscripción: va como gastos habituales con presupuesto en la categoría Transporte.
- El resumen de la cabecera se simplificó porque el usuario lo veía «sobrecargado».
- La versión anterior se publicaba como artifact de claude.ai, donde los escudos de Brave borraban los datos (almacenamiento de terceros efímero). Por eso existe esta PWA en un dominio propio.

## Probar

```bash
python3 tools/build.py
python3 -m http.server 8000              # abrir http://localhost:8000 (sin Drive: Google solo acepta el origen registrado)
npm i -D playwright && npx playwright install chromium
node tools/test-sync.mjs                 # Drive falso: dos dispositivos, sincronización y conflicto
```

Después de cualquier cambio en `app.js` o `sync.js`, comprueba al menos la sintaxis y que `test-sync.mjs` pasa. Mira la app a 400 px de ancho y en modo oscuro.

## Pendiente o ideas que salieron

- En iPhone, la app instalada puede no volver sola tras el login de Google. No afecta al usuario, que usa Android.
- No hay historial real de cobros: el gráfico «Últimos 6 meses» estima los fijos con las suscripciones actuales.
- `src/app.js` todavía arrastra código de la versión artifact (`IN_CLAUDE`, `claudeUse`, el borrador con Claude y el aviso de Brave). Fuera de claude.ai no hace nada; se puede limpiar.
- La resolución de conflictos es por documento completo; una fusión elemento a elemento sería mejor si el usuario edita mucho en dos dispositivos.
