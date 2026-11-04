# Changelog

All notable changes to the TempoFlow project are documented in this file.

## [1.2.0] - 2026-11-04

### Added
- **Custom Timer Studio (`js/customStudio.js`):**
  - High-precision standalone countdown timer with hours, minutes, and seconds.
  - Repeating interval timer for periodic reminders (e.g. hydration, posture) with finite or indefinite cycles.
  - Real-time clock-aligned alarms for hourly minute marks (e.g., `:45`) and daily fixed times (`09:30`).
- **Audio Library Manager in Settings:**
  - Support for 6 distinct sound categories: Background Music, Work Sounds, Rest Sounds, Notification Sounds, Completion Sounds, and Custom Sounds.
  - Category filter chips, audio duration and file size metadata calculation.
  - Track preview, renaming, category changing, and deletion directly in Settings.
- **Unit Test Suite:**
  - Added `tests/test_custom_studio.js` covering countdown states, repeating cycles, and clock-aligned alarm checks.
- **Architectural Documentation:**
  - Added `PROJECT_CONTEXT.md` detailing system architecture and module boundaries.

### Improved
- Routine editor with full hours, minutes, and seconds input precision.
- Audio sync logic prevents multiple audio instances and handles browser autoplay policies.

## [1.1.0] - 2026-11-04
- Initial full build of TempoFlow featuring Pomodoro, Tabata workouts, and Trading flows.
- Zero-drift `TimerEngine` based on `endTimestamp - Date.now()`.
- LocalStorage and IndexedDB persistence layer.
- 7-day weekly activity scheduler and session statistics dashboard.
