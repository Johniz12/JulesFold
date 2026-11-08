/**
 * Simple LocalStorage Persistence Service
 * Stores user preferences and enabled workspace modules safely.
 */

const STORAGE_KEYS = {
  PREFERENCES: 'alfred_preferences',
  ACTIVE_MODULES: 'alfred_active_modules',
};

const DEFAULT_PREFERENCES = {
  userName: 'Commander',
  clock24Hour: true,
  showSeconds: true,
};

export const storageService = {
  getPreferences() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch (e) {
      console.warn('Failed to load preferences from localStorage:', e);
      return DEFAULT_PREFERENCES;
    }
  },

  savePreferences(prefs) {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
      return true;
    } catch (e) {
      console.warn('Failed to save preferences to localStorage:', e);
      return false;
    }
  },

  getActiveModules(defaultList = ['demo-clock']) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_MODULES);
      return data ? JSON.parse(data) : defaultList;
    } catch (e) {
      console.warn('Failed to load active modules from localStorage:', e);
      return defaultList;
    }
  },

  saveActiveModules(activeIds) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_MODULES, JSON.stringify(activeIds));
      return true;
    } catch (e) {
      console.warn('Failed to save active modules to localStorage:', e);
      return false;
    }
  },
};
