/**
 * TEMPOFLOW - Storage Module
 * LocalStorage management for settings, routines, schedules, statistics
 * IndexedDB management for persistent audio tracks (MP3/WAV)
 * JSON Import/Export with schema validation
 */

const APP_DATA_VERSION = 1;
const STORAGE_KEYS = {
  SETTINGS: 'tempoflow_settings_v1',
  ROUTINES: 'tempoflow_routines_v1',
  SCHEDULES: 'tempoflow_schedules_v1',
  STATISTICS: 'tempoflow_statistics_v1',
  VERSION: 'tempoflow_version'
};

const DEFAULT_SETTINGS = {
  theme: 'dark', // 'dark' | 'light'
  defaultMode: 'pomodoro', // 'pomodoro' | 'exercise' | 'trading'
  notificationVolume: 0.8,
  musicVolume: 0.5,
  notificationSound: 'chime', // 'chime' | 'digital' | 'bell' | 'marimba'
  autoTransitions: true,
  audioEnabled: true,
  warningCountdown: true, // 3-second warning beep
  defaultPomodoro: {
    focusDuration: 50 * 60,
    shortBreakDuration: 10 * 60,
    longBreakDuration: 30 * 60,
    sessionsBeforeLongBreak: 4,
    totalCycles: 1, // 0 means infinite
    autoTransitions: true,
    musicOnFocus: true
  },
  defaultExercise: {
    workDuration: 45,
    restDuration: 15,
    roundRestDuration: 60,
    prepDuration: 10,
    rounds: 3, // 0 means infinite
    musicOnWork: true,
    warningSound: true
  }
};

class StorageManager {
  constructor() {
    this.dbName = 'TempoFlowAudioDB';
    this.dbVersion = 1;
    this.audioStoreName = 'audioTracks';
    this.db = null;
    this._initIndexedDBPromise = null;
  }

  // --- LocalStorage helpers ---
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.warn('Failed to parse settings from storage, using defaults:', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return false;
    }
  }

  getRoutines() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to parse routines:', e);
      return [];
    }
  }

  saveRoutines(routines) {
    try {
      localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
      return true;
    } catch (e) {
      console.error('Failed to save routines:', e);
      return false;
    }
  }

  getSchedules() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to parse schedules:', e);
      return [];
    }
  }

  saveSchedules(schedules) {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
      return true;
    } catch (e) {
      console.error('Failed to save schedules:', e);
      return false;
    }
  }

  getStatistics() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATISTICS);
      return data ? JSON.parse(data) : {
        completedRoutines: 0,
        completedPomodoros: 0,
        completedExerciseRounds: 0,
        totalFocusSeconds: 0,
        totalStudySeconds: 0,
        totalTradingSeconds: 0,
        totalExerciseSeconds: 0,
        history: [] // array of session objects
      };
    } catch (e) {
      console.warn('Failed to parse statistics:', e);
      return {
        completedRoutines: 0,
        completedPomodoros: 0,
        completedExerciseRounds: 0,
        totalFocusSeconds: 0,
        totalStudySeconds: 0,
        totalTradingSeconds: 0,
        totalExerciseSeconds: 0,
        history: []
      };
    }
  }

  saveStatistics(stats) {
    try {
      localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(stats));
      return true;
    } catch (e) {
      console.error('Failed to save statistics:', e);
      return false;
    }
  }

  // --- Export and Import ---
  exportAllData() {
    return {
      appName: 'TempoFlow',
      version: APP_DATA_VERSION,
      exportDate: new Date().toISOString(),
      settings: this.getSettings(),
      routines: this.getRoutines(),
      schedules: this.getSchedules(),
      statistics: this.getStatistics()
    };
  }

  importAllData(jsonData) {
    try {
      let data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON format');
      }

      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
      if (Array.isArray(data.routines)) {
        this.saveRoutines(data.routines);
      }
      if (Array.isArray(data.schedules)) {
        this.saveSchedules(data.schedules);
      }
      if (data.statistics && typeof data.statistics === 'object') {
        this.saveStatistics(data.statistics);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // --- IndexedDB for Audio files ---
  initIndexedDB() {
    if (this._initIndexedDBPromise) return this._initIndexedDBPromise;
    if (typeof indexedDB === 'undefined') {
      return Promise.resolve(null);
    }

    this._initIndexedDBPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.audioStoreName)) {
          db.createObjectStore(this.audioStoreName, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        resolve(null); // fallback gracefully
      };
    });

    return this._initIndexedDBPromise;
  }

  async saveAudioTrack(id, name, blob) {
    try {
      const db = await this.initIndexedDB();
      if (!db) return false;

      return new Promise((resolve, reject) => {
        const tx = db.transaction([this.audioStoreName], 'readwrite');
        const store = tx.objectStore(this.audioStoreName);
        store.put({ id, name, blob, dateAdded: Date.now() });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn('Error saving audio track to IndexedDB:', e);
      return false;
    }
  }

  async getAudioTrack(id) {
    try {
      const db = await this.initIndexedDB();
      if (!db) return null;

      return new Promise((resolve) => {
        const tx = db.transaction([this.audioStoreName], 'readonly');
        const store = tx.objectStore(this.audioStoreName);
        const req = store.get(id);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  async getAllAudioTracks() {
    try {
      const db = await this.initIndexedDB();
      if (!db) return [];

      return new Promise((resolve) => {
        const tx = db.transaction([this.audioStoreName], 'readonly');
        const store = tx.objectStore(this.audioStoreName);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  async deleteAudioTrack(id) {
    try {
      const db = await this.initIndexedDB();
      if (!db) return false;

      return new Promise((resolve) => {
        const tx = db.transaction([this.audioStoreName], 'readwrite');
        const store = tx.objectStore(this.audioStoreName);
        store.delete(id);

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }
}

// Export for ES modules and Node environment compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageManager, DEFAULT_SETTINGS, STORAGE_KEYS };
} else if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
}
