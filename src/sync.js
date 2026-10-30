/* ---------- Google Drive sync (PWA build) ----------
   Data path: this device <-> a JSON file in the user's own Google Drive. No other server.
   Auth: OAuth 2.0 for client-side web apps (token in the URL fragment), scope drive.file:
   the app can only see files it created itself. */
const DRIVE = {
  scope: 'https://www.googleapis.com/auth/drive.file',
  folderName: 'Wallet',
  fileName: 'wallet-datos.json',
  metaKey: KEY + '.sync',
  tokenKey: KEY + '.token'
};
const redirectUri = () => location.origin + location.pathname.replace(/index\.html$/, '');
const clientId = () => (window.WALLET_CONFIG && window.WALLET_CONFIG.googleClientId) || (() => { try { return localStorage.getItem(KEY + '.clientId') || ''; } catch (e) { return ''; } })();
const readMeta = () => { try { return JSON.parse(localStorage.getItem(DRIVE.metaKey) || '{}'); } catch (e) { return {}; } };
const writeMeta = m => { try { localStorage.setItem(DRIVE.metaKey, JSON.stringify(m)); } catch (e) { } };
let sync = { state: 'idle', msg: '', at: null }; // idle | working | ok | offline | auth | error | conflict
let pushTimer = null;

function getToken() {
  try { const t = JSON.parse(sessionStorage.getItem(DRIVE.tokenKey) || 'null'); if (t && t.exp > Date.now() + 60e3) return t.v; } catch (e) { }
  return null;
}
function connect(silent) {
  const id = clientId(); if (!id) { goto('ajustes'); toast('Primero configura Google Drive en Ajustes.'); return; }
  const st = Math.random().toString(36).slice(2);
  try { sessionStorage.setItem(KEY + '.oauthState', st); } catch (e) { }
  const p = new URLSearchParams({ client_id: id, redirect_uri: redirectUri(), response_type: 'token', scope: DRIVE.scope, include_granted_scopes: 'true', state: st });
  const m = readMeta(); if (m.email) p.set('login_hint', m.email);
  if (silent) p.set('prompt', 'none');
  location.assign('https://accounts.google.com/o/oauth2/v2/auth?' + p.toString());
}
// Read the token Google sends back in the URL fragment, then clean the address bar.
function takeTokenFromUrl() {
  if (!location.hash || location.hash.length < 2) return;
  const h = new URLSearchParams(location.hash.slice(1));
  if (!h.has('access_token') && !h.has('error')) return;
  let expected = null; try { expected = sessionStorage.getItem(KEY + '.oauthState'); } catch (e) { }
  history.replaceState(null, '', location.pathname + location.search);
  if (h.get('state') !== expected) return;
  if (h.has('error')) { const m = readMeta(); if (h.get('error') !== 'access_denied' && m.connected) sync = { state: 'auth', msg: 'Pulsa para volver a conectar con Drive' }; else if (h.get('error') === 'access_denied') toast('Has cancelado la conexión con Google Drive.'); return; }
  try { sessionStorage.setItem(DRIVE.tokenKey, JSON.stringify({ v: h.get('access_token'), exp: Date.now() + (+h.get('expires_in') || 3600) * 1000 })); } catch (e) { }
  const m = readMeta(); m.connected = true; m.chosen = 'drive'; writeMeta(m);
}

async function api(path, opts = {}) {
  const tok = getToken(); if (!tok) { const e = new Error('auth'); e.auth = true; throw e; }
  const r = await fetch(path.startsWith('http') ? path : 'https://www.googleapis.com/drive/v3/' + path, { ...opts, headers: { Authorization: 'Bearer ' + tok, ...(opts.headers || {}) } });
  if (r.status === 401) { try { sessionStorage.removeItem(DRIVE.tokenKey); } catch (e) { } const e = new Error('auth'); e.auth = true; throw e; }
  if (!r.ok) throw new Error('Drive respondió ' + r.status);
  return r;
}
const q = s => encodeURIComponent(s);
async function ensureFile() {
  const m = readMeta();
  if (m.fileId) {
    const r = await api(`files/${m.fileId}?fields=id,trashed`).catch(e => { if (e.auth) throw e; return null; });
    if (r) { const f = await r.json(); if (!f.trashed) return m.fileId; }
  }
  let folderId = m.folderId;
  if (!folderId) {
    const r = await api(`files?q=${q(`name='${DRIVE.folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id)&spaces=drive`);
    folderId = ((await r.json()).files[0] || {}).id;
    if (!folderId) {
      const c = await api('files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: DRIVE.folderName, mimeType: 'application/vnd.google-apps.folder' }) });
      folderId = (await c.json()).id;
    }
  }
  const r = await api(`files?q=${q(`name='${DRIVE.fileName}' and '${folderId}' in parents and trashed=false`)}&fields=files(id,modifiedTime)&orderBy=modifiedTime desc&spaces=drive`);
  const fileId = ((await r.json()).files[0] || {}).id || null;
  writeMeta({ ...readMeta(), folderId, fileId });
  return fileId;
}
async function readRemote(fileId) { const r = await api(`files/${fileId}?alt=media`); try { return await r.json(); } catch (e) { return null; } }
async function writeRemote(fileId, data) {
  const body = JSON.stringify(data);
  if (fileId) { await api(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body }); return fileId; }
  const m = readMeta(); const boundary = 'wallet' + Date.now();
  const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: DRIVE.fileName, parents: [m.folderId], mimeType: 'application/json' })}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
  const r = await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + boundary }, body: multipart });
  const id = (await r.json()).id; writeMeta({ ...readMeta(), fileId: id }); return id;
}

let syncing = null;
async function syncNow(reason) {
  if (syncing) return syncing;
  if (!readMeta().connected) return;
  if (!navigator.onLine) { sync = { state: 'offline', msg: 'Sin conexión: los cambios se guardan aquí y se subirán luego' }; renderBand(); return; }
  if (!getToken()) { sync = { state: 'auth', msg: 'Pulsa para sincronizar con Drive' }; renderBand(); return; }
  sync = { ...sync, state: 'working', msg: 'Sincronizando…' }; renderBand();
  syncing = (async () => {
    try {
      const fileId = await ensureFile();
      const meta = readMeta(); const base = meta.base || 0;
      const remote = fileId ? await readRemote(fileId) : null;
      const rU = remote && remote._updated || 0, lU = S._updated || 0;
      const remoteChanged = remote && rU !== base, localChanged = lU && lU !== base;
      if (!remote) { if (!S._updated) S._updated = Date.now(); await writeRemote(fileId, S); writeMeta({ ...readMeta(), base: S._updated }); }
      else if (remoteChanged && localChanged) { sync = { state: 'conflict', msg: 'Hay cambios en Drive y en este dispositivo' }; renderBand(); askConflict(remote, fileId); return; }
      else if (remoteChanged) { adopt(remote); writeMeta({ ...readMeta(), base: rU }); }
      else if (localChanged) { await writeRemote(fileId, S); writeMeta({ ...readMeta(), base: lU }); }
      sync = { state: 'ok', msg: 'Sincronizado con Drive', at: Date.now() };
    } catch (e) {
      sync = e.auth ? { state: 'auth', msg: 'Pulsa para volver a conectar con Drive' } : { state: 'error', msg: 'No se pudo sincronizar. Los cambios siguen guardados aquí.' };
    } finally { syncing = null; renderBand(); if (ui.tab === 'ajustes') render(); }
  })();
  return syncing;
}
function adopt(data) {
  backupCurrent();
  S = { ...blank(), ...data }; syncCats(); rollForward();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
  loadState = 'ok'; render();
}
function backupCurrent() {
  if (!countOf(S)) return;
  const list = readBackups(); list.push({ at: Date.now(), data: JSON.parse(JSON.stringify(S)) }); list.sort((a, b) => b.at - a.at);
  let kept = list.slice(0, 6); while (kept.length) { try { localStorage.setItem(BAK, JSON.stringify(kept)); break; } catch (e) { kept = kept.slice(0, -1); } }
}
let conflictData = null;
function askConflict(remote, fileId) {
  conflictData = { remote, fileId };
  const when = t => t ? new Date(t).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  openModal(`<div class="modal-head"><h2>¿Qué versión te quedas?</h2></div>
    <div class="modal-body"><p style="margin:0">Hay cambios en Google Drive y también en este dispositivo desde la última sincronización.</p>
      <div class="uplist">
        <div class="uprow"><span class="nm">Google Drive<small>${when(remote._updated)} · ${(remote.subs || []).length} suscripciones · ${(remote.tx || []).length} gastos</small></span><button class="btn sm" data-act="useRemote">Usar esta</button></div>
        <div class="uprow"><span class="nm">Este dispositivo<small>${when(S._updated)} · ${S.subs.length} suscripciones · ${S.tx.length} gastos</small></span><button class="btn sm" data-act="useLocal">Usar esta</button></div>
      </div>
      <p class="muted" style="margin:0;font-size:.85rem">La que no elijas se guarda como copia automática en este dispositivo (Ajustes → Copias automáticas).</p></div>`);
}
function schedulePush() { clearTimeout(pushTimer); pushTimer = setTimeout(() => syncNow('change'), 1500); }

/* hooks used by the app */
window.afterSave = () => { if (readMeta().connected) schedulePush(); };
window.syncPill = () => {
  const m = readMeta();
  if (!m.connected) return lu('shield-check', 14) + `<span class="pp-long">Solo en este dispositivo</span>`;
  const ic = { working: 'repeat', ok: 'cloud', offline: 'cloud', auth: 'cloud', error: 'triangle-alert', conflict: 'triangle-alert', idle: 'cloud' }[sync.state] || 'cloud';
  const txt = sync.state === 'ok' ? 'Drive · al día' : sync.state === 'working' ? 'Sincronizando…' : sync.state === 'auth' || sync.state === 'idle' ? 'Drive · pulsa para sincronizar' : sync.state === 'offline' ? 'Sin conexión' : sync.state === 'conflict' ? 'Elige versión' : 'Error de Drive';
  return lu(ic, 14) + `<span class="pp-long">${txt}</span>`;
};
window.extraAct = (a) => {
  if (a === 'syncPill') { const m = readMeta(); if (!m.connected) { goto('ajustes'); return; } if (sync.state === 'conflict' && conflictData) { askConflict(conflictData.remote, conflictData.fileId); return; } if (!getToken()) connect(false); else syncNow('manual'); return; }
  if (a === 'driveConnect') { connect(false); return; }
  if (a === 'driveSync') { if (!getToken()) connect(false); else syncNow('manual'); return; }
  if (a === 'driveOff') { writeMeta({ chosen: 'local' }); try { sessionStorage.removeItem(DRIVE.tokenKey); } catch (e) { } sync = { state: 'idle' }; render(); toast('Desconectado. Tus datos siguen en este dispositivo y en tu Drive.'); return; }
  if (a === 'saveClientId') { const v = ($('#clientIdIn') || {}).value || ''; try { localStorage.setItem(KEY + '.clientId', v.trim()); } catch (e) { } render(); toast(v.trim() ? 'ID de cliente guardado.' : 'ID borrado.'); return; }
  if (a === 'copyTxt') { const v = document.getElementById(arguments[1].dataset.target); if (v) copyText(v); return; }
  if (a === 'useRemote' && conflictData) { adopt(conflictData.remote); writeMeta({ ...readMeta(), base: conflictData.remote._updated }); conflictData = null; closeModal(); sync = { state: 'ok', at: Date.now() }; renderBand(); toast('Usando los datos de Drive. Los de este dispositivo están en Copias automáticas.'); return; }
  if (a === 'useLocal' && conflictData) { const { remote, fileId } = conflictData; conflictData = null; closeModal(); const keep = S; S = { ...blank(), ...remote }; backupCurrent(); S = keep; S._updated = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } writeRemote(fileId, S).then(() => { writeMeta({ ...readMeta(), base: S._updated }); sync = { state: 'ok', at: Date.now() }; renderBand(); toast('Subidos los datos de este dispositivo. Los de Drive están en Copias automáticas.'); }).catch(() => { sync = { state: 'error' }; renderBand(); }); return; }
  if (a === 'chooseLocal') { writeMeta({ ...readMeta(), chosen: 'local' }); closeModal(); render(); return; }
  if (a === 'chooseDrive') { writeMeta({ ...readMeta(), chosen: 'drive' }); closeModal(); if (clientId()) connect(false); else goto('ajustes'); return; }
};
window.drivePanel = () => {
  const m = readMeta(), id = clientId();
  const body = !id ? `<p style="margin:0">Para sincronizar, Wallet necesita un <b>ID de cliente de Google</b> (gratuito, lo creas una vez). Sigue la guía del archivo LEEME.md y pega aquí el ID, o ponlo en <code>config.js</code> para no tener que pegarlo en cada dispositivo.</p>
      <div class="form-grid"><label class="field full"><span>Origen autorizado (cópialo en Google Cloud)</span><input type="text" id="originTxt" readonly value="${esc(location.origin)}"></label>
      <label class="field full"><span>URI de redirección autorizada (cópiala en Google Cloud)</span><input type="text" id="redirTxt" readonly value="${esc(redirectUri())}"></label>
      <label class="field full"><span>ID de cliente</span><input type="text" id="clientIdIn" placeholder="1234…apps.googleusercontent.com"></label></div>
      <div class="toolbar"><button class="btn primary" data-act="saveClientId">Guardar ID</button></div>`
    : m.connected ? `<p style="margin:0">Conectado. Tus datos se guardan en este dispositivo y en <b>Mi unidad › ${DRIVE.folderName} › ${DRIVE.fileName}</b>. ${sync.at ? 'Última sincronización: ' + new Date(sync.at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + '.' : ''}</p>
      <div class="toolbar"><button class="btn primary" data-act="driveSync">${lu('repeat', 16)}Sincronizar ahora</button><button class="btn ghost" data-act="driveOff">Desconectar este dispositivo</button></div>`
    : `<p style="margin:0">Conecta tu cuenta de Google para guardar los datos en un archivo de tu Drive y verlos igual en el móvil y en el ordenador.</p>
      <div class="toolbar"><button class="btn primary" data-act="driveConnect">${lu('cloud', 16)}Conectar Google Drive</button></div>`;
  return `<section class="panel"><div class="panel-head"><h2>Google Drive</h2>${lu('cloud', 20)}</div><div class="prose" style="max-width:none">${body}
    <p class="muted" style="font-size:.85rem">Wallet solo puede ver los archivos que ha creado ella misma en tu Drive (permiso «drive.file»). Los datos viajan directamente entre tu dispositivo y Google: no hay ningún otro servidor.</p></div></section>`;
};

/* start */
takeTokenFromUrl();
(() => {
  const m = readMeta();
  if (m.connected) {
    if (getToken()) syncNow('open');
    else if (navigator.onLine && !sessionStorage.getItem(KEY + '.bounced')) { try { sessionStorage.setItem(KEY + '.bounced', '1'); } catch (e) { } connect(true); }
    else { sync = { state: 'auth', msg: 'Pulsa para sincronizar' }; renderBand(); }
  } else if (!m.chosen && loadState === 'empty') {
    openModal(`<div class="modal-head"><h2>¿Dónde guardo tus datos?</h2></div>
      <div class="modal-body">
        <button class="choice" data-act="chooseDrive">${lu('cloud', 22)}<span><b>En tu Google Drive</b><small>Se sincronizan entre el móvil y el ordenador. Se guardan en un archivo de tu Drive y en este dispositivo.</small></span></button>
        <button class="choice" data-act="chooseLocal">${lu('smartphone', 22)}<span><b>Solo en este dispositivo</b><small>No salen de aquí. Puedes conectar Drive más tarde desde Ajustes.</small></span></button>
      </div>`);
  }
  window.addEventListener('online', () => syncNow('online'));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow('focus'); });
})();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
