/**
 * TEMPOFLOW - Statistics and Activity History
 * Tracks active timer sessions (excluding paused time)
 * Pomodoros completed, Exercise rounds completed, Routines completed
 * Focus, Study, Trading, and Exercise duration breakdowns
 */

class StatisticsTracker {
  constructor(storageManager) {
    this.storage = storageManager;
    const stored = this.storage ? this.storage.getStatistics() : null;
    this.stats = stored || this._defaultStats();

    // In-memory active accumulation session
    this.activeSessionStart = null;
    this.currentRoutine = null;
    this.currentInterval = null;
  }

  _defaultStats() {
    return {
      completedRoutines: 0,
      completedPomodoros: 0,
      completedExerciseRounds: 0,
      totalFocusSeconds: 0,
      totalStudySeconds: 0,
      totalTradingSeconds: 0,
      totalExerciseSeconds: 0,
      history: [] // { id, timestamp, routineName, mode, durationSeconds, dateStr }
    };
  }

  getSummary() {
    const stored = this.storage ? this.storage.getStatistics() : null;
    this.stats = stored || this.stats || this._defaultStats();
    return { ...this.stats };
  }

  getTodaySummary() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayEntries = (this.stats.history || []).filter(h => h.dateStr === todayStr);

    let focusSecs = 0;
    let exerciseSecs = 0;
    let tradingSecs = 0;
    let studySecs = 0;

    todayEntries.forEach(item => {
      if (item.mode === 'pomodoro') focusSecs += item.durationSeconds;
      else if (item.mode === 'exercise') exerciseSecs += item.durationSeconds;
      else if (item.mode === 'trading') tradingSecs += item.durationSeconds;
      else if (item.mode === 'study') studySecs += item.durationSeconds;
    });

    return {
      completedRoutines: todayEntries.length,
      focusSeconds: focusSecs,
      exerciseSeconds: exerciseSecs,
      tradingSeconds: tradingSecs,
      studySeconds: studySecs,
      totalActiveSeconds: focusSecs + exerciseSecs + tradingSecs + studySecs,
      entries: todayEntries
    };
  }

  // --- Record completed interval or routine ---
  recordCompletedInterval(interval, routine) {
    if (!interval || !routine) return;
    const duration = interval.duration || 0;
    const mode = routine.mode || 'pomodoro';

    if (mode === 'pomodoro' && interval.type === 'work') {
      this.stats.completedPomodoros = (this.stats.completedPomodoros || 0) + 1;
      this.stats.totalFocusSeconds = (this.stats.totalFocusSeconds || 0) + duration;
    } else if (mode === 'exercise' && interval.type === 'exercise_work') {
      this.stats.totalExerciseSeconds = (this.stats.totalExerciseSeconds || 0) + duration;
    } else if (mode === 'trading' && interval.type === 'work') {
      this.stats.totalTradingSeconds = (this.stats.totalTradingSeconds || 0) + duration;
    } else if (mode === 'study' && interval.type === 'work') {
      this.stats.totalStudySeconds = (this.stats.totalStudySeconds || 0) + duration;
    }

    this._persist();
  }

  recordCompletedRound(routine) {
    if (!routine) return;
    if (routine.mode === 'exercise') {
      this.stats.completedExerciseRounds = (this.stats.completedExerciseRounds || 0) + 1;
      this._persist();
    }
  }

  recordCompletedRoutine(routine, totalDurationSeconds) {
    if (!routine) return;
    this.stats.completedRoutines = (this.stats.completedRoutines || 0) + 1;

    const record = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      dateStr: new Date().toISOString().slice(0, 10),
      routineId: routine.id,
      routineName: routine.name,
      mode: routine.mode,
      durationSeconds: totalDurationSeconds || 0
    };

    if (!Array.isArray(this.stats.history)) {
      this.stats.history = [];
    }
    this.stats.history.unshift(record);

    // Limit history length to last 200 sessions
    if (this.stats.history.length > 200) {
      this.stats.history = this.stats.history.slice(0, 200);
    }

    this._persist();
  }

  _persist() {
    if (this.storage) {
      this.storage.saveStatistics(this.stats);
    }
  }

  // --- Bind to Timer Engine ---
  bindToTimerEngine(timerEngine) {
    let currentInterval = null;
    let routineStartTime = null;

    timerEngine.on('intervalChange', (data) => {
      if (currentInterval && timerEngine.routine) {
        // Record interval that just completed
        this.recordCompletedInterval(currentInterval, timerEngine.routine);
      }
      currentInterval = data.interval;
    });

    timerEngine.on('roundChange', () => {
      if (timerEngine.routine) {
        this.recordCompletedRound(timerEngine.routine);
      }
    });

    timerEngine.on('stateChange', (data) => {
      if (data.state === 'running' && !routineStartTime) {
        routineStartTime = Date.now();
      } else if (data.state === 'idle') {
        routineStartTime = null;
      }
    });

    timerEngine.on('complete', (data) => {
      if (currentInterval && data.routine) {
        this.recordCompletedInterval(currentInterval, data.routine);
      }
      const totalElapsedSeconds = routineStartTime
        ? Math.round((Date.now() - routineStartTime) / 1000)
        : 0;
      this.recordCompletedRoutine(data.routine, totalElapsedSeconds);
      routineStartTime = null;
      currentInterval = null;
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StatisticsTracker };
} else if (typeof window !== 'undefined') {
  window.StatisticsTracker = StatisticsTracker;
}
