# TempoFlow — Customizable Productivity, Trading, Study & Exercise Timer

TempoFlow is a multi-purpose interval timer, routine builder, and weekly activity scheduler engineered with modern web standards (HTML5, CSS3, Vanilla ES6+ JavaScript, Web Audio API, LocalStorage, and IndexedDB). Designed as a clean, desktop-grade productivity dashboard, TempoFlow is 100% static, requires no external build tools, and is ready for static deployment on Netlify or future packaging into Electron.

## Features

### 1. Three Dedicated Modes with Seconds-Level Precision
- **Mode A: Pomodoro / Productivity**: Customizable focus duration (hours, minutes, seconds), short break duration, long break duration, sessions before long break, finite or infinite repetition cycles, automatic or manual transitions, and optional ambient focus music.
- **Mode B: Exercise / Tabata**: Full workout builder with custom exercises, individual work/rest durations (in exact seconds), preparation countdown, rest between rounds, finite or infinite rounds, 3-second audio warnings, and high-visibility WORK vs REST colorways.
- **Mode C: Trading / Study**: Fully customizable multi-step interval sequences for chart analysis, trading logs, active recall, flashcards, or research blocks, configurable with exact hours, minutes, and seconds.

### 2. Unified Custom Timer Studio (`js/customStudio.js`)
- **Unified Mode Selection**: Switch effortlessly between Countdown, Repeating Interval, and Clock-Aligned alarms from a single dropdown that surfaces only relevant controls.
- **Standalone Countdown Timer**: High-precision hours, minutes, and seconds duration with custom alarm sounds and previewing.
- **Repeating Interval Timer**: Periodic reminders (hydration, posture, eyes) with finite or indefinite cycles and live cycle count.
- **Clock-Aligned Alarms**: Real-time wall-clock triggers on exact minute marks (e.g. `:45` every hour) or daily fixed appointments (`09:30`).
- **Complete Control Suite**: Start, pause, resume, reset, and stop with active timer status badges.

### 3. Dedicated Audio Library Section
- **Dedicated Top-Level Navigation**: Directly manage sound files via the main navigation sidebar.
- **6 Organized Categories**: Background Music, Work Sounds, Rest Sounds, Notification Sounds, Completion Sounds, and Custom Sounds.
- **Track Management**: Upload custom audio (`MP3`, `WAV`, `OGG`, `M4A`, `WEBM`), preview sounds inline, edit titles, reassign categories, and delete files safely.
- **High-Capacity Persistence**: IndexedDB storage ensures uploaded music files persist across browser reloads without localStorage quota limits.

### 4. Comprehensive Routine Audio Configuration
- Configure 5 distinct audio events per routine:
  1. *Work Start Notification*: Chime, beep, bell, fanfare, or custom uploaded track.
  2. *Rest / Break Notification*: Subtle rest beeps, bells, chimes, or uploaded alerts.
  3. *Routine Completion Notification*: Victorious fanfare or custom tone.
  4. *Work Background Music*: Built-in ambient focus synth or uploaded background tracks.
  5. *Rest Background Music*: Pause music, resume track, or silent rest.
- Audio synchronization responds dynamically to interval transitions, pauses, resumes, and stops.

### 4. Zero-Drift Timestamp-Based Timer Engine (`js/timerEngine.js`)
- Headless, DOM-independent, event-driven state machine (`idle`, `running`, `paused`, `completed`).
- Calculated with `remainingMs = endTimestamp - Date.now()`, avoiding `setInterval` cumulative drift.
- Synchronizes with system clock on browser tab visibility changes.
- Supports pause, resume, skip, reset, stop, and indefinite loops.
- Emits real-time events (`tick`, `intervalChange`, `stateChange`, `roundChange`, `warning`, `complete`).

### 3. Centralized Audio Manager (`js/audioManager.js`)
- Web Audio API synthesizer for crisp start beeps, rest beeps, 3-2-1 warning pulses, interval completion chimes, and routine completion fanfares.
- Built-in soothing ambient focus chord synthesizer.
- User custom track upload support (`MP3`, `WAV`) persistently stored in IndexedDB.
- Track audio preview controls (`Play / Stop Preview`) and track deletion in Audio Controls.
- Routine-level audio customization: select specific background tracks for work intervals and rest intervals.
- Timer event synchronization: music plays during active work, pauses during rest intervals, and stops on routine completion or stop.
- Audio unlock mechanism handling browser autoplay policies gracefully.

### 4. Custom Routine Builder (`js/routineManager.js`)
- Create, edit, clone, favorite, and delete routines.
- Pre-loaded with default presets for Deep Work (50/10), Standard Pomodoro (25/5), Tabata Full-Body Burn, HIIT Core Intervals, Crypto Trading, and Deep Study.
- Supports routine-specific audio configurations (`workMusicTrack`, `restMusicAction`).

### 5. Weekly Activity Scheduler (`js/scheduler.js`)
- Monday through Sunday calendar view.
- Assign routines to specific days and times.
- Real-time monitor with duplicate-safe notification alarms (Web Notifications & in-app toast banner).

### 6. Statistics & Activity History (`js/statistics.js`)
- Tracks active time (excluding paused durations).
- Breakdowns for focus time, exercise time, trading time, and study time.
- Completed routines and session history log.

### 7. Modern Desktop Productivity Aesthetic & Settings
- Dark theme default with instant high-contrast Light theme option.
- Dynamic circular SVG progress ring and audio visualizer indicators.
- Configurable audio preferences in Settings: Notification Sound Preference (Chime, Beep, Bell) and Default Work/Rest Music preferences.
- Touch-friendly mobile navigation drawer with hamburger toggle button and backdrop overlay.
- JSON backup export and restore.

---

## Architecture & Electron Compatibility

TempoFlow is structured with modular separation of concerns:
- **Core Logic:** `js/timerEngine.js`, `js/routineManager.js`, `js/scheduler.js`, `js/statistics.js`, and `js/storage.js` have zero direct DOM dependencies.
- **Audio Logic:** `js/audioManager.js` handles audio lifecycle and Web Audio synthesis cleanly.
- **Presentation:** `js/ui.js` handles rendering and DOM events, while `js/app.js` wires modules together.

This architecture enables 1:1 reuse in future desktop wrappers such as Electron without rewriting core timing or storage subsystems.

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
node --test tests/test_custom_studio.js
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
