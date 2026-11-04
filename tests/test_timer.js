const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { TimerEngine } = require(path.resolve(__dirname, '../js/timerEngine.js'));

test('TimerEngine state transitions and compilation for Pomodoro', (t) => {
  const engine = new TimerEngine();
  const mockPomodoro = {
    id: 'test_pomo',
    name: 'Test Pomodoro',
    mode: 'pomodoro',
    config: {
      focusDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      sessionsBeforeLongBreak: 2,
      totalCycles: 1,
      autoTransitions: true
    }
  };

  engine.loadRoutine(mockPomodoro);
  assert.strictEqual(engine.state, 'idle');
  assert.strictEqual(engine.intervals.length, 4); // Focus 1, Short Break, Focus 2, Long Break
  assert.strictEqual(engine.getCurrentInterval().name, 'Focus Session 1');
  assert.strictEqual(engine.getCurrentInterval().type, 'work');
  assert.strictEqual(engine.getNextInterval().name, 'Short Break');

  // Start
  engine.start();
  assert.strictEqual(engine.state, 'running');

  // Pause
  engine.pause();
  assert.strictEqual(engine.state, 'paused');

  // Resume
  engine.resume();
  assert.strictEqual(engine.state, 'running');

  // Skip interval
  engine.skip();
  assert.strictEqual(engine.getCurrentInterval().name, 'Short Break');
  assert.strictEqual(engine.getCurrentInterval().type, 'rest');

  // Stop
  engine.stop();
  assert.strictEqual(engine.state, 'idle');
  assert.strictEqual(engine.getCurrentInterval().name, 'Focus Session 1');
});

test('TimerEngine Exercise/Tabata sequencing and round repetition', (t) => {
  const engine = new TimerEngine();
  const mockExercise = {
    id: 'test_tabata',
    name: 'Test Tabata',
    mode: 'exercise',
    config: {
      prepDuration: 5,
      roundRestDuration: 30,
      rounds: 2,
      exercises: [
        { name: 'Pushups', workDuration: 20, restDuration: 10 },
        { name: 'Squats', workDuration: 20, restDuration: 10 }
      ]
    }
  };

  engine.loadRoutine(mockExercise);
  // Intervals: Prep (5s), Pushups (20s), Rest (10s), Squats (20s), Round Rest (30s) = 5 intervals
  assert.strictEqual(engine.intervals.length, 5);
  assert.strictEqual(engine.intervals[0].name, 'Preparation');
  assert.strictEqual(engine.intervals[1].name, 'Pushups');
  assert.strictEqual(engine.intervals[2].name, 'Rest (Pushups)');
  assert.strictEqual(engine.intervals[3].name, 'Squats');
  assert.strictEqual(engine.intervals[4].name, 'Round Rest');

  engine.start();
  assert.strictEqual(engine.currentCycle, 1);
  // Skip through all intervals of round 1
  engine.skip(); // -> Pushups
  engine.skip(); // -> Rest
  engine.skip(); // -> Squats
  engine.skip(); // -> Round Rest
  engine.skip(); // -> Starts Round 2 at Prep

  assert.strictEqual(engine.currentCycle, 2);
  assert.strictEqual(engine.getCurrentInterval().name, 'Preparation');

  // Finish Round 2
  engine.skip(); // -> Pushups
  engine.skip(); // -> Rest
  engine.skip(); // -> Squats
  engine.skip(); // -> Round Rest
  let completed = false;
  engine.on('complete', () => { completed = true; });
  engine.skip(); // -> Completed

  assert.strictEqual(engine.state, 'completed');
  assert.strictEqual(completed, true);
});

test('TimerEngine Trading custom intervals and manual transitions', (t) => {
  const engine = new TimerEngine();
  const mockTrading = {
    id: 'test_trading',
    name: 'Test Trading',
    mode: 'trading',
    config: {
      totalCycles: 1,
      autoTransitions: false,
      intervals: [
        { name: 'Analyze Charts', duration: 1800, type: 'work', music: true },
        { name: 'Break', duration: 300, type: 'rest', music: false }
      ]
    }
  };

  engine.loadRoutine(mockTrading);
  engine.start();
  assert.strictEqual(engine.getCurrentInterval().name, 'Analyze Charts');
  // Skip interval with manual transition setting -> should pause at next interval
  engine.skip();
  assert.strictEqual(engine.getCurrentInterval().name, 'Break');
  assert.strictEqual(engine.state, 'paused');
});
