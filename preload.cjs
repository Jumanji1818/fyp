const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('procuraDesktop', { isDesktop: true, platform: process.platform });
