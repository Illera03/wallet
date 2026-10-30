// End-to-end test of Drive sync with a fake Google Drive (no network, no real account).
// Usage: npm i -D playwright && npx playwright install chromium && node tools/test-sync.mjs
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const assert = (c, m) => { if (!c) { console.error('FALLO:', m); process.exitCode = 1; } else console.log('ok -', m); };
const D=path.join(path.dirname(fileURLToPath(import.meta.url)),'..')+'/';
const b = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}); const errs=[];
// fake Drive
let files={}, nextId=1; const log=[];
async function drive(route){ const r=route.request(); const u=new URL(r.url()); log.push(r.method()+' '+u.pathname);
  const json=(o)=>route.fulfill({contentType:'application/json',body:JSON.stringify(o)});
  if(u.pathname==='/drive/v3/files' && r.method()==='GET'){ const q=u.searchParams.get('q'); const isFolder=q.includes('folder'); return json({files:Object.entries(files).filter(([,f])=>isFolder?f.folder:!f.folder && q.includes(f.name)).map(([id])=>({id}))}); }
  if(u.pathname==='/drive/v3/files' && r.method()==='POST'){ const id='f'+nextId++; files[id]={folder:true,...JSON.parse(r.postData())}; return json({id}); }
  let m=u.pathname.match(/^\/drive\/v3\/files\/(\w+)$/); if(m){ if(u.searchParams.get('alt')==='media') return route.fulfill({contentType:'application/json',body:files[m[1]].content}); return json({id:m[1],trashed:false}); }
  if(u.pathname==='/upload/drive/v3/files' && r.method()==='POST'){ const id='f'+nextId++; const body=r.postData(); const parts=body.split(/--wallet\d+/); files[id]={name:'wallet-datos.json',content:parts[2].split('\r\n\r\n')[1].trim()}; return json({id}); }
  m=u.pathname.match(/^\/upload\/drive\/v3\/files\/(\w+)$/); if(m){ files[m[1]].content=r.postData(); return json({id:m[1]}); }
  return route.fulfill({status:404,body:'?'});
}
async function device(name){
  const ctx=await b.newContext({viewport:{width:name==='phone'?400:1280,height:900}});
  await ctx.route('http://app.test/**', r=>{ const u=new URL(r.request().url()); let f=u.pathname.replace('/wallet/','')||'index.html'; if(f==='config.js') return r.fulfill({body:"window.WALLET_CONFIG={googleClientId:'test.apps.googleusercontent.com'}",contentType:'text/javascript'}); const fp=path.join(D,f); if(!fs.existsSync(fp)) return r.fulfill({status:404}); r.fulfill({body:fs.readFileSync(fp),contentType:f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'application/json'}); });
  await ctx.route('https://www.googleapis.com/**', drive);
  await ctx.route('https://accounts.google.com/**', r=>{ const u=new URL(r.request().url()); const st=u.searchParams.get('state'); r.fulfill({contentType:'text/html',body:`<script>location.replace(${JSON.stringify(u.searchParams.get('redirect_uri')+'#access_token=TOK&expires_in=3600&token_type=Bearer&state='+st)})</script>`}); });
  await ctx.addInitScript(()=>{ window.WALLET_CONFIG={googleClientId:'test.apps.googleusercontent.com'}; });
  const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(name+': '+e.message));
  return p;
}
// Device 1: computer, choose Drive at welcome
const pc=await device('pc'); await pc.goto('http://app.test/wallet/');
assert(!!(await pc.$('[data-act=chooseDrive]')), 'pregunta dónde guardar al primer arranque');
await pc.click('[data-act=chooseDrive]'); await pc.waitForTimeout(1500);
assert((await pc.innerText('#privacyPill')).includes('al día'), 'conecta con Drive tras el login');
await pc.evaluate(()=>{ S.tx.push({id:'x1',date:todayISO,desc:'Cena',amount:30,cat:'restaurantes',account:'a1'}); save(); });
await pc.waitForTimeout(2200);
assert(JSON.parse(Object.values(files).find(f=>!f.folder).content).tx.length===1, 'sube un gasto nuevo a Drive');
// Device 2: phone, choose Drive -> should adopt remote
const ph=await device('phone'); await ph.goto('http://app.test/wallet/'); await ph.click('[data-act=chooseDrive]'); await ph.waitForTimeout(1000);
assert(await ph.evaluate(()=>S.tx.length)===1, 'el segundo dispositivo descarga los datos de Drive');
await ph.evaluate(()=>{ S.tx.push({id:'x2',date:todayISO,desc:'Bus',amount:13.15,cat:'transporte',account:'a1'}); save(); }); await ph.waitForTimeout(2200);
// pc focus -> pulls
await pc.evaluate(()=>syncNow('focus')); await pc.waitForTimeout(500);
assert(await pc.evaluate(()=>S.tx.length)===2, 'el primero recibe el cambio del segundo');
// conflict
await pc.evaluate(()=>{ S.tx.push({id:'x3',date:todayISO,desc:'A',amount:1,cat:'otros',account:'a1'}); localStorage.setItem('wallet.v2',JSON.stringify({...S,_updated:Date.now()})); S._updated=Date.now(); });
await ph.evaluate(()=>{ S.tx.push({id:'x4',date:todayISO,desc:'B',amount:2,cat:'otros',account:'a1'}); save(); }); await ph.waitForTimeout(2200);
await pc.evaluate(()=>syncNow('focus')); await pc.waitForTimeout(500);
assert(!!(await pc.$('[data-act=useRemote]')), 'con cambios en ambos lados pregunta qué versión usar');
await pc.click('[data-act=useRemote]'); assert(await pc.evaluate(()=>S.tx.map(t=>t.id).join(','))==='x1,x2,x4', 'usar Drive aplica la versión remota'); assert(await pc.evaluate(()=>readBackups().length)>=1, 'la versión descartada queda en copias automáticas');
assert(!errs.length, 'sin errores de JavaScript ' + errs.join(' | ')); await b.close();
