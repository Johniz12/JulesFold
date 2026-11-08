import test from 'node:test';
import assert from 'node:assert/strict';
import { storageService } from '../src/services/storage.js';

// Mock localStorage for Node test runner
const mockStore = {};
global.localStorage = {
  getItem: (key) => (key in mockStore ? mockStore[key] : null),
  setItem: (key, val) => {
    mockStore[key] = String(val);
  },
  removeItem: (key) => {
    delete mockStore[key];
  },
  clear: () => {
    for (const k in mockStore) delete mockStore[k];
  },
};

test('ALFRED Storage Service - preferences persistence', () => {
  localStorage.clear();

  // Defaults when empty
  const defaultPrefs = storageService.getPreferences();
  assert.strictEqual(defaultPrefs.userName, 'Commander');
  assert.strictEqual(defaultPrefs.clock24Hour, true);

  // Save new preferences
  const customPrefs = {
    userName: 'Stark',
    clock24Hour: false,
    showSeconds: false,
  };
  storageService.savePreferences(customPrefs);

  const loaded = storageService.getPreferences();
  assert.strictEqual(loaded.userName, 'Stark');
  assert.strictEqual(loaded.clock24Hour, false);
  assert.strictEqual(loaded.showSeconds, false);
});

test('ALFRED Storage Service - active modules persistence', () => {
  localStorage.clear();

  // Default fallback
  const initial = storageService.getActiveModules(['demo-clock']);
  assert.deepStrictEqual(initial, ['demo-clock']);

  // Update active modules list
  storageService.saveActiveModules(['demo-clock', 'future-module']);
  const loaded = storageService.getActiveModules();
  assert.deepStrictEqual(loaded, ['demo-clock', 'future-module']);

  // Close all modules
  storageService.saveActiveModules([]);
  const empty = storageService.getActiveModules();
  assert.deepStrictEqual(empty, []);
});
