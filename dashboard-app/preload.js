const path = require('node:path');
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('EnglishDreamDesktop', {
    dashboardPath: path.join(__dirname, 'app', 'marketing-dashboard.html'),
    secureStore: {
        get: (key) => ipcRenderer.invoke('secure-store:get', key),
        set: (key, value) => ipcRenderer.invoke('secure-store:set', key, value),
        delete: (key) => ipcRenderer.invoke('secure-store:delete', key)
    }
});
