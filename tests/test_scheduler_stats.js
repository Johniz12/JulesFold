const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const { Scheduler } = require(path.resolve(__dirname, '../js/scheduler.js'));
const { StatisticsTracker } = require(path.resolve(__dirname, '../js/statistics.js'));

// Mock Storage Manager
class MockStorage {
  constructor() {
    this.data = {};
  }
  getSchedules() { return this.data.schedules || []; }
  saveSchedules(s) { this.data.schedules = s; return true; }
  getStatistics() { return this.data.stats || null; }
  saveStatistics(s) { this.data.stats = s; return true; }
}

class MockRoutineManager {
  getById(id) {
    return { id, name: 'Mock Routine ' + id, mode: 'pomodoro' };
  }
}

test('Scheduler CRUD and Day filtering', (t) => {
  const storage = new MockStorage();
  const rm = new MockRoutineManager();
  const scheduler = new Scheduler(storage, rm);

  // Initialized with presets
  const initial = scheduler.getAll();
  assert.ok(initial.length > 0);

  // Add schedule
  const added = scheduler.addSchedule({
    day: 'mon',
    time: '12:00',
    routineId: 'preset_test',
    enabled: true
  });
  assert.strictEqual(added.time, '12:00');
  assert.strictEqual(added.day, 'mon');

  // Verify getByDay
  const monEntries = scheduler.getByDay('mon');
  assert.ok(monEntries.some(e => e.id === added.id));

  // Toggle
  const isEnabled = scheduler.toggleSchedule(added.id);
  assert.strictEqual(isEnabled, false);

  // Update
  scheduler.updateSchedule(added.id, { time: '13:00' });
  const updated = scheduler.getAll().find(e => e.id === added.id);
  assert.strictEqual(updated.time, '13:00');

  // Delete
  const deleted = scheduler.deleteSchedule(added.id);
  assert.strictEqual(deleted, true);
  assert.strictEqual(scheduler.getAll().find(e => e.id === added.id), undefined);
});

test('StatisticsTracker record intervals and routines', (t) => {
  const storage = new MockStorage();
  const tracker = new StatisticsTracker(storage);

  const mockRoutine = { id: 'r1', name: 'Work Pomo', mode: 'pomodoro' };
  const mockWorkInterval = { id: 'w1', name: 'Focus', type: 'work', duration: 1500 };

  tracker.recordCompletedInterval(mockWorkInterval, mockRoutine);

  let summary = tracker.getSummary();
  assert.strictEqual(summary.completedPomodoros, 1);
  assert.strictEqual(summary.totalFocusSeconds, 1500);

  // Exercise interval
  const mockExRoutine = { id: 'r2', name: 'HIIT', mode: 'exercise' };
  const mockExWorkInterval = { id: 'e1', name: 'Burpees', type: 'exercise_work', duration: 45 };
  tracker.recordCompletedInterval(mockExWorkInterval, mockExRoutine);
  tracker.recordCompletedRound(mockExRoutine);

  summary = tracker.getSummary();
  assert.strictEqual(summary.totalExerciseSeconds, 45);
  assert.strictEqual(summary.completedExerciseRounds, 1);

  // Routine completion
  tracker.recordCompletedRoutine(mockRoutine, 1500);
  summary = tracker.getSummary();
  assert.strictEqual(summary.completedRoutines, 1);
  assert.strictEqual(summary.history.length, 1);
  assert.strictEqual(summary.history[0].routineName, 'Work Pomo');
});
