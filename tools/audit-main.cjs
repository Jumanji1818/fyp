// Dev-only audit harness (not shipped): drives the real app through every role and screen.
const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path'); const fs = require('fs'); const { pathToFileURL } = require('url');
require('./dbstub.cjs');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
const DIST = path.join(__dirname, '..', 'dist');
const USERS = (process.env.AUDIT_USERS || 'admin@emeraldcourtestates.ng,blessing.adeyemi@emeraldcourtestates.ng,fatima.mohammed@emeraldcourtestates.ng,chidiebere.okonkwo@emeraldcourtestates.ng,folake.oshodi@emeraldcourtestates.ng,babatunde.adeleke@emeraldcourtestates.ng,musa@apexholdings.ng,hussain@husabdesign.ng').split(',');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
app.whenReady().then(async () => {
  protocol.handle('app', (req) => { const p = decodeURIComponent(new URL(req.url).pathname); return net.fetch(pathToFileURL(path.join(DIST, p === '/' ? 'index.html' : p)).toString()); });
  const win = new BrowserWindow({ width: 1366, height: 820, show: false, webPreferences: { preload: path.join(__dirname, '..', 'electron', 'preload.cjs'), contextIsolation: true } });
  const report = [];
  const consoleErrs = [];
  win.webContents.on('console-message', (_e, level, msg) => { if (level >= 2 && !/Electron Security Warning/.test(msg)) consoleErrs.push(msg.slice(0, 300)); });
  await win.loadURL('app://procura/index.html'); await sleep(4500);
  const run = (code) => win.webContents.executeJavaScript(code, true);
  await run(`window.__click=(re,scope)=>{const bs=[...(scope||document).querySelectorAll('button,a,[role=button]')];const b=bs.find(x=>re.test((x.innerText||x.title||'').trim()));if(b){b.click();return true}return false};
    window.__fill=(el,v)=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}))};true;`);
  console.log('demo click:', await run(`__click(/Load Demo Data/i)`)); await sleep(1500);
  for (const email of USERS) {
    const entry = { email, tabs: [] };
    // logout if authenticated
    await run(`__click(/log\\s?out|sign\\s?out/i)`); await sleep(800);
    await run(`__click(/^Already have an account|Sign in$/i)`); await sleep(500);
    const filled = await run(`(()=>{const e=document.querySelector('input[type=text],input[type=email]');const p=document.querySelector('input[type=password]');if(!e||!p)return false;__fill(e,${JSON.stringify(email)});__fill(p,'Procura@2026');document.querySelector('button[type=submit]').click();return true})()`);
    await sleep(1500);
    if (process.env.AUDIT_DEBUG) { console.log('BODY>>', (await run(`document.body.innerText.slice(0,500)`)).replace(/\n+/g,' | ')); }
    entry.loggedIn = await run(`/Log Out/.test(document.body.innerText)`);
    if (!entry.loggedIn) { entry.note = 'login failed (filled=' + filled + ')'; report.push(entry); continue; }
    entry.who = await run(`(document.body.innerText.match(/(Organization Admin|Request Officer|Department Head|Procurement Officer|Finance Officer|Approving Authority|Vendor)/)||[''])[0] + ' | ' + (document.body.innerText.match(/Good (morning|afternoon|evening),[^\\n]*/)||[''])[0]`);
    const openMenu = async () => { await run(`__click(/^\\s*Menu\\s*$/i)`); await sleep(400); };
    await openMenu();
    const labels = await run(`[...document.querySelectorAll('aside nav button')].map(b=>(b.innerText||'').trim()).filter(Boolean)`);
    await run(`document.querySelector('aside button[title*="Close"]')?.click(); true`); await sleep(300);
    entry.nav = labels;
    for (const label of labels) {
      const before = consoleErrs.length;
      await openMenu();
      await run(`(()=>{const b=[...document.querySelectorAll('aside nav button')].find(x=>(x.innerText||'').trim()===${JSON.stringify(label)});b&&b.click();return true})()`);
      await sleep(900);
      const info = await run(`(()=>{const t=(document.querySelector('main')||document.body).innerText;const m=t.match(/.{0,40}(\\bundefined\\b|\\bNaN\\b|\\[object|\\bnull\\b|Invalid Date|something went wrong).{0,40}/);return {len:t.length,err:m?m[0].replace(/\\n/g,' '):''}})()`);
      const img = await win.webContents.capturePage();
      const f = `/tmp/shots/${email.split('@')[0]}__${label.replace(/[^a-z0-9]+/gi, '_')}.png`; fs.writeFileSync(f, img.toPNG());
      entry.tabs.push({ label, textLen: info.len, suspiciousText: info.err, newConsoleErrors: consoleErrs.slice(before) });
    }
    report.push(entry);
  }
  fs.writeFileSync('/tmp/audit.json', JSON.stringify({ report, consoleErrs }, null, 2));
  console.log('AUDIT DONE'); app.quit();
});
