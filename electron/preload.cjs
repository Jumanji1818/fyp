const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('procuraDesktop', {
  isDesktop: true,
  platform: process.platform,
  savePdf: (defaultName) => ipcRenderer.invoke('save-pdf', defaultName),
});
