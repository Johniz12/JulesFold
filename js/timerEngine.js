/**
 * TEMPOFLOW - Headless Shared Timer Engine
 * Timestamp-based interval countdown engine with zero-drift accuracy
 * Supports: Pomodoro cycles, Exercise/Tabata rounds, Trading/Study sequences
 * Pure JS, DOM-independent, event-driven
 */

class TimerEngine {
  constructor() {
    // States: 'idle', 'running', 'paused', 'completed'
    this.state = 'idle';

    // Sequence configuration
    this.routine = null;
    this.intervals = []; // Array of { id, name, duration, type, music, meta }
    this.currentIntervalIndex = 0;
    this.currentCycle = 1; // 1-based current cycle/round
    this.totalCycles = 1; // 0 means infinite repetition
    this.autoTransition = true;

    // Time calculation (timestamp based)
    this.intervalDurationMs = 0;
    this.remainingMs = 0;
    this.endTimestamp = 0;
    this.tickerId = null;

    // Warning tracking
    this.warningFired = false;

    // Event listeners
    this.listeners = {
      stateChange: [],
      tick: [],
      intervalChange: [],
      warning: [], // 3-second warning
      roundChange: [],
      complete: []
    };
  }

  // --- Event Handling ---
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return this;
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }

  // --- Routine Loading and Sequence Compilation ---
  loadRoutine(routine) {
    this.stop();
    this.routine = routine;
    this.intervals = this.compileIntervals(routine);
    this.totalCycles = routine.config.totalCycles !== undefined
      ? routine.config.totalCycles
      : (routine.config.rounds !== undefined ? routine.config.rounds : 1);
    this.autoTransition = routine.config.autoTransitions !== undefined
      ? routine.config.autoTransitions
      : true;

    this.currentCycle = 1;
    this.currentIntervalIndex = 0;
    this.state = 'idle';

    if (this.intervals.length > 0) {
      this.loadInterval(0);
    }

    this.emit('stateChange', { state: this.state });
    return this;
  }

  compileIntervals(routine) {
    const intervals = [];
    if (!routine || !routine.config) return intervals;

    if (routine.mode === 'pomodoro') {
      const focusSec = routine.config.focusDuration || 25 * 60;
      const shortBreakSec = routine.config.shortBreakDuration || 5 * 60;
      const longBreakSec = routine.config.longBreakDuration || 15 * 60;
      const sessionsBeforeLong = routine.config.sessionsBeforeLongBreak || 4;
      const musicFocus = routine.config.musicOnFocus !== false;

      for (let i = 1; i <= sessionsBeforeLong; i++) {
        intervals.push({
          id: `pomodoro_focus_${i}`,
          name: `Focus Session ${i}`,
          duration: focusSec,
          type: 'work',
          music: musicFocus,
          meta: { sessionNumber: i, totalSessionsInCycle: sessionsBeforeLong, isBreak: false }
        });

        if (i < sessionsBeforeLong) {
          intervals.push({
            id: `pomodoro_short_break_${i}`,
            name: 'Short Break',
            duration: shortBreakSec,
            type: 'rest',
            music: false,
            meta: { sessionNumber: i, isBreak: true, isLongBreak: false }
          });
        } else {
          intervals.push({
            id: `pomodoro_long_break`,
            name: 'Long Break',
            duration: longBreakSec,
            type: 'rest',
            music: false,
            meta: { sessionNumber: i, isBreak: true, isLongBreak: true }
          });
        }
      }
    } else if (routine.mode === 'exercise') {
      const prepSec = routine.config.prepDuration || 0;
      const roundRestSec = routine.config.roundRestDuration || 0;
      const exercises = routine.config.exercises || [];
      const musicWork = routine.config.musicOnWork !== false;

      if (prepSec > 0) {
        intervals.push({
          id: 'exercise_prep',
          name: 'Preparation',
          duration: prepSec,
          type: 'prep',
          music: false,
          meta: { isPrep: true }
        });
      }

      exercises.forEach((ex, idx) => {
        intervals.push({
          id: `exercise_work_${idx + 1}`,
          name: ex.name || `Exercise ${idx + 1}`,
          duration: ex.workDuration || 45,
          type: 'exercise_work',
          music: musicWork,
          notes: ex.notes || '',
          meta: { exerciseNumber: idx + 1, totalExercises: exercises.length }
        });

        // Add rest interval if restDuration > 0
        const isLastExercise = idx === exercises.length - 1;
        if (!isLastExercise && (ex.restDuration || 0) > 0) {
          intervals.push({
            id: `exercise_rest_${idx + 1}`,
            name: `Rest (${ex.name || 'Next Exercise'})`,
            duration: ex.restDuration || 15,
            type: 'exercise_rest',
            music: false,
            meta: { afterExercise: idx + 1 }
          });
        }
      });

      // Round rest at the end of the round
      if (roundRestSec > 0) {
        intervals.push({
          id: 'exercise_round_rest',
          name: 'Round Rest',
          duration: roundRestSec,
          type: 'exercise_rest',
          music: false,
          meta: { isRoundRest: true }
        });
      }
    } else if (routine.mode === 'trading' || routine.mode === 'study') {
      const customIntervals = routine.config.intervals || [];
      customIntervals.forEach((item, idx) => {
        intervals.push({
          id: `custom_interval_${idx + 1}`,
          name: item.name || `Interval ${idx + 1}`,
          duration: item.duration || 30 * 60,
          type: item.type === 'rest' ? 'rest' : 'work',
          music: item.music !== undefined ? item.music : (item.type !== 'rest'),
          autoTransition: item.autoTransition !== undefined ? item.autoTransition : true,
          meta: { intervalIndex: idx + 1, totalIntervals: customIntervals.length }
        });
      });
    }

    return intervals;
  }

  loadInterval(index) {
    if (index >= 0 && index < this.intervals.length) {
      this.currentIntervalIndex = index;
      const interval = this.intervals[index];
      this.intervalDurationMs = (interval.duration || 0) * 1000;
      this.remainingMs = this.intervalDurationMs;
      this.warningFired = false;

      this.emit('intervalChange', {
        interval: this.getCurrentInterval(),
        nextInterval: this.getNextInterval(),
        currentCycle: this.currentCycle,
        totalCycles: this.totalCycles,
        progress: this.getProgress()
      });
    }
  }

  // --- Core Timer Operations ---
  start() {
    if (this.state === 'running') return;
    if (this.intervals.length === 0) return;

    if (this.state === 'idle' || this.state === 'completed') {
      this.currentCycle = 1;
      this.loadInterval(0);
    }

    this.state = 'running';
    this.endTimestamp = Date.now() + this.remainingMs;
    this.warningFired = false;
    this._startTicker();

    this.emit('stateChange', { state: this.state });
    this.emit('tick', this.getTimeData());
  }

  pause() {
    if (this.state !== 'running') return;

    this._stopTicker();
    // Accurate timestamp delta preservation
    this.remainingMs = Math.max(0, this.endTimestamp - Date.now());
    this.state = 'paused';

    this.emit('stateChange', { state: this.state });
    this.emit('tick', this.getTimeData());
  }

  resume() {
    if (this.state !== 'paused') return;

    this.state = 'running';
    this.endTimestamp = Date.now() + this.remainingMs;
    this._startTicker();

    this.emit('stateChange', { state: this.state });
    this.emit('tick', this.getTimeData());
  }

  stop() {
    this._stopTicker();
    this.state = 'idle';
    this.currentCycle = 1;
    this.currentIntervalIndex = 0;
    if (this.intervals.length > 0) {
      this.loadInterval(0);
    } else {
      this.remainingMs = 0;
      this.intervalDurationMs = 0;
    }
    this.emit('stateChange', { state: this.state });
    this.emit('tick', this.getTimeData());
  }

  reset() {
    const wasRunning = this.state === 'running';
    this._stopTicker();

    // Reset current interval back to its full duration
    const current = this.intervals[this.currentIntervalIndex];
    if (current) {
      this.remainingMs = (current.duration || 0) * 1000;
      this.intervalDurationMs = this.remainingMs;
    }
    this.warningFired = false;

    if (wasRunning) {
      this.endTimestamp = Date.now() + this.remainingMs;
      this._startTicker();
    } else {
      this.state = 'paused';
      this.emit('stateChange', { state: this.state });
    }

    this.emit('tick', this.getTimeData());
  }

  skip() {
    this._advanceInterval(true);
  }

  // --- Internal Tick and Advance Logic ---
  _startTicker() {
    this._stopTicker();
    // 250ms tick frequency for high precision and immediate response
    this.tickerId = setInterval(() => {
      this._tick();
    }, 250);
  }

  _stopTicker() {
    if (this.tickerId) {
      clearInterval(this.tickerId);
      this.tickerId = null;
    }
  }

  _tick() {
    if (this.state !== 'running') return;

    const now = Date.now();
    this.remainingMs = Math.max(0, this.endTimestamp - now);

    // Warning sound trigger (e.g. last 3 seconds of exercise or focus)
    const remainingSec = Math.ceil(this.remainingMs / 1000);
    if (remainingSec <= 3 && remainingSec > 0 && !this.warningFired && this.intervalDurationMs > 5000) {
      this.emit('warning', { remainingSec });
      // We emit for 3, 2, 1
    }

    if (this.remainingMs <= 0) {
      this._advanceInterval(false);
    } else {
      this.emit('tick', this.getTimeData());
    }
  }

  _advanceInterval(isManualSkip = false) {
    const finishedInterval = this.getCurrentInterval();

    const isLastInCycle = this.currentIntervalIndex >= this.intervals.length - 1;

    if (!isLastInCycle) {
      this.loadInterval(this.currentIntervalIndex + 1);
      this._afterAdvance(isManualSkip);
    } else {
      // Completed full cycle of routine
      const hasMoreCycles = this.totalCycles === 0 || this.currentCycle < this.totalCycles;

      if (hasMoreCycles) {
        this.currentCycle += 1;
        this.emit('roundChange', { currentCycle: this.currentCycle, totalCycles: this.totalCycles });
        this.loadInterval(0);
        this._afterAdvance(isManualSkip);
      } else {
        // Complete routine
        this._stopTicker();
        this.remainingMs = 0;
        this.state = 'completed';
        this.emit('stateChange', { state: this.state });
        this.emit('tick', this.getTimeData());
        this.emit('complete', {
          routine: this.routine,
          totalCyclesCompleted: this.currentCycle
        });
      }
    }
  }

  _afterAdvance(isManualSkip) {
    const currentInterval = this.getCurrentInterval();
    const shouldAutoRun = this.autoTransition &&
      (currentInterval.autoTransition !== false);

    if (this.state === 'running' && shouldAutoRun) {
      this.endTimestamp = Date.now() + this.remainingMs;
      this.emit('tick', this.getTimeData());
    } else {
      // Manual transition required
      this._stopTicker();
      this.state = 'paused';
      this.emit('stateChange', { state: this.state });
      this.emit('tick', this.getTimeData());
    }
  }

  // --- Query Helpers ---
  getRemainingTime() {
    return Math.ceil(this.remainingMs / 1000);
  }

  getCurrentInterval() {
    return this.intervals[this.currentIntervalIndex] || null;
  }

  getNextInterval() {
    if (this.currentIntervalIndex < this.intervals.length - 1) {
      return this.intervals[this.currentIntervalIndex + 1];
    }
    const hasMoreCycles = this.totalCycles === 0 || this.currentCycle < this.totalCycles;
    if (hasMoreCycles && this.intervals.length > 0) {
      return this.intervals[0];
    }
    return null;
  }

  getProgress() {
    if (this.intervalDurationMs <= 0) return 0;
    const elapsed = this.intervalDurationMs - this.remainingMs;
    return Math.min(1, Math.max(0, elapsed / this.intervalDurationMs));
  }

  getTimeData() {
    return {
      remainingSeconds: this.getRemainingTime(),
      remainingMs: this.remainingMs,
      durationSeconds: Math.round(this.intervalDurationMs / 1000),
      progress: this.getProgress(),
      state: this.state,
      currentInterval: this.getCurrentInterval(),
      nextInterval: this.getNextInterval(),
      currentCycle: this.currentCycle,
      totalCycles: this.totalCycles
    };
  }

  // Handle browser tab visibility change to correct any drift
  syncWithSystemTime() {
    if (this.state === 'running') {
      const now = Date.now();
      this.remainingMs = Math.max(0, this.endTimestamp - now);
      if (this.remainingMs <= 0) {
        this._advanceInterval(false);
      } else {
        this.emit('tick', this.getTimeData());
      }
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TimerEngine };
} else if (typeof window !== 'undefined') {
  window.TimerEngine = TimerEngine;
}
