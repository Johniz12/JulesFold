const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  console.log('ELECTRON_APP_READY');
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../electron/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.on('did-finish-load', async () => {
    try {
      console.log('ELECTRON_PAGE_LOADED');
      const hasAlfredApi = await win.webContents.executeJavaScript('Boolean(window.alfredAPI)');
      console.log('ALFRED_API_EXPOSED:', hasAlfredApi);
      const isElectronFlag = await win.webContents.executeJavaScript('Boolean(window.alfredAPI.isElectron)');
      console.log('ALFRED_IS_ELECTRON:', isElectronFlag);
      const title = await win.webContents.executeJavaScript('document.title');
      console.log('DOC_TITLE:', title);
      const hasDashboard = await win.webContents.executeJavaScript('Boolean(document.querySelector(".alfred-dashboard"))');
      console.log('DASHBOARD_RENDERED:', hasDashboard);
      const hasClock = await win.webContents.executeJavaScript('Boolean(document.querySelector(".alfred-module-demo-clock"))');
      console.log('DEMO_CLOCK_RENDERED:', hasClock);

      // Verify close/hide functionality
      await win.webContents.executeJavaScript('document.querySelector("[data-testid=\'close-widget-demo-clock\']").click()');
      const clockHidden = await win.webContents.executeJavaScript('Boolean(document.querySelector(".alfred-module-demo-clock")) === false');
      const emptyStateVisible = await win.webContents.executeJavaScript('Boolean(document.querySelector(".alfred-empty-state"))');
      console.log('MODULE_CLOSED_SUCCESSFULLY:', clockHidden && emptyStateVisible);

      // Verify reopen functionality
      await win.webContents.executeJavaScript('document.querySelector("[data-testid=\'toggle-module-demo-clock\']").click()');
      const clockReopened = await win.webContents.executeJavaScript('Boolean(document.querySelector(".alfred-module-demo-clock"))');
      console.log('MODULE_REOPENED_SUCCESSFULLY:', clockReopened);

      console.log('ALL_VERIFICATION_CHECKS_PASSED');
      app.quit();
    } catch (err) {
      console.error('VERIFICATION_ERROR:', err);
      app.exit(1);
    }
  });

  win.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('FAIL_LOAD:', code, desc);
    app.exit(1);
  });

  win.loadFile(path.join(__dirname, '../dist/index.html'));
});
