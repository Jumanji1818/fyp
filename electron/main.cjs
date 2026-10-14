// Procura desktop shell (Electron). Serves the built web app from a stable
// custom origin (app://procura) so localStorage data persists between launches.
const { app, BrowserWindow, protocol, net, shell, Menu, ipcMain, dialog } = require('electron');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const { openDatabase } = require('./db.cjs');

if (process.env.PROCURA_USERDATA) app.setPath('userData', process.env.PROCURA_USERDATA); // test hook
const path = require('path');
const { pathToFileURL } = require('url');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

const DIST = path.join(__dirname, '..', 'dist');

// ---- Local database (SQLite file in the user's profile; survives restarts and app updates) ----
let db;
function getDb() {
  if (!db) db = openDatabase(process.env.PROCURA_DB || path.join(app.getPath('userData'), 'procura.db'));
  return db;
}
ipcMain.on('db:load-all', (e) => { try { e.returnValue = getDb().loadAll(); } catch (err) { console.error('db load failed', err); e.returnValue = {}; } });
ipcMain.on('db:set', (_e, key, value) => { try { getDb().setItem(key, value); } catch (err) { console.error('db set failed', err); } });
ipcMain.on('db:remove', (_e, key) => { try { getDb().removeItem(key); } catch (err) { console.error('db remove failed', err); } });
ipcMain.on('db:clear', () => { try { getDb().clear(); } catch (err) { console.error('db clear failed', err); } });
ipcMain.handle('db:backup', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const stamp = new Date().toISOString().slice(0, 10);
    const r = await dialog.showSaveDialog(win, {
      defaultPath: path.join(app.getPath('documents'), `Procura-backup-${stamp}.db`),
      filters: [{ name: 'Procura database backup', extensions: ['db'] }],
    });
    if (r.canceled || !r.filePath) return { canceled: true };
    if (fs.existsSync(r.filePath)) fs.unlinkSync(r.filePath);
    getDb().backupTo(r.filePath);
    return { path: r.filePath };
  } catch (e) { return { error: String((e && e.message) || e) }; }
});
app.on('before-quit', () => { try { db && db.close(); } catch {} });

// Save the current page (the document being printed) as an A4 PDF, then open it.
ipcMain.handle('save-pdf', async (event, defaultName) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    let filePath = process.env.PROCURA_TEST_PDF; // test hook: skip the dialog
    if (!filePath) {
      const r = await dialog.showSaveDialog(win, {
        defaultPath: path.join(app.getPath('documents'), String(defaultName || 'Procura-document.pdf')),
        filters: [{ name: 'PDF document', extensions: ['pdf'] }],
      });
      if (r.canceled || !r.filePath) return { canceled: true };
      filePath = r.filePath;
    }
    const data = await event.sender.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true });
    fs.writeFileSync(filePath, data);
    if (!process.env.PROCURA_TEST_PDF) shell.openPath(filePath);
    return { path: filePath };
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
});

// Automatic updates from GitHub Releases (installed version only; the portable .exe cannot self-update).
function setupUpdates(win) {
  if (!app.isPackaged || process.env.PORTABLE_EXECUTABLE_FILE) return;
  autoUpdater.autoDownload = true;
  autoUpdater.on('update-downloaded', async (info) => {
    const r = await dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['Restart and update', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Procura update ready',
      message: `Procura ${info.version} has been downloaded.`,
      detail: 'Restart now to install it. Your data is kept.',
    });
    if (r.response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.on('error', () => {});
  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  check();
  setInterval(check, 4 * 60 * 60 * 1000);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#07130E',
    title: 'Procura - Smart Procurement System',
    icon: path.join(DIST, 'icon-square.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.loadURL('app://procura/index.html');
  setupUpdates(win);

  // Optional smoke-test hook: PROCURA_SHOT=/path/out.png saves a screenshot and exits.
  if (process.env.PROCURA_SHOT) {
    win.webContents.on('console-message', (_e, level, msg) => { if (level >= 2) console.log('[renderer]', msg); });
    win.webContents.on('did-finish-load', () => setTimeout(async () => {
      const img = await win.webContents.capturePage();
      require('fs').writeFileSync(process.env.PROCURA_SHOT, img.toPNG());
      app.quit();
    }, 4000));
  }

  // External links open in the user's browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [w] = BrowserWindow.getAllWindows();
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    protocol.handle('app', (request) => {
      const { pathname } = new URL(request.url);
      const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
      const file = path.normalize(path.join(DIST, rel));
      if (!file.startsWith(DIST)) return new Response('Forbidden', { status: 403 });
      return net.fetch(pathToFileURL(file).toString());
    });
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });

  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
