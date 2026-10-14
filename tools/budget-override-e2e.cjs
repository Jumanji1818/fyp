const assert = require('node:assert/strict');
const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
require('./dbstub.cjs');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
const DIST = path.join(__dirname, '..', 'dist');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.whenReady().then(async () => {
  protocol.handle('app', (req) => {
    const pathname = decodeURIComponent(new URL(req.url).pathname);
    return net.fetch(pathToFileURL(path.join(DIST, pathname === '/' ? 'index.html' : pathname)).toString());
  });
  const win = new BrowserWindow({ width: 1366, height: 900, show: false, webPreferences: { preload: path.join(__dirname, '..', 'electron', 'preload.cjs'), contextIsolation: true } });
  const errors = [];
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 2) errors.push(message.slice(0, 200)); });
  await win.loadURL('app://procura/index.html');
  await sleep(4500);
  const run = (code) => win.webContents.executeJavaScript(code, true);
  await run(`window.__click=(re)=>{const b=[...document.querySelectorAll('button,a')].find(x=>re.test((x.innerText||x.title||'').trim()));if(b){b.click();return true}return false};true`);
  assert.equal(await run(`__click(/Load Demo Data/i)`), true, 'demo seed button should be available');
  await sleep(1200);

  const initial = await run(`(()=>{const a=window.__app;const t=a.tenders.find(x=>x.id==='tnd-4');const d=t&&a.departments.find(x=>x.id===t.departmentId);return {org:a.currentOrganization.id,tender:t&&{id:t.id,organizationId:t.organizationId,status:t.status,close:t.bidClosingDateTime,departmentId:t.departmentId},department:d&&{id:d.id,spent:d.spent,committed:d.committed,budget:d.annualBudget},bids:a.bids.filter(b=>b.tenderId==='tnd-4').map(b=>({id:b.id,amount:b.totalAmount}))}})()`);
  assert.equal(initial.org, 'org-emerald', 'demo starts in Emerald Court');
  assert.equal(initial.tender?.organizationId, 'org-emerald', 'test tender must belong to active organization');
  assert.ok(initial.tender && Date.parse(initial.tender.close) <= Date.now(), 'test tender must be closed');
  assert.ok(initial.bids.some(b=>b.id==='bid-4') && initial.bids.some(b=>b.id==='bid-5'), 'both test bids must exist');
  assert.ok(initial.bids.every(b=>b.amount > 5000000), 'test awards must exceed the Authority threshold');

  const call = async (expression, wait = 300) => {
    const result = await run(`(async()=>{const a=window.__app;const value=await (${expression});return JSON.parse(JSON.stringify(value===undefined?null:value))})()`);
    await sleep(wait);
    return result;
  };
  await call(`a.switchUser('user-admin')`);
  const constrainedBudget = initial.department.spent + initial.department.committed + 1;
  await call(`a.adjustBudget(${JSON.stringify(initial.tender.departmentId)}, ${constrainedBudget}, 'Automated budget override test')`);
  await call(`a.switchUser('user-proc')`);

  // Rejection path: a rejected override must leave the award blocked and create no PO.
  const rejectedRequestResult = await call(`a.overrideBudgetAndAward('tnd-4','bid-5','Test rejected override')`);
  assert.match(rejectedRequestResult.blocked || '', /budget override request submitted to Finance|Finance-approved budget override|pending Finance/i);
  const rejectedRequest = await run(`(()=>{const r=window.__app.budgetOverrideRequests.find(x=>x.tenderId==='tnd-4'&&x.bidId==='bid-5'&&x.status==='Pending');return r&&r.id})()`);
  assert.ok(rejectedRequest, 'request should be created in Pending state');
  await call(`a.switchUser('user-fin')`);
  await call(`a.decideBudgetOverride(${JSON.stringify(rejectedRequest)},false,'Rejected by E2E test')`);
  await call(`a.switchUser('user-proc')`);
  const rejectedAward = await call(`a.awardTender('tnd-4','bid-5')`);
  assert.match(rejectedAward.blocked || '', /budget|override/i, 'rejected override must keep award blocked');
  let poCount = await run(`window.__app.purchaseOrders.filter(po=>po.tenderId==='tnd-4').length`);
  assert.equal(poCount, 0, 'no PO may exist after Finance rejects the override');

  // Approval path: Finance approval permits the award to proceed to Authority, but does not bypass Authority.
  await call(`a.overrideBudgetAndAward('tnd-4','bid-4','Test approved override')`);
  const approvedRequest = await run(`(()=>{const r=window.__app.budgetOverrideRequests.find(x=>x.tenderId==='tnd-4'&&x.bidId==='bid-4'&&x.status==='Pending');return r&&r.id})()`);
  assert.ok(approvedRequest, 'second request should be created in Pending state');
  await call(`a.switchUser('user-fin')`);
  await call(`a.decideBudgetOverride(${JSON.stringify(approvedRequest)},true,'Approved by E2E test')`);
  await call(`a.switchUser('user-proc')`);
  const award = await call(`a.awardTender('tnd-4','bid-4')`);
  assert.equal(award.requiresAuthority, true, 'high-value award must still require Authority sign-off');
  assert.equal(award.poCreated, undefined, 'Finance approval must not create the PO');
  const awaiting = await run(`(()=>{const t=window.__app.tenders.find(x=>x.id==='tnd-4');return !!t?.awaitingAuthorityApproval && t.pendingAuthorityBidId==='bid-4'})()`);
  assert.equal(awaiting, true, 'award should wait for Authority');
  poCount = await run(`window.__app.purchaseOrders.filter(po=>po.tenderId==='tnd-4').length`);
  assert.equal(poCount, 0, 'no PO may exist before Authority sign-off');
  await call(`a.switchUser('user-auth')`);
  await call(`a.authorityApproveAward('tnd-4',true,'Approved by E2E Authority')`, 500);
  poCount = await run(`window.__app.purchaseOrders.filter(po=>po.tenderId==='tnd-4').length`);
  assert.equal(poCount, 1, 'Authority approval should issue exactly one PO');
  const final = await run(`(()=>{const t=window.__app.tenders.find(x=>x.id==='tnd-4');return {status:t.status,awaiting:t.awaitingAuthorityApproval,poCount:window.__app.purchaseOrders.filter(po=>po.tenderId==='tnd-4').length}})()`);
  assert.equal(final.status, 'Awarded');
  assert.equal(final.awaiting, false);

  // Cancellation after issuance must release the unpaid commitment and leave an audit trail.
  await call(`a.switchUser('user-proc')`);
  const beforeCancel = await run(`(()=>{const a=window.__app;const po=a.purchaseOrders.find(x=>x.tenderId==='tnd-4');const d=a.departments.find(x=>x.id===po.departmentId);return {poId:po.id,status:po.status,total:po.totalAmount,paid:po.paidAmount,committed:d.committed}})()`);
  assert.equal(beforeCancel.status, 'Issued', 'PO should be issued before cancellation test');
  await call(`a.cancelTender('tnd-4','Automated cancellation test')`, 500);
  const afterCancel = await run(`(()=>{const a=window.__app;const po=a.purchaseOrders.find(x=>x.id===${JSON.stringify(beforeCancel.poId)});const t=a.tenders.find(x=>x.id==='tnd-4');const d=a.departments.find(x=>x.id===po.departmentId);return {poStatus:po.status,tenderStatus:t.status,committed:d.committed,bids:a.bids.filter(b=>b.tenderId==='tnd-4').map(b=>b.status),audit:a.auditLogs.some(x=>x.action==='Cancelled Tender'&&x.recordReference==='TND-2026-0004')}})()`);
  assert.equal(afterCancel.poStatus, 'Cancelled');
  assert.equal(afterCancel.tenderStatus, 'Cancelled');
  assert.equal(afterCancel.committed, Math.max(0, beforeCancel.committed - Math.max(0, beforeCancel.total - beforeCancel.paid)));
  assert.ok(afterCancel.bids.length > 0 && afterCancel.bids.every(status => status === 'Withdrawn'), 'all bids must be withdrawn');
  assert.equal(afterCancel.audit, true, 'tender cancellation must be audited');
  assert.deepEqual(errors, [], 'renderer must not log errors');
  console.log('BUDGET OVERRIDE / AUTHORITY / CANCELLATION E2E PASSED', JSON.stringify({ rejectedRequest, approvedRequest, final, afterCancel }));
  app.quit();
}).catch((error) => { console.error('BUDGET OVERRIDE E2E FAILED', error); process.exitCode = 1; app.quit(); });
