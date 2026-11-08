const { contextBridge, ipcRenderer } = require('electron');

// Expose a restricted and safe API to the renderer process
// Do NOT expose ipcRenderer or Node.js primitives directly
contextBridge.exposeInMainWorld('alfredAPI', {
  isElectron: true,
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
});
