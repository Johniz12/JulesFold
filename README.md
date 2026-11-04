# TempoFlow — Customizable Productivity, Trading, Study & Exercise Timer

TempoFlow is a multi-purpose interval timer, routine builder, and weekly activity scheduler engineered with modern web standards (HTML5, CSS3, Vanilla ES6+ JavaScript, Web Audio API, LocalStorage, and IndexedDB).

## Features

### 1. Three Dedicated Modes
- **Mode A: Pomodoro / Productivity**: Customizable focus duration, short break duration, long break duration, sessions before long break, finite or infinite repetition cycles, automatic or manual transitions, and optional ambient focus music.
- **Mode B: Exercise / Tabata**: Full workout builder with custom exercises, individual work/rest durations, preparation countdown, round rest, finite or infinite rounds, 3-second audio warnings, and visual WORK vs REST distinctions.
- **Mode C: Trading / Study**: Fully customizable multi-step interval sequences for chart analysis, trading logs, active recall, flashcards, or research blocks.

### 2. Zero-Drift Timestamp-Based Timer Engine (`js/timerEngine.js`)
- Headless, DOM-independent, event-driven state machine (`idle`, `running`, `paused`, `completed`).
- Calculated with `remainingMs = endTimestamp - Date.now()`, avoiding `setInterval` cumulative drift.
- Synchronizes with system clock on browser tab visibility changes.
- Supports pause, resume, skip, reset, stop, and indefinite loops.

### 3. Centralized Audio Manager (`js/audioManager.js`)
- Web Audio API synthesizer for crisp start beeps, rest beeps, 3-2-1 warning pulses, interval completion chimes, and routine completion fanfares.
- Built-in soothing ambient focus chord synthesizer.
- User custom track upload support (MP3, WAV) persistently stored in IndexedDB.
- Timer event synchronization: music plays during active work, pauses during rest intervals, and stops on routine completion or stop.

### 4. Custom Routine Builder (`js/routineManager.js`)
- Create, edit, clone, favorite, and delete routines.
- Pre-loaded with default presets for Deep Work (50/10), Standard Pomodoro (25/5), Tabata Full-Body Burn, HIIT Core Intervals, Crypto Trading, and Deep Study.

### 5. Weekly Activity Scheduler (`js/scheduler.js`)
- Monday through Sunday calendar view.
- Assign routines to specific days and times.
- Real-time monitor with duplicate-safe notification alarms (Web Notifications & in-app toast banner).

### 6. Statistics & Activity History (`js/statistics.js`)
- Tracks active time (excluding paused durations).
- Breakdowns for focus time, exercise time, trading time, and study time.
- Completed routines and session history log.

### 7. Modern Desktop Productivity Aesthetic
- Dark theme default with instant high-contrast Light theme option.
- Dynamic circular SVG progress ring.
- Fully responsive across Desktop, Tablet, and Mobile devices.
- JSON backup export and restore.

---

## Local Development & Running

You can run TempoFlow locally using any static web server or VS Code Live Server:

```bash
# Using Python
python3 -m http.server 3000

# Or using npx serve
npx serve .
```

Open `http://localhost:3000` in your web browser.

---

## Running Automated Tests

TempoFlow includes headless automated unit tests for the timer engine, scheduler, and statistics tracker:

```bash
node --test tests/test_timer.js
node --test tests/test_scheduler_stats.js
```

---

## Netlify Deployment

TempoFlow is ready for deployment to Netlify as a static web application:

1. Connect your repository to Netlify.
2. Build command: None required (static web files).
3. Publish directory: `.` (repository root).

Configured in `netlify.toml`:
```toml
[build]
  publish = "."
```
