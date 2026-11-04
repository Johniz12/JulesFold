/**
 * TEMPOFLOW - Weekly Activity Scheduler
 * Monday - Sunday calendar planning, routine time assignments
 * Schedule trigger checks with duplicate-safe notification alarms
 */

const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Monday', index: 1 },
  { key: 'tue', label: 'Tuesday', index: 2 },
  { key: 'wed', label: 'Wednesday', index: 3 },
  { key: 'thu', label: 'Thursday', index: 4 },
  { key: 'fri', label: 'Friday', index: 5 },
  { key: 'sat', label: 'Saturday', index: 6 },
  { key: 'sun', label: 'Sunday', index: 0 }
];

const DEFAULT_PRESET_SCHEDULES = [
  {
    id: 'sched_mon_morning',
    day: 'mon',
    time: '06:30',
    routineId: 'preset_tabata_fullbody',
    enabled: true
  },
  {
    id: 'sched_mon_trading',
    day: 'mon',
    time: '09:00',
    routineId: 'preset_crypto_trading',
    enabled: true
  },
  {
    id: 'sched_mon_study',
    day: 'mon',
    time: '19:00',
    routineId: 'preset_pomodoro_50_10',
    enabled: true
  },
  {
    id: 'sched_tue_morning',
    day: 'tue',
    time: '06:30',
    routineId: 'preset_exercise_core',
    enabled: true
  },
  {
    id: 'sched_wed_trading',
    day: 'wed',
    time: '09:00',
    routineId: 'preset_crypto_trading',
    enabled: true
  },
  {
    id: 'sched_fri_pomodoro',
    day: 'fri',
    time: '14:00',
    routineId: 'preset_deep_study',
    enabled: true
  }
];

class Scheduler {
  constructor(storageManager, routineManager) {
    this.storage = storageManager;
    this.routineManager = routineManager;
    this.schedules = [];
    this.notifiedSet = new Set(); // Key: `${dateStr}_${scheduleId}` to prevent duplicate alerts
    this.intervalId = null;
    this.onScheduleDueCallback = null;

    this.init();
  }

  init() {
    let saved = this.storage.getSchedules();
    if (!saved || saved.length === 0) {
      this.schedules = [...DEFAULT_PRESET_SCHEDULES];
      this.storage.saveSchedules(this.schedules);
    } else {
      this.schedules = saved;
    }
  }

  getAll() {
    return [...this.schedules];
  }

  getByDay(dayKey) {
    return this.schedules
      .filter(s => s.day === dayKey)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  getTodayKey() {
    const dayIdx = new Date().getDay();
    const found = DAYS_OF_WEEK.find(d => d.index === dayIdx);
    return found ? found.key : 'mon';
  }

  getTodaySchedules() {
    return this.getByDay(this.getTodayKey());
  }

  addSchedule(entry) {
    const id = entry.id || 'sched_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newEntry = {
      id,
      day: entry.day || 'mon',
      time: entry.time || '09:00',
      routineId: entry.routineId,
      enabled: entry.enabled !== false
    };
    this.schedules.push(newEntry);
    this.storage.saveSchedules(this.schedules);
    return newEntry;
  }

  updateSchedule(id, updates) {
    const idx = this.schedules.findIndex(s => s.id === id);
    if (idx >= 0) {
      this.schedules[idx] = { ...this.schedules[idx], ...updates };
      this.storage.saveSchedules(this.schedules);
      return this.schedules[idx];
    }
    return null;
  }

  toggleSchedule(id) {
    const entry = this.schedules.find(s => s.id === id);
    if (entry) {
      entry.enabled = !entry.enabled;
      this.storage.saveSchedules(this.schedules);
      return entry.enabled;
    }
    return false;
  }

  deleteSchedule(id) {
    const origLen = this.schedules.length;
    this.schedules = this.schedules.filter(s => s.id !== id);
    if (this.schedules.length !== origLen) {
      this.storage.saveSchedules(this.schedules);
      return true;
    }
    return false;
  }

  // --- Real-time Schedule Monitor Loop ---
  startMonitoring(onDueCallback) {
    this.onScheduleDueCallback = onDueCallback;
    this.stopMonitoring();

    // Check once immediately, then check every 15 seconds
    this.checkDueSchedules();
    this.intervalId = setInterval(() => {
      this.checkDueSchedules();
    }, 15000);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  checkDueSchedules() {
    const now = new Date();
    const todayKey = this.getTodayKey();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;
    const dateStr = now.toISOString().slice(0, 10);

    const todaySchedules = this.getByDay(todayKey).filter(s => s.enabled);

    todaySchedules.forEach(sched => {
      if (sched.time === currentTimeStr) {
        const notifKey = `${dateStr}_${sched.id}_${sched.time}`;
        if (!this.notifiedSet.has(notifKey)) {
          this.notifiedSet.add(notifKey);
          const routine = this.routineManager.getById(sched.routineId);
          if (this.onScheduleDueCallback) {
            this.onScheduleDueCallback({
              schedule: sched,
              routine: routine
            });
          }
        }
      }
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Scheduler, DAYS_OF_WEEK, DEFAULT_PRESET_SCHEDULES };
} else if (typeof window !== 'undefined') {
  window.Scheduler = Scheduler;
  window.DAYS_OF_WEEK = DAYS_OF_WEEK;
  window.DEFAULT_PRESET_SCHEDULES = DEFAULT_PRESET_SCHEDULES;
}
