const { app, BrowserWindow, protocol, net } = require('electron');
if (process.env.PROCURA_USERDATA) app.setPath('userData', process.env.PROCURA_USERDATA);
const path = require('path'); const { pathToFileURL } = require('url'); const { ipcMain } = require('electron');
const { openDatabase } = require('../electron/db.cjs');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
const DIST = path.join(__dirname, '..', 'dist'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
app.whenReady().then(async () => {
  const db = openDatabase(process.env.PROCURA_DB);
  ipcMain.on('db:load-all', (e) => { e.returnValue = db.loadAll(); }); ipcMain.on('db:set', (_e, k, v) => db.setItem(k, v)); ipcMain.on('db:remove', (_e, k) => db.removeItem(k)); ipcMain.on('db:clear', () => db.clear());
  protocol.handle('app', (req) => { const p = decodeURIComponent(new URL(req.url).pathname); return net.fetch(pathToFileURL(path.join(DIST, p === '/' ? 'index.html' : p)).toString()); });
  const win = new BrowserWindow({ width: 1366, height: 900, show: false, webPreferences: { preload: path.join(__dirname, '..', 'electron', 'preload.cjs'), contextIsolation: true } });
  const errs = []; win.webContents.on('console-message', (_e, l, m) => { if (l >= 2 && !/Security Warning/.test(m)) errs.push(m.slice(0, 200)); });
  await win.loadURL('app://procura/index.html'); await sleep(4500);
  const run = (c) => win.webContents.executeJavaScript(c, true);
  await run(`window.__click=(re)=>{const b=[...document.querySelectorAll('button,a')].find(x=>re.test((x.innerText||x.title||'').trim()));if(b){b.click();return true}return false};true`);
  await run(`__click(/Load Demo Data/i)`); await sleep(2000);
  const results = [];
  const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  -> ' + extra : '')); };
  const call = async (expr, wait = 400) => { const r = await run(`(async()=>{const A=window.__app;const r=await (${expr});return JSON.parse(JSON.stringify(r===undefined?null:r))})()`); await sleep(wait); return r; };
  const ADMIN = 'admin@emeraldcourtestates.ng';

  // --- login basics
  check('demo admin logs in with documented demo password', (await call(`A.login('${ADMIN}','Procura@2026')`)).success === true);
  await call(`A.logout()`);
  check('wrong password rejected', (await call(`A.login('${ADMIN}','nope')`)).success === false);
  check('empty password rejected', (await call(`A.login('${ADMIN}','')`)).success === false);
  await call(`A.login('${ADMIN}','Procura@2026')`, 800);

  // --- provision staff -> temp password -> forced change
  const prov = await call(`A.provisionStaffUser({fullName:'Test Officer',email:'test.officer@emeraldcourtestates.ng',phone:'0800',role:'Procurement Officer'})`, 800);
  check('provisioning returns a temporary password', prov.success && prov.tempPassword && prov.tempPassword.length >= 8, prov.tempPassword);
  const stored = await run(`JSON.stringify(window.__app.users.find(u=>u.email==='test.officer@emeraldcourtestates.ng'))`);
  check('provisioned user has hash+salt and NO plaintext password/tempPassword', /passwordHash/.test(stored) && !/"password":|"tempPassword":"/.test(stored) && !stored.includes(prov.tempPassword));
  check('duplicate email provisioning rejected', (await call(`A.provisionStaffUser({fullName:'Dup',email:'test.officer@emeraldcourtestates.ng',phone:'1',role:'Procurement Officer'})`)).success === false);
  await call(`A.logout()`);
  const tl = await call(`A.login('test.officer@emeraldcourtestates.ng','${prov.tempPassword}')`, 800);
  check('temp password logs in and demands a change', tl.success && tl.mustChangePassword === true);
  check('change rejected with wrong current password', (await call(`A.changeTempPassword(A.currentUser.id,'wrong','NewPass123')`)).success === false);
  check('change rejected for weak new password', (await call(`A.changeTempPassword(A.currentUser.id,'${prov.tempPassword}','short')`)).success === false);
  check('change rejected when same as temporary', (await call(`A.changeTempPassword(A.currentUser.id,'${prov.tempPassword}','${prov.tempPassword}')`)).success === false);
  check('change accepted with strong new password', (await call(`A.changeTempPassword(A.currentUser.id,'${prov.tempPassword}','Better#Pass9')`, 800)).success === true);
  await call(`A.logout()`);
  check('old temporary password no longer works', (await call(`A.login('test.officer@emeraldcourtestates.ng','${prov.tempPassword}')`)).success === false);
  const nl = await call(`A.login('test.officer@emeraldcourtestates.ng','Better#Pass9')`, 800);
  check('new password works and no further change demanded', nl.success && !nl.mustChangePassword);
  await call(`A.logout()`);

  // --- admin reset
  await call(`A.login('${ADMIN}','Procura@2026')`, 800);
  const uid = await run(`window.__app.users.find(u=>u.email==='test.officer@emeraldcourtestates.ng').id`);
  const temp2 = await call(`A.adminResetUserPassword('${uid}')`, 800);
  check('admin reset returns a new temporary password', typeof temp2 === 'string' && temp2.length >= 8, temp2);
  await call(`A.logout()`);
  check('previous password invalid after admin reset', (await call(`A.login('test.officer@emeraldcourtestates.ng','Better#Pass9')`)).success === false);
  check('temporary password from reset works (must change)', (await call(`A.login('test.officer@emeraldcourtestates.ng','${temp2}')`, 800)).mustChangePassword === true);
  await call(`A.logout()`);
  check('non-admin cannot reset passwords', (await (async()=>{ await call(`A.login('chidiebere.okonkwo@emeraldcourtestates.ng','Procura@2026')`, 800); const r = await call(`A.adminResetUserPassword('${uid}')`); await call(`A.logout()`); return r; })()) === null);

  // --- security-question reset (demo user has a seeded plaintext answer)
  const q = await run(`JSON.stringify(window.__app.users.filter(u=>u.securityQuestion).map(u=>[u.email,u.securityAnswer]).slice(0,1))`);
  const [[qEmail, qAns]] = JSON.parse(q);
  check('reset with wrong security answer rejected', (await call(`A.resetPasswordWithAnswer('${qEmail}','totally wrong','Fresh#Pass1')`)).success === false);
  check('reset with right answer but weak password rejected', (await call(`A.resetPasswordWithAnswer('${qEmail}','${qAns}','abc')`)).success === false);
  check('reset with right answer + strong password accepted', (await call(`A.resetPasswordWithAnswer('${qEmail}','${qAns}','Fresh#Pass1')`, 800)).success === true);
  check('user can sign in with the reset password', (await call(`A.login('${qEmail}','Fresh#Pass1')`, 800)).success === true);
  await call(`A.logout()`);

  // --- self-registration: staff
  const reg = await call(`A.registerStaffAccount({fullName:'New Hire',email:'new.hire@emeraldcourtestates.ng',phone:'0801',departmentId:A.departments[0].id,securityQuestion:'Pet?',securityAnswer:'Rex',password:'Hire#Pass123'})`, 800);
  check('staff self-registration succeeds', reg.success === true);
  const sh = await run(`JSON.stringify(window.__app.users.find(u=>u.email==='new.hire@emeraldcourtestates.ng'))`);
  check('registered staff is Pending, hashed password, hashed security answer, no plaintext', /"status":"Pending"/.test(sh) && /passwordHash/.test(sh) && /securityAnswerHash/.test(sh) && !/Rex|Hire#Pass123/.test(sh));
  check('weak password rejected at registration', (await call(`A.registerStaffAccount({fullName:'X',email:'x1@e.ng',phone:'1',password:'123'})`)).success === false);
  check('duplicate email rejected at registration', (await call(`A.registerStaffAccount({fullName:'X',email:'NEW.HIRE@emeraldcourtestates.ng',phone:'1',password:'Hire#Pass123'})`)).success === false);
  const pl = await call(`A.login('new.hire@emeraldcourtestates.ng','Hire#Pass123')`);
  check('pending account cannot enter until approved', pl.success === false, pl.error);

  // --- vendor registration
  const v = await call(`A.registerVendorAccount({id:'vendor-t1',userId:'user-vendor-t1',businessName:'Test Supplies Ltd',cacNumber:'RC1',taxId:'T1',yearEstablished:'2020',address:'x',state:'FCT',phone:'1',email:'a@b.ng',contactPerson:'Ada',categories:['Electrical'],subcategories:[],documents:[],inMyVendors:false,status:'Registered',reliabilityScore:60,onTimeDeliveries:0,lateDeliveries:0,rejections:0,totalOrders:0,totalValueAwarded:0},{id:'user-vendor-t1',fullName:'Ada',email:'ada@testsupplies.ng',phone:'1',role:'Vendor',vendorId:'vendor-t1',status:'Active',securityQuestion:'City?',securityAnswer:'Abuja',createdAt:new Date().toISOString()},'Vendor#Pass77')`, 800);
  check('vendor registration succeeds and signs the vendor in', v.success === true && (await run(`window.__app.currentUser && window.__app.currentUser.email==='ada@testsupplies.ng'`)));
  check('vendor persisted (state + hashed)', await run(`window.__app.vendors.some(x=>x.id==='vendor-t1') && /passwordHash/.test(JSON.stringify(window.__app.users.find(u=>u.id==='user-vendor-t1')))`));
  await call(`A.logout()`);
  check('vendor signs in with chosen password', (await call(`A.login('ada@testsupplies.ng','Vendor#Pass77')`, 600)).success === true);
  await call(`A.logout()`);

  // --- organisation registration
  const orgArgs = (email, pw) => `A.registerOrganization({name:'Acme Ltd',type:'enterprise',industry:'Tech',address:'a',phone:'1',email:'o@acme.ng'},{fullName:'Boss',email:'${email}',phone:'1',password:'${pw}'})`;
  check('org registration rejects weak password', (await call(orgArgs('boss@acme.ng','abc'))).success === false);
  check('org registration rejects an existing email', (await call(orgArgs(ADMIN,'Strong#Pass1'))).success === false);
  check('org registration accepts valid details', (await call(orgArgs('boss@acme.ng','Strong#Pass1'), 800)).success === true);
  await call(`A.logout()`);
  check('new org admin signs in with their password', (await call(`A.login('boss@acme.ng','Strong#Pass1')`, 600)).success === true);

  // --- persisted to SQLite
  await sleep(800);
  const rows = db.loadAll();
  const usersJson = JSON.parse(rows['procura_app_v1_users'] || '[]');
  check('SQLite holds the new users', ['test.officer@emeraldcourtestates.ng','new.hire@emeraldcourtestates.ng','ada@testsupplies.ng','boss@acme.ng'].every((e) => usersJson.some((u) => u.email === e)));
  check('SQLite contains no plaintext passwords', !/Better#Pass9|Hire#Pass123|Vendor#Pass77|Strong#Pass1|Fresh#Pass1/.test(JSON.stringify(rows)));
  console.log('\nTOTAL', results.filter(Boolean).length + '/' + results.length, 'passed; console errors:', JSON.stringify(errs.slice(0, 3)));
  db.close(); app.quit();
});
