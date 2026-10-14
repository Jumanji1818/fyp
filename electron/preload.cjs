const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('procuraDesktop', {
  isDesktop: true,
  platform: process.platform,
  savePdf: (defaultName) => ipcRenderer.invoke('save-pdf', defaultName),
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  db: {
    loadAll: () => ipcRenderer.sendSync('db:load-all'),
    set: (key, value) => ipcRenderer.send('db:set', key, value),
    remove: (key) => ipcRenderer.send('db:remove', key),
    clear: () => ipcRenderer.send('db:clear'),
  },
});
