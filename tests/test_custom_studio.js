const test = require('node:test');
const assert = require('node:assert');
const CustomStudioEngine = require('../js/customStudio.js');

test('CustomStudioEngine - Standalone Countdown Timer', (t) => {
  const studio = new CustomStudioEngine();
  studio.configureCountdown({
    title: 'Test Countdown',
    durationSeconds: 10,
    sound: 'chime'
  });

  let state = studio.getCountdownState();
  assert.strictEqual(state.title, 'Test Countdown');
  assert.strictEqual(state.remainingSeconds, 10);
  assert.strictEqual(state.state, 'idle');

  studio.startCountdown();
  state = studio.getCountdownState();
  assert.strictEqual(state.state, 'running');

  // Pause
  studio.pauseCountdown();
  state = studio.getCountdownState();
  assert.strictEqual(state.state, 'paused');

  // Reset
  studio.resetCountdown();
  state = studio.getCountdownState();
  assert.strictEqual(state.state, 'idle');
  assert.strictEqual(state.remainingSeconds, 10);
  studio.destroy();
});

test('CustomStudioEngine - Repeating Interval Timer with cycle limit', (t) => {
  const studio = new CustomStudioEngine();
  studio.configureRepeating({
    title: 'Posture Check',
    intervalSeconds: 5,
    totalCycles: 2,
    sound: 'bell'
  });

  let state = studio.getRepeatingState();
  assert.strictEqual(state.intervalSeconds, 5);
  assert.strictEqual(state.totalCycles, 2);
  assert.strictEqual(state.completedCycles, 0);

  studio.startRepeating();
  state = studio.getRepeatingState();
  assert.strictEqual(state.state, 'running');

  studio.pauseRepeating();
  state = studio.getRepeatingState();
  assert.strictEqual(state.state, 'paused');

  studio.resetRepeating();
  state = studio.getRepeatingState();
  assert.strictEqual(state.state, 'idle');
  assert.strictEqual(state.completedCycles, 0);
  studio.destroy();
});

test('CustomStudioEngine - Clock-Aligned Alarms (Hourly and Daily)', (t) => {
  const studio = new CustomStudioEngine();

  const hourlyAlarm = studio.addClockAlarm({
    label: 'Hourly Stretch',
    type: 'hourly',
    minute: 45
  });

  const dailyAlarm = studio.addClockAlarm({
    label: 'Market Open',
    type: 'daily',
    time: '09:30'
  });

  const alarms = studio.getClockAlarms();
  assert.strictEqual(alarms.length, 2);

  let triggered = [];
  studio.on('alarm:trigger', (al) => {
    triggered.push(al.label);
  });

  // Test at 14:45 -> should trigger hourly
  const testDate1 = new Date(2026, 10, 4, 14, 45, 0);
  studio.checkClockAlarms(testDate1);
  assert.strictEqual(triggered.length, 1);
  assert.strictEqual(triggered[0], 'Hourly Stretch');

  // Second check in same minute should not double-trigger
  studio.checkClockAlarms(testDate1);
  assert.strictEqual(triggered.length, 1);

  // Test at 09:30 -> should trigger daily
  const testDate2 = new Date(2026, 10, 4, 9, 30, 0);
  studio.checkClockAlarms(testDate2);
  assert.strictEqual(triggered.length, 2);
  assert.strictEqual(triggered[1], 'Market Open');

  // Toggle alarm
  studio.toggleClockAlarm(dailyAlarm.id);
  const updatedDaily = studio.getClockAlarms().find(a => a.id === dailyAlarm.id);
  assert.strictEqual(updatedDaily.enabled, false);

  // Delete alarm
  studio.deleteClockAlarm(hourlyAlarm.id);
  assert.strictEqual(studio.getClockAlarms().length, 1);

  studio.destroy();
});
