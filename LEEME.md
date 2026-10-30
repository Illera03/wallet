# Wallet: instalación

Wallet es una app web que guardas en tu GitHub y que sincroniza tus datos con un archivo de tu Google Drive. Tus datos viajan solo entre tus dispositivos y tu Drive; GitHub únicamente aloja el código de la app, nunca tus datos.

Tardarás unos 15 minutos y solo hay que hacerlo una vez. En los pasos, cambia `TU-USUARIO` por tu nombre de usuario de GitHub.

## 1. Sube la app a GitHub

1. Entra en github.com y crea un repositorio nuevo llamado **wallet**. Debe ser público para usar GitHub Pages gratis. Solo contiene el código: tus datos no se suben nunca.
2. En el repositorio, pulsa **Add file → Upload files** y arrastra todos los archivos de esta carpeta (`index.html`, `config.js`, `sw.js`, `manifest.webmanifest` y los `.png`). Pulsa **Commit changes**.
3. Ve a **Settings → Pages**. En «Build and deployment», elige **Deploy from a branch**, rama **main** y carpeta **/ (root)**, y pulsa **Save**.
4. En uno o dos minutos la app estará en `https://TU-USUARIO.github.io/wallet/`.

## 2. Crea el acceso a Google Drive (gratis)

1. Entra en console.cloud.google.com con tu cuenta de Google y crea un proyecto nuevo llamado **Wallet**.
2. Ve a **APIs y servicios → Biblioteca**, busca **Google Drive API** y pulsa **Habilitar**.
3. Ve a **Google Auth Platform** (o «Pantalla de consentimiento de OAuth») y pulsa **Empezar**:
   - Nombre de la app: Wallet. Correo de asistencia: el tuyo.
   - Público: **Externo**.
   - Correo de contacto: el tuyo. Acepta y crea.
4. En **Público → Usuarios de prueba**, añade tu Gmail. La app se queda en modo «Prueba», que es lo correcto para uso personal.
5. Ve a **Clientes → Crear cliente**:
   - Tipo: **Aplicación web**.
   - Orígenes de JavaScript autorizados: `https://TU-USUARIO.github.io`
   - URIs de redirección autorizados: `https://TU-USUARIO.github.io/wallet/` (con la barra final)
   - Pulsa **Crear** y copia el **ID de cliente**, que termina en `.apps.googleusercontent.com`.

## 3. Pon el ID en la app

En GitHub, abre `config.js`, pulsa el lápiz para editarlo, pega el ID entre las comillas y pulsa **Commit changes**:

```js
window.WALLET_CONFIG = {
  googleClientId: '1234567890-abc123.apps.googleusercontent.com'
};
```

El ID de cliente no es secreto: puede estar en un repositorio público sin problema.

## 4. Instálala y conéctala

- **Mac (Brave o Chrome):** abre `https://TU-USUARIO.github.io/wallet/` y pulsa el icono de instalar en la barra de direcciones (o en el menú, **Instalar Wallet**).
- **iPhone:** ábrela en Safari, pulsa **Compartir → Añadir a pantalla de inicio**.
- **Android:** ábrela en Chrome o Brave, menú **⋮ → Instalar app**.

La primera vez te preguntará dónde guardar los datos: elige **Google Drive**. Google te avisará de que «no ha verificado esta aplicación»: es normal porque la app es tuya. Pulsa **Continuar**.

Tus datos quedan en **Mi unidad › Wallet › wallet-datos.json**. Wallet solo puede ver los archivos que crea ella misma (permiso `drive.file`): no puede ver el resto de tu Drive.

## Cómo funciona la sincronización

- Cada cambio se guarda al momento en el dispositivo y se sube a Drive a los pocos segundos.
- Al abrir la app, o al volver a ella, descarga lo último de Drive. Si hace falta, pasa un segundo por la página de Google para renovar el acceso.
- Sin conexión sigue funcionando y sube los cambios cuando vuelve la red.
- Si cambias cosas en dos dispositivos sin sincronizar entre medias, te pregunta qué versión quieres. La otra se guarda en **Ajustes → Copias automáticas**.

## Pasar tus datos anteriores

En la versión antigua (la de Claude o `Wallet.html`), ve a **Ajustes → Copia completa (JSON)**. En la nueva, ve a **Ajustes → Restaurar copia** y elige ese archivo.

## Si algo falla

- **«redirect_uri_mismatch»:** la URI de redirección del paso 2.5 no coincide exactamente. Revisa la barra final y que sea `https`.
- **«access_denied» o «no tienes acceso»:** añade tu Gmail en Usuarios de prueba (paso 2.4).
- **En el iPhone, tras iniciar sesión no vuelve a la app instalada:** usa Wallet desde una pestaña de Safari; los datos son los mismos porque están en Drive.
