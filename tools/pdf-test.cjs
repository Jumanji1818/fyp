const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path'); const fs = require('fs'); const { pathToFileURL } = require('url');
require('./dbstub.cjs');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
const DIST = path.join(__dirname, '..', 'dist'); const errs = []; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { ipcMain, dialog, shell } = require('electron');
app.whenReady().then(async () => {
  // reuse the real handler from main.cjs by requiring it would start the app; replicate by loading the module's handler
  protocol.handle('app', (req) => { const p = decodeURIComponent(new URL(req.url).pathname); return net.fetch(pathToFileURL(path.join(DIST, p === '/' ? 'index.html' : p)).toString()); });
  ipcMain.handle('save-pdf', async (event) => { const data = await event.sender.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true }); fs.writeFileSync(process.env.PROCURA_TEST_PDF, data); return { path: process.env.PROCURA_TEST_PDF }; });
  const win = new BrowserWindow({ width: 1366, height: 820, show: false, webPreferences: { preload: path.join(__dirname, '..', 'electron', 'preload.cjs'), contextIsolation: true } });
  win.webContents.on('console-message', (_e, level, msg) => { if (level >= 2 && !/Electron Security Warning|Insecure Content-Security-Policy/.test(msg)) errs.push(msg.slice(0, 200)); });
  await win.loadURL('app://procura/index.html'); await sleep(4500);
  const run = (c) => win.webContents.executeJavaScript(c, true);
  await run(`window.__click=(re)=>{const b=[...document.querySelectorAll('button,a')].find(x=>re.test((x.innerText||x.title||'').trim()));if(b){b.click();return true}return false};window.__fill=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}))};true`);
  await run(`__click(/Load Demo Data/i)`); await sleep(1500);
  await run(`__click(/log\\s?out/i)`); await sleep(800); await run(`__click(/^Already have an account|Sign in$/i)`); await sleep(500);
  await run(`(()=>{__fill(document.querySelector('input[type=text],input[type=email]'),'chidiebere.okonkwo@emeraldcourtestates.ng');__fill(document.querySelector('input[type=password]'),'Procura@2026');document.querySelector('button[type=submit]').click();return true})()`); await sleep(1500);
  const tab = process.env.TAB || 'Award Contract Decisions';
  await run(`__click(/^\\s*Menu\\s*$/i)`); await sleep(400);
  await run(`(()=>{[...document.querySelectorAll('aside nav button')].find(x=>(x.innerText||'').trim()===${JSON.stringify(tab)}).click();return true})()`); await sleep(1200);
  console.log('award letter btn:', await run(`__click(/View Award Letter/i)`)); await sleep(800);
  console.log('buttons in modal:', JSON.stringify(await run(`[...document.querySelectorAll('button')].map(b=>(b.innerText||'').trim()).filter(t=>/print|save|download|pdf/i.test(t))`)));
  console.log('print click:', await run(`__click(/Print \\/ Save PDF/i)`)); await sleep(3500);
  console.log('pdf exists:', fs.existsSync(process.env.PROCURA_TEST_PDF));
  const appVisible = await run(`!!document.querySelector('#root') && getComputedStyle(document.querySelector('#root')).display!=='none' && document.getElementById('print-root').innerHTML==='' `);
  console.log('app visible after:', appVisible);
  const pdfExists = fs.existsSync(process.env.PROCURA_TEST_PDF);
  const pdfBytes = pdfExists ? fs.statSync(process.env.PROCURA_TEST_PDF).size : 0;
  const failures = [];
  if (!pdfExists || pdfBytes < 1000) failures.push('PDF output missing or too small');
  if (!appVisible) failures.push('app did not return to the visible normal screen');
  if (errs.length) failures.push('renderer console errors');
  console.log('PDF E2E SUMMARY', JSON.stringify({ pdfExists, pdfBytes, appVisible, failures }));
  if (failures.length) { console.error('PDF E2E FAILED'); app.exit(1); return; }
  app.quit();
}).catch((error) => { console.error('PDF E2E CRASHED', error); app.exit(1); });
