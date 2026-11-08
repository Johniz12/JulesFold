/**
 * TempoFlow - Custom Timer Studio Engine
 * Standalone high-precision countdowns, repeating interval timers, and real-time clock-aligned alarms.
 * Zero-drift timestamp arithmetic.
 */

class CustomStudioEngine {
  constructor(options = {}) {
    this.options = options;
    this.listeners = {};

    // 1. Standalone Countdown State
    this.countdown = {
      title: 'Quick Focus',
      durationSeconds: 300,
      state: 'idle', // idle, running, paused, completed
      endTimestamp: null,
      remainingMs: 300000,
      sound: 'chime',
      soundCategory: 'Notification Sounds'
    };

    // 2. Repeating Interval State
    this.repeating = {
      title: 'Water & Posture Check',
      intervalSeconds: 1200,
      totalCycles: 0, // 0 = indefinite
      completedCycles: 0,
      state: 'idle',
      endTimestamp: null,
      remainingMs: 1200000,
      sound: 'bell',
      soundCategory: 'Notification Sounds'
    };

    // 3. Clock-Aligned Alarms
    // Each alarm: { id, label, type: 'hourly' | 'daily', minute: 0..59, time: 'HH:MM', sound, enabled: true, lastTriggered: null }
    this.clockAlarms = [];

    this._timerInterval = null;
    this._startClockMonitor();
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try { cb(data); } catch (e) { console.error(`Error in studio listener for ${event}:`, e); }
      });
    }
  }

  // --- Countdown Timer Controls ---
  configureCountdown({ title, durationSeconds, sound = 'chime', soundCategory = 'Notification Sounds' }) {
    this.countdown.title = title || 'Quick Countdown';
    this.countdown.durationSeconds = Math.max(1, parseInt(durationSeconds, 10) || 60);
    this.countdown.sound = sound;
    this.countdown.soundCategory = soundCategory;
    this.countdown.state = 'idle';
    this.countdown.remainingMs = this.countdown.durationSeconds * 1000;
    this.countdown.endTimestamp = null;
    this.emit('countdown:update', this.getCountdownState());
  }

  startCountdown() {
    if (this.countdown.state === 'running') return;
    this.countdown.state = 'running';
    this.countdown.endTimestamp = Date.now() + this.countdown.remainingMs;
    this._ensureTickLoop();
    this.emit('countdown:start', this.getCountdownState());
  }

  pauseCountdown() {
    if (this.countdown.state !== 'running') return;
    this.countdown.remainingMs = Math.max(0, this.countdown.endTimestamp - Date.now());
    this.countdown.state = 'paused';
    this.countdown.endTimestamp = null;
    this.emit('countdown:pause', this.getCountdownState());
  }

  resumeCountdown() {
    if (this.countdown.state === 'paused') {
      this.startCountdown();
    }
  }

  resetCountdown() {
    this.countdown.state = 'idle';
    this.countdown.remainingMs = this.countdown.durationSeconds * 1000;
    this.countdown.endTimestamp = null;
    this.emit('countdown:update', this.getCountdownState());
  }

  stopCountdown() {
    this.countdown.state = 'idle';
    this.countdown.remainingMs = this.countdown.durationSeconds * 1000;
    this.countdown.endTimestamp = null;
    this.emit('countdown:update', this.getCountdownState());
  }

  getCountdownState() {
    let remainingMs = this.countdown.remainingMs;
    if (this.countdown.state === 'running') {
      remainingMs = Math.max(0, this.countdown.endTimestamp - Date.now());
    }
    const totalMs = this.countdown.durationSeconds * 1000;
    const progress = totalMs > 0 ? (totalMs - remainingMs) / totalMs : 0;
    return {
      title: this.countdown.title,
      durationSeconds: this.countdown.durationSeconds,
      remainingMs,
      remainingSeconds: Math.ceil(remainingMs / 1000),
      state: this.countdown.state,
      sound: this.countdown.sound,
      soundCategory: this.countdown.soundCategory,
      progress: Math.min(1, Math.max(0, progress))
    };
  }

  // --- Repeating Interval Timer Controls ---
  configureRepeating({ title, intervalSeconds, totalCycles = 0, sound = 'bell', soundCategory = 'Notification Sounds' }) {
    this.repeating.title = title || 'Repeating Alert';
    this.repeating.intervalSeconds = Math.max(1, parseInt(intervalSeconds, 10) || 60);
    this.repeating.totalCycles = Math.max(0, parseInt(totalCycles, 10) || 0);
    this.repeating.completedCycles = 0;
    this.repeating.sound = sound;
    this.repeating.soundCategory = soundCategory;
    this.repeating.state = 'idle';
    this.repeating.remainingMs = this.repeating.intervalSeconds * 1000;
    this.repeating.endTimestamp = null;
    this.emit('repeating:update', this.getRepeatingState());
  }

  startRepeating() {
    if (this.repeating.state === 'running') return;
    this.repeating.state = 'running';
    this.repeating.endTimestamp = Date.now() + this.repeating.remainingMs;
    this._ensureTickLoop();
    this.emit('repeating:start', this.getRepeatingState());
  }

  pauseRepeating() {
    if (this.repeating.state !== 'running') return;
    this.repeating.remainingMs = Math.max(0, this.repeating.endTimestamp - Date.now());
    this.repeating.state = 'paused';
    this.repeating.endTimestamp = null;
    this.emit('repeating:pause', this.getRepeatingState());
  }

  resumeRepeating() {
    if (this.repeating.state === 'paused') {
      this.startRepeating();
    }
  }

  resetRepeating() {
    this.repeating.state = 'idle';
    this.repeating.completedCycles = 0;
    this.repeating.remainingMs = this.repeating.intervalSeconds * 1000;
    this.repeating.endTimestamp = null;
    this.emit('repeating:update', this.getRepeatingState());
  }

  stopRepeating() {
    this.repeating.state = 'idle';
    this.repeating.completedCycles = 0;
    this.repeating.remainingMs = this.repeating.intervalSeconds * 1000;
    this.repeating.endTimestamp = null;
    this.emit('repeating:update', this.getRepeatingState());
  }

  getRepeatingState() {
    let remainingMs = this.repeating.remainingMs;
    if (this.repeating.state === 'running') {
      remainingMs = Math.max(0, this.repeating.endTimestamp - Date.now());
    }
    const totalMs = this.repeating.intervalSeconds * 1000;
    const progress = totalMs > 0 ? (totalMs - remainingMs) / totalMs : 0;
    return {
      title: this.repeating.title,
      intervalSeconds: this.repeating.intervalSeconds,
      totalCycles: this.repeating.totalCycles,
      completedCycles: this.repeating.completedCycles,
      remainingMs,
      remainingSeconds: Math.ceil(remainingMs / 1000),
      state: this.repeating.state,
      sound: this.repeating.sound,
      soundCategory: this.repeating.soundCategory,
      progress: Math.min(1, Math.max(0, progress))
    };
  }

  // --- Clock-Aligned Alarms Management ---
  loadClockAlarms(alarms) {
    if (Array.isArray(alarms)) {
      this.clockAlarms = alarms;
    }
  }

  getClockAlarms() {
    return [...this.clockAlarms];
  }

  addClockAlarm({ label, type, minute, time, sound = 'bell', soundCategory = 'Notification Sounds', enabled = true }) {
    const alarm = {
      id: 'alarm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      label: label || (type === 'hourly' ? `Hourly at :${String(minute).padStart(2, '0')}` : `Daily at ${time}`),
      type: type || 'hourly', // 'hourly' or 'daily'
      minute: typeof minute === 'number' ? minute : (parseInt(minute, 10) || 0),
      time: time || '09:00',
      sound: sound || 'bell',
      soundCategory: soundCategory || 'Notification Sounds',
      enabled: enabled !== false,
      lastTriggered: null
    };
    this.clockAlarms.push(alarm);
    this.emit('alarms:change', this.getClockAlarms());
    return alarm;
  }

  updateClockAlarm(id, updates) {
    const index = this.clockAlarms.findIndex(a => a.id === id);
    if (index !== -1) {
      this.clockAlarms[index] = { ...this.clockAlarms[index], ...updates };
      this.emit('alarms:change', this.getClockAlarms());
      return this.clockAlarms[index];
    }
    return null;
  }

  deleteClockAlarm(id) {
    this.clockAlarms = this.clockAlarms.filter(a => a.id !== id);
    this.emit('alarms:change', this.getClockAlarms());
  }

  toggleClockAlarm(id) {
    const alarm = this.clockAlarms.find(a => a.id === id);
    if (alarm) {
      alarm.enabled = !alarm.enabled;
      this.emit('alarms:change', this.getClockAlarms());
    }
  }

  // Internal Loop & Ticks
  _ensureTickLoop() {
    if (this._timerInterval) return;
    this._timerInterval = setInterval(() => this._tick(), 250);
  }

  _tick() {
    const now = Date.now();
    let hasActive = false;

    // Countdown tick
    if (this.countdown.state === 'running') {
      hasActive = true;
      const rem = Math.max(0, this.countdown.endTimestamp - now);
      this.countdown.remainingMs = rem;
      this.emit('countdown:tick', this.getCountdownState());

      if (rem <= 0) {
        this.countdown.state = 'completed';
        this.countdown.remainingMs = 0;
        this.emit('countdown:complete', this.getCountdownState());
      }
    }

    // Repeating tick
    if (this.repeating.state === 'running') {
      hasActive = true;
      const rem = Math.max(0, this.repeating.endTimestamp - now);
      this.repeating.remainingMs = rem;
      this.emit('repeating:tick', this.getRepeatingState());

      if (rem <= 0) {
        this.repeating.completedCycles++;
        this.emit('repeating:cycle_complete', this.getRepeatingState());

        if (this.repeating.totalCycles > 0 && this.repeating.completedCycles >= this.repeating.totalCycles) {
          this.repeating.state = 'completed';
          this.repeating.remainingMs = 0;
          this.emit('repeating:complete', this.getRepeatingState());
        } else {
          // Next cycle restarts automatically
          this.repeating.remainingMs = this.repeating.intervalSeconds * 1000;
          this.repeating.endTimestamp = Date.now() + this.repeating.remainingMs;
        }
      }
    }

    if (!hasActive && this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  _startClockMonitor() {
    if (this._clockInterval) return;
    // Check real-time clock every 2 seconds
    this._clockInterval = setInterval(() => {
      this.checkClockAlarms();
    }, 2000);
  }

  checkClockAlarms(customDate = null) {
    const d = customDate || new Date();
    const currentH = d.getHours();
    const currentM = d.getMinutes();
    const timeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
    const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

    for (const alarm of this.clockAlarms) {
      if (!alarm.enabled) continue;

      if (alarm.type === 'hourly') {
        const hourKey = `${dateKey}_${currentH}_${currentM}`;
        if (currentM === alarm.minute && alarm.lastTriggered !== hourKey) {
          alarm.lastTriggered = hourKey;
          this.emit('alarm:trigger', { ...alarm, triggeredAt: d });
        }
      } else if (alarm.type === 'daily') {
        const dayKey = `${dateKey}_${timeStr}`;
        if (timeStr === alarm.time && alarm.lastTriggered !== dayKey) {
          alarm.lastTriggered = dayKey;
          this.emit('alarm:trigger', { ...alarm, triggeredAt: d });
        }
      }
    }
  }

  destroy() {
    if (this._timerInterval) clearInterval(this._timerInterval);
    if (this._clockInterval) clearInterval(this._clockInterval);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustomStudioEngine;
}
