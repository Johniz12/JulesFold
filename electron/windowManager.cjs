const { BrowserWindow } = require('electron');
const path = require('path');

class ModuleWindowManager {
  constructor(modulePreloadPath, eventBroker) {
    this.modulePreloadPath = modulePreloadPath;
    this.eventBroker = eventBroker;
    this.moduleWindows = new Map();
  }

  launchModule(moduleDef) {
    const moduleId = moduleDef.id;

    if (this.moduleWindows.has(moduleId)) {
      const record = this.moduleWindows.get(moduleId);
      const win = record.window;
      if (!win.isDestroyed()) {
        if (win.isMinimized()) win.restore();
        if (!win.isVisible()) win.show();
        win.focus();
        record.status = 'visible';
        return win;
      }
      this.moduleWindows.delete(moduleId);
    }

    const winConfig = moduleDef.window || {};
    const isHeadless = process.env.HEADLESS === 'true' || !process.env.DISPLAY;
    const win = new BrowserWindow({
      width: winConfig.width || 900,
      height: winConfig.height || 650,
      minWidth: winConfig.minWidth || 450,
      minHeight: winConfig.minHeight || 350,
      resizable: winConfig.resizable !== false,
      show: !isHeadless,
      title: `${moduleDef.name} — ALFRED Module`,
      backgroundColor: '#0a0d14',
      webPreferences: {
        preload: this.modulePreloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        additionalArguments: [
          `--alfred-module-id=${moduleId}`,
          `--alfred-module-name=${encodeURIComponent(moduleDef.name)}`,
          `--alfred-module-capabilities=${(moduleDef.capabilities || []).join(',')}`,
        ],
      },
    });

    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', (event, url) => {
      const isAllowedFile = url.startsWith('file://');
      if (!isAllowedFile) {
        event.preventDefault();
      }
    });

    const closePolicy = (moduleDef.lifecycle && moduleDef.lifecycle.close) || 'keep-alive';

    win.on('close', (event) => {
      if (closePolicy === 'keep-alive' && !win.isDestroyed() && !win._forceDestroy) {
        event.preventDefault();
        win.hide();
        if (this.moduleWindows.has(moduleId)) {
          this.moduleWindows.get(moduleId).status = 'hidden';
        }
      }
    });

    win.on('closed', () => {
      if (this.eventBroker) {
        this.eventBroker.removeSubscriber(win.webContents.id);
      }
      this.moduleWindows.delete(moduleId);
    });

    win.loadFile(moduleDef.fullEntryPath);

    this.moduleWindows.set(moduleId, {
      window: win,
      moduleDef,
      status: 'visible',
    });

    return win;
  }

  hideModule(moduleId) {
    if (this.moduleWindows.has(moduleId)) {
      const record = this.moduleWindows.get(moduleId);
      if (!record.window.isDestroyed()) {
        record.window.hide();
        record.status = 'hidden';
        return true;
      }
    }
    return false;
  }

  showModule(moduleId) {
    if (this.moduleWindows.has(moduleId)) {
      const record = this.moduleWindows.get(moduleId);
      if (!record.window.isDestroyed()) {
        record.window.show();
        record.window.focus();
        record.status = 'visible';
        return true;
      }
    }
    return false;
  }

  closeModule(moduleId) {
    if (this.moduleWindows.has(moduleId)) {
      const record = this.moduleWindows.get(moduleId);
      if (!record.window.isDestroyed()) {
        record.window.close();
        return true;
      }
    }
    return false;
  }

  terminateModule(moduleId) {
    if (this.moduleWindows.has(moduleId)) {
      const record = this.moduleWindows.get(moduleId);
      if (!record.window.isDestroyed()) {
        record.window._forceDestroy = true;
        record.window.destroy();
      }
      if (this.eventBroker) {
        this.eventBroker.removeSubscriber(record.window.webContents.id);
      }
      this.moduleWindows.delete(moduleId);
      return true;
    }
    return false;
  }

  isModuleRunning(moduleId) {
    return this.moduleWindows.has(moduleId) && !this.moduleWindows.get(moduleId).window.isDestroyed();
  }

  getModuleWindow(moduleId) {
    const record = this.moduleWindows.get(moduleId);
    return record && !record.window.isDestroyed() ? record.window : null;
  }

  getAllRunningModuleIds() {
    return Array.from(this.moduleWindows.keys()).filter((id) => this.isModuleRunning(id));
  }
}

module.exports = {
  ModuleWindowManager,
};
