const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { ModuleDiscoveryEngine } = require('../electron/moduleDiscovery.cjs');
const { ModuleWindowManager } = require('../electron/windowManager.cjs');
const { HostEventBroker } = require('../electron/eventBroker.cjs');

app.whenReady().then(async () => {
  console.log('STARTING_AMCS_E2E_VERIFICATION');

  try {
    const modulesDir = path.join(__dirname, '../modules');
    const discovery = new ModuleDiscoveryEngine(modulesDir);
    const eventBroker = new HostEventBroker();
    const preloadPath = path.join(__dirname, '../electron/modulePreload.cjs');
    const windowManager = new ModuleWindowManager(preloadPath, eventBroker);

    const discovered = discovery.discoverModules();
    console.log('DISCOVERED_MODULES:', discovered.map((m) => m.id));

    ipcMain.handle('amcs:get-info', (event, { moduleId }) => {
      return { host: 'ALFRED', moduleId };
    });

    ipcMain.handle('amcs:event-publish', (event, { moduleId, eventName, payload }) => {
      return eventBroker.publish(moduleId, eventName, payload);
    });

    ipcMain.handle('amcs:event-subscribe', (event, { moduleId, eventName }) => {
      const sender = event.sender;
      const subId = eventBroker.subscribe(moduleId, sender.id, eventName, (env) => {
        if (!sender.isDestroyed()) {
          sender.send('amcs:event-dispatched', env);
        }
      });
      return { subscriptionId: subId };
    });

    const reactDef = discovery.getModule('demo-react');
    const reactWin = new BrowserWindow({
      width: 600,
      height: 400,
      show: false,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        additionalArguments: [
          '--alfred-module-id=demo-react',
          '--alfred-module-name=React%20Demo',
          '--alfred-module-capabilities=events',
        ],
      },
    });

    await new Promise((resolve) => {
      reactWin.webContents.once('did-finish-load', resolve);
      reactWin.loadFile(reactDef.fullEntryPath);
    });
    console.log('DEMO_REACT_LOADED');

    for (let i = 0; i < 20; i++) {
      if (eventBroker.getTopicSubscriberCount('demo.message') > 0) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    console.log('SUBSCRIBER_COUNT:', eventBroker.getTopicSubscriberCount('demo.message'));

    const vanillaDef = discovery.getModule('demo-vanilla');
    const vanillaWin = new BrowserWindow({
      width: 600,
      height: 400,
      show: false,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        additionalArguments: [
          '--alfred-module-id=demo-vanilla',
          '--alfred-module-name=Vanilla%20Demo',
          '--alfred-module-capabilities=notifications,events',
        ],
      },
    });

    await new Promise((resolve) => {
      vanillaWin.webContents.once('did-finish-load', resolve);
      vanillaWin.loadFile(vanillaDef.fullEntryPath);
    });
    console.log('DEMO_VANILLA_LOADED');

    await vanillaWin.webContents.executeJavaScript(`
      document.getElementById('msg-input').value = 'E2E Inter-Module Test Message';
      document.getElementById('send-event-btn').click();
    `);
    console.log('VANILLA_CLICKED_PUBLISH');

    let receivedText = null;
    for (let i = 0; i < 20; i++) {
      receivedText = await reactWin.webContents.executeJavaScript(`
        const item = document.querySelector('.message-item .msg-text');
        item ? item.textContent : null;
      `);
      if (receivedText) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    console.log('REACT_RECEIVED_MESSAGE_TEXT:', receivedText);
    if (receivedText !== 'E2E Inter-Module Test Message') {
      throw new Error(`Expected 'E2E Inter-Module Test Message', got '${receivedText}'`);
    }

    console.log('ALL_AMCS_E2E_CHECKS_PASSED');
    app.quit();
  } catch (err) {
    console.error('AMCS_E2E_ERROR:', err);
    app.exit(1);
  }
});
