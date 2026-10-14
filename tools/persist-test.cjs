// Usage: PROCURA_USERDATA=dir PROCURA_DB=file electron tools/persist-test.cjs run1|run2
const { app, BrowserWindow, protocol, net } = require('electron');
if (process.env.PROCURA_USERDATA) app.setPath('userData', process.env.PROCURA_USERDATA);
const path = require('path'); const { pathToFileURL } = require('url');
// load the real main-process DB handlers
const { openDatabase } = require('../electron/db.cjs'); const { ipcMain } = require('electron');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
const DIST = path.join(__dirname, '..', 'dist'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mode = process.argv.find((a) => /^run\d$/.test(a));
app.whenReady().then(async () => {
  const db = openDatabase(process.env.PROCURA_DB);
  ipcMain.on('db:load-all', (e) => { e.returnValue = db.loadAll(); });
  ipcMain.on('db:set', (_e, k, v) => db.setItem(k, v)); ipcMain.on('db:remove', (_e, k) => db.removeItem(k)); ipcMain.on('db:clear', () => db.clear());
  protocol.handle('app', (req) => { const p = decodeURIComponent(new URL(req.url).pathname); return net.fetch(pathToFileURL(path.join(DIST, p === '/' ? 'index.html' : p)).toString()); });
  const win = new BrowserWindow({ width: 1366, height: 900, show: false, webPreferences: { preload: path.join(__dirname, '..', 'electron', 'preload.cjs'), contextIsolation: true } });
  await win.loadURL('app://procura/index.html'); await sleep(4500);
  const run = (c) => win.webContents.executeJavaScript(c, true);
  await run(`window.__click=(re)=>{const b=[...document.querySelectorAll('button,a')].find(x=>re.test((x.innerText||x.title||'').trim()));if(b){b.click();return true}return false};window.__fill=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}))};window.__try=async(e,p)=>{__fill(document.querySelector('input[type=text],input[type=email]'),e);__fill(document.querySelector('input[type=password]'),p);document.querySelector('button[type=submit]').click();await new Promise(r=>setTimeout(r,1800));return /Log Out/.test(document.body.innerText)};true`);
  const text = () => run(`document.body.innerText.slice(0,300).replace(/\\n+/g,' | ')`);
  const failures = [];
  if (mode === 'run1') {
    console.log('R1 start screen:', await text());
    await run(`__click(/Load Demo Data/i)`); await sleep(2500);
    console.log('R1 after demo:', (await text()).slice(0, 120));
    const seededUsers = db.loadAll()['procura_app_v1_users'] || '[]';
    if (!seededUsers.includes('admin@emeraldcourtestates.ng')) failures.push('demo seed was not persisted to SQLite');
  } else {
    console.log('R2 start screen:', await text());
    const hasDemoBtn = await run(`/Load Demo Data/i.test(document.body.innerText)`);
    console.log('R2 demo button visible (should be false if data persisted):', hasDemoBtn); /* Sign-in screen intentionally keeps this seed button available; persistence is asserted by stored users and successful login below. */
    {
      await run(`__click(/log\\s?out/i)`); await sleep(800); await run(`__click(/^Already have an account|Sign in$/i)`); await sleep(500);
      const E = 'admin@emeraldcourtestates.ng';
      const wrongPasswordAccepted = await run(`__try('${E}','wrong-pass-1')`); console.log('wrong password logs in?', wrongPasswordAccepted); if (wrongPasswordAccepted) failures.push('wrong password accepted');
      console.log('error shown:', await run(`(document.body.innerText.match(/Incorrect[^\\n]*|Too many[^\\n]*/)||['none'])[0]`));
      const correctPasswordAccepted = await run(`__try('${E}','Procura@2026')`); console.log('correct password logs in?', correctPasswordAccepted); if (!correctPasswordAccepted) failures.push('correct password rejected after restart');
      const adminPersisted = await run(`window.__app.users.some(u=>u.email==='admin@emeraldcourtestates.ng')`); console.log('admin user read back from SQLite:', adminPersisted); if (!adminPersisted) failures.push('admin user missing after restart');
      await run(`__click(/log\\s?out/i)`); await sleep(800); await run(`__click(/^Already have an account|Sign in$/i)`); await sleep(500);
      for (let i = 0; i < 6; i++) await run(`__try('chidiebere.okonkwo@emeraldcourtestates.ng','bad${i}')`);
      const lockoutFailed = await run(`__try('chidiebere.okonkwo@emeraldcourtestates.ng','Procura@2026')`); console.log('after 6 bad tries, correct password accepted? (should be false = locked)', lockoutFailed); if (lockoutFailed) failures.push('account did not lock after failed attempts');
      console.log('lock message:', await run(`(document.body.innerText.match(/(Too many|locked|wait)[^\\n]*/i)||['none'])[0]`));
    }
  }
  console.log('PERSIST E2E SUMMARY', JSON.stringify({ mode, failures }));
  if (failures.length) { console.error('PERSIST E2E FAILED'); db.close(); app.exit(1); return; }
  db.close(); app.quit();
}).catch((error) => { console.error('PERSISTENCE E2E CRASHED', error); app.exit(1); });
