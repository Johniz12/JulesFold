const { contextBridge, ipcRenderer } = require('electron');

let currentModuleId = 'unknown';
let currentModuleName = 'Module';
let currentCapabilities = [];

for (const arg of process.argv) {
  if (arg.startsWith('--alfred-module-id=')) {
    currentModuleId = arg.split('=')[1];
  } else if (arg.startsWith('--alfred-module-name=')) {
    currentModuleName = decodeURIComponent(arg.split('=')[1]);
  } else if (arg.startsWith('--alfred-module-capabilities=')) {
    const raw = arg.split('=')[1];
    currentCapabilities = raw ? raw.split(',').filter(Boolean) : [];
  }
}

const eventSubscriptions = new Map();

ipcRenderer.on('amcs:event-dispatched', (event, envelope) => {
  if (!envelope || !envelope.event) return;
  for (const [subId, sub] of eventSubscriptions.entries()) {
    if (sub.eventName === envelope.event) {
      try {
        sub.callback(envelope);
      } catch (err) {
        console.error(`[AMCS] Error in event listener for ${envelope.event}:`, err);
      }
    }
  }
});

contextBridge.exposeInMainWorld('alfred', {
  app: {
    getInfo: () => ipcRenderer.invoke('amcs:get-info', { moduleId: currentModuleId }),
    getModuleIdentity: () => ({
      id: currentModuleId,
      name: currentModuleName,
      capabilities: [...currentCapabilities],
    }),
  },
  window: {
    minimize: () => ipcRenderer.invoke('amcs:window-action', { moduleId: currentModuleId, action: 'minimize' }),
    hide: () => ipcRenderer.invoke('amcs:window-action', { moduleId: currentModuleId, action: 'hide' }),
    close: () => ipcRenderer.invoke('amcs:window-action', { moduleId: currentModuleId, action: 'close' }),
  },
  notifications: {
    show: (options) => {
      if (!currentCapabilities.includes('notifications')) {
        return Promise.reject(new Error(`Permission denied: module "${currentModuleId}" lacks "notifications" capability`));
      }
      return ipcRenderer.invoke('amcs:show-notification', { moduleId: currentModuleId, options });
    },
  },
  events: {
    publish: (eventName, payload) => {
      if (!currentCapabilities.includes('events')) {
        return Promise.reject(new Error(`Permission denied: module "${currentModuleId}" lacks "events" capability`));
      }
      return ipcRenderer.invoke('amcs:event-publish', {
        moduleId: currentModuleId,
        eventName,
        payload,
      });
    },
    subscribe: async (eventName, callback) => {
      if (!currentCapabilities.includes('events')) {
        throw new Error(`Permission denied: module "${currentModuleId}" lacks "events" capability`);
      }
      if (typeof callback !== 'function') {
        throw new Error('Subscriber callback must be a function');
      }

      const res = await ipcRenderer.invoke('amcs:event-subscribe', {
        moduleId: currentModuleId,
        eventName,
      });

      if (res && res.subscriptionId) {
        eventSubscriptions.set(res.subscriptionId, {
          eventName,
          callback,
        });
        return res.subscriptionId;
      }
      throw new Error(res?.error || 'Failed to subscribe to event');
    },
    unsubscribe: async (subscriptionId) => {
      eventSubscriptions.delete(subscriptionId);
      return ipcRenderer.invoke('amcs:event-unsubscribe', {
        moduleId: currentModuleId,
        subscriptionId,
      });
    },
  },
});
