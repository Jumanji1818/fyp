// Registers the same database IPC handlers as the real app, for the test harnesses (in-memory unless PROCURA_DB is set).
const { ipcMain } = require('electron');
const { openDatabase } = require('../electron/db.cjs');
const db = openDatabase(process.env.PROCURA_DB || ':memory:');
ipcMain.on('db:load-all', (e) => { e.returnValue = db.loadAll(); });
ipcMain.on('db:set', (_e, k, v) => db.setItem(k, v));
ipcMain.on('db:remove', (_e, k) => db.removeItem(k));
ipcMain.on('db:clear', () => db.clear());
module.exports = db;
