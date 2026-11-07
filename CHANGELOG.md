# Changelog

All notable changes to the TempoFlow project are documented in this file.

## [1.3.0] - 2026-11-05

### Added
- **Dedicated Top-Level Audio Library Section:**
  - Created a first-class navigation view (`#tab-audiolib`) for browsing and organizing custom audio tracks.
  - Prominent "+ Add Audio" modal supporting MP3, WAV, OGG, M4A, and WEBM formats with drag-and-drop or file picker.
  - 6 category filter chips: All Tracks, Background Music, Work Sounds, Rest Sounds, Notification Sounds, Completion Sounds, and Custom Sounds.
  - Track cards with metadata (duration, file size, format), inline preview player, category re-assignment, title renaming, and deletion.
- **Unified Custom Timer Studio Experience:**
  - Replaced split multi-tab subpanels with a single, clean dropdown selector (`Timer Type`: Countdown Timer, Repeating Interval Timer, Clock-Aligned Alarm).
  - Dynamically updates description and reveals only relevant configuration inputs.
  - Real-time preview player for custom alarm and notification sounds.
  - Complete control suite: Start, Pause, Resume, Reset, and Stop with active state indicators.
- **Expanded Routine Audio Event Configuration:**
  - Routine modal supports 5 distinct customizable audio events:
    1. Work Start Notification (built-in chimes/beeps/bells or uploaded custom tones)
    2. Rest/Break Notification
    3. Routine Completion Notification (fanfare, chime, bell, or custom tone)
    4. Work Background Music (built-in synth ambient or uploaded music)
    5. Rest Background Music (pause music, resume, or silent rest)
  - Synchronized interval transitions trigger the user's selected tones and background audio cleanly.
- **Touch-Friendly Mobile Navigation Drawer:**
  - Responsive hamburger toggle and sliding vertical drawer on mobile/tablet viewports (< 900px), eliminating awkward horizontal scrollbars.
  - Darkened backdrop overlay with touch dismiss and automatic drawer collapse upon navigating.

## [1.2.0] - 2026-11-04

### Added
- **Custom Timer Studio (`js/customStudio.js`):**
  - High-precision standalone countdown timer with hours, minutes, and seconds.
  - Repeating interval timer for periodic reminders (e.g. hydration, posture) with finite or indefinite cycles.
  - Real-time clock-aligned alarms for hourly minute marks (e.g., `:45`) and daily fixed times (`09:30`).
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
