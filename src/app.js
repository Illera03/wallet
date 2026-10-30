/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const EUR0 = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eur = n => EUR.format(n || 0);
const eur0 = n => EUR0.format(n || 0);
const numES = n => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
const uid = () => Math.random().toString(36).slice(2, 10);
const z2 = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + z2(d.getMonth() + 1) + '-' + z2(d.getDate());
const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const todayISO = iso(TODAY);
const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return iso(d); };
function addMonths(s, n) { const d = pd(s); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return iso(d); }
const PERIODS = { semanal: { label: 'Semanal', short: '/semana', m: 12 / 52, d: 7 }, quincenal: { label: 'Cada 2 semanas', short: '/2 semanas', m: 12 / 26, d: 14 }, mensual: { label: 'Mensual', short: '/mes', m: 1 }, trimestral: { label: 'Trimestral', short: '/trim.', m: 3 }, semestral: { label: 'Semestral', short: '/6 meses', m: 6 }, anual: { label: 'Anual', short: '/año', m: 12 } };
const addPeriod = (s, p, k = 1) => PERIODS[p].d ? addDays(s, PERIODS[p].d * k) : addMonths(s, PERIODS[p].m * k);
const daysUntil = s => Math.round((pd(s) - TODAY) / 86400000);
const fmtD = s => pd(s).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
const fmtDY = s => pd(s).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
const fmtNum = s => { const d = pd(s); return z2(d.getDate()) + '/' + z2(d.getMonth() + 1) + '/' + d.getFullYear(); };
function rel(s) { const n = daysUntil(s); if (n === 0) return 'hoy'; if (n === 1) return 'mañana'; if (n < 0) return 'hace ' + (-n) + ' d'; if (n < 45) return 'en ' + n + ' días'; return fmtDY(s); }
const median = a => { const b = [...a].sort((x, y) => x - y); const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const norm = s => String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const title = s => s.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
function parseAmount(s) {
  if (s == null) return NaN; s = String(s).replace(/[€\s ]|EUR/gi, ''); if (!s) return NaN;
  const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
  if (lc > -1 && ld > -1) s = lc > ld ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (lc > -1) s = s.replace(/\./g, '').replace(',', '.');
  else if (ld > -1 && /^\-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s); return isNaN(n) ? NaN : n;
}

function lu(name, size = 18, sw = 2) { return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LU[name] || LU.layers}</svg>`; }
function lum(hex) { const h = hex.replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4)); return .2126 * r + .7152 * g + .0722 * b; }

/* ---------- catalog ---------- */
const DEFAULT_CATS = {
  streaming: { n: 'Streaming', i: 'tv', c: '#D6453D', k: 'sub', dup: true },
  musica: { n: 'Música y audio', i: 'music', c: '#1E9E5A', k: 'sub', dup: true },
  software: { n: 'Software y servicios', i: 'code-xml', c: '#5865D8', k: 'sub' },
  ia: { n: 'Asistentes IA', i: 'sparkles', c: '#B4622F', k: 'sub', dup: true },
  cloud: { n: 'Almacenamiento', i: 'cloud', c: '#2F86C9', k: 'sub', dup: true },
  gaming: { n: 'Gaming', i: 'gamepad-2', c: '#7B4BD1', k: 'sub', dup: true },
  movil: { n: 'Móvil y datos', i: 'smartphone', c: '#0E8C94', k: 'sub' },
  gimnasio: { n: 'Gimnasio', i: 'dumbbell', c: '#C2410C', k: 'sub' },
  prensa: { n: 'Prensa', i: 'newspaper', c: '#6B6460', k: 'sub' },
  fitness: { n: 'Apps de salud', i: 'heart-pulse', c: '#D02C72', k: 'sub' },
  super: { n: 'Supermercado', i: 'shopping-cart', c: '#5E9A0E', k: 'gasto' },
  restaurantes: { n: 'Restaurantes', i: 'utensils', c: '#E2621B', k: 'gasto' },
  cafe: { n: 'Cafés y snacks', i: 'coffee', c: '#9A5B23', k: 'gasto' },
  transporte: { n: 'Transporte', i: 'car', c: '#0B8DB0', k: 'gasto' },
  hogar: { n: 'Hogar y suministros', i: 'house', c: '#4F55D6', k: 'gasto' },
  compras: { n: 'Compras', i: 'tag', c: '#9A3FD0', k: 'gasto' },
  ocio: { n: 'Ocio y viajes', i: 'plane', c: '#C9342F', k: 'gasto' },
  abono: { n: 'Transporte (abono)', i: 'train-front', c: '#0B8DB0', k: 'sub' },
  ahorro: { n: 'Ahorro e inversión', i: 'piggy-bank', c: '#17904F', k: 'ambos', save: true },
  otros: { n: 'Otros', i: 'layers', c: '#7A818E', k: 'ambos' }
};
let CATS = JSON.parse(JSON.stringify(DEFAULT_CATS));
const CAT_ICONS = ['tv', 'film', 'music', 'headphones', 'code-xml', 'sparkles', 'cloud', 'gamepad-2', 'smartphone', 'wifi', 'dumbbell', 'bike', 'heart-pulse', 'pill', 'stethoscope', 'newspaper', 'book-open', 'graduation-cap', 'shopping-cart', 'tag', 'shirt', 'gift', 'utensils', 'pizza', 'coffee', 'beer', 'car', 'fuel', 'bus', 'train-front', 'plane', 'ticket', 'house', 'sofa', 'zap', 'droplet', 'flame', 'wrench', 'hammer', 'scissors', 'baby', 'dog', 'paw-print', 'camera', 'palette', 'gem', 'star', 'heart', 'briefcase', 'landmark', 'receipt', 'piggy-bank', 'wallet', 'cigarette', 'layers'];
const CAT_COLORS = ['#D6453D', '#C9342F', '#E2621B', '#C2410C', '#B7791F', '#9A5B23', '#5E9A0E', '#1E9E5A', '#0E8C94', '#0B8DB0', '#2F86C9', '#2F5BD0', '#4F55D6', '#5865D8', '#7B4BD1', '#9A3FD0', '#D02C72', '#6B6460', '#7A818E', '#141414'];
const KINDS = { sub: 'Suscripciones', gasto: 'Gastos puntuales', ambos: 'Ambos' };
const sortCats = ks => ks.sort((x, y) => (x === 'otros') - (y === 'otros'));
const subCats = () => sortCats(Object.keys(CATS).filter(k => CATS[k].k !== 'gasto'));
const expCats = () => sortCats(Object.keys(CATS).filter(k => CATS[k].k !== 'sub'));
const catOf = id => CATS[id] || CATS.otros;
const isSav = x => !!catOf(x.cat).save;
function syncCats() {
  if (!S.cats || typeof S.cats !== 'object') S.cats = JSON.parse(JSON.stringify(DEFAULT_CATS));
  if (!S.cats.otros) S.cats.otros = { ...DEFAULT_CATS.otros };
  if (!Array.isArray(S.quick)) S.quick = [];
  if (S.hMax == null) S.hMax = 10; if (S.hMin == null) S.hMin = 4;
  CATS = S.cats;
}

const KW_CAT = [['MERCADONA', 'super'], ['CARREFOUR', 'super'], ['LIDL', 'super'], ['ALDI', 'super'], ['DIA', 'super'], ['SUPER', 'super'], ['CAFE', 'cafe'], ['PANADER', 'cafe'], ['VENDING', 'cafe'], ['GLOVO', 'restaurantes'], ['JUST EAT', 'restaurantes'], ['UBER EATS', 'restaurantes'], ['RESTAURANTE', 'restaurantes'], ['CENA', 'restaurantes'], ['COMIDA', 'restaurantes'], ['BAR ', 'restaurantes'],
  ['GASOLINA', 'transporte'], ['REPSOL', 'transporte'], ['CEPSA', 'transporte'], ['RENFE', 'transporte'], ['TAXI', 'transporte'], ['CABIFY', 'transporte'], ['UBER', 'transporte'], ['PARKING', 'transporte'], ['METRO', 'transporte'],
  ['IKEA', 'hogar'], ['LUZ', 'hogar'], ['AGUA', 'hogar'], ['IBERDROLA', 'hogar'], ['ENDESA', 'hogar'], ['NATURGY', 'hogar'], ['AMAZON', 'compras'], ['ZARA', 'compras'], ['DECATHLON', 'compras'], ['MEDIA MARKT', 'compras'],
  ['CINE', 'ocio'], ['CONCIERTO', 'ocio'], ['ENTRADAS', 'ocio'], ['VUELO', 'ocio'], ['HOTEL', 'ocio'], ['VIAJE', 'ocio'], ['RYANAIR', 'ocio'], ['BOOKING', 'ocio']];

const CATALOG = [
  { id: 'netflix', n: 'Netflix', cat: 'streaming', si: 'netflix', p: 13.99 },
  { id: 'disney', n: 'Disney+', cat: 'streaming', col: '#0E2A8C', p: 9.99, ann: 99.90 },
  { id: 'hbomax', n: 'HBO Max', cat: 'streaming', si: 'hbo', col: '#000000', p: 10.99, ann: 109.90 },
  { id: 'prime', n: 'Amazon Prime', cat: 'streaming', si: 'amazon', col: '#232F3E', p: 4.99, ann: 49.90 },
  { id: 'movistarplus', n: 'Movistar+', cat: 'streaming', si: 'movistar', p: 12 },
  { id: 'dazn', n: 'DAZN', cat: 'streaming', si: 'dazn', col: '#0C161C', p: 19.99 },
  { id: 'filmin', n: 'Filmin', cat: 'streaming', col: '#1B1B1B', p: 7.99, ann: 79.99 },
  { id: 'crunchyroll', n: 'Crunchyroll', cat: 'streaming', si: 'crunchyroll', p: 4.99 },
  { id: 'youtube', n: 'YouTube Premium', cat: 'streaming', si: 'youtube', p: 13.99 },
  { id: 'twitch', n: 'Twitch', cat: 'streaming', si: 'twitch', p: 4.99 },
  { id: 'realdebrid', n: 'Real-Debrid', cat: 'software', col: '#2C6E49', p: 16, per: 'semestral' },
  { id: 'spotify', n: 'Spotify', cat: 'musica', si: 'spotify', p: 11.99 },
  { id: 'applemusic', n: 'Apple Music', cat: 'musica', si: 'applemusic', p: 10.99, ann: 109 },
  { id: 'ytmusic', n: 'YouTube Music', cat: 'musica', si: 'youtubemusic', p: 10.99 },
  { id: 'audible', n: 'Audible', cat: 'musica', si: 'audible', p: 9.99 },
  { id: 'adobe', n: 'Adobe Creative Cloud', cat: 'software', si: 'adobe', p: 30.24, ann: 290.40 },
  { id: 'm365', n: 'Microsoft 365', cat: 'software', si: 'microsoft', col: '#D83B01', p: 10, ann: 99 },
  { id: 'notion', n: 'Notion', cat: 'software', si: 'notion', p: 11, ann: 115 },
  { id: 'googleaiplus', n: 'Google AI Plus', cat: 'ia', si: 'googlegemini', p: 0, per: 'anual' },
  { id: 'chatgpt', n: 'ChatGPT', cat: 'ia', si: 'openai', col: '#10A37F', p: 23 },
  { id: 'claude', n: 'Claude', cat: 'ia', si: 'claude', p: 18, ann: 180 },
  { id: 'icloud', n: 'iCloud+', cat: 'cloud', si: 'icloud', p: 0.99 },
  { id: 'googleone', n: 'Google One', cat: 'cloud', si: 'google', p: 1.99, ann: 19.99 },
  { id: 'dropbox', n: 'Dropbox', cat: 'cloud', si: 'dropbox', p: 11.99, ann: 119.88 },
  { id: 'googledrive', n: 'Google Drive', cat: 'cloud', si: 'googledrive', p: 1.99 },
  { id: 'psplus', n: 'PlayStation Plus', cat: 'gaming', si: 'playstation', p: 8.99, ann: 71.99 },
  { id: 'gamepass', n: 'Xbox Game Pass', cat: 'gaming', si: 'xbox', col: '#107C10', p: 14.99 },
  { id: 'nso', n: 'Nintendo Switch Online', cat: 'gaming', si: 'nintendoswitch', p: 3.99, ann: 19.99 },
  { id: 'movistar', n: 'Movistar', cat: 'movil', si: 'movistar', p: 65 },
  { id: 'vodafone', n: 'Vodafone', cat: 'movil', si: 'vodafone', p: 40 },
  { id: 'orange', n: 'Orange', cat: 'movil', si: 'orange', p: 35 },
  { id: 'digi', n: 'DIGI', cat: 'movil', col: '#1A4FA0', p: 15 },
  { id: 'abono', n: 'Abono de transporte', cat: 'abono', col: '#0B8DB0', glyph: 'train-front', p: 20 },
  { id: 'fondo', n: 'Fondo indexado', cat: 'ahorro', col: '#17904F', glyph: 'piggy-bank', p: 100 },
  { id: 'gym', n: 'Gimnasio', cat: 'gimnasio', col: '#C2410C', glyph: 'dumbbell', p: 29.90 },
  { id: 'elpais', n: 'El País', cat: 'prensa', col: '#141414', p: 12, ann: 120 },
  { id: 'prensa', n: 'Prensa digital', cat: 'prensa', col: '#57534E', glyph: 'newspaper', p: 9.99 },
  { id: 'strava', n: 'Strava', cat: 'fitness', si: 'strava', p: 7.99, ann: 59.99 },
  { id: 'peloton', n: 'Peloton App', cat: 'fitness', si: 'peloton', p: 12.99 },
  { id: 'duolingo', n: 'Duolingo Super', cat: 'fitness', si: 'duolingo', p: 12.99, ann: 83.99 }
];
const CAT_BY_ID = Object.fromEntries(CATALOG.map(c => [c.id, c]));
const QUICK = ['netflix', 'spotify', 'realdebrid', 'prime', 'disney', 'hbomax', 'youtube', 'chatgpt', 'icloud', 'googleone', 'movistar', 'gym'];
const ACC_COLORS = ['#1F8A63', '#D35E2A', '#2F5BD0', '#9B3FB5', '#C9342F', '#0E8C94', '#B7791F', '#4B5563'];
const SVC_COLORS = ['#2C6E49', '#1F8A63', '#0E8C94', '#2F5BD0', '#5865D8', '#9B3FB5', '#D02C72', '#C9342F', '#D35E2A', '#B7791F', '#4B5563', '#141414'];
const ACC_ICONS = ['user', 'house', 'briefcase', 'wallet', 'landmark', 'piggy-bank'];

function logo(svc, size = 40, name, color, img) {
  const c = svc && CAT_BY_ID[svc];
  const label = name || (c ? c.n : '?');
  const r = Math.round(size * .26);
  if (img && /^data:image\//.test(img)) return `<span class="logo ring" style="width:${size}px;height:${size}px;border-radius:${r}px;background:#fff" title="${esc(label)}"><img src="${img}" alt="" style="width:100%;height:100%;object-fit:contain"></span>`;
  if (c && c.si && SI[c.si]) {
    const bg = c.col || '#' + SI[c.si].h;
    const fg = lum(bg) > .5 ? '#111' : '#fff';
    const g = Math.round(size * .56);
    return `<span class="logo ${lum(bg) > .85 || lum(bg) < .02 ? 'ring' : ''}" style="width:${size}px;height:${size}px;border-radius:${r}px;background:${bg}" title="${esc(label)}"><svg width="${g}" height="${g}" viewBox="0 0 24 24" fill="${fg}" aria-hidden="true"><path d="${SI[c.si].p}"/></svg></span>`;
  }
  const bg = color || (c && c.col) || '#5E6573';
  if (c && c.glyph && !color) return `<span class="logo" style="width:${size}px;height:${size}px;border-radius:${r}px;background:${bg}">${lu(c.glyph, Math.round(size * .5))}</span>`;
  const ini = label.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 1).toUpperCase() || '?';
  return `<span class="logo ${lum(bg) < .02 ? 'ring' : ''}" style="width:${size}px;height:${size}px;border-radius:${r}px;background:${bg};font-size:${Math.round(size * .46)}px">${esc(ini)}</span>`;
}
const subLogo = (s, size) => logo(s.service, size, subLabel(s), s.color, s.logo);
function catIcon(cat, size = 32) { const c = CATS[cat] || CATS.otros; return `<span class="logo" style="width:${size}px;height:${size}px;background:${c.c}">${lu(c.i, Math.round(size * .55))}</span>`; }

/* ---------- state ---------- */
const KEY = 'wallet.v2';
let S;
const ui = { fixView: 'sub', editQuick: false, tab: 'inicio', acc: 'all', status: 'vigentes', sort: 'next', txCat: '', txQ: '', txLimit: 80, editTx: null };

function blank() {
  return { v: 2, accounts: [{ id: 'a1', name: 'Personal', color: '#1F8A63', icon: 'user' }, { id: 'a2', name: 'Casa', color: '#D35E2A', icon: 'house' }], subs: [], tx: [], memo: {}, alertDays: 7, hMax: 10, hMin: 4, cats: JSON.parse(JSON.stringify(DEFAULT_CATS)) };
}
function mySubs() {
  const mk = (service, name, period, next, renew, url) => ({ id: uid(), service, name, plan: '', account: 'a1', amount: 0, period, next, start: addPeriod(next, period, -1), status: 'activa', cat: CAT_BY_ID[service].cat, renew, url });
  return [
    mk('prime', 'Amazon Prime', 'anual', '2027-08-27', 'auto', 'https://www.amazon.es/gp/primecentral?ref_=ya_d_c_prime'),
    mk('realdebrid', 'Real-Debrid', 'semestral', '2027-01-01', 'manual', 'https://real-debrid.com/premium'),
    mk('googleaiplus', 'Google AI Plus', 'anual', '2027-10-09', 'manual', 'https://one.google.com/settings?expand=upgrade&hl=es'),
    mk('claude', 'Claude Pro', 'mensual', '2026-11-20', 'auto', 'https://claude.ai/new#settings/billing')
  ];
}
let storageOK = true, loadState = 'ok';
const BAK = KEY + '.bak';
function readBackups() { try { const b = JSON.parse(localStorage.getItem(BAK) || '[]'); return Array.isArray(b) ? b : []; } catch (e) { return []; } }
const countOf = d => (d && (d.subs || []).length || 0) + (d && (d.tx || []).length || 0);
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { storageOK = false; loadState = 'error'; S = blank(); S.subs = mySubs(); return; }
  if (raw) {
    try { S = { ...blank(), ...JSON.parse(raw) }; return; }
    catch (e) { loadState = 'corrupt'; try { localStorage.setItem(KEY + '.corrupt.' + Date.now(), raw); } catch (_) { } }
  }
  // nothing usable under the main key: fall back to the newest automatic copy, if any
  const bk = readBackups().filter(b => countOf(b.data)).sort((x, y) => y.at - x.at)[0];
  if (bk) { S = { ...blank(), ...bk.data }; loadState = 'fromBackup'; return; }
  if (loadState === 'ok') loadState = 'empty';
  S = blank(); S.subs = mySubs();
}
// Writes only happen after something the viewer did; the previous stored version is kept as an automatic copy.
function save() {
  if (loadState === 'error') return;
  try {
    const prev = localStorage.getItem(KEY);
    if (prev) {
      let prevData = null; try { prevData = JSON.parse(prev); } catch (e) { }
      if (prevData && countOf(prevData)) {
        const list = readBackups(); const last = list.length ? Math.max(...list.map(b => b.at)) : 0;
        const shrinking = countOf(S) < countOf(prevData) * .5;
        if (Date.now() - last > 3 * 3600e3 || shrinking) {
          list.push({ at: Date.now(), data: prevData });
          list.sort((x, y) => y.at - x.at);
          let kept = list.slice(0, 6);
          while (kept.length) { try { localStorage.setItem(BAK, JSON.stringify(kept)); break; } catch (e) { kept = kept.slice(0, -1); } }
        }
      }
    }
    S._updated = Date.now();
    localStorage.setItem(KEY, JSON.stringify(S)); storageOK = true;
    if (window.afterSave) window.afterSave();
    if (loadState !== 'ok') loadState = 'ok';
  } catch (e) { storageOK = false; }
}
function rollForward() {
  for (const s of S.subs) {
    if (s.status === 'cancelada' || !s.next) continue;
    if (s.renew === 'fin') { if (s.next <= todayISO) { s.status = 'cancelada'; s.endedOn = s.next; } continue; }
    if (s.renew === 'manual') continue;
    let guard = 0;
    while (s.next < todayISO && guard++ < 400) { s.next = addPeriod(s.next, s.period); if (s.status === 'prueba') { s.status = 'activa'; s.converted = true; } }
  }
}

/* ---------- derived ---------- */
const acc = id => S.accounts.find(a => a.id === id) || S.accounts[0];
const inAcc = x => ui.acc === 'all' || x.account === ui.acc;
const live = s => s.status !== 'cancelada';
const monthly = s => s.amount / PERIODS[s.period].m;
const subsVis = () => S.subs.filter(inAcc);
const txVis = () => S.tx.filter(inAcc);
const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';
const expired = s => live(s) && s.renew === 'manual' && s.next < todayISO;
const noAmt = s => s.amount == null || isNaN(s.amount) || (!(s.amount > 0) && !s.amountSet);
const isFree = s => !noAmt(s) && s.amount === 0;
const subLabel = s => s.name || (CAT_BY_ID[s.service] || {}).n || 'Servicio';
function accChip(id) { const a = acc(id); return `<span class="chip"><span class="acc-dot" style="background:${a.color}"></span>${esc(a.name)}</span>`; }
function duplicates(list) {
  const out = [];
  for (const g of Object.keys(CATS).filter(k => CATS[k].dup)) { const items = list.filter(s => live(s) && s.cat === g && !isFree(s) && !isSav(s) && s.renew !== 'fin'); if (items.length >= 2) out.push({ cat: g, items }); }
  return out;
}
const dupIds = list => new Set(duplicates(list).flatMap(d => d.items.map(s => s.id)));
function conceptKey(desc) { return norm(desc).replace(/\d[\d.,\/:-]*/g, ' ').replace(/[*#\/\\_.,;:()"'+-]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 3).join(' '); }
function guessCat(desc) {
  const k = conceptKey(desc); if (!k) return null;
  if (S.memo[k] && CATS[S.memo[k]]) return S.memo[k];
  const u = ' ' + norm(desc) + ' ';
  const hit = KW_CAT.find(([w]) => u.includes(w.length <= 3 ? ' ' + w + ' ' : w)); return hit && CATS[hit[1]] ? hit[1] : null;
}
function monthsSpan(txs) { if (!txs.length) return 1; const ds = txs.map(t => t.date).sort(); return Math.max(1, Math.round((pd(ds.at(-1)) - pd(ds[0])) / 86400000 / 30.44)); }
function hormiga(txs) {
  const groups = {};
  for (const t of txs) { if (t.amount > (S.hMax || 10)) continue; const k = conceptKey(t.desc); (groups[k] = groups[k] || []).push(t); }
  const span = Math.max(1, monthsSpan(txs));
  return Object.entries(groups).filter(([, g]) => g.length >= (S.hMin || 4)).map(([k, g]) => {
    const total = g.reduce((s, t) => s + t.amount, 0);
    return { name: title(k), count: g.length, avg: total / g.length, perMonth: total / span, perYear: total / span * 12, cat: g[0].cat, accounts: [...new Set(g.map(t => t.account))] };
  }).sort((a, b) => b.perYear - a.perYear);
}
function detectRecurring(txs) {
  const groups = {};
  for (const t of txs) { if (t.q) continue; const k = t.account + '|' + conceptKey(t.desc); (groups[k] = groups[k] || []).push(t); }
  const out = [];
  for (const [k, g0] of Object.entries(groups)) {
    if (g0.length < 3) continue;
    const med = median(g0.map(t => t.amount));
    const g = g0.filter(t => Math.abs(t.amount - med) / med <= .1).sort((a, b) => a.date.localeCompare(b.date));
    if (g.length < 3 || g.length < g0.length * .7) continue;
    const gaps = g.slice(1).map((t, i) => (pd(t.date) - pd(g[i].date)) / 86400000);
    const mi = median(gaps);
    if (!(mi >= 26 && mi <= 35) || gaps.some(x => x < 20)) continue;
    const [account, key] = k.split('|');
    if (S.subs.some(s => s.account === account && norm(subLabel(s)).includes(key.split(' ')[0]))) continue;
    out.push({ key: k, account, name: g.at(-1).desc, amount: Math.round(med * 100) / 100, count: g.length, first: g[0].date, last: g.at(-1).date });
  }
  return out;
}

function suggestions() {
  const list = subsVis().filter(live);
  const out = [];
  for (const d of duplicates(list)) {
    const tot = d.items.reduce((s, x) => s + monthly(x) * 12, 0);
    const byCost = [...d.items].sort((a, b) => monthly(b) - monthly(a));
    out.push({ kind: 'Duplicadas', icon: CATS[d.cat].i, color: CATS[d.cat].c, save: monthly(byCost[0]) * 12, saveNote: 'si cancelas ' + subLabel(byCost[0]), sum: true,
      text: `Tienes ${d.items.length} suscripciones de «${CATS[d.cat].n}» (${d.items.map(subLabel).join(', ')}) que suman ${eur(tot)} al año. Cancelar ${subLabel(byCost[0])} te ahorra ${eur0(monthly(byCost[0]) * 12)}/año; otra opción es alternarlas mes a mes.`,
      acts: byCost.map(s => ({ act: 'draft', id: s.id, label: 'Carta para cancelar ' + subLabel(s) })) });
  }
  for (const s of list) {
    const c = CAT_BY_ID[s.service];
    if (s.status === 'prueba') out.push({ kind: 'Prueba gratuita', icon: 'clock', color: '#9A5B00', save: monthly(s) * 12, saveNote: 'si no la usas',
      text: `Tu prueba de ${subLabel(s)} pasa a cobrarse ${eur(s.amount)}${PERIODS[s.period].short} el ${fmtD(s.next)} (${rel(s.next)}). Cancélala antes si no la vas a usar.`,
      acts: [{ act: 'draft', id: s.id, label: 'Redactar cancelación' }, { act: 'edit', id: s.id, label: 'Editar' }] });
    if (s.converted) out.push({ kind: 'Prueba convertida', icon: 'triangle-alert', color: '#B8352B', save: monthly(s) * 12, saveNote: 'al año',
      text: `La prueba de ${subLabel(s)} ya se ha convertido en una suscripción de pago.`, acts: [{ act: 'draft', id: s.id, label: 'Redactar cancelación' }, { act: 'edit', id: s.id, label: 'Marcar como revisada' }] });
  }
  for (const s of list.filter(expired)) out.unshift({ kind: 'Renovación vencida', icon: 'triangle-alert', color: '#B8352B', save: 0,
    text: `${subLabel(s)} venció el ${fmtDY(s.next)}. Si la has renovado, actualiza la fecha; si no, márcala como cancelada.`, acts: [{ act: 'edit', id: s.id, label: 'Actualizar' }] });
  for (const s of list.filter(noAmt)) out.unshift({ kind: 'Falta el importe', icon: 'pencil', color: '#9A5B00', save: 0,
    text: `Añade cuánto pagas por ${subLabel(s)} para que cuente en los totales y en las sugerencias. Si es gratis (por ejemplo, plan de estudiante), pon 0.`, acts: [{ act: 'edit', id: s.id, label: 'Añadir importe' }] });
  for (const g of hormiga(txVis().filter(t => !isSav(t))).slice(0, 3)) out.push({ kind: 'Gasto hormiga', icon: 'coffee', color: '#9A5B23', save: g.perYear * .5, saveNote: 'reduciéndolo a la mitad', sum: true,
    text: `${g.name}: ${g.count} gastos de ${eur(g.avg)} de media. Son ${eur(g.perMonth)} al mes, ${eur0(g.perYear)} al año.`, acts: [] });
  for (const r of detectRecurring(txVis())) out.push({ kind: '¿Es una suscripción?', icon: 'repeat', color: '#4F55D6', save: 0,
    text: `Has apuntado «${r.name}» (${eur(r.amount)}) ${r.count} veces, una vez al mes. Si es un pago fijo, regístralo como suscripción para recibir avisos.`,
    acts: [{ act: 'addRec', key: r.key, label: 'Convertir en suscripción' }] });
  return out;
}

/* ---------- top band ---------- */
function renderBand() {
  $('#brandMark').innerHTML = lu('wallet', 18);
  $('#privacyPill').innerHTML = window.syncPill ? window.syncPill() : '';
  const btn = (id, name, color, icon) => `<button data-act="acc" data-id="${id}" aria-pressed="${ui.acc === id}">${color ? `<span class="acc-badge" style="background:${color}">${lu(icon, 12)}</span>` : lu('layers', 14)}<span>${esc(name)}</span></button>`;
  $('#accSwitch').innerHTML = btn('all', 'Todas', null, null) + S.accounts.map(a => btn(a.id, a.name, a.color, a.icon)).join('');
}

const TABS = [['inicio', 'Inicio', 'house'], ['suscripciones', 'Suscripciones', 'repeat'], ['gastos', 'Gastos', 'shopping-cart'], ['analisis', 'Análisis', 'chart-pie'], ['ajustes', 'Ajustes y datos', 'shield-check']];
function renderTabs() {
  const counts = { suscripciones: subsVis().filter(live).length, gastos: txVis().length, analisis: suggestions().length };
  $('#tabs').innerHTML = TABS.map(([id, n, i]) => `<button class="tab" role="tab" aria-selected="${ui.tab === id}" data-act="goto" data-tab="${id}">${lu(i, 16)}${n}${counts[id] ? `<span class="count">${counts[id]}</span>` : ''}</button>`).join('');
}

/* ---------- home (Inicio) ---------- */
const monthStartISO = () => todayISO.slice(0, 8) + '01';
const monthEndISO = () => iso(new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0));
// Charge dates of a subscription between two dates, inferred from its next renewal and period.
function chargesIn(s, from, to) {
  if (noAmt(s) || !s.amount || !s.next) return [];
  if (!live(s) && !s.endedOn) return [];
  const out = [];
  const fin = s.renew === 'fin' || !live(s);
  if (!fin) { let d = s.next, g = 0; while (d <= to && g++ < 60) { if (d >= from) out.push(d); d = addPeriod(d, s.period); } }
  if (s.status !== 'prueba') { let d = addPeriod(s.next, s.period, -1), g = 0; while (d >= from && g++ < 60) { if (d <= to && d >= (s.start || '0000')) out.push(d); d = addPeriod(d, s.period, -1); } }
  return out;
}
function monthNumbers() {
  const from = monthStartISO(), to = monthEndISO();
  let subPaid = 0, subPending = 0, savPaid = 0; const pendingList = [];
  for (const s of subsVis()) for (const d of chargesIn(s, from, to)) {
    if (isSav(s)) { if (d <= todayISO) savPaid += s.amount; continue; }
    if (d <= todayISO) subPaid += s.amount; else { subPending += s.amount; pendingList.push({ s, d }); }
  }
  const mtx = txVis().filter(t => t.date >= from && t.date <= to);
  const exp = mtx.filter(t => !isSav(t)).reduce((a, t) => a + t.amount, 0);
  const savTx = mtx.filter(isSav).reduce((a, t) => a + t.amount, 0);
  // a "normal" month: subscriptions prorated + average one-off spending of previous months
  const fixedM = subsVis().filter(s => live(s) && !isSav(s)).reduce((a, s) => a + monthly(s), 0);
  const prev = txVis().filter(t => t.date < from && !isSav(t));
  let avgExp = 0;
  if (prev.length) { const first = prev.map(t => t.date).sort()[0]; const n = Math.max(1, (TODAY.getFullYear() - +first.slice(0, 4)) * 12 + TODAY.getMonth() - (+first.slice(5, 7) - 1)); avgExp = prev.reduce((a, t) => a + t.amount, 0) / n; }
  return { subPaid, subPending, savPaid: savPaid + savTx, exp, spent: subPaid + exp, normal: fixedM + avgExp, hasHistory: prev.length > 0, pendingList, mtx };
}
function budgetRows() {
  const from = monthStartISO();
  return Object.keys(CATS).filter(k => CATS[k].budget > 0).map(k => {
    const spent = txVis().filter(t => t.cat === k && t.date >= from).reduce((a, t) => a + t.amount, 0);
    return { k, c: CATS[k], spent, budget: CATS[k].budget, ratio: spent / CATS[k].budget };
  });
}
function migCandidates() { return S.migDismissed ? [] : S.subs.filter(s => live(s) && s.amount > 0 && (s.cat === 'abono' || PERIODS[s.period].d)); }
function quickChips(editable) {
  const qs = S.quick || [];
  return `<div class="quickbar">${qs.map(q => `<span class="qchip-wrap"><button class="qchip" data-act="quickAdd" data-id="${q.id}" title="Apuntar ahora en ${esc(acc(q.account).name)}">${catIcon(q.cat, 22)}<span>${esc(q.desc)}</span><b>${eur(q.amount)}</b></button>${editable && ui.editQuick ? `<button class="qdel" data-act="quickDel" data-id="${q.id}" aria-label="Quitar ${esc(q.desc)}">${lu('x', 12)}</button>` : ''}</span>`).join('')}
    ${!qs.length ? `<span class="muted" style="font-size:.88rem">${editable ? 'Marca «Guardar como habitual» al apuntar un gasto y aparecerá aquí para añadirlo con un toque.' : 'Aún no tienes gastos habituales.'}</span>` : ''}
    ${editable && qs.length ? `<button class="btn sm ghost" data-act="quickEdit">${ui.editQuick ? 'Listo' : 'Editar'}</button>` : ''}</div>`;
}
function migBanner() {
  const c = migCandidates(); if (!c.length) return '';
  return `<section class="panel mig">${lu('lightbulb', 20)}<div><b>${c.map(subLabel).join(' y ')} ${c.length > 1 ? 'no son suscripciones' : 'no es una suscripción'}: son gastos que varían.</b>
    <p class="muted">Puedo pasarlos a gastos habituales (los apuntas con un toque cuando los pagas) y crear un presupuesto mensual de ${eur0(Math.ceil(c.reduce((a, s) => a + monthly(s), 0)))} para Transporte.</p>
    <div class="toolbar"><button class="btn primary sm" data-act="migrate">${lu('check', 14)}Pasarlos a gastos habituales</button><button class="btn ghost sm" data-act="migDismiss">Dejarlos como están</button></div></div></section>`;
}
function migrate() {
  const c = migCandidates(); if (!c.length) return;
  const target = s => /bus|barik|metro|tranv|tren|renfe|abono|transporte/i.test(subLabel(s)) || s.cat === 'abono' ? (CATS.transporte ? 'transporte' : 'otros') : (CATS[s.cat] && CATS[s.cat].k !== 'sub' ? s.cat : 'otros');
  S.quick = S.quick || [];
  const add = {};
  for (const s of c) {
    const cat = target(s);
    S.quick.push({ id: uid(), desc: subLabel(s), amount: s.amount, cat, account: s.account });
    add[cat] = (add[cat] || 0) + monthly(s);
  }
  for (const [k, v] of Object.entries(add)) if (CATS[k]) CATS[k].budget = Math.ceil((CATS[k].budget || 0) + v);
  const ids = new Set(c.map(s => s.id)); S.subs = S.subs.filter(s => !ids.has(s.id));
  save(); render(); toast(`Hecho: ${c.length} gastos habituales y presupuesto de ${Object.entries(add).map(([k]) => CATS[k].n + ' ' + eur0(CATS[k].budget)).join(', ')}.`);
}
function quickAdd(id) {
  const q = (S.quick || []).find(x => x.id === id); if (!q) return;
  const t = { id: uid(), date: todayISO, desc: q.desc, amount: q.amount, cat: CATS[q.cat] ? q.cat : 'otros', account: ui.acc !== 'all' ? ui.acc : q.account, q: q.id };
  S.tx.unshift(t); save(); render();
  toast(`Apuntado: ${q.desc}, ${eur(q.amount)} (${acc(t.account).name}).`, { label: 'Deshacer', fn: () => { S.tx = S.tx.filter(x => x.id !== t.id); save(); render(); toast('Deshecho.'); } });
}

function viewHome() {
  const hasAny = S.subs.length || S.tx.length || (S.quick || []).length;
  if (!hasAny) return onboarding();
  const N = monthNumbers();
  const monthName = TODAY.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const ratio = N.normal ? N.spent / N.normal : 0;
  const dayRatio = TODAY.getDate() / +monthEndISO().slice(8);
  const pace = !N.normal ? '' : ratio > 1 ? `Ya has superado un mes normal (${eur(N.normal)}).` : ratio > dayRatio + .15 ? `Vas algo por encima de lo habitual para estas fechas.` : `Vas dentro de lo habitual: un mes normal son unos ${eur0(N.normal)}.`;
  const hero = `<section class="panel hero">
    <span class="lbl">${monthName}${ui.acc === 'all' ? '' : ' · ' + esc(acc(ui.acc).name)}</span>
    <div class="hero-num"><span class="num">${eur(N.spent)}</span><span class="muted">gastado este mes</span></div>
    ${N.normal ? `<div class="meter" ${tipAttr(['Este mes: ' + eur(N.spent), 'Mes normal: ' + eur(N.normal)])}><span class="meter-fill ${ratio > 1 ? 'over' : ''}" style="width:${Math.min(100, ratio * 100)}%;${ratio > 1 ? '' : 'background:var(--s-fix)'}"></span></div>
    <span class="muted">${ratio > 1 ? `${eur0(N.spent - N.normal)} por encima de un mes normal (${eur0(N.normal)})` : `de unos ${eur0(N.normal)} en un mes normal`}</span>` : ''}
  </section>`;

  const quick = `<section class="panel"><div class="panel-head"><h2>Apuntar rápido</h2><button class="btn sm" data-act="goto" data-tab="gastos">${lu('plus', 14)}Otro gasto</button></div>${quickChips(false)}</section>`;

  const br = budgetRows();
  const budgets = `<section class="panel"><div class="panel-head"><h2>Presupuestos del mes</h2><button class="btn sm ghost" data-act="goto" data-tab="ajustes">${lu('pencil', 14)}Editar</button></div>
    ${br.length ? `<div class="budgets">${br.map(b => `<div class="budget" ${tipAttr([b.c.n, `${eur(b.spent)} de ${eur(b.budget)}`, b.ratio > 1 ? `Te has pasado ${eur(b.spent - b.budget)}` : `Te quedan ${eur(b.budget - b.spent)}`])}>
        <div class="budget-head">${catIcon(b.k, 24)}<span class="nm">${esc(b.c.n)}</span><span><b>${eur(b.spent)}</b> <span class="muted">de ${eur0(b.budget)}</span></span></div>
        <div class="meter sm"><span class="meter-fill ${b.ratio > 1 ? 'over' : b.ratio > .85 ? 'near' : ''}" style="width:${Math.min(100, b.ratio * 100)}%;${b.ratio <= .85 ? `background:${b.c.c}` : ''}"></span><span class="meter-today" style="left:${dayRatio * 100}%"></span></div>
        <span class="budget-note ${b.ratio > 1 ? 'bad' : b.ratio > .85 ? 'warn' : ''}">${b.ratio > 1 ? `Te has pasado ${eur(b.spent - b.budget)}` : `Quedan ${eur(b.budget - b.spent)}`}</span>
      </div>`).join('')}</div>
      <p class="muted" style="margin:10px 0 0;font-size:.82rem">La línea vertical marca el día del mes en el que estás.</p>`
    : `<div class="empty" style="padding:18px">Ponle un presupuesto mensual a una categoría (Transporte, Restaurantes…) en Ajustes y verás aquí cuánto llevas.</div>`}
  </section>`;

  const vis = subsVis().filter(live);
  const up = vis.filter(s => !PERIODS[s.period].d && daysUntil(s.next) >= 0 && daysUntil(s.next) <= Math.max(S.alertDays, 14)).sort((a, b) => a.next.localeCompare(b.next)).slice(0, 6);
  const upcoming = `<section class="panel"><div class="panel-head"><h2>Próximos cobros</h2><button class="btn sm ghost" data-act="goto" data-tab="suscripciones">Ver todas</button></div>
    ${up.length ? `<div class="uplist">${up.map(s => `<button class="uprow" data-act="edit" data-id="${s.id}">${subLogo(s, 30)}<span class="nm">${esc(subLabel(s))}<small>${s.renew === 'fin' ? 'termina, no se cobra' : s.renew === 'manual' ? 'renovación manual' : s.status === 'prueba' ? 'fin de la prueba' : esc(catOf(s.cat).n)}</small></span><span class="amt">${s.renew === 'fin' || noAmt(s) ? '' : eur(s.amount)}<small class="${daysUntil(s.next) <= S.alertDays ? 'soon' : ''}">${fmtD(s.next)} · ${rel(s.next)}</small></span></button>`).join('')}</div>`
    : `<div class="empty" style="padding:18px">Nada en las próximas dos semanas.</div>`}
  </section>`;

  const keep = ['Falta el importe', 'Renovación vencida', 'Prueba gratuita', 'Prueba convertida', 'Duplicadas'];
  const sg = suggestions().filter(s => keep.includes(s.kind)).slice(0, 3);
  const alerts = sg.length ? `<section class="panel"><div class="panel-head"><h2>Para revisar</h2><button class="btn sm ghost" data-act="goto" data-tab="analisis">Ver análisis</button></div><div class="sugs">${sg.map(s => `<div class="sug"><span class="logo" style="width:32px;height:32px;background:${s.color}">${lu(s.icon, 16)}</span><div><div class="kind">${s.kind}</div><p>${esc(s.text)}</p></div>${s.save ? `<div class="save">${eur0(s.save)}/año</div>` : '<span></span>'}${s.acts && s.acts[0] ? `<div class="sug-actions"><button class="btn sm" data-act="${s.acts[0].act}" data-id="${s.acts[0].id || ''}" data-mode="${s.acts[0].mode || ''}">${esc(s.acts[0].label)}</button></div>` : ''}</div>`).join('')}</div></section>` : '';

  return `${migBanner()}${hero}${alerts ? `<div class="two">${upcoming}${alerts}</div>` : upcoming}`;
}

/* ---------- subscriptions view ---------- */
function onboarding() {
  return `<section class="panel onboard">
    <div><h2>Empieza por tus suscripciones</h2><p class="muted" style="margin:6px 0 0">Elige un servicio para apuntarlo con su importe, periodicidad y fecha del próximo cobro. Si no está en la lista, usa «Otro servicio».</p></div>
    <div class="quick">${QUICK.map(id => `<button class="cat-item" data-act="pick" data-v="${id}">${logo(id, 38)}<span>${esc(CAT_BY_ID[id].n)}</span></button>`).join('')}
      <button class="cat-item" data-act="add"><span class="logo" style="width:38px;height:38px;background:var(--surface-2);color:var(--ink);border:1px dashed var(--faint)">${lu('search', 18)}</span><span>Ver catálogo</span></button>
      <button class="cat-item" data-act="pick" data-v=""><span class="logo" style="width:38px;height:38px;background:var(--surface-2);color:var(--ink);border:1px dashed var(--faint)">${lu('plus', 18)}</span><span>Otro servicio</span></button></div>
    <div><span class="lbl">Tus dos cuentas</span><div class="acc-names" style="margin-top:8px">${S.accounts.map(a => `<label class="field"><span><span class="acc-dot" style="background:${a.color};display:inline-block;margin-right:6px"></span>Nombre de la cuenta</span><input type="text" id="obName-${a.id}" data-act="accName" data-id="${a.id}" value="${esc(a.name)}" maxlength="24"></label>`).join('')}</div>
      <p class="muted" style="margin:8px 0 0;font-size:.85rem">Por ejemplo, dos bancos distintos, o una cuenta personal y otra compartida. Color e icono, en Ajustes.</p></div>
  </section>`;
}
function viewSubs() {
  if (!S.subs.length) return onboarding();
  const mig = migBanner();
  let list = subsVis();
  if (ui.status === 'vigentes') list = list.filter(live);
  else if (ui.status !== 'todas') list = list.filter(s => s.status === ui.status);
  list.sort(ui.sort === 'next' ? (a, b) => (live(b) - live(a)) || a.next.localeCompare(b.next) : (a, b) => monthly(b) - monthly(a));
  const dset = dupIds(subsVis());
  const seg = (k, v, l) => `<button data-act="set" data-k="${k}" data-v="${v}" aria-pressed="${ui[k] === v}">${l}</button>`;
  const cards = list.map(s => {
    const d = daysUntil(s.next);
    const url = safeUrl(s.url);
    const manual = s.renew === 'manual', fin = s.renew === 'fin';
    const pill = expired(s) ? '<span class="pill dup">Vencida</span>' : `<span class="pill ${s.status}">${{ activa: 'Activa', prueba: 'En prueba', cancelada: 'Cancelada' }[s.status]}</span>`;
    const when = d >= 0 && d <= 45 ? `${fmtD(s.next)} · ${rel(s.next)}` : fmtDY(s.next);
    const dup = dset.has(s.id) ? `<span class="pill dup">${lu('copy', 11)} Duplicada</span>` : isSav(s) ? `<span class="pill activa">${lu('piggy-bank', 11)} Ahorro</span>` : '';
    const amt = noAmt(s) ? `<span class="pill prueba">${lu('pencil', 11)} Falta el importe</span><span class="per">${PERIODS[s.period].label}</span>`
      : isFree(s) ? `<span class="num">Gratis</span><span class="per">${PERIODS[s.period].label}</span>`
      : `<span class="num">${eur(s.amount)}</span><span class="per">${PERIODS[s.period].short}${s.period !== 'mensual' ? ` · ≈ ${eur(monthly(s))}/mes` : ''}</span>`;
    return `<div class="sub ${live(s) ? '' : 'off'}" data-act="edit" data-id="${s.id}" role="button" tabindex="0" aria-label="Editar ${esc(subLabel(s))}">
      <div class="sub-top">${subLogo(s, 40)}<div class="sub-name">${esc(subLabel(s))}<span class="plan">${esc(catOf(s.cat).n)}</span></div>${pill}</div>
      <div class="sub-amt">${amt}${dup ? `<span class="dupwrap">${dup}</span>` : ''}</div>
      <dl class="sub-foot">
        <div><dt>${lu('calendar', 13)}${!live(s) ? (s.endedOn ? 'Terminó' : 'Próximo cobro') : fin ? 'Termina' : manual ? 'Vence' : 'Próximo cobro'}</dt><dd class="${live(s) && d <= S.alertDays ? 'soon' : ''}">${live(s) ? when : s.endedOn ? fmtDY(s.endedOn) : 'Sin cobros'}</dd></div>
        <div><dt>${lu(fin ? 'x' : manual ? 'clock' : 'repeat', 13)}Renovación</dt><dd>${fin ? 'Cancelada' : manual ? 'Manual' : 'Automática'}</dd></div>
        <div><dt>${accChip(s.account)}</dt><dd>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">Gestionar ↗</a>` : ''}</dd></div>
      </dl>
    </div>`;
  }).join('');
  return `${mig}<section class="toolbar">
      <div class="seg" role="group" aria-label="Estado">${seg('status', 'vigentes', 'Vigentes')}${seg('status', 'prueba', 'En prueba')}${seg('status', 'cancelada', 'Canceladas')}${seg('status', 'todas', 'Todas')}</div>
      <div class="seg" role="group" aria-label="Orden">${seg('sort', 'next', 'Próximo cobro')}${seg('sort', 'cost', 'Coste')}</div>
      <span class="grow"></span>
      <button class="btn primary" data-act="add">${lu('plus', 16)}Añadir suscripción</button>
    </section>
    ${list.length ? `<section class="subgrid">${cards}</section>` : `<div class="empty">No hay suscripciones en esta vista.</div>`}`;
}

/* ---------- expenses view ---------- */
function viewTx() {
  const e = ui.editTx ? S.tx.find(t => t.id === ui.editTx) : null;
  const defAcc = e ? e.account : (ui.acc !== 'all' ? ui.acc : S.accounts[0].id);
  const accOpts = S.accounts.map(a => `<option value="${a.id}" ${defAcc === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
  const catOpts = (sel, keys) => keys.map(k => `<option value="${k}" ${sel === k ? 'selected' : ''}>${esc(CATS[k].n)}</option>`).join('');
  let list = txVis();
  if (ui.txCat) list = list.filter(t => t.cat === ui.txCat);
  if (ui.txQ) { const q = norm(ui.txQ); list = list.filter(t => norm(t.desc).includes(q)); }
  const total = list.reduce((s, t) => s + t.amount, 0);
  const rows = list.slice(0, ui.txLimit).map(t => `<tr>
      <td>${fmtNum(t.date)}</td><td><span class="cell">${catIcon(t.cat, 22)}<span class="desc" title="${esc(t.desc)}">${esc(t.desc)}</span></span></td>
      <td class="muted">${esc(catOf(t.cat).n)}</td><td>${accChip(t.account)}</td>
      <td class="r"><b>${eur(t.amount)}</b></td>
      <td><div class="row-acts"><button class="btn sm ghost" data-act="txEdit" data-id="${t.id}" aria-label="Editar">${lu('pencil', 14)}</button><button class="btn sm ghost" data-act="txDel" data-id="${t.id}" aria-label="Eliminar">${lu('trash-2', 14)}</button></div></td></tr>`).join('');
  return `<section class="panel">
      ${e ? '' : `<div class="field" style="margin-bottom:14px"><span class="lbl">Gastos habituales</span>${quickChips(true)}</div>`}
      <div class="panel-head"><h2>${e ? 'Editar gasto' : 'Apuntar un gasto'}</h2></div>
      <form id="txForm" class="addform">
        <label class="field"><span>Fecha</span><input type="date" id="t-date" value="${e ? e.date : todayISO}" required></label>
        <label class="field wide"><span>Concepto</span><input type="text" id="t-desc" value="${esc(e ? e.desc : '')}" placeholder="Ej.: cena" maxlength="60" required autocomplete="off"></label>
        <label class="field"><span>Importe (€)</span><input type="text" id="t-amt" inputmode="decimal" value="${e ? numES(e.amount) : ''}" placeholder="0,00" required></label>
        <label class="field"><span>Categoría</span><select id="t-cat">${catOpts(e ? e.cat : 'otros', expCats())}</select></label>
        <label class="field"><span>Cuenta</span><select id="t-acc">${accOpts}</select></label>
        <div class="toolbar">${e ? '' : '<label class="chip keepq"><input type="checkbox" id="t-keep"> Guardar como habitual</label>'}<button class="btn primary" type="submit">${lu(e ? 'check' : 'plus', 16)}${e ? 'Guardar' : 'Añadir'}</button>${e ? '<button class="btn ghost" type="button" data-act="txCancel">Cancelar</button>' : ''}</div>
      </form>
      <p class="muted" style="margin:10px 0 0;font-size:.85rem">La categoría se sugiere a partir del concepto y recuerda lo que elijas para la próxima vez.</p>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Gastos apuntados</h2>
        <div class="toolbar"><span class="muted">${list.length} gastos · ${eur(total)}</span>${S.tx.length ? `<button class="btn sm" data-act="exportTx">${lu('download', 14)}Exportar CSV</button>` : ''}</div></div>
      ${S.tx.length ? `<div class="toolbar" style="margin-bottom:12px">
        <input type="search" id="txQ" placeholder="Buscar concepto" value="${esc(ui.txQ)}" aria-label="Buscar concepto">
        <select id="txCat" aria-label="Filtrar por categoría"><option value="">Todas las categorías</option>${catOpts(ui.txCat, expCats())}</select></div>` : ''}
      ${list.length ? `<div class="tbl-wrap"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Cuenta</th><th class="r">Importe</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      ${list.length > ui.txLimit ? `<div class="toolbar" style="margin-top:12px"><button class="btn" data-act="more">Mostrar más</button><span class="muted">${ui.txLimit} de ${list.length}</span></div>` : ''}`
      : `<div class="empty">${S.tx.length ? 'No hay gastos con estos filtros.' : 'Todavía no has apuntado gastos. Usa el formulario de arriba: con unas semanas de datos verás en qué se va el dinero y los gastos hormiga.'}</div>`}
    </section>`;
}
function saveTx() {
  const desc = $('#t-desc').value.trim(); const amt = Math.abs(parseAmount($('#t-amt').value));
  if (!desc) { toast('Escribe un concepto.'); return; }
  if (!amt) { toast('Escribe un importe mayor que 0. Usa coma para los decimales: 12,50.'); return; }
  const t = { id: ui.editTx || uid(), date: $('#t-date').value || todayISO, desc, amount: Math.round(amt * 100) / 100, cat: $('#t-cat').value, account: $('#t-acc').value };
  const k = conceptKey(desc); if (k) S.memo[k] = t.cat;
  const keep = $('#t-keep') && $('#t-keep').checked;
  if (keep) { S.quick = S.quick || []; const q = { id: uid(), desc, amount: t.amount, cat: t.cat, account: t.account }; S.quick.push(q); t.q = q.id; }
  const i = S.tx.findIndex(x => x.id === t.id);
  if (i > -1) S.tx[i] = t; else S.tx.push(t);
  S.tx.sort((a, b) => b.date.localeCompare(a.date));
  const wasEdit = !!ui.editTx; ui.editTx = null; save(); render();
  toast(wasEdit ? 'Gasto actualizado.' : `Apuntado: ${desc}, ${eur(t.amount)}.${keep ? ' Guardado como habitual.' : ''}`);
  const f = $('#t-desc'); f && f.focus();
}

/* ---------- analysis view ---------- */
const MES = (ym, long) => pd(ym + '-01').toLocaleDateString('es-ES', long ? { month: 'long', year: 'numeric' } : { month: 'short' }).replace('.', '');
function monthsBack(n) { const out = []; for (let k = n - 1; k >= 0; k--) out.push(iso(new Date(TODAY.getFullYear(), TODAY.getMonth() - k, 1)).slice(0, 7)); return out; }
function monthsAhead(n) { const out = []; for (let k = 0; k < n; k++) out.push(iso(new Date(TODAY.getFullYear(), TODAY.getMonth() + k, 1)).slice(0, 7)); return out; }
function niceMax(v) { if (v <= 0) return 10; const p = Math.pow(10, Math.floor(Math.log10(v))); for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p; return 10 * p; }
const pctOf = (v, t) => t ? Math.round(v / t * 100) : 0;
const tipAttr = lines => `data-tip="${esc(lines.join('\n'))}" tabindex="0"`;

// Charges expected in the next 12 months, from each live subscription's renewal date and period.
function projection() {
  const months = monthsAhead(12); const end = addMonths(months[11] + '-01', 1);
  const rows = Object.fromEntries(months.map(m => [m, []]));
  for (const s of subsVis()) {
    if (!live(s) || s.renew === 'fin' || noAmt(s) || !s.amount) continue;
    let d = s.next, g = 0;
    while (d < end && g++ < 400) { const k = d.slice(0, 7); if (rows[k]) rows[k].push({ ...s, on: d }); d = addPeriod(d, s.period); }
  }
  return months.map(m => {
    const items = rows[m];
    const spend = items.filter(s => !isSav(s)).reduce((t, s) => t + s.amount, 0);
    const sav = items.filter(isSav).reduce((t, s) => t + s.amount, 0);
    return { m, items, spend, sav, total: spend + sav };
  });
}

// Vertical stacked bars (HTML, scales to any width). cols: [{label, segs:[{v, color, tip}], total, tipTotal, strong}]
function vbars(cols, { height = 190, valueLabels = 'all', dense = false } = {}) {
  const top = niceMax(Math.max(...cols.map(c => c.total), 0));
  const ticks = [0, top / 2, top];
  const peak = Math.max(...cols.map(c => c.total));
  return `<div class="vchart ${dense ? 'dense' : ''}" style="--h:${height}px">
    <div class="vgrid">${ticks.map(t => `<div class="vtick" style="bottom:${t / top * 100}%"><span>${eur0(t)}</span></div>`).join('')}</div>
    <div class="vcols" style="grid-template-columns:repeat(${cols.length},minmax(0,1fr))">
      ${cols.map(c => {
        const showVal = c.total > 0 && (valueLabels === 'all' || c.total === peak);
        return `<div class="vcol ${c.muted ? 'muted' : ''}" ${tipAttr(c.tip)} aria-label="${esc(c.tip.join('. '))}">
          <div class="vstack" style="height:${c.total / top * 100}%">
            ${showVal ? `<span class="vval ${c.total === peak ? 'peak' : ''}">${eur0(c.total)}</span>` : ''}
            ${c.segs.filter(s => s.v > 0).map(s => `<div class="vseg" style="flex:${s.v};background:${s.color}"></div>`).join('')}
          </div>
          <span class="vlab">${c.label}</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// Horizontal bars with a label column and a value column.
function hbars(rows, { max, unit = '/mes', sub } = {}) {
  max = max || Math.max(...rows.map(r => r.v), 1);
  return `<div class="hbars">${rows.map(r => `<div class="hrow" ${tipAttr(r.tip || [r.name, eur(r.v) + unit])}>
      <span class="hname">${r.icon || ''}<span>${esc(r.name)}</span></span>
      <span class="htrack"><span class="hfill" style="width:${Math.max(1.5, r.v / max * 100)}%;background:${r.color}"></span></span>
      <span class="hval"><b>${eur(r.v)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span>
    </div>`).join('')}</div>`;
}

// Donut from a conic-gradient. parts: [{name, v, color, sub}]
function donut(parts, center) {
  const tot = parts.reduce((t, p) => t + p.v, 0) || 1; let acc0 = 0;
  const stops = parts.map(p => { const a = acc0; acc0 += p.v / tot * 100; return `${p.color} ${a}% ${acc0}%`; }).join(',');
  return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${stops})" ${tipAttr(parts.map(p => `${p.name}: ${p.sub} (${pctOf(p.v, tot)} %)`))}><span>${center}</span></div>
    <div class="split-legend col">${parts.map(p => `<span><i class="key" style="background:${p.color}"></i>${esc(p.name)}<b>${p.sub}</b><small>${pctOf(p.v, tot)} %</small></span>`).join('')}</div></div>`;
}

// Cumulative line chart in SVG. series: [{name, color, pts:[values by day], dash}]
function lineChart(series, days) {
  const W = 600, H = 200, top = niceMax(Math.max(...series.flatMap(s => s.pts), 0));
  const x = i => i / (days - 1) * W, y = v => H - v / top * H;
  return `<div class="line-chart"><div class="vgrid">${[0, top / 2, top].map(t => `<div class="vtick" style="bottom:${t / top * 100}%"><span>${eur0(t)}</span></div>`).join('')}</div>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${series.map(s => `<polyline fill="none" stroke="${s.color}" stroke-width="2.5" vector-effect="non-scaling-stroke" ${s.dash ? 'stroke-dasharray="5 4"' : ''} points="${s.pts.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ')}"/>`).join('')}</svg>
    <div class="line-x"><span>1</span><span>${days >> 1}</span><span>${days}</span></div></div>`;
}

function chartCard(title, takeaway, body, extra = '') {
  return `<section class="panel chart-card"><div class="chart-head"><h2>${title}</h2>${takeaway ? `<p class="takeaway">${takeaway}</p>` : ''}</div>${body}${extra}</section>`;
}

function viewAnalysis() {
  const all = subsVis().filter(live);
  const txAll = txVis();
  if (!all.length && !txAll.length) return `<div class="empty">El análisis aparece cuando apuntes suscripciones o gastos: cuánto se va cada mes, qué meses vienen cargados, qué te cuesta más y dónde puedes recortar.</div>`;
  const spendSubs = all.filter(s => !isSav(s));
  const fixedM = spendSubs.reduce((t, s) => t + monthly(s), 0);
  const savSubM = all.filter(isSav).reduce((t, s) => t + monthly(s), 0);
  const txs = txAll.filter(t => !isSav(t));
  // average over the calendar months since the first expense, current month included
  const firstM = txAll.length ? txAll.map(t => t.date).sort()[0].slice(0, 7) : null;
  const nMonths = firstM ? Math.max(1, (TODAY.getFullYear() - +firstM.slice(0, 4)) * 12 + TODAY.getMonth() + 1 - +firstM.slice(5, 7) + 1) : 1;
  const expM = txs.reduce((t, x) => t + x.amount, 0) / nMonths;
  const savM = savSubM + txAll.filter(isSav).reduce((t, x) => t + x.amount, 0) / nMonths;
  const totalM = fixedM + expM;
  const C = { fix: 'var(--s-fix)', exp: 'var(--s-exp)', sav: 'var(--s-sav)' };
  const h = hormiga(txs);
  const hy = h.reduce((s, g) => s + g.perYear, 0);
  const sugs = suggestions();
  const pot = sugs.filter(s => s.sum).reduce((a, s) => a + s.save, 0);
  const scope = ui.acc === 'all' ? 'Ambas cuentas' : esc(acc(ui.acc).name);

  /* 1. KPIs */
  const kpis = `<section class="kpis">
    <div class="kpi"><span class="lbl"><i class="key" style="background:${C.fix}"></i>Fijos al mes</span><span class="num">${eur(fixedM)}</span><span class="hint">${spendSubs.length} suscripciones · ${eur0(fixedM * 12)} al año</span></div>
    <div class="kpi"><span class="lbl"><i class="key" style="background:${C.exp}"></i>Puntuales al mes</span><span class="num">${eur(expM)}</span><span class="hint">${txs.length ? `media de ${nMonths} ${nMonths === 1 ? 'mes' : 'meses'}` : 'aún no has apuntado gastos'}</span></div>
    <div class="kpi"><span class="lbl"><i class="key" style="background:${C.sav}"></i>Ahorro al mes</span><span class="num">${eur(savM)}</span><span class="hint">no cuenta como gasto</span></div>
    <div class="kpi"><span class="lbl">Podrías ahorrar</span><span class="num" style="color:var(--good)">${eur0(pot)}</span><span class="hint">al año, con las sugerencias de abajo</span></div>
  </section>`;

  /* 2. Composition of a typical month */
  const parts = [['Fijos', fixedM, C.fix], ['Puntuales', expM, C.exp], ['Ahorro', savM, C.sav]].filter(p => p[1] > 0);
  const allM = parts.reduce((t, p) => t + p[1], 0);
  const comp = allM ? chartCard('¿A dónde va tu dinero cada mes?',
    `Un mes normal se van <b>${eur(totalM)}</b> en gastos${savM ? ` y apartas <b>${eur(savM)}</b> para ahorro` : ''}. Los fijos son el ${pctOf(fixedM, totalM)} % del gasto.`,
    `<div class="split">${parts.map(([n, v, c]) => `<div class="split-seg" style="flex:${v};background:${c}" ${tipAttr([n, eur(v) + ' al mes', pctOf(v, allM) + ' % del total'])}></div>`).join('')}</div>
     <div class="split-legend">${parts.map(([n, v, c]) => `<span><i class="key" style="background:${c}"></i>${n}<b>${eur(v)}</b><small>${pctOf(v, allM)} %</small></span>`).join('')}</div>`) : '';

  /* 3. Next 12 months */
  const proj = projection();
  const projTot = proj.reduce((t, p) => t + p.spend, 0);
  const peak = proj.reduce((a, b) => b.total > a.total ? b : a, proj[0]);
  const peakTop = peak && peak.items.length ? [...peak.items].sort((a, b) => b.amount - a.amount)[0] : null;
  const projCols = proj.map((p, i) => ({
    label: MES(p.m) + (i === 0 ? '*' : ''), total: p.total,
    segs: [{ v: p.spend, color: C.fix }, { v: p.sav, color: C.sav }],
    tip: [MES(p.m, true) + ': ' + eur(p.total), ...[...p.items].sort((a, b) => a.on.localeCompare(b.on)).slice(0, 8).map(s => `${fmtD(s.on)} · ${subLabel(s)} · ${eur(s.amount)}`), ...(p.items.length > 8 ? [`y ${p.items.length - 8} más`] : [])]
  }));
  const projTable = `<details class="dtable"><summary>Ver como tabla</summary><div class="tbl-wrap"><table><thead><tr><th>Mes</th><th class="r">Gastos</th><th class="r">Ahorro</th><th>Cobros</th></tr></thead><tbody>${proj.map(p => `<tr><td>${MES(p.m, true)}</td><td class="r">${eur(p.spend)}</td><td class="r">${p.sav ? eur(p.sav) : '—'}</td><td class="muted">${esc([...new Set(p.items.map(subLabel))].join(', '))}</td></tr>`).join('')}</tbody></table></div></details>`;
  const projCard = all.length ? chartCard('Cobros previstos en los próximos 12 meses',
    peak && peak.total ? `En total, <b>${eur(projTot)}</b> en suscripciones. El mes más cargado es <b>${MES(peak.m, true)}</b> (${eur(peak.total)})${peakTop && peakTop.period !== 'mensual' ? `, por el pago ${PERIODS[peakTop.period].label.toLowerCase()} de ${esc(subLabel(peakTop))}` : ''}.` : 'No hay cobros previstos con importe.',
    vbars(projCols, { valueLabels: 'all', dense: true }) + `<div class="legend"><span><i class="key" style="background:${C.fix}"></i>Suscripciones</span>${proj.some(p => p.sav) ? `<span><i class="key" style="background:${C.sav}"></i>Ahorro</span>` : ''}<span>* desde hoy hasta fin de mes · pasa el ratón por una barra para ver qué se cobra</span></div>`, projTable) : '';

  /* 4. What costs the most */
  const ranked = [...spendSubs].filter(s => monthly(s) > 0).sort((a, b) => monthly(b) - monthly(a));
  const topN = ranked.slice(0, 8);
  const rest = ranked.slice(8);
  const rankRows = topN.map(s => ({ name: subLabel(s), v: monthly(s), color: catOf(s.cat).c, icon: subLogo(s, 22), sub: eur0(monthly(s) * 12) + '/año', tip: [subLabel(s), `${eur(s.amount)} ${PERIODS[s.period].label.toLowerCase()}`, `≈ ${eur(monthly(s))} al mes · ${eur(monthly(s) * 12)} al año`, catOf(s.cat).n] }));
  if (rest.length) rankRows.push({ name: `Otras ${rest.length}`, v: rest.reduce((t, s) => t + monthly(s), 0), color: 'var(--faint)', icon: '<span class="logo" style="width:22px;height:22px;background:var(--surface-2);color:var(--muted);border:1px solid var(--line)">+</span>', sub: '' });
  const top3 = ranked.slice(0, 3).reduce((t, s) => t + monthly(s), 0);
  const rankCard = ranked.length ? chartCard('¿Qué suscripción te cuesta más?',
    ranked.length > 3 ? `Las 3 más caras suman <b>${eur(top3)}</b> al mes: el ${pctOf(top3, fixedM)} % de tus fijos.` : `Todo convertido a coste mensual para poder compararlo.`,
    hbars(rankRows)) : '';

  /* 5. By category (subscriptions) */
  const catRows = subCats().map(k => ({ k, v: spendSubs.filter(s => s.cat === k).reduce((t, s) => t + monthly(s), 0), n: spendSubs.filter(s => s.cat === k).length })).filter(r => r.v > 0).sort((a, b) => b.v - a.v)
    .map(r => ({ name: CATS[r.k].n, v: r.v, color: CATS[r.k].c, icon: catIcon(r.k, 22), sub: pctOf(r.v, fixedM) + ' %', tip: [CATS[r.k].n, `${eur(r.v)} al mes · ${eur(r.v * 12)} al año`, `${r.n} ${r.n === 1 ? 'suscripción' : 'suscripciones'} · ${pctOf(r.v, fixedM)} % de los fijos`] }));
  const catCard = catRows.length ? chartCard('Fijos por categoría', `<b>${esc(catRows[0].name)}</b> es la categoría que más pesa: ${eur(catRows[0].v)} al mes.`, hbars(catRows)) : '';

  const fixSeg = `<div class="seg" role="group" aria-label="Ver por">${[['sub', 'Por suscripción'], ['cat', 'Por categoría']].map(([k, l]) => `<button data-act="set" data-k="fixView" data-v="${k}" aria-pressed="${ui.fixView === k}">${l}</button>`).join('')}</div>`;
  const fixCard = ranked.length ? chartCard('¿En qué se van tus fijos?',
    ui.fixView === 'cat' ? `<b>${esc(catRows[0].name)}</b> es la categoría que más pesa: ${eur(catRows[0].v)} al mes (${catRows[0].sub}).` : (ranked.length > 3 ? `Las 3 suscripciones más caras suman <b>${eur(top3)}</b> al mes: el ${pctOf(top3, fixedM)} % de tus fijos.` : 'Todo convertido a coste mensual para poder compararlo.'),
    fixSeg + hbars(ui.fixView === 'cat' ? catRows : rankRows)) : '';

  /* 6. Last 6 months: fixed vs one-off */
  const back = monthsBack(6);
  const histCols = back.map((m, i) => {
    const e = txs.filter(t => t.date.startsWith(m)).reduce((t, x) => t + x.amount, 0);
    return { label: MES(m) + (i === 5 ? '*' : ''), total: fixedM + e, segs: [{ v: fixedM, color: C.fix }, { v: e, color: C.exp }], tip: [MES(m, true) + ': ' + eur(fixedM + e), `Fijos (estimado): ${eur(fixedM)}`, `Puntuales: ${eur(e)}`] };
  });
  const curE = histCols[5].total - fixedM, prevAvg = histCols.slice(0, 5).map(c => c.total - fixedM).filter(v => v > 0);
  const histCard = chartCard('Últimos 6 meses',
    txs.length ? `Este mes llevas <b>${eur(curE)}</b> en gastos puntuales${prevAvg.length ? `; la media de los meses anteriores es ${eur(prevAvg.reduce((a, b) => a + b, 0) / prevAvg.length)}` : ''}.` : 'Apunta tus gastos puntuales para ver cómo cambia cada mes.',
    vbars(histCols, { height: 170 }) + `<div class="legend"><span><i class="key" style="background:${C.fix}"></i>Fijos (con tus suscripciones actuales)</span><span><i class="key" style="background:${C.exp}"></i>Puntuales</span><span>* mes en curso</span></div>`);

  /* 7. One-off expenses by category */
  const totE = txs.reduce((t, x) => t + x.amount, 0);
  const expRows = expCats().map(k => { const g = txs.filter(t => t.cat === k); return { k, v: g.reduce((t, x) => t + x.amount, 0) / nMonths, n: g.length }; }).filter(r => r.v > 0).sort((a, b) => b.v - a.v)
    .map(r => ({ name: CATS[r.k].n, v: r.v, color: CATS[r.k].c, icon: catIcon(r.k, 22), sub: pctOf(r.v * nMonths, totE) + ' %', tip: [CATS[r.k].n, `${eur(r.v)} al mes de media`, `${r.n} ${r.n === 1 ? 'gasto' : 'gastos'} · ${eur(r.v * nMonths)} en total`] }));
  const expCard = chartCard('Puntuales por categoría', expRows.length ? `Media mensual. Donde más gastas: <b>${esc(expRows[0].name)}</b> (${eur(expRows[0].v)} al mes).` : '', expRows.length ? hbars(expRows) : '<div class="empty">Aún no hay gastos puntuales.</div>');

  /* 8. By account */
  let accCard = '';
  if (ui.acc === 'all') {
    const rows = S.accounts.map(a => {
      const f = S.subs.filter(s => live(s) && !isSav(s) && s.account === a.id).reduce((t, s) => t + monthly(s), 0);
      const e = S.tx.filter(t => !isSav(t) && t.account === a.id).reduce((t, x) => t + x.amount, 0) / nMonths;
      return { a, f, e, t: f + e };
    });
    const mx = Math.max(...rows.map(r => r.t), 1);
    accCard = chartCard('Reparto entre cuentas', `Gasto de un mes normal en cada cuenta.`,
      `<div class="hbars">${rows.map(r => `<div class="hrow" ${tipAttr([r.a.name + ': ' + eur(r.t) + ' al mes', 'Fijos: ' + eur(r.f), 'Puntuales: ' + eur(r.e)])}>
        <span class="hname"><span class="acc-badge" style="background:${r.a.color}">${lu(r.a.icon, 12)}</span><span>${esc(r.a.name)}</span></span>
        <span class="htrack stacked">${r.f ? `<span class="hfill" style="width:${r.f / mx * 100}%;background:${C.fix}"></span>` : ''}${r.e ? `<span class="hfill" style="width:${r.e / mx * 100}%;background:${C.exp}"></span>` : ''}</span>
        <span class="hval"><b>${eur(r.t)}</b><small>${pctOf(r.t, rows.reduce((x, y) => x + y.t, 0))} %</small></span></div>`).join('')}</div>
      <div class="legend"><span><i class="key" style="background:${C.fix}"></i>Fijos</span><span><i class="key" style="background:${C.exp}"></i>Puntuales</span></div>`);
  }

  /* 9. Suggestions + hormiga */
  const sugHtml = sugs.map(s => `<div class="sug"><span class="logo" style="width:36px;height:36px;background:${s.color}">${lu(s.icon, 18)}</span>
      <div><div class="kind">${s.kind}</div><p>${esc(s.text)}</p></div>
      ${s.save ? `<div class="save">${eur0(s.save)}/año<small>${esc(s.saveNote || '')}</small></div>` : '<span></span>'}
      ${s.acts && s.acts.length ? `<div class="sug-actions">${s.acts.map(a => `<button class="btn sm" data-act="${a.act}" data-id="${a.id || ''}" data-key="${esc(a.key || '')}" data-mode="${a.mode || ''}">${a.act === 'draft' ? lu('sparkles', 14) : a.act === 'addRec' ? lu('plus', 14) : lu('pencil', 14)}${esc(a.label)}</button>`).join('')}</div>` : ''}
    </div>`).join('');
  const sugCard = `<section class="panel"><div class="panel-head"><h2>Sugerencias</h2><span class="muted">${scope}</span></div>${sugs.length ? `<div class="sugs">${sugHtml}</div>` : '<div class="empty">Nada que recortar por ahora.</div>'}</section>`;
  const hRows = h.map(g => ({ name: g.name, v: g.perMonth, color: catOf(g.cat).c, icon: catIcon(g.cat, 22), sub: eur0(g.perYear) + '/año', tip: [g.name, `${g.count} veces · ${eur(g.avg)} de media`, `${eur(g.perMonth)} al mes · ${eur(g.perYear)} al año`] }));
  const hCard = chartCard('Gastos hormiga', h.length ? `Compras de ${eur0(S.hMax)} o menos que repites: suman <b>${eur0(hy)}</b> al año.` : `Aparecen cuando repites ${S.hMin} o más veces un gasto de ${eur0(S.hMax)} o menos (cámbialo en Ajustes).`, h.length ? hbars(hRows) : '');

  /* 10. This month vs last month, cumulative one-off spend per day */
  const curYM = todayISO.slice(0, 7), prevYM = monthsBack(2)[0];
  const dim = ym => new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate();
  const cumul = (ym, upto) => { const by = Array(dim(ym)).fill(0); txs.filter(t => t.date.startsWith(ym)).forEach(t => { by[+t.date.slice(8) - 1] += t.amount; }); let r = 0; return by.map(v => r += v).slice(0, upto); };
  const curC = cumul(curYM, TODAY.getDate()), prevC = cumul(prevYM, dim(prevYM));
  const prevSame = prevC[Math.min(TODAY.getDate(), prevC.length) - 1] || 0;
  const lineCard = txs.length ? chartCard('Este mes frente al anterior',
    `Gastos puntuales acumulados día a día. Hoy llevas <b>${eur(curC.at(-1) || 0)}</b>; a estas alturas de ${MES(prevYM, true)} llevabas ${eur(prevSame)}.`,
    lineChart([{ name: MES(prevYM, true), color: 'var(--faint)', pts: prevC, dash: true }, { name: MES(curYM, true), color: C.exp, pts: curC }], Math.max(dim(curYM), dim(prevYM)))
    + `<div class="legend"><span><i class="key" style="background:${C.exp}"></i>${MES(curYM, true)}</span><span><i class="key" style="background:var(--faint)"></i>${MES(prevYM, true)}</span></div>`) : '';

  /* 11. One-off expenses by category, last 12 months */
  const back12 = monthsBack(12), from12 = back12[0];
  const tx12 = txs.filter(t => t.date >= from12);
  const catTot = {}; tx12.forEach(t => { catTot[t.cat] = (catTot[t.cat] || 0) + t.amount; });
  const topCats = Object.keys(catTot).sort((a, b) => catTot[b] - catTot[a]).slice(0, 5);
  const grp = t => topCats.includes(t.cat) ? t.cat : '_';
  const keys = [...topCats, ...(Object.keys(catTot).length > 5 ? ['_'] : [])];
  const kName = k => k === '_' ? 'Otras' : catOf(k).n, kColor = k => k === '_' ? 'var(--faint)' : catOf(k).c;
  const evoCols = back12.map((m, i) => {
    const mt = tx12.filter(t => t.date.startsWith(m)); const by = k => mt.filter(t => grp(t) === k).reduce((a, t) => a + t.amount, 0);
    const segs = keys.map(k => ({ v: by(k), color: kColor(k) })); const total = segs.reduce((a, s) => a + s.v, 0);
    return { label: MES(m) + (i === 11 ? '*' : ''), total, segs, tip: [MES(m, true) + ': ' + eur(total), ...keys.filter(k => by(k)).map(k => `${kName(k)}: ${eur(by(k))}`)] };
  });
  const evoCard = tx12.length ? chartCard('Puntuales mes a mes', 'Últimos 12 meses, por categoría.',
    vbars(evoCols, { height: 180, valueLabels: 'peak', dense: true }) + `<div class="legend">${keys.map(k => `<span><i class="key" style="background:${kColor(k)}"></i>${esc(kName(k))}</span>`).join('')}<span>* mes en curso</span></div>`) : '';

  /* 12. Weekday */
  const WD = ['L', 'M', 'X', 'J', 'V', 'S', 'D'], WDL = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const wd = WD.map(() => ({ v: 0, n: 0 })); txs.forEach(t => { const w = (pd(t.date).getDay() + 6) % 7; wd[w].v += t.amount; wd[w].n++; });
  const wdTop = wd.reduce((b, x, i) => x.v > wd[b].v ? i : b, 0);
  const wdCard = txs.length ? chartCard('¿Qué día gastas más?', `Los <b>${WDL[wdTop]}</b> se te va más dinero: ${eur(wd[wdTop].v)} en ${wd[wdTop].n} ${wd[wdTop].n === 1 ? 'gasto' : 'gastos'}.`,
    vbars(wd.map((x, i) => ({ label: WD[i], total: x.v, segs: [{ v: x.v, color: C.exp }], tip: [WDL[i][0].toUpperCase() + WDL[i].slice(1) + ': ' + eur(x.v), `${x.n} ${x.n === 1 ? 'gasto' : 'gastos'}`, x.n ? `${eur(x.v / x.n)} de media` : ''] })), { height: 150, valueLabels: 'peak' })) : '';

  /* 13. Calendar heatmap, last 16 weeks */
  const startD = addDays(todayISO, -((TODAY.getDay() + 6) % 7) - 7 * 15);
  const byDay = {}; txs.forEach(t => { if (t.date >= startD) byDay[t.date] = (byDay[t.date] || 0) + t.amount; });
  const dayMax = Math.max(...Object.values(byDay), 1);
  const cells = []; for (let d = startD; d <= todayISO; d = addDays(d, 1)) cells.push(d);
  const heatCard = txs.length ? chartCard('Calendario de gasto', `Cada cuadro es un día de las últimas 16 semanas; cuanto más intenso, más gastaste. ${Object.keys(byDay).length} días con gastos.`,
    `<div class="heat-wrap"><div class="heat-days">${WD.map(d => `<span>${d}</span>`).join('')}</div><div class="heat">${cells.map(d => { const v = byDay[d] || 0; return `<span class="hcell" style="${v ? `background:color-mix(in srgb,var(--s-exp) ${Math.round(20 + v / dayMax * 80)}%,var(--surface-2))` : ''}" ${tipAttr([fmtDY(d), v ? eur(v) : 'Sin gastos'])}></span>`; }).join('')}</div></div>`) : '';

  /* 14. Budgets */
  const br = budgetRows();
  const budCard = br.length ? chartCard('Presupuestos del mes', `${br.filter(b => b.ratio > 1).length ? `Te has pasado en <b>${br.filter(b => b.ratio > 1).map(b => esc(b.c.n)).join(', ')}</b>.` : 'Vas dentro de todos tus presupuestos.'} Se cambian en Ajustes → categorías.`,
    `<div class="hbars">${br.map(b => `<div class="hrow" ${tipAttr([b.c.n, `${eur(b.spent)} de ${eur(b.budget)}`, b.ratio > 1 ? `Te has pasado ${eur(b.spent - b.budget)}` : `Te quedan ${eur(b.budget - b.spent)}`])}>
      <span class="hname">${catIcon(b.k, 22)}<span>${esc(b.c.n)}</span></span>
      <span class="htrack budget-track"><span class="hfill" style="width:${Math.min(100, b.ratio * 100)}%;background:${b.ratio > 1 ? 'var(--bad)' : b.c.c}"></span></span>
      <span class="hval"><b>${pctOf(b.spent, b.budget)} %</b><small>${eur0(b.spent)} de ${eur0(b.budget)}</small></span></div>`).join('')}</div>`) : '';

  /* 15. Size of expenses */
  const BK = [[0, 5, '< 5 €'], [5, 20, '5–20'], [20, 50, '20–50'], [50, 100, '50–100'], [100, Infinity, '> 100']];
  const bk = BK.map(([a, b, l]) => { const g = txs.filter(t => t.amount >= a && t.amount < b); return { l, n: g.length, v: g.reduce((s, t) => s + t.amount, 0) }; });
  const sizeCard = txs.length ? chartCard('¿Cuánto cuesta cada gasto?', `La mayoría de tus gastos son de <b>${bk.reduce((a, b) => b.n > a.n ? b : a).l}${bk.reduce((a, b) => b.n > a.n ? b : a).l.includes('€') ? '' : ' €'}</b>. Cada barra suma lo gastado en ese tramo.`,
    vbars(bk.map(b => ({ label: b.l, total: b.v, segs: [{ v: b.v, color: C.exp }], tip: [b.l + (b.l.includes('€') ? '' : ' €') + ': ' + eur(b.v), `${b.n} ${b.n === 1 ? 'gasto' : 'gastos'}`] })), { height: 150 })) : '';

  /* 16. Biggest one-off expenses */
  const big = [...txs].sort((a, b) => b.amount - a.amount).slice(0, 6);
  const bigCard = big.length ? chartCard('Los gastos más grandes', '', hbars(big.map(t => ({ name: t.desc, v: t.amount, color: catOf(t.cat).c, icon: catIcon(t.cat, 22), sub: fmtNum(t.date), tip: [t.desc, eur(t.amount), fmtDY(t.date) + ' · ' + catOf(t.cat).n + ' · ' + acc(t.account).name] })), { unit: '' })) : '';

  /* 17. Habitual expenses */
  const qMap = {}; txs.filter(t => t.q).forEach(t => { (qMap[t.q] = qMap[t.q] || { n: 0, v: 0, t }).n++; qMap[t.q].v += t.amount; });
  const qRows = Object.entries(qMap).sort((a, b) => b[1].v - a[1].v).map(([id, g]) => { const q = (S.quick || []).find(x => x.id === id) || g.t; return { name: q.desc, v: g.v, color: catOf(q.cat).c, icon: catIcon(q.cat, 22), sub: `${g.n} ${g.n === 1 ? 'vez' : 'veces'}`, tip: [q.desc, `${g.n} ${g.n === 1 ? 'vez' : 'veces'} · ${eur(g.v)} en total`] }; });
  const qCard = qRows.length ? chartCard('Gastos habituales', 'Lo que has apuntado con un toque desde la pestaña Gastos.', hbars(qRows, { unit: '' })) : '';

  /* 18. Subscriptions by period and by status */
  const PC = ['var(--s-fix)', 'var(--s-exp)', 'var(--s-sav)', '#9A3FD0', '#B7791F', '#7A818E'];
  const perParts = Object.keys(PERIODS).map(p => ({ p, g: spendSubs.filter(s => s.period === p && monthly(s) > 0) })).filter(x => x.g.length)
    .map((x, i) => ({ name: PERIODS[x.p].label, v: x.g.reduce((t, s) => t + monthly(s), 0), color: PC[i % PC.length], sub: `${eur(x.g.reduce((t, s) => t + monthly(s), 0))}/mes · ${x.g.length}` }));
  const perCard = perParts.length ? chartCard('Cómo se cobran', 'Coste mensual según cada cuánto se paga. Las anuales pesan poco al mes pero llegan de golpe.', donut(perParts, eur0(fixedM) + '<small>/mes</small>')) : '';
  const allSubs = subsVis();
  const stParts = [['activa', 'Activas', 'var(--s-fix)'], ['prueba', 'En prueba', 'var(--s-exp)'], ['cancelada', 'Canceladas', 'var(--faint)']]
    .map(([k, n, c]) => ({ name: n, v: allSubs.filter(s => s.status === k).length, color: c })).filter(p => p.v).map(p => ({ ...p, sub: String(p.v) }));
  const cancelY = allSubs.filter(s => s.status === 'cancelada' && s.amount > 0).reduce((t, s) => t + monthly(s) * 12, 0);
  const stCard = stParts.length ? chartCard('Estado de tus suscripciones', cancelY ? `Lo que has cancelado te ahorra <b>${eur0(cancelY)}</b> al año.` : '', donut(stParts, allSubs.length + '<small>en total</small>')) : '';

  const AV = [['resumen', 'Resumen'], ['subs', 'Suscripciones'], ['gastos', 'Gastos']];
  const av = AV.some(a => a[0] === ui.anView) ? ui.anView : 'resumen';
  const avSeg = `<div class="seg" role="group" aria-label="Sección">${AV.map(([k, l]) => `<button data-act="set" data-k="anView" data-v="${k}" aria-pressed="${av === k}">${l}</button>`).join('')}</div>`;
  const pair = (a, b) => a && b ? `<div class="two">${a}${b}</div>` : a + b;
  const body = {
    resumen: `${kpis}${comp}${histCard}${pair(lineCard, accCard)}${sugCard}`,
    subs: `${fixCard}${pair(perCard, stCard)}`,
    gastos: `${evoCard}${pair(expCard, budCard)}${pair(wdCard, sizeCard)}${heatCard}${pair(bigCard, qCard)}${hCard}`
  }[av];
  return `${avSeg}${body}`;
}

/* tooltip */
(() => {
  const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip);
  const show = (el, x, y) => {
    const lines = el.dataset.tip.split('\n'); tip.textContent = '';
    lines.forEach((l, i) => { const d = document.createElement(i ? 'div' : 'b'); d.textContent = l; tip.appendChild(d); });
    tip.hidden = false;
    const r = tip.getBoundingClientRect(); const W = innerWidth;
    let left = x + 14, top = y + 14;
    if (left + r.width > W - 8) left = Math.max(8, x - r.width - 14);
    if (top + r.height > innerHeight - 8) top = Math.max(8, y - r.height - 14);
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  };
  document.addEventListener('pointermove', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) show(el, e.clientX, e.clientY); else tip.hidden = true; });
  document.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) { const r = el.getBoundingClientRect(); show(el, r.left + r.width / 2, r.top); } else tip.hidden = true; });
  document.addEventListener('scroll', () => { tip.hidden = true; }, true);
})();

/* ---------- settings view ---------- */
function viewSettings() {
  const accs = S.accounts.map(a => `<div class="acc-edit">
      <div class="toolbar"><span class="acc-badge" style="background:${a.color};width:30px;height:30px;border-radius:9px">${lu(a.icon, 16)}</span>
        <label class="field" style="flex:1"><span>Nombre</span><input type="text" id="accName-${a.id}" data-act="accName" data-id="${a.id}" value="${esc(a.name)}" maxlength="24"></label></div>
      <div class="field"><span>Color</span><div class="swatches">${ACC_COLORS.map(c => `<button class="swatch" style="background:${c}" data-act="accColor" data-id="${a.id}" data-v="${c}" aria-pressed="${a.color === c}" aria-label="Color ${c}"></button>`).join('')}</div></div>
      <div class="field"><span>Icono</span><div class="iconpick">${ACC_ICONS.map(i => `<button data-act="accIcon" data-id="${a.id}" data-v="${i}" aria-pressed="${a.icon === i}" aria-label="${i}">${lu(i, 16)}</button>`).join('')}</div></div>
      <span class="muted" style="font-size:.85rem">${S.subs.filter(s => s.account === a.id && live(s)).length} suscripciones · ${S.tx.filter(t => t.account === a.id).length} gastos</span>
    </div>`).join('');
  return `${window.drivePanel ? window.drivePanel() : ''}<section class="panel"><div class="panel-head"><h2>Cuentas</h2><span class="muted">Cada suscripción y cada gasto pertenecen a una de las dos</span></div><div class="accs">${accs}</div></section>
    ${catSection()}
    <section class="two">
      <div class="panel"><div class="panel-head"><h2>Avisos y detección</h2></div>
        <label class="field"><span>Avisar de cobros con antelación de</span><select id="alertDays">${[1, 2, 3, 5, 7, 10, 14, 21, 30].map(n => `<option value="${n}" ${S.alertDays === n ? 'selected' : ''}>${n} ${n === 1 ? 'día' : 'días'}</option>`).join('')}</select></label>
        <h3 style="margin-top:18px">Gastos hormiga</h3>
        <div class="form-grid" style="margin-top:10px">
          <label class="field"><span>Importe máximo por gasto (€)</span><input type="text" id="hMax" inputmode="decimal" value="${numES(S.hMax)}"></label>
          <label class="field"><span>Veces que se repite, como mínimo</span><select id="hMin">${[2, 3, 4, 5, 6, 8, 10].map(n => `<option value="${n}" ${S.hMin === n ? 'selected' : ''}>${n} veces</option>`).join('')}</select></label>
        </div></div>
      <div class="panel"><div class="panel-head"><h2>Copias automáticas</h2></div>
        <p class="muted" style="margin:0 0 10px;font-size:.88rem">Cada pocas horas, y antes de cualquier cambio que borre muchos datos, se guarda una copia de la versión anterior en este navegador (las 6 últimas).</p>
        ${(() => { const b = readBackups().sort((x, y) => y.at - x.at); return b.length ? `<div class="uplist">${b.map(x => `<div class="uprow"><span class="nm">${new Date(x.at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}<small>${(x.data.subs || []).length} suscripciones · ${(x.data.tx || []).length} gastos</small></span><button class="btn sm" data-act="bakRestore" data-id="${x.at}">Restaurar</button></div>`).join('')}</div>` : '<div class="empty" style="padding:14px">Todavía no hay copias. Se crean solas a medida que usas la app.</div>'; })()}
      </div>
      <div class="panel"><div class="panel-head"><h2>Exportar y copia de seguridad</h2></div>
        <div class="toolbar"><button class="btn" data-act="exportSubs">${lu('download', 16)}Suscripciones (CSV)</button><button class="btn" data-act="exportTx">${lu('download', 16)}Gastos (CSV)</button><button class="btn" data-act="exportJson">${lu('file-text', 16)}Copia completa (JSON)</button>
          <label class="btn" for="restoreFile">${lu('upload', 16)}Restaurar copia</label><input type="file" id="restoreFile" accept=".json,application/json" hidden></div>
        <p class="muted" style="margin:10px 0 0;font-size:.85rem">CSV con «;» y decimales con coma, listo para Excel o Numbers en español. La copia JSON te permite llevar tus datos a otro navegador.</p></div>
    </section>
    <section class="panel"><div class="panel-head"><h2>Privacidad y dónde viven tus datos</h2>${lu('shield-check', 20)}</div>
      <div class="prose">
        <p><b>Tus datos se guardan en este dispositivo</b> y, si conectas Google Drive, en un archivo de tu propio Drive. No pasan por ningún otro servidor: ni por el de Wallet (no tiene) ni por el de nadie más.</p>
        <p>Wallet no se conecta a ningún banco ni pide credenciales: solo guarda lo que tú apuntas.</p>
        <p>Si borras los datos del navegador y no tienes Drive conectado, se pierden. Exporta una copia de vez en cuando.</p>
        <p>Los mensajes para cancelar o pedir rebaja se generan con plantillas en tu dispositivo, sin IA.</p>
        <p class="muted" style="font-size:.85rem">Logotipos de <a href="https://simpleicons.org" target="_blank" rel="noopener">Simple Icons</a> (CC0) e iconos de <a href="https://lucide.dev" target="_blank" rel="noopener">Lucide</a> (ISC). Las marcas pertenecen a sus propietarios y se muestran solo para identificar servicios en una herramienta personal y no comercial. Los servicios sin logotipo usan su inicial. Los precios de catálogo son orientativos.</p>
      </div>
      <div class="toolbar" style="margin-top:16px"><button class="btn danger" data-act="wipe" id="wipeBtn">${lu('trash-2', 16)}Borrar todos los datos</button></div>
    </section>`;
}

function catSection() {
  const used = k => S.subs.filter(s => s.cat === k).length + S.tx.filter(t => t.cat === k).length;
  const row = k => { const c = CATS[k]; return `<button class="catrow" data-act="catEdit" data-id="${k}">${catIcon(k, 28)}<span class="nm">${esc(c.n)}</span>${c.dup && c.k !== 'gasto' ? `<span class="pill dup" title="Avisa si tienes dos o más">${lu('copy', 11)} Duplicados</span>` : ''}${c.save ? `<span class="pill activa">${lu('piggy-bank', 11)} Ahorro</span>` : ''}${c.budget ? `<span class="pill cancelada">${eur0(c.budget)}/mes</span>` : ''}${c.k === 'ambos' ? '<span class="pill cancelada">Ambos</span>' : ''}<span class="muted cnt">${used(k) || ''}</span>${lu('pencil', 14)}</button>`; };
  const col = (kind, keys) => `<div class="panel"><div class="panel-head"><h2>Categorías de ${kind === 'sub' ? 'suscripciones' : 'gastos'}</h2><button class="btn sm" data-act="catAdd" data-k="${kind}">${lu('plus', 14)}Nueva</button></div><div class="catlist">${keys.map(row).join('')}</div></div>`;
  return `<section class="two">${col('sub', subCats())}${col('gasto', expCats())}</section>`;
}
let catEdit = null;
function catHTML() {
  const c = catEdit;
  return `<div class="modal-head"><div class="toolbar"><span id="c-prev"><span class="logo" style="width:36px;height:36px;background:${c.c}">${lu(c.i, 20)}</span></span><h2>${c.isNew ? 'Nueva categoría' : esc(c.n)}</h2></div><button class="btn ghost sm" data-act="close" aria-label="Cerrar">${lu('x', 18)}</button></div>
    <form id="catForm" class="modal-body">
      <label class="field"><span>Nombre</span><input type="text" id="c-name" value="${esc(c.n)}" maxlength="32" required autofocus></label>
      <div class="field"><span>Se usa en</span><div class="seg" role="group" aria-label="Se usa en">${c.id === 'otros' ? '<button type="button" aria-pressed="true">Ambos</button>' : Object.entries(KINDS).map(([k, l]) => `<button type="button" data-act="cKind" data-v="${k}" aria-pressed="${c.k === k}">${l}</button>`).join('')}</div></div>
      <div class="field"><span>Color</span><div class="colorpick">${CAT_COLORS.map(x => `<button type="button" class="swatch" style="background:${x}" data-act="cColor" data-v="${x}" aria-pressed="${c.c.toLowerCase() === x.toLowerCase()}" aria-label="Color ${x}"></button>`).join('')}<label class="swatch custom" title="Otro color" style="background:${CAT_COLORS.includes(c.c) ? 'var(--surface-2)' : c.c}">${lu('palette', 14)}<input type="color" id="c-color" value="${c.c}" aria-label="Otro color"></label></div></div>
      <div class="field"><span>Icono</span><div class="iconpick">${CAT_ICONS.map(i => `<button type="button" data-act="cIcon" data-v="${i}" aria-pressed="${c.i === i}" aria-label="${i}">${lu(i, 16)}</button>`).join('')}</div></div>
      ${c.k !== 'sub' ? `<label class="field"><span>Presupuesto mensual (€, opcional)</span><input type="text" id="c-budget" inputmode="decimal" value="${c.budget ? numES(c.budget) : ''}" placeholder="Sin presupuesto"><small class="muted">Se compara con lo que apuntas en Gastos cada mes y aparece en Inicio.</small></label>` : ''}
      <label class="chip" style="color:var(--ink)"><input type="checkbox" id="c-save" ${c.save ? 'checked' : ''}> Es ahorro o inversión: se registra, pero no cuenta como gasto</label>
      ${c.k !== 'gasto' ? `<label class="chip" style="color:var(--ink)"><input type="checkbox" id="c-dup" ${c.dup ? 'checked' : ''}> Avisar si tengo dos o más suscripciones activas en esta categoría</label>` : ''}
      <button type="submit" hidden></button>
    </form>
    <div class="modal-foot">${c.isNew || c.id === 'otros' ? '' : `<button class="btn danger left" data-act="catDel">${lu('trash-2', 16)}Eliminar</button>`}<button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="catSave">${lu('check', 16)}Guardar</button></div>`;
}
function openCat(id, kind) {
  catEdit = id ? { id, ...CATS[id] } : { id: 'c' + uid(), n: '', i: 'tag', c: CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)], k: kind, dup: false, isNew: true };
  openModal(catHTML());
}
function catPreview() { const p = $('#c-prev'); if (p) p.innerHTML = `<span class="logo" style="width:36px;height:36px;background:${catEdit.c}">${lu(catEdit.i, 20)}</span>`; }
function saveCat() {
  const n = $('#c-name').value.trim(); if (!n) { toast('Ponle un nombre a la categoría.'); return; }
  const d = $('#c-dup');
  const { id, isNew, ...rest } = catEdit;
  const bEl = $('#c-budget'); const bv = bEl ? parseAmount(bEl.value) : NaN;
  S.cats[id] = { ...rest, n, budget: bv > 0 ? Math.round(bv * 100) / 100 : undefined, dup: d ? d.checked : false, save: $('#c-save').checked, k: id === 'otros' ? 'ambos' : rest.k };
  syncCats(); save(); closeModal(); render(); toast(isNew ? 'Categoría creada.' : 'Categoría guardada.');
}

/* ---------- modals ---------- */
function openModal(html) { $('#modalRoot').innerHTML = `<div class="overlay" data-act="closeBg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`; const f = $('#modalRoot [autofocus]') || $('#modalRoot input, #modalRoot button'); f && f.focus(); }
function closeModal() { $('#modalRoot').innerHTML = ''; }
let pickFilter = { q: '', cat: '' };
function pickerHTML() {
  const q = norm(pickFilter.q);
  const items = CATALOG.filter(c => (!pickFilter.cat || c.cat === pickFilter.cat) && (!q || norm(c.n).includes(q)));
  const cats = [...new Set(CATALOG.map(c => c.cat))].filter(c => CATS[c]);
  return `<div class="modal-head"><h2>Añadir suscripción</h2><button class="btn ghost sm" data-act="close" aria-label="Cerrar">${lu('x', 18)}</button></div>
    <div class="modal-body">
      <input type="search" id="pickQ" placeholder="Buscar servicio" value="${esc(pickFilter.q)}" aria-label="Buscar servicio" autofocus>
      <div class="chips"><button data-act="pickCat" data-v="" aria-pressed="${!pickFilter.cat}">Todos</button>${cats.map(c => `<button data-act="pickCat" data-v="${c}" aria-pressed="${pickFilter.cat === c}">${esc(CATS[c].n)}</button>`).join('')}</div>
      <div class="catalog" id="pickGrid">${items.map(c => `<button class="cat-item" data-act="pick" data-v="${c.id}">${logo(c.id, 38)}<span>${esc(c.n)}</span></button>`).join('')}
        <button class="cat-item" data-act="pick" data-v=""><span class="logo" style="width:38px;height:38px;background:var(--surface-2);color:var(--ink);border:1px dashed var(--faint)">${lu('plus', 18)}</span><span>Otro servicio</span></button></div>
    </div>`;
}
function editHTML(s, isNew) {
  const per = Object.entries(PERIODS).map(([k, v]) => `<option value="${k}" ${s.period === k ? 'selected' : ''}>${v.label}</option>`).join('');
  const accs = S.accounts.map(a => `<option value="${a.id}" ${s.account === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
  const cats = subCats().map(k => `<option value="${k}" ${s.cat === k ? 'selected' : ''}>${CATS[k].n}</option>`).join('');
  const hasBrand = s.service && CAT_BY_ID[s.service] && CAT_BY_ID[s.service].si;
  return `<div class="modal-head"><div class="toolbar"><span id="f-logo">${subLogo(s, 36)}</span><h2>${isNew ? 'Nueva suscripción' : esc(subLabel(s))}</h2></div><button class="btn ghost sm" data-act="close" aria-label="Cerrar">${lu('x', 18)}</button></div>
    <form id="subForm" class="modal-body">
      <div class="form-grid">
        <label class="field"><span>Servicio</span><input type="text" id="f-name" value="${esc(subLabel(s) === 'Servicio' ? '' : subLabel(s))}" required maxlength="40" placeholder="Nombre del servicio" ${isNew && !s.service ? 'autofocus' : ''}></label>
        
        <label class="field"><span>Cuenta</span><select id="f-acc">${accs}</select></label>
        <label class="field"><span>Categoría</span><select id="f-cat">${cats}</select></label>
        <label class="field"><span>Importe (€)</span><input type="text" id="f-amt" inputmode="decimal" value="${noAmt(s) ? '' : numES(s.amount)}" placeholder="0,00 (gratis)"></label>
        <label class="field"><span>Periodicidad</span><select id="f-per">${per}</select></label>
        <label class="field"><span>Próximo cobro</span><input type="date" id="f-next" value="${s.next}" required></label>
        <label class="field"><span>Fecha de alta</span><input type="date" id="f-start" value="${s.start}"></label>
        <div class="field"><span>Renovación</span><div class="seg" role="group" aria-label="Renovación">${[['auto', 'Automática'], ['manual', 'Manual'], ['fin', 'Cancelada']].map(([k, l]) => `<button type="button" data-act="fRenew" data-v="${k}" aria-pressed="${(s.renew || 'auto') === k}">${l}</button>`).join('')}</div><input type="hidden" id="f-renew" value="${s.renew || 'auto'}"></div>
        <label class="field"><span>Enlace para gestionarla</span><input type="url" id="f-url" value="${esc(s.url || '')}" placeholder="https://…"></label>
        <label class="field full"><span>Plan o nota</span><textarea id="f-plan" rows="3" maxlength="600" placeholder="Premium, 180 días, plan de estudiante con el correo de la universidad, se renueva hasta junio…">${esc(s.plan || '')}</textarea></label>
        <div class="field full"><span>Estado</span><div class="seg" role="group" aria-label="Estado">${['activa', 'prueba', 'cancelada'].map(st => `<button type="button" data-act="fStatus" data-v="${st}" aria-pressed="${s.status === st}">${{ activa: 'Activa', prueba: 'En prueba', cancelada: 'Cancelada' }[st]}</button>`).join('')}</div><input type="hidden" id="f-status" value="${s.status}"></div>
        <div class="field full"><span>Logo</span><div class="toolbar"><label class="btn sm" for="f-logofile">${lu('upload', 14)}${editing.logo ? 'Cambiar logo' : 'Subir logo'}</label><input type="file" id="f-logofile" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden>${editing.logo ? `<button type="button" class="btn sm ghost" data-act="fLogoDel">Quitar logo</button>` : ''}<span class="muted" style="font-size:.82rem">PNG, JPG o SVG. Se guarda en tu navegador.</span></div></div>
        ${hasBrand || editing.logo ? '' : `<div class="field full"><span>Color del icono</span><div class="colorpick">${SVC_COLORS.map(c => `<button type="button" class="swatch" style="background:${c}" data-act="fColor" data-v="${c}" aria-pressed="${(s.color || (CAT_BY_ID[s.service] || {}).col) === c}" aria-label="Color ${c}"></button>`).join('')}</div></div>`}
      </div>
      <div class="note" id="f-hint">${lu('info', 16)}<span>${hintFor(s)}</span></div>
      <button type="submit" hidden></button>
    </form>
    <div class="modal-foot">
      ${isNew ? '' : `<button class="btn danger left" data-act="delSub" data-id="${s.id}">${lu('trash-2', 16)}Eliminar</button><button class="btn" data-act="draft" data-id="${s.id}">${lu('sparkles', 16)}${IN_CLAUDE ? 'Redactar con Claude' : 'Redactar mensaje'}</button>`}
      <button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="saveSub">${lu('check', 16)}Guardar</button>
    </div>`;
}
function hintFor(s) {
  const c = CAT_BY_ID[s.service];
  if (s.renew === 'fin' && live(s)) return `Renovación cancelada: sigue activa y cuenta en los totales hasta el ${fmtDY(s.next)}. Ese día pasará a Cancelada automáticamente.`;
  if (isFree(s)) return 'Suscripción gratuita: aparece en tu lista y en los avisos, pero no suma en los totales. Si en algún momento pasa a ser de pago, cambia el importe.';
  if (noAmt(s)) return (s.renew === 'manual' ? 'Renovación manual: te avisaremos antes de que venza. ' : '') + 'Escribe el importe tal como te lo cobran (con coma para los decimales) y su periodicidad.';
  let t = `Equivale a ${eur(monthly(s))} al mes y ${eur(monthly(s) * 12)} al año.`;
  if (s.status === 'prueba') t += ` El primer cobro llega el ${fmtD(s.next)}: recibirás aviso ${S.alertDays} días antes.`;
  return t;
}
function newSub(service, extra = {}) {
  const c = CAT_BY_ID[service];
  const period = (c && c.per) || 'mensual';
  return { id: uid(), service: service || null, name: c ? c.n : '', plan: '', account: ui.acc === 'all' ? S.accounts[0].id : ui.acc, amount: c ? c.p : 0, period, next: addPeriod(todayISO, period), start: todayISO, status: 'activa', cat: c && CATS[c.cat] ? c.cat : 'otros', ...extra };
}
let editing = null;
function openEdit(s, isNew) { editing = { ...s }; openModal(editHTML(editing, isNew)); if (s.service && noAmt(s)) { const f = $('#f-amt'); f && f.focus(); } }
function readForm() {
  if (!$('#subForm')) return null;
  const amount = parseAmount($('#f-amt').value);
  return { ...editing, name: $('#f-name').value.trim(), plan: $('#f-plan').value.trim(), account: $('#f-acc').value, cat: $('#f-cat').value, amount: isNaN(amount) ? null : Math.abs(amount), amountSet: !isNaN(amount), period: $('#f-per').value, next: $('#f-next').value || todayISO, start: $('#f-start').value || todayISO, status: $('#f-status').value, renew: $('#f-renew').value, url: $('#f-url').value.trim() };
}
function saveSub() {
  const s = readForm(); if (!s) return;
  if (!s.name) { toast('Escribe el nombre del servicio.'); return; }
  if (noAmt(s)) { toast('Escribe el importe con coma para los decimales (9,99). Si es gratis, pon 0.'); return; }
  s.converted = false; if (s.status !== 'cancelada') delete s.endedOn;
  const i = S.subs.findIndex(x => x.id === s.id);
  if (i > -1) S.subs[i] = s; else S.subs.push(s);
  rollForward(); save(); closeModal(); if (ui.tab !== 'suscripciones' && i < 0) ui.tab = 'suscripciones'; render(); toast(i > -1 ? 'Suscripción actualizada.' : 'Suscripción añadida.');
}

/* Claude drafting */
let draftCtl = null, draftMode = 'cancelar';
function draftHTML(s, mode) {
  const months = Math.max(0, Math.round((TODAY - pd(s.start)) / 86400000 / 30.44));
  return `<div class="modal-head"><div class="toolbar">${subLogo(s, 32)}<h2>Mensaje para ${esc(subLabel(s))}</h2></div><button class="btn ghost sm" data-act="close" aria-label="Cerrar">${lu('x', 18)}</button></div>
    <div class="modal-body" id="draftBody" data-id="${s.id}">
      <div class="seg" role="group" aria-label="Tipo de mensaje">${[['cancelar', 'Cancelar suscripción'], ['rebaja', 'Pedir una rebaja']].map(([k, l]) => `<button data-act="draftMode" data-v="${k}" aria-pressed="${mode === k}">${l}</button>`).join('')}</div>
      <label class="field"><span>Detalles opcionales (motivo, oferta de la competencia…)</span><input type="text" id="draftExtra" placeholder="Ej.: he visto la misma oferta por 7,99 €" maxlength="200"></label>
      ${IN_CLAUDE ? '' : '<p class="muted" style="margin:0">Elige el tipo de mensaje y pulsa «Usar plantilla». Después puedes editarlo antes de copiarlo.</p>'}
      <div class="note" ${IN_CLAUDE ? '' : 'hidden'}>${lu('shield-check', 16)}<span>Se envía a Claude: ${esc(subLabel(s))}${s.plan ? ' (' + esc(s.plan) + ')' : ''}, ${eur(s.amount)} ${PERIODS[s.period].label.toLowerCase()}, cliente desde hace ${months} meses y lo que escribas arriba. Nada más.</span></div>
      <div class="toolbar"><button class="btn primary" data-act="draftGo" id="draftGo" ${IN_CLAUDE ? '' : 'hidden'}>${lu('sparkles', 16)}Redactar con Claude</button><button class="btn" data-act="draftTpl">Usar plantilla</button><span class="muted" id="draftStatus"></span></div>
      <textarea id="draftOut" rows="11" placeholder="El texto aparecerá aquí. Puedes editarlo antes de copiarlo."></textarea>
    </div>
    <div class="modal-foot"><button class="btn" data-act="close">Cerrar</button><button class="btn primary" data-act="copyDraft">${lu('copy', 16)}Copiar texto</button></div>`;
}
function openDraft(id, mode) { const s = S.subs.find(x => x.id === id); if (!s) return; draftMode = mode || 'cancelar'; openModal(draftHTML(s, draftMode)); }
function template(s, mode, extra) {
  const n = subLabel(s), amt = eur(s.amount) + ' (' + PERIODS[s.period].label.toLowerCase() + ')';
  if (mode === 'cancelar') return `Asunto: Solicitud de baja de mi suscripción a ${n}\n\nHola:\n\nSoy titular de una suscripción a ${n}${s.plan ? ' (' + s.plan + ')' : ''} por ${amt}. Os escribo para solicitar la baja con efecto inmediato y que no se realicen más cargos a partir de la fecha de este mensaje${s.status === 'prueba' ? ', antes de que termine el periodo de prueba' : ''}.\n\n${extra ? extra + '\n\n' : ''}Os agradecería que me confirméis la cancelación por escrito, indicando la fecha efectiva de la baja.\n\nUn saludo,\n[Tu nombre]\n[Email o número de cliente]`;
  if (mode === 'rebaja') return `Asunto: Revisión del precio de mi suscripción a ${n}\n\nHola:\n\nLlevo un tiempo como cliente de ${n} y pago ${amt}. Estoy revisando mis gastos y me estoy planteando darme de baja.\n\n${extra ? extra + '\n\n' : ''}Antes de decidir, me gustaría saber si podéis ofrecerme un precio mejor o algún plan más ajustado a mi uso. Si es así, me quedaría con mucho gusto.\n\nUn saludo,\n[Tu nombre]`;
  return `Asunto: Cambio a facturación anual en ${n}\n\nHola:\n\nActualmente pago ${amt} por ${n}. Me gustaría pasar a la modalidad de pago anual si sale más económica.\n\n${extra ? extra + '\n\n' : ''}¿Podéis indicarme el precio anual y cómo se aplicaría lo que ya he pagado este periodo?\n\nGracias,\n[Tu nombre]`;
}
async function claudeUse(name) { try { return window.claude && window.claude.use ? await window.claude.use(name) : null; } catch (e) { return null; } }
async function draftGo() {
  const body = $('#draftBody'); if (!body) return;
  const s = S.subs.find(x => x.id === body.dataset.id); const extra = $('#draftExtra').value.trim();
  const out = $('#draftOut'), st = $('#draftStatus'), go = $('#draftGo');
  const sample = await claudeUse('sample');
  if (!sample) { out.value = template(s, draftMode, extra); st.textContent = 'Claude no está disponible en esta vista; te dejo una plantilla.'; return; }
  const months = Math.max(0, Math.round((TODAY - pd(s.start)) / 86400000 / 30.44));
  const goal = { cancelar: 'solicitar la baja de la suscripción con efecto inmediato y pedir confirmación por escrito', rebaja: 'pedir una rebaja o un plan más barato, dejando caer con educación que se plantea darse de baja', anual: 'pedir pasar a facturación anual si es más barata y preguntar el precio' }[draftMode];
  const prompt = `Redacta en español de España un mensaje breve (máximo 150 palabras) para el servicio de atención al cliente de ${subLabel(s)}. Objetivo: ${goal}.
Datos: plan "${s.plan || 'no indicado'}", precio ${numES(s.amount)} € ${PERIODS[s.period].label.toLowerCase()}, cliente desde hace unos ${months} meses${s.status === 'prueba' ? ', está en periodo de prueba' : ''}.
${extra ? 'Detalle que aporta el usuario: ' + extra : ''}
Tono cordial y firme. Empieza con una línea "Asunto: ...". Deja [Tu nombre] y [Email o número de cliente] como marcadores. Devuelve solo el texto del mensaje.`;
  draftCtl && draftCtl.abort(); draftCtl = new AbortController();
  go.disabled = true; st.textContent = 'Redactando…'; out.value = '';
  try {
    const r = await sample(prompt, { signal: draftCtl.signal, modelTier: 'quick', onText: ({ text }) => { out.value = text; } });
    out.value = r.text; st.textContent = r.truncated ? 'El texto se ha cortado; revísalo.' : 'Listo. Revísalo antes de enviarlo.';
  } catch (e) {
    if (e && e.code === 'cancelled') return;
    out.value = template(s, draftMode, extra);
    st.textContent = e && e.code === 'rate_limited' ? 'Demasiadas peticiones; usa la plantilla o prueba en un rato.' : 'No se pudo usar Claude; te dejo una plantilla.';
  } finally { go.disabled = false; }
}

/* ---------- export / backup ---------- */
const csvCell = v => { v = String(v ?? ''); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const toCSV = rows => '﻿' + rows.map(r => r.map(csvCell).join(';')).join('\r\n');
const IN_CLAUDE = !!(window.claude && window.claude.use);
async function offerFile(filename, text) {
  if (!IN_CLAUDE) {
    const url = URL.createObjectURL(new Blob([text], { type: filename.endsWith('.json') ? 'application/json' : 'text/csv' }));
    const el = document.createElement('a'); el.href = url; el.download = filename; document.body.appendChild(el); el.click(); el.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000); toast('Descargado: ' + filename); return;
  }
  const dl = await claudeUse('downloads');
  if (dl) {
    try { await dl.save({ filename, data: text }); toast('Archivo listo: ' + filename); return; }
    catch (e) { if (e && e.code === 'declined') return; }
  }
  openModal(`<div class="modal-head"><h2>${esc(filename)}</h2><button class="btn ghost sm" data-act="close" aria-label="Cerrar">${lu('x', 18)}</button></div>
    <div class="modal-body"><p class="muted" style="margin:0">Las descargas no están disponibles en esta vista. Copia el contenido y pégalo en un archivo de texto con este nombre.</p><textarea id="exportBox" rows="14" readonly>${esc(text.replace(/^﻿/, ''))}</textarea></div>
    <div class="modal-foot"><button class="btn primary" data-act="copyExport">${lu('copy', 16)}Copiar</button></div>`);
}
function exportSubs() {
  const rows = [['Servicio', 'Plan', 'Cuenta', 'Categoría', 'Importe', 'Periodicidad', 'Equivalente mensual', 'Próximo cobro', 'Fecha de alta', 'Estado']];
  S.subs.filter(inAcc).forEach(s => rows.push([subLabel(s), s.plan, acc(s.account).name, (CATS[s.cat] || CATS.otros).n, numES(s.amount), PERIODS[s.period].label, numES(monthly(s)), fmtNum(s.next), fmtNum(s.start), s.status]));
  offerFile('wallet-suscripciones.csv', toCSV(rows));
}
function exportTx() {
  const rows = [['Fecha', 'Concepto', 'Importe', 'Cuenta', 'Categoría']];
  S.tx.filter(inAcc).forEach(t => rows.push([fmtNum(t.date), t.desc, numES(t.amount), acc(t.account).name, (CATS[t.cat] || CATS.otros).n]));
  offerFile('wallet-gastos.csv', toCSV(rows));
}
function restore(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (!Array.isArray(d.subs) || !Array.isArray(d.accounts)) throw 0;
      S = { ...blank(), ...d, v: 2, tx: (d.tx || []).filter(t => t.amount > 0 && t.cat !== 'traspaso').map(t => ({ ...t, cat: t.cat })) };
      syncCats();
      rollForward(); save(); render(); toast(`Copia restaurada: ${S.subs.length} suscripciones y ${S.tx.length} gastos.`);
    } catch (e) { toast('Ese archivo no es una copia de Wallet. Elige el .json que exportaste desde aquí.'); }
  };
  rd.readAsText(file);
}
async function copyText(el) { try { await navigator.clipboard.writeText(el.value); toast('Copiado.'); } catch (e) { el.focus(); el.select(); toast('Selecciona y copia con Ctrl/Cmd + C.'); } }

/* ---------- toast ---------- */
let toastT;
let toastFn = null;
function toast(msg, action) {
  clearTimeout(toastT); toastFn = action ? action.fn : null;
  $('#toastRoot').innerHTML = `<div class="toast" role="status"><span>${esc(msg)}</span>${action ? `<button class="btn sm" data-act="toastAct">${esc(action.label)}</button>` : ''}</div>`;
  toastT = setTimeout(() => { $('#toastRoot').innerHTML = ''; toastFn = null; }, action ? 7000 : 3500);
}

/* ---------- render ---------- */
function render() {
  renderBand(); renderTabs();
  const notice = loadState === 'fromBackup' ? `<div class="note">${lu('info', 16)}<span>No he encontrado tus datos principales en este navegador y he cargado la copia automática más reciente. Revisa que esté todo bien.</span></div>`
    : loadState === 'corrupt' ? `<div class="note">${lu('triangle-alert', 16)}<span>Los datos guardados estaban dañados. Los he apartado sin borrarlos; puedes restaurar una copia en Ajustes.</span></div>`
    : IN_CLAUDE && navigator.brave && !ui.braveOk ? `<div class="note">${lu('triangle-alert', 16)}<span><b>Estás usando Brave.</b> Con los escudos activados, Brave borra los datos de Wallet al cerrar las pestañas de claude.ai. Para que se queden en este ordenador, desactiva los escudos en claude.ai (icono del león) o usa la versión local de Wallet, y exporta una copia de vez en cuando. <button class="btn sm ghost" data-act="braveOk">Entendido</button></span></div>`
    : loadState === 'error' ? `<div class="note">${lu('triangle-alert', 16)}<span>Este navegador no deja leer el almacenamiento, así que no se guardará nada. Abre Wallet en una ventana normal.</span></div>` : '';
  $('#view').innerHTML = notice + { inicio: viewHome, suscripciones: viewSubs, gastos: viewTx, analisis: viewAnalysis, ajustes: viewSettings }[ui.tab]();
  try { localStorage.setItem(KEY + '.ui', JSON.stringify({ acc: ui.acc })); } catch (e) { }
}
function goto(tab) { ui.tab = tab; try { history.replaceState(null, '', '#' + tab); } catch (e) { } render(); window.scrollTo({ top: 0 }); }

/* ---------- events ---------- */
let wipeArmed = false, delArmed = null;
document.addEventListener('click', e => {
  if (e.target.closest('a')) return;
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, id = t.dataset.id;
  if (a === 'closeBg') { if (e.target === t) closeModal(); return; }
  if (t.tagName === 'SELECT' || t.tagName === 'INPUT') return;
  switch (a) {
    case 'goto': goto(t.dataset.tab); break;
    case 'acc': ui.acc = id; ui.txLimit = 80; render(); break;
    case 'set': ui[t.dataset.k] = t.dataset.v; render(); break;
    case 'add': pickFilter = { q: '', cat: '' }; openModal(pickerHTML()); break;
    case 'pickCat': pickFilter.cat = t.dataset.v; openModal(pickerHTML()); break;
    case 'pick': openEdit(newSub(t.dataset.v), true); break;
    case 'edit': { const s = S.subs.find(x => x.id === id); if (s) openEdit(s, false); break; }
    case 'close': closeModal(); break;
    case 'toastAct': { const f = toastFn; toastFn = null; $('#toastRoot').innerHTML = ''; f && f(); break; }
    case 'quickAdd': quickAdd(id); break;
    case 'quickEdit': ui.editQuick = !ui.editQuick; render(); break;
    case 'quickDel': S.quick = (S.quick || []).filter(q => q.id !== id); save(); render(); break;
    case 'migrate': migrate(); break;
    case 'migDismiss': S.migDismissed = true; save(); render(); break;
    case 'catAdd': openCat(null, t.dataset.k); break;
    case 'catEdit': openCat(id); break;
    case 'catSave': saveCat(); break;
    case 'cKind': catEdit.k = t.dataset.v; catEdit.n = $('#c-name').value; openModal(catHTML()); break;
    case 'cColor': catEdit.c = t.dataset.v; t.parentNode.querySelectorAll('.swatch').forEach(b => b.setAttribute('aria-pressed', b === t)); catPreview(); break;
    case 'cIcon': catEdit.i = t.dataset.v; t.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === t)); catPreview(); break;
    case 'catDel': {
      const cid = catEdit.id;
      if (delArmed !== cid) { delArmed = cid; t.classList.add('armed'); t.lastChild.textContent = 'Pulsa otra vez: lo que tenga pasa a «Otros»'; setTimeout(() => { delArmed = null; }, 4000); break; }
      S.subs.forEach(s => { if (s.cat === cid) s.cat = 'otros'; }); S.tx.forEach(x => { if (x.cat === cid) x.cat = 'otros'; });
      Object.keys(S.memo).forEach(k => { if (S.memo[k] === cid) delete S.memo[k]; });
      delete S.cats[cid]; delArmed = null; syncCats(); save(); closeModal(); render(); toast('Categoría eliminada.'); break;
    }
    case 'fRenew': $('#f-renew').value = t.dataset.v; t.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === t)); editing = readForm(); $('#f-hint span').textContent = hintFor(editing); break;
    case 'fStatus': $('#f-status').value = t.dataset.v; t.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === t)); editing = readForm(); $('#f-hint span').textContent = hintFor(editing); break;
    case 'fLogoDel': editing = { ...readForm(), logo: undefined }; openModal(editHTML(editing, !S.subs.some(x => x.id === editing.id))); break;
    case 'fColor': editing = { ...readForm(), color: t.dataset.v }; t.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === t)); $('#f-logo').innerHTML = subLogo(editing, 36); break;
    case 'saveSub': saveSub(); break;
    case 'delSub':
      if (delArmed !== id) { delArmed = id; t.classList.add('armed'); t.lastChild.textContent = 'Pulsa otra vez para eliminar'; setTimeout(() => { delArmed = null; }, 4000); break; }
      S.subs = S.subs.filter(s => s.id !== id); delArmed = null; save(); closeModal(); render(); toast('Suscripción eliminada.'); break;
    case 'draft': openDraft(id, t.dataset.mode); break;
    case 'draftMode': draftMode = t.dataset.v; t.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === t)); break;
    case 'draftGo': draftGo(); break;
    case 'draftTpl': { const s = S.subs.find(x => x.id === $('#draftBody').dataset.id); $('#draftOut').value = template(s, draftMode, $('#draftExtra').value.trim()); $('#draftStatus').textContent = 'Plantilla lista para editar.'; break; }
    case 'copyDraft': copyText($('#draftOut')); break;
    case 'copyExport': copyText($('#exportBox')); break;
    case 'txEdit': ui.editTx = id; render(); $('#t-desc').focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'txCancel': ui.editTx = null; render(); break;
    case 'txDel': {
      const x = S.tx.find(v => v.id === id); if (!x) break;
      if (delArmed !== id) { delArmed = id; t.classList.add('danger', 'armed'); t.setAttribute('aria-label', 'Pulsa otra vez para eliminar'); setTimeout(() => { if (delArmed === id) { delArmed = null; t.classList.remove('danger', 'armed'); } }, 3000); toast('Pulsa otra vez la papelera para eliminar «' + x.desc + '».'); break; }
      S.tx = S.tx.filter(v => v.id !== id); delArmed = null; if (ui.editTx === id) ui.editTx = null; save(); render(); toast('Gasto eliminado.'); break;
    }
    case 'more': ui.txLimit += 200; render(); break;
    case 'exportTx': exportTx(); break;
    case 'exportSubs': exportSubs(); break;
    case 'exportJson': offerFile('wallet-copia.json', JSON.stringify(S, null, 2)); break;
    case 'addRec': { const r = detectRecurring(S.tx).find(x => x.key === t.dataset.key); if (r) { const s = newSub(null, { name: title(r.name), amount: r.amount, account: r.account, start: r.first, next: addPeriod(r.last, 'mensual') }); rollForward.call(null); openEdit(s, true); } break; }
    case 'accColor': acc(id).color = t.dataset.v; save(); render(); break;
    case 'accIcon': acc(id).icon = t.dataset.v; save(); render(); break;
    case 'bakRestore': {
      const x = readBackups().find(b => String(b.at) === id); if (!x) break;
      if (delArmed !== 'bak' + id) { delArmed = 'bak' + id; t.classList.add('danger', 'armed'); t.textContent = 'Pulsa otra vez para restaurar'; setTimeout(() => { delArmed = null; }, 4000); break; }
      delArmed = null; S = { ...blank(), ...x.data }; syncCats(); rollForward(); save(); render(); toast(`Copia restaurada: ${(S.subs || []).length} suscripciones y ${(S.tx || []).length} gastos.`); break;
    }
    case 'braveOk': ui.braveOk = true; render(); break;
    case 'wipe':
      if (!wipeArmed) { wipeArmed = true; t.classList.add('armed'); t.lastChild.textContent = 'Pulsa otra vez para borrarlo todo'; setTimeout(() => { wipeArmed = false; const b = $('#wipeBtn'); if (b) { b.classList.remove('armed'); b.lastChild.textContent = 'Borrar todos los datos'; } }, 4000); break; }
      wipeArmed = false; S = { ...blank(), accounts: S.accounts, alertDays: S.alertDays, cats: S.cats, hMax: S.hMax, hMin: S.hMin }; syncCats(); save(); render(); toast('Datos borrados. Se conservan los nombres de tus cuentas.'); break;
    default: if (window.extraAct) window.extraAct(a, t, id);
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'txCat') { ui.txCat = t.value; render(); return; }
  if (t.id === 'alertDays') { S.alertDays = +t.value; save(); render(); return; }
  if (t.id === 'hMin') { S.hMin = +t.value; save(); return; }
  if (t.id === 'hMax') { const v = parseAmount(t.value); if (v > 0) { S.hMax = v; save(); toast('Guardado: gastos de ' + eur(v) + ' o menos.'); } else toast('Escribe un importe mayor que 0.'); return; }
  if (t.id === 'c-color') { catEdit.c = t.value.toUpperCase(); t.parentNode.style.background = t.value; $('#catForm').querySelectorAll('.swatch[data-v]').forEach(b => b.setAttribute('aria-pressed', 'false')); catPreview(); return; }
  if (t.id === 'restoreFile' && t.files[0]) { restore(t.files[0]); return; }
  if (t.id === 'f-logofile' && t.files[0]) {
    const f = t.files[0]; if (f.size > 5e6) { toast('La imagen es demasiado grande (máximo 5 MB).'); return; }
    const url = URL.createObjectURL(f); const img = new Image();
    img.onload = () => {
      const S2 = 96, cv = document.createElement('canvas'); cv.width = cv.height = S2; const cx = cv.getContext('2d');
      const w = img.naturalWidth || S2, h = img.naturalHeight || S2, k = Math.min(S2 / w, S2 / h) * .9;
      cx.drawImage(img, (S2 - w * k) / 2, (S2 - h * k) / 2, w * k, h * k); URL.revokeObjectURL(url);
      let data; try { data = cv.toDataURL('image/png'); } catch (e) { toast('No he podido leer esa imagen. Prueba con un PNG.'); return; }
      editing = { ...readForm(), logo: data }; openModal(editHTML(editing, !S.subs.some(x => x.id === editing.id)));
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('No he podido leer esa imagen. Prueba con un PNG o JPG.'); };
    img.src = url; return;
  }
  if (t.dataset.act === 'accName') { render(); return; }
  if (t.closest && t.closest('#subForm') && ['f-amt', 'f-per', 'f-next'].includes(t.id)) { editing = readForm(); $('#f-hint span').textContent = hintFor(editing); }
  if (t.id === 'f-name' && editing && !editing.service) { editing = readForm(); $('#f-logo').innerHTML = subLogo(editing, 36); }
});
let qT;
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'txQ') { clearTimeout(qT); qT = setTimeout(() => { ui.txQ = t.value; const pos = t.selectionStart; render(); const n = $('#txQ'); n.focus(); n.setSelectionRange(pos, pos); }, 250); }
  if (t.id === 'pickQ') { pickFilter.q = t.value; const q = norm(t.value); $('#pickGrid').querySelectorAll('.cat-item').forEach(b => { const c = CAT_BY_ID[b.dataset.v]; b.hidden = !!(c && q && !norm(c.n).includes(q)); }); }
  if (t.id === 't-desc' && !ui.editTx) { const c = guessCat(t.value); if (c && CATS[c] && CATS[c].k !== 'sub') $('#t-cat').value = c; }
  if (t.dataset.act === 'accName') { const a = acc(t.dataset.id); a.name = t.value.trim() || a.name; save(); renderBand(); }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'subForm') { e.preventDefault(); saveSub(); }
  if (e.target.id === 'txForm') { e.preventDefault(); saveTx(); }
  if (e.target.id === 'catForm') { e.preventDefault(); saveCat(); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#modalRoot').innerHTML) closeModal();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('sub')) { e.preventDefault(); e.target.click(); }
});

/* ---------- boot ---------- */
load(); syncCats(); rollForward();
try { const u = JSON.parse(localStorage.getItem(KEY + '.ui') || '{}'); if (u.acc && (u.acc === 'all' || S.accounts.some(a => a.id === u.acc))) ui.acc = u.acc; } catch (e) { }
const h0 = (location.hash || '').slice(1); if (TABS.some(t => t[0] === h0)) ui.tab = h0;
render();
