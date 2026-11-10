const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('alfredAPI', {
  isElectron: true,
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),

  getDiscoveredModules: () => ipcRenderer.invoke('amcs:get-discovered-modules'),
  launchModuleWindow: (moduleId) => ipcRenderer.invoke('amcs:launch-module', { moduleId }),
});
