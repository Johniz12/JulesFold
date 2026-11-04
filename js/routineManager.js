/**
 * TEMPOFLOW - Routine Manager
 * Manages routine definitions for Pomodoro, Exercise/Tabata, and Trading/Study
 * Handles CRUD operations, presets, validation, and cloning
 */

const DEFAULT_PRESET_ROUTINES = [
  // 1. Classic Pomodoro (50/10)
  {
    id: 'preset_pomodoro_50_10',
    name: 'Deep Work (50/10 Pomodoro)',
    mode: 'pomodoro',
    favorite: true,
    isPreset: true,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    config: {
      focusDuration: 50 * 60, // 50 mins
      shortBreakDuration: 10 * 60, // 10 mins
      longBreakDuration: 30 * 60, // 30 mins
      sessionsBeforeLongBreak: 4,
      totalCycles: 1, // 1 full cycle of 4 focus + breaks, 0 for infinite
      autoTransitions: true,
      musicOnFocus: true
    }
  },
  // 2. Standard 25/5 Pomodoro
  {
    id: 'preset_pomodoro_25_5',
    name: 'Standard Pomodoro (25/5)',
    mode: 'pomodoro',
    favorite: false,
    isPreset: true,
    createdAt: 1700000000001,
    updatedAt: 1700000000001,
    config: {
      focusDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      sessionsBeforeLongBreak: 4,
      totalCycles: 1,
      autoTransitions: true,
      musicOnFocus: true
    }
  },
  // 3. Tabata High Intensity Workout
  {
    id: 'preset_tabata_fullbody',
    name: 'Tabata Full-Body Burn',
    mode: 'exercise',
    favorite: true,
    isPreset: true,
    createdAt: 1700000000002,
    updatedAt: 1700000000002,
    config: {
      prepDuration: 10,
      roundRestDuration: 60,
      rounds: 4, // 4 rounds total, 0 for infinite
      musicOnWork: true,
      exercises: [
        { name: 'Jumping Jacks', workDuration: 45, restDuration: 10, notes: 'Warm up rhythm' },
        { name: 'Air Squats', workDuration: 45, restDuration: 10, notes: 'Full depth' },
        { name: 'Push-ups', workDuration: 45, restDuration: 10, notes: 'Chest to floor' },
        { name: 'Mountain Climbers', workDuration: 45, restDuration: 10, notes: 'Core tight, drive knees' }
      ]
    }
  },
  // 4. HIIT Core Intervals
  {
    id: 'preset_exercise_core',
    name: 'Core Crusher Intervals',
    mode: 'exercise',
    favorite: false,
    isPreset: true,
    createdAt: 1700000000003,
    updatedAt: 1700000000003,
    config: {
      prepDuration: 5,
      roundRestDuration: 45,
      rounds: 3,
      musicOnWork: true,
      exercises: [
        { name: 'Plank Hold', workDuration: 40, restDuration: 15, notes: 'Maintain straight line' },
        { name: 'Bicycle Crunches', workDuration: 40, restDuration: 15, notes: 'Controlled tempo' },
        { name: 'Leg Raises', workDuration: 40, restDuration: 15, notes: 'Lower back flat' }
      ]
    }
  },
  // 5. Crypto Trading Routine
  {
    id: 'preset_crypto_trading',
    name: 'Crypto Trading & Charting Session',
    mode: 'trading',
    favorite: true,
    isPreset: true,
    createdAt: 1700000000004,
    updatedAt: 1700000000004,
    config: {
      totalCycles: 1, // 0 for infinite
      autoTransitions: true,
      intervals: [
        { name: 'Macro Market & BTC Review', duration: 25 * 60, type: 'work', music: true },
        { name: 'Eye Rest & Hydration', duration: 5 * 60, type: 'rest', music: false },
        { name: 'Altcoin Chart Setups & Orders', duration: 35 * 60, type: 'work', music: true },
        { name: 'Mental Reset Break', duration: 10 * 60, type: 'rest', music: false },
        { name: 'Trade Journaling & Risk Audit', duration: 15 * 60, type: 'work', music: true }
      ]
    }
  },
  // 6. University / Deep Study Routine
  {
    id: 'preset_deep_study',
    name: 'Focused Study & Recall Block',
    mode: 'study', // categorized under trading/study mode
    favorite: false,
    isPreset: true,
    createdAt: 1700000000005,
    updatedAt: 1700000000005,
    config: {
      totalCycles: 1,
      autoTransitions: true,
      intervals: [
        { name: 'Active Reading & Note Taking', duration: 40 * 60, type: 'work', music: true },
        { name: 'Stretch & Water Break', duration: 8 * 60, type: 'rest', music: false },
        { name: 'Flashcards & Active Recall', duration: 30 * 60, type: 'work', music: true },
        { name: 'Mind Refresh Walk', duration: 12 * 60, type: 'rest', music: false }
      ]
    }
  }
];

class RoutineManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.routines = [];
    this.init();
  }

  init() {
    let saved = this.storage.getRoutines();
    if (!saved || saved.length === 0) {
      this.routines = [...DEFAULT_PRESET_ROUTINES];
      this.storage.saveRoutines(this.routines);
    } else {
      // Ensure default presets are available if missing
      this.routines = saved;
      const existingIds = new Set(this.routines.map(r => r.id));
      let addedPreset = false;
      DEFAULT_PRESET_ROUTINES.forEach(preset => {
        if (!existingIds.has(preset.id)) {
          this.routines.push(preset);
          addedPreset = true;
        }
      });
      if (addedPreset) {
        this.storage.saveRoutines(this.routines);
      }
    }
  }

  getAll() {
    return [...this.routines];
  }

  getByMode(mode) {
    if (mode === 'trading' || mode === 'study') {
      return this.routines.filter(r => r.mode === 'trading' || r.mode === 'study');
    }
    return this.routines.filter(r => r.mode === mode);
  }

  getById(id) {
    return this.routines.find(r => r.id === id) || null;
  }

  saveRoutine(routineData) {
    const now = Date.now();
    let index = this.routines.findIndex(r => r.id === routineData.id);

    if (index >= 0) {
      // Update
      this.routines[index] = {
        ...this.routines[index],
        ...routineData,
        updatedAt: now
      };
    } else {
      // Create new
      const newRoutine = {
        id: routineData.id || 'routine_' + now + '_' + Math.random().toString(36).substr(2, 6),
        name: routineData.name || 'Untitled Routine',
        mode: routineData.mode || 'pomodoro',
        favorite: !!routineData.favorite,
        isPreset: false,
        createdAt: now,
        updatedAt: now,
        config: routineData.config || {}
      };
      this.routines.unshift(newRoutine);
    }

    this.storage.saveRoutines(this.routines);
    return routineData.id || this.routines[0].id;
  }

  deleteRoutine(id) {
    const initialLen = this.routines.length;
    this.routines = this.routines.filter(r => r.id !== id);
    if (this.routines.length !== initialLen) {
      this.storage.saveRoutines(this.routines);
      return true;
    }
    return false;
  }

  toggleFavorite(id) {
    const routine = this.getById(id);
    if (routine) {
      routine.favorite = !routine.favorite;
      routine.updatedAt = Date.now();
      this.storage.saveRoutines(this.routines);
      return routine.favorite;
    }
    return false;
  }

  duplicateRoutine(id) {
    const routine = this.getById(id);
    if (!routine) return null;

    const copy = JSON.parse(JSON.stringify(routine));
    copy.id = 'routine_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    copy.name = `${routine.name} (Copy)`;
    copy.isPreset = false;
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();

    this.routines.unshift(copy);
    this.storage.saveRoutines(this.routines);
    return copy;
  }

  /**
   * Helper to format a routine into human-readable summary string
   */
  getRoutineSummary(routine) {
    if (!routine || !routine.config) return '';

    if (routine.mode === 'pomodoro') {
      const focusMins = Math.round((routine.config.focusDuration || 1500) / 60);
      const breakMins = Math.round((routine.config.shortBreakDuration || 300) / 60);
      const longBreakMins = Math.round((routine.config.longBreakDuration || 1800) / 60);
      const sessions = routine.config.sessionsBeforeLongBreak || 4;
      return `${focusMins}m Focus / ${breakMins}m Break • Long break (${longBreakMins}m) every ${sessions} sessions`;
    }

    if (routine.mode === 'exercise') {
      const exCount = routine.config.exercises ? routine.config.exercises.length : 0;
      const rounds = routine.config.rounds === 0 ? 'Unlimited' : `${routine.config.rounds} Rounds`;
      return `${exCount} Exercises • ${rounds} • Rest between rounds: ${routine.config.roundRestDuration || 0}s`;
    }

    if (routine.mode === 'trading' || routine.mode === 'study') {
      const intervals = routine.config.intervals || [];
      const totalSecs = intervals.reduce((acc, cur) => acc + (cur.duration || 0), 0);
      const totalMins = Math.round(totalSecs / 60);
      return `${intervals.length} Custom Steps • Total: ${totalMins} mins`;
    }

    return '';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RoutineManager, DEFAULT_PRESET_ROUTINES };
} else if (typeof window !== 'undefined') {
  window.RoutineManager = RoutineManager;
  window.DEFAULT_PRESET_ROUTINES = DEFAULT_PRESET_ROUTINES;
}
