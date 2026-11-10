const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const { ModuleDiscoveryEngine } = require('./moduleDiscovery.cjs');
const { ModuleWindowManager } = require('./windowManager.cjs');
const { HostEventBroker } = require('./eventBroker.cjs');

let mainWindow = null;

const modulesRootDir = path.join(__dirname, '../modules');
const discoveryEngine = new ModuleDiscoveryEngine(modulesRootDir);
const eventBroker = new HostEventBroker();
const modulePreloadPath = path.join(__dirname, 'modulePreload.cjs');
const windowManager = new ModuleWindowManager(modulePreloadPath, eventBroker);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'ALFRED — Productivity Workspace',
    backgroundColor: '#0a0d14',
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isLocalhost = url.startsWith('http://localhost:5173') || url.startsWith('http://127.0.0.1:5173');
    const isFileUrl = url.startsWith('file://');
    if (!isLocalhost && !isFileUrl) {
      event.preventDefault();
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('window:minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
    return true;
  }
  return false;
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return mainWindow.isMaximized();
  }
  return false;
});

ipcMain.handle('window:close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
    return true;
  }
  return false;
});

ipcMain.handle('app:get-info', () => {
  return {
    name: 'ALFRED',
    version: app.getVersion() || '1.0.0',
    platform: process.platform,
    arch: process.arch,
  };
});

ipcMain.handle('amcs:get-discovered-modules', () => {
  return discoveryEngine.discoverModules().map((m) => ({
    id: m.id,
    name: m.name,
    version: m.version,
    amcsVersion: m.amcsVersion,
    description: m.description,
    runtime: m.runtime,
    capabilities: m.capabilities,
    lifecycle: m.lifecycle,
    isRunning: windowManager.isModuleRunning(m.id),
  }));
});

ipcMain.handle('amcs:launch-module', (event, { moduleId }) => {
  if (!moduleId || typeof moduleId !== 'string') {
    return { success: false, error: 'Invalid module ID' };
  }
  const moduleDef = discoveryEngine.getModule(moduleId);
  if (!moduleDef) {
    return { success: false, error: `Module "${moduleId}" is not registered` };
  }
  try {
    const win = windowManager.launchModule(moduleDef);
    return { success: true, isNew: !win.isVisible() };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('amcs:get-info', (event, { moduleId }) => {
  const mod = discoveryEngine.getModule(moduleId);
  return {
    host: 'ALFRED',
    hostVersion: app.getVersion() || '1.0.0',
    moduleId,
    moduleName: mod ? mod.name : 'Unknown',
  };
});

ipcMain.handle('amcs:window-action', (event, { moduleId, action }) => {
  if (action === 'minimize') {
    const win = windowManager.getModuleWindow(moduleId);
    if (win && !win.isDestroyed()) win.minimize();
    return true;
  }
  if (action === 'hide') {
    return windowManager.hideModule(moduleId);
  }
  if (action === 'close') {
    return windowManager.closeModule(moduleId);
  }
  return false;
});

ipcMain.handle('amcs:show-notification', (event, { moduleId, options }) => {
  const mod = discoveryEngine.getModule(moduleId);
  if (!mod || !mod.capabilities || !mod.capabilities.includes('notifications')) {
    throw new Error(`Module "${moduleId}" lacks permission for notifications`);
  }
  if (Notification && Notification.isSupported && Notification.isSupported()) {
    const notif = new Notification({
      title: options?.title || mod.name,
      body: options?.message || '',
    });
    notif.show();
    return { displayed: true };
  }
  return { displayed: false, reason: 'Notifications not supported on this platform' };
});

ipcMain.handle('amcs:event-publish', (event, { moduleId, eventName, payload }) => {
  const mod = discoveryEngine.getModule(moduleId);
  if (!mod || !mod.capabilities || !mod.capabilities.includes('events')) {
    throw new Error(`Module "${moduleId}" lacks permission for events`);
  }
  return eventBroker.publish(moduleId, eventName, payload);
});

ipcMain.handle('amcs:event-subscribe', (event, { moduleId, eventName }) => {
  const mod = discoveryEngine.getModule(moduleId);
  if (!mod || !mod.capabilities || !mod.capabilities.includes('events')) {
    throw new Error(`Module "${moduleId}" lacks permission for events`);
  }
  const senderWebContents = event.sender;
  const subId = eventBroker.subscribe(
    moduleId,
    senderWebContents.id,
    eventName,
    (envelope) => {
      if (!senderWebContents.isDestroyed()) {
        senderWebContents.send('amcs:event-dispatched', envelope);
      }
    }
  );
  return { subscriptionId: subId };
});

ipcMain.handle('amcs:event-unsubscribe', (event, { moduleId, subscriptionId }) => {
  return eventBroker.unsubscribe(subscriptionId);
});

app.whenReady().then(() => {
  discoveryEngine.discoverModules();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
