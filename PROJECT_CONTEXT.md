# TempoFlow — Project Context & Architecture

TempoFlow is a zero-drift interval timer, routine builder, and weekly activity scheduler designed for deep productivity, cryptocurrency trading, learning, and interval training.

## Architecture Overview

```
tempoflow/
├── index.html                 # Semantic single-page application shell
├── netlify.toml               # Static deployment configuration
├── css/
│   ├── themes.css             # Theme variables (Dark/Light mode design system)
│   ├── style.css              # Core typography, components, timer centerpiece ring
│   └── responsive.css         # Responsive rules, mobile drawer, and layout breakpoints
├── js/
│   ├── timerEngine.js         # Headless zero-drift countdown & interval sequencer
│   ├── customStudio.js        # High-precision countdown, repeating alert & clock alarms
│   ├── audioManager.js        # Web Audio synthesizer & IndexedDB audio playback
│   ├── storage.js             # LocalStorage & IndexedDB persistent data layer
│   ├── routineManager.js      # CRUD & presets for Pomodoro, Exercise & Trading routines
│   ├── scheduler.js           # 7-day scheduler with real-time due notifications
│   ├── statistics.js          # Session tracker, historical records & duration stats
│   ├── ui.js                  # View rendering & DOM bindings
│   └── app.js                 # App orchestrator & event bus
└── tests/
    ├── test_timer.js          # Node unit tests for TimerEngine
    ├── test_scheduler_stats.js# Node unit tests for Scheduler & Statistics
    └── test_custom_studio.js  # Node unit tests for CustomStudioEngine
```

## Key Modules

### 1. Zero-Drift Timer Engine (`js/timerEngine.js`)
* Uses timestamp calculations `remainingMs = endTimestamp - Date.now()`.
* Handles browser tab switching, pauses, skips, and finite or indefinite cycles without cumulative drift.
* Emits state and interval change events to trigger audio and UI reactions.

### 2. Custom Timer Studio (`js/customStudio.js`)
* **Unified Mode Selection:** Dropdown selector seamlessly toggles Countdown, Repeating Interval, or Clock Alarm configurations while maintaining live timer state.
* **Countdown Timer:** Standalone countdown with custom title, H/M/S inputs, and previewable tones.
* **Repeating Interval:** Periodic alerts (e.g. hydration, posture checks) with cycle counters and audio preview.
* **Clock-Aligned Alarms:** Fires triggers at exact wall-clock moments (e.g., `:45` of every hour or `09:30` daily).

### 3. Audio Architecture & Dedicated Library (`js/audioManager.js`, `js/app.js`)
* **Dedicated Top-Level Audio Library:** Standalone navigation section with "+ Add Audio" modal, filter chips, and card-based track management.
* **Web Audio Synthesis:** Generates pure tones, harmonic chimes, bells, and warning alerts without external audio files.
* **IndexedDB Audio Storage:** Stores uploaded MP3, WAV, OGG, M4A, WEBM tracks as persistent Blobs.
* **Categorization:** Classifies audio into 6 categories: Background Music, Work Sounds, Rest Sounds, Notification Sounds, Completion Sounds, and Custom Sounds.
* **Event-Driven Routine Audio Sync:** Custom routine definitions support 5 independent sound bindings (Work Start, Rest Start, Completion, Work Background Music, Rest Background Music).

### 4. Future Electron Portability
All application core logic (`timerEngine.js`, `customStudio.js`, `storage.js`, `routineManager.js`, `scheduler.js`, `statistics.js`) is decoupled from the DOM and can be directly reused inside an Electron desktop app.
