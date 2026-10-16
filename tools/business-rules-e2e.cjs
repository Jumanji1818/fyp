// Runtime business-rule regression tests. Requires a build made with VITE_E2E=1.
const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
require('./dbstub.cjs');

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
const DIST = path.join(__dirname, '..', 'dist');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
const check = (name, passed, detail) => {
  results.push({ name, passed: !!passed });
  console.log((passed ? 'PASS ' : 'FAIL ') + name + (detail ? ' -> ' + detail : ''));
};

app.whenReady().then(async () => {
  protocol.handle('app', (req) => {
    const pathname = decodeURIComponent(new URL(req.url).pathname);
    return net.fetch(pathToFileURL(path.join(DIST, pathname === '/' ? 'index.html' : pathname)).toString());
  });
  const win = new BrowserWindow({
    width: 1366, height: 900, show: false,
    webPreferences: { preload: path.join(__dirname, '..', 'electron', 'preload.cjs'), contextIsolation: true },
  });
  const run = (code) => Promise.race([
    win.webContents.executeJavaScript(code, true),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Renderer evaluation timed out: ' + code.slice(0, 100))), 15000)),
  ]);
  const read = async (expr) => {
    const raw = await run(`JSON.stringify((${expr}) ?? null)`);
    return JSON.parse(raw);
  };
  const call = async (expr, wait = 350) => {
    const raw = await run(`(async()=>{const A=window.__app;if(!A)throw new Error('E2E hook missing');const result=await (${expr});return JSON.stringify(result===undefined?null:result)})()`);
    await sleep(wait);
    return JSON.parse(raw);
  };

  try {
    await win.loadURL('app://procura/index.html');
    await sleep(4500);
    if (!(await read('!!window.__app && typeof window.__app.login === "function"'))) {
      throw new Error('E2E hook missing. Build with VITE_E2E=1.');
    }
    await call('A.loadDemoData()', 1200);

    // TC5: the request creator must not approve their own request.
    const requestLogin = await call(`A.login('blessing.adeyemi@emeraldcourtestates.ng','Procura@2026')`);
    check('request officer can sign in for self-approval test', requestLogin?.success === true);
    const request = await call(`A.createRequest({title:'QA self-approval guard',departmentId:'dept-works',departmentName:'Works & Infrastructure',priority:'Normal',neededByDate:'2026-11-01',justification:'Automated regression test',items:[],status:'Submitted'})`);
    check('new request starts awaiting review', request?.status === 'Submitted', request?.status);
    await call(`A.approveRequest('${request.id}','self-approval test')`);
    const afterSelfApproval = await read(`window.__app.requests.find(r=>r.id==='${request.id}')`);
    check('TC5: requester cannot approve their own request', afterSelfApproval?.status === 'Submitted' && afterSelfApproval?.reviewerId !== afterSelfApproval?.requesterId, JSON.stringify({status:afterSelfApproval?.status,reviewerId:afterSelfApproval?.reviewerId,requesterId:afterSelfApproval?.requesterId}));

    await call('A.logout()');
    const procurementLogin = await call(`A.login('chidiebere.okonkwo@emeraldcourtestates.ng','Procura@2026')`);
    check('procurement officer can sign in for award-rule tests', procurementLogin?.success === true);

    // TC7: compliance-failed bids must be absent from recommendations and cannot be awarded.
    await call(`A.evaluateCompliance('bid-5',false,'Automated disqualification test')`);
    const ranked = await call(`A.calculateVendorRecommendations('tnd-4')`);
    check('TC7: disqualified bid is excluded from recommendation ranking', Array.isArray(ranked) && !ranked.some(b=>b.id==='bid-5') && ranked.some(b=>b.id==='bid-4'), JSON.stringify((ranked||[]).map(b=>b.id)));
    const disqualifiedAward = await call(`A.awardTender('tnd-4','bid-5','Automated test')`);
    check('TC7: award action blocks a disqualified bid', !!disqualifiedAward?.blocked && /compliance/i.test(disqualifiedAward.blocked), disqualifiedAward?.blocked);

    // TC9: an over-budget award is blocked unless a non-empty override reason is supplied.
    await call(`A.adjustBudget('dept-works',0,'Automated TC9 regression test')`);
    const blockedOverBudget = await call(`A.awardTender('tnd-4','bid-4','Automated test')`);
    check('TC9: over-budget award is blocked without override', !!blockedOverBudget?.blocked && /budget/i.test(blockedOverBudget.blocked), blockedOverBudget?.blocked);
    const blankOverride = await call(`A.overrideBudgetAndAward('tnd-4','bid-4','')`);
    check('TC9: blank budget override reason is rejected', !!blankOverride?.blocked && /reason/i.test(blankOverride.blocked), blankOverride?.blocked);
    const approvedOverride = await call(`A.overrideBudgetAndAward('tnd-4','bid-4','Approved for controlled QA test')`);
    check('TC9: reasoned budget override proceeds to required authority sign-off', approvedOverride?.requiresAuthority === true && !approvedOverride?.blocked, JSON.stringify(approvedOverride));

    // TC10: missing rejection reason is blocked in the business-logic layer, not only the UI.
    await call('A.logout()');
    const authorityLogin = await call(`A.login('babatunde.adeleke@emeraldcourtestates.ng','Procura@2026')`);
    check('approving authority can sign in for rejection-reason test', authorityLogin?.success === true);
    await call(`A.authorityApproveAward('tnd-4',false,'')`);
    const stillPending = await read(`window.__app.tenders.find(t=>t.id==='tnd-4')`);
    check('TC10: rejection without a reason leaves approval pending', stillPending?.awaitingAuthorityApproval === true, String(stillPending?.awaitingAuthorityApproval));
    await call(`A.authorityApproveAward('tnd-4',false,'Returned for missing supporting documentation')`);
    const afterReasonedRejection = await read(`window.__app.tenders.find(t=>t.id==='tnd-4')`);
    check('TC10: rejection with a reason returns tender to evaluation', afterReasonedRejection?.awaitingAuthorityApproval === false && afterReasonedRejection?.pendingAuthorityBidId == null, JSON.stringify({awaiting:afterReasonedRejection?.awaitingAuthorityApproval,pendingBid:afterReasonedRejection?.pendingAuthorityBidId}));

    // TC11: late receipt must record elapsed days and update vendor reliability metrics.
    await call('A.logout()');
    const receivingLogin = await call(`A.login('blessing.adeyemi@emeraldcourtestates.ng','Procura@2026')`);
    check('receiving test user can sign in', receivingLogin?.success === true);
    const before = await read(`(()=>{const p=window.__app.purchaseOrders.find(p=>p.id==='po-2');const v=window.__app.vendors.find(v=>v.id==='vendor-3');return {expected:p?.expectedDeliveryDate,late:v?.lateDeliveries,onTime:v?.onTimeDeliveries,score:v?.reliabilityScore,items:p?.items}})()`);
    await call(`A.receiveDelivery('po-2',[{description:'Dell PowerEdge R750 Rack Server',ordered:2,received:2,status:'Accepted'},{description:'Synology Enterprise 96TB SAS SAN Storage Enclosure',ordered:1,received:1,status:'Accepted'}])`, 700);
    const after = await read(`(()=>{const d=window.__app.deliveries.find(d=>d.purchaseOrderId==='po-2');const v=window.__app.vendors.find(v=>v.id==='vendor-3');return {lateDays:d?.lateDays,onTime:d?.onTime,late:v?.lateDeliveries,onTimeCount:v?.onTimeDeliveries,score:v?.reliabilityScore}})()`);
    check('TC11: overdue receipt records positive late days', Number(after?.lateDays) > 0 && after?.onTime === false, JSON.stringify({expected:before?.expected,lateDays:after?.lateDays,onTime:after?.onTime}));
    check('TC11: late delivery increments vendor late count and recalculates reliability', after?.late === Number(before?.late) + 1 && after?.score === Math.round(Number(before?.onTime) / (Number(before?.onTime) + Number(before?.late) + 1) * 100), JSON.stringify({before:{late:before?.late,onTime:before?.onTime,score:before?.score},after}));

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed);
    console.log(`BUSINESS RULES TOTAL ${passed}/${results.length} passed`);
    if (failed.length) console.error('FAILED CHECKS:', JSON.stringify(failed));
    if (failed.length) process.exitCode = 1;
  } catch (error) {
    console.error('BUSINESS RULES FATAL:', error && error.stack ? error.stack : error);
    process.exitCode = 1;
  } finally {
    app.quit();
  }
});
