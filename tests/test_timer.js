const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { TimerEngine } = require(path.resolve(__dirname, '../js/timerEngine.js'));

test('TimerEngine state transitions and seconds precision for Pomodoro', (t) => {
  const engine = new TimerEngine();
  const mockPomodoro = {
    id: 'test_pomo_sec',
    name: 'Precision Pomodoro',
    mode: 'pomodoro',
    config: {
      focusDuration: 25 * 60 + 30, // 25 mins 30 secs
      shortBreakDuration: 5 * 60 + 15, // 5 mins 15 secs
      longBreakDuration: 15 * 60,
      sessionsBeforeLongBreak: 2,
      totalCycles: 1,
      autoTransitions: true
    }
  };

  engine.loadRoutine(mockPomodoro);
  assert.strictEqual(engine.state, 'idle');
  assert.strictEqual(engine.intervals.length, 4);
  assert.strictEqual(engine.getCurrentInterval().duration, 1530); // 25m30s
  assert.strictEqual(engine.intervals[1].duration, 315); // 5m15s

  // Start & Pause
  engine.start();
  assert.strictEqual(engine.state, 'running');
  assert.strictEqual(engine.getRemainingTime(), 1530);

  engine.pause();
  assert.strictEqual(engine.state, 'paused');

  engine.resume();
  assert.strictEqual(engine.state, 'running');

  // Skip interval
  engine.skip();
  assert.strictEqual(engine.getCurrentInterval().name, 'Short Break');
  assert.strictEqual(engine.getCurrentInterval().duration, 315);

  engine.stop();
  assert.strictEqual(engine.state, 'idle');
});

test('TimerEngine Exercise/Tabata seconds sequencing and round repetition', (t) => {
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
        { name: 'Squats', workDuration: 25, restDuration: 12 }
      ]
    }
  };

  engine.loadRoutine(mockExercise);
  assert.strictEqual(engine.intervals.length, 5);
  assert.strictEqual(engine.intervals[0].duration, 5);
  assert.strictEqual(engine.intervals[1].duration, 20);
  assert.strictEqual(engine.intervals[2].duration, 10);
  assert.strictEqual(engine.intervals[3].duration, 25);
  assert.strictEqual(engine.intervals[4].duration, 30);

  engine.start();
  assert.strictEqual(engine.currentCycle, 1);
  engine.skip(); // -> Pushups
  engine.skip(); // -> Rest
  engine.skip(); // -> Squats
  engine.skip(); // -> Round Rest
  engine.skip(); // -> Starts Round 2 at Prep

  assert.strictEqual(engine.currentCycle, 2);
  assert.strictEqual(engine.getCurrentInterval().name, 'Preparation');

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

test('TimerEngine Trading custom intervals with exact seconds', (t) => {
  const engine = new TimerEngine();
  const mockTrading = {
    id: 'test_trading',
    name: 'Chart Analysis',
    mode: 'trading',
    config: {
      totalCycles: 1,
      autoTransitions: false,
      intervals: [
        { name: 'Analyze Order Flow', duration: 55 * 60 + 45, type: 'work', music: true },
        { name: 'Break', duration: 5 * 60, type: 'rest', music: false }
      ]
    }
  };

  engine.loadRoutine(mockTrading);
  assert.strictEqual(engine.getCurrentInterval().duration, 3345); // 55m45s
  engine.start();
  assert.strictEqual(engine.getCurrentInterval().name, 'Analyze Order Flow');
  engine.skip();
  assert.strictEqual(engine.getCurrentInterval().name, 'Break');
  assert.strictEqual(engine.state, 'paused'); // manual transition
});
