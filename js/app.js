/**
 * TEMPOFLOW - Main Application Orchestrator
 * Connects TimerEngine, AudioManager, RoutineManager, Scheduler, StatisticsTracker, and UIController
 * Supports seconds precision across all intervals and routine audio customization
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Core Singletons
  const storage = new StorageManager();
  const settings = storage.getSettings();

  const routineManager = new RoutineManager(storage);
  const audioManager = new AudioManager(storage);
  const timerEngine = new TimerEngine();
  const customStudio = new CustomStudioEngine();
  const scheduler = new Scheduler(storage, routineManager);
  const statsTracker = new StatisticsTracker(storage);
  const ui = new UIController();

  // 2. Bind Timer Engine with Audio & Statistics
  audioManager.bindToTimerEngine(timerEngine);
  statsTracker.bindToTimerEngine(timerEngine);

  // Set initial theme
  document.documentElement.setAttribute('data-theme', settings.theme || 'dark');

  // 3. Initialize Active Routine & State
  let currentMode = settings.defaultMode || 'pomodoro';
  let routinesForMode = routineManager.getByMode(currentMode);
  let activeRoutine = routinesForMode[0] || routineManager.getAll()[0];

  if (activeRoutine) {
    timerEngine.loadRoutine(activeRoutine);
  }

  // 4. UI Rendering Initial State
  ui.updateHeaderDate();
  ui.renderRoutineOptions(routinesForMode, activeRoutine ? activeRoutine.id : null);
  ui.renderRoutinesList(routineManager.getAll(), routineManager);
  ui.renderWeeklyScheduler(scheduler, routineManager);
  ui.renderTodaySchedule(scheduler, routineManager);
  ui.renderStatistics(statsTracker);
  ui.updateTimer(timerEngine.getTimeData());

  // Restore audio settings in UI
  const musicSlider = document.getElementById('musicVolumeSlider');
  const notifSlider = document.getElementById('notifVolumeSlider');
  const audioToggle = document.getElementById('toggleAudioEngine');
  if (musicSlider) musicSlider.value = audioManager.musicVolume;
  if (notifSlider) notifSlider.value = audioManager.notificationVolume;
  if (audioToggle) audioToggle.checked = audioManager.audioEnabled;

  // 5. Timer Engine Event Listeners
  timerEngine.on('tick', (data) => {
    ui.updateTimer(data);
  });

  timerEngine.on('intervalChange', (data) => {
    ui.updateTimer(timerEngine.getTimeData());
  });

  timerEngine.on('stateChange', (data) => {
    ui.updateTimer(timerEngine.getTimeData());
    ui.renderStatistics(statsTracker);

    const quickStatus = document.getElementById('audioQuickStatusText');
    const quickIndicator = document.getElementById('audioQuickIndicator');
    const discIcon = document.getElementById('audioDiscIcon');

    if (data.state === 'running') {
      if (quickStatus) quickStatus.textContent = 'Session In Progress';
      if (quickIndicator) quickIndicator.className = 'status-indicator';
      if (discIcon) discIcon.classList.add('spinning');
    } else if (data.state === 'paused') {
      if (quickStatus) quickStatus.textContent = 'Session Paused';
      if (quickIndicator) quickIndicator.className = 'status-indicator paused';
      if (discIcon) discIcon.classList.remove('spinning');
    } else {
      if (quickStatus) quickStatus.textContent = 'Timer Idle';
      if (quickIndicator) quickIndicator.className = 'status-indicator paused';
      if (discIcon) discIcon.classList.remove('spinning');
    }
  });

  timerEngine.on('complete', (data) => {
    ui.updateTimer(timerEngine.getTimeData());
    ui.renderStatistics(statsTracker);
    alert(`Congratulations! You completed the "${data.routine.name}" routine!`);
  });

  // Handle Tab Visibility Changes to prevent drift
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      timerEngine.syncWithSystemTime();
    }
  });

  // 6. Audio Unlock & User Interaction
  const unlockAudio = () => {
    audioManager.initAudioContext();
    const btnUnlock = document.getElementById('btnUnlockAudio');
    if (btnUnlock) {
      btnUnlock.textContent = 'Unlocked';
      btnUnlock.style.borderColor = 'var(--status-success)';
      btnUnlock.style.color = 'var(--status-success)';
    }
  };

  document.getElementById('btnUnlockAudio')?.addEventListener('click', unlockAudio);
  document.addEventListener('click', () => {
    if (!audioManager.isAudioUnlocked) unlockAudio();
  }, { once: true });

  // 7. Mobile Responsive Drawer Navigation
  const sidebarEl = document.querySelector('.app-sidebar');
  const backdropEl = document.getElementById('sidebarBackdrop');
  const mobileToggleBtn = document.getElementById('mobileMenuToggle');

  const closeMobileDrawer = () => {
    if (sidebarEl) sidebarEl.classList.remove('drawer-open');
    if (backdropEl) backdropEl.classList.remove('active');
  };

  const openMobileDrawer = () => {
    if (sidebarEl) sidebarEl.classList.add('drawer-open');
    if (backdropEl) backdropEl.classList.add('active');
  };

  mobileToggleBtn?.addEventListener('click', () => {
    if (sidebarEl && sidebarEl.classList.contains('drawer-open')) {
      closeMobileDrawer();
    } else {
      openMobileDrawer();
    }
  });

  backdropEl?.addEventListener('click', closeMobileDrawer);

  // Navigation Tabs with auto-close for mobile
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      ui.switchTab(tab);
      closeMobileDrawer();

      if (tab === 'routines') {
        ui.renderRoutinesList(routineManager.getAll(), routineManager);
      } else if (tab === 'studio') {
        updateStudioTypeVisibility();
      } else if (tab === 'audiolib') {
        ui.renderAudioLibrary(audioManager.userTracks, activeAudioCatFilter, 'mainAudioLibraryContainer');
      } else if (tab === 'scheduler') {
        ui.renderWeeklyScheduler(scheduler, routineManager);
      } else if (tab === 'settings') {
        ui.renderAudioLibrary(audioManager.userTracks, activeAudioCatFilter, 'audio-lib-container');
      } else if (tab === 'statistics') {
        ui.renderStatistics(statsTracker);
      }
    });
  });

  document.getElementById('btnNavSchedule')?.addEventListener('click', () => {
    ui.switchTab('scheduler');
    ui.renderWeeklyScheduler(scheduler, routineManager);
  });

  // Theme Toggle Button
  const themeToggle = document.getElementById('themeToggleBtn');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      settings.theme = newTheme;
      storage.saveSettings(settings);
    });
  }

  // 8. Mode Switcher on Dashboard
  document.querySelectorAll('.mode-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;

      routinesForMode = routineManager.getByMode(currentMode);
      if (routinesForMode.length > 0) {
        activeRoutine = routinesForMode[0];
        timerEngine.loadRoutine(activeRoutine);
        ui.renderRoutineOptions(routinesForMode, activeRoutine.id);
        ui.updateTimer(timerEngine.getTimeData());
      }
    });
  });

  // Routine Selector Dropdown
  const selectRoutine = document.getElementById('selectActiveRoutine');
  if (selectRoutine) {
    selectRoutine.addEventListener('change', (e) => {
      const selected = routineManager.getById(e.target.value);
      if (selected) {
        activeRoutine = selected;
        timerEngine.loadRoutine(activeRoutine);
        ui.updateTimer(timerEngine.getTimeData());
      }
    });
  }

  // 9. Timer Controls
  document.getElementById('btnTimerMain')?.addEventListener('click', () => {
    unlockAudio();
    if (timerEngine.state === 'running') {
      timerEngine.pause();
    } else if (timerEngine.state === 'paused') {
      timerEngine.resume();
    } else {
      timerEngine.start();
    }
  });

  document.getElementById('btnTimerSkip')?.addEventListener('click', () => {
    unlockAudio();
    timerEngine.skip();
  });

  document.getElementById('btnTimerReset')?.addEventListener('click', () => {
    timerEngine.reset();
  });

  document.getElementById('btnTimerStop')?.addEventListener('click', () => {
    timerEngine.stop();
  });

  // 10. Audio Controls (Volume & Mute)
  if (musicSlider) {
    musicSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      audioManager.setMusicVolume(val);
      settings.musicVolume = val;
      storage.saveSettings(settings);
    });
  }

  if (notifSlider) {
    notifSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      audioManager.setNotificationVolume(val);
      settings.notificationVolume = val;
      storage.saveSettings(settings);
    });
  }

  if (audioToggle) {
    audioToggle.addEventListener('change', (e) => {
      audioManager.setAudioEnabled(e.target.checked);
      settings.audioEnabled = e.target.checked;
      storage.saveSettings(settings);
    });
  }

  // Custom Audio Upload Handling
  const btnUpload = document.getElementById('btnUploadTrack');
  const inputUpload = document.getElementById('inputAudioUpload');

  if (btnUpload && inputUpload) {
    btnUpload.addEventListener('click', () => inputUpload.click());

    inputUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        unlockAudio();
        const track = await audioManager.uploadUserTrack(file);
        if (track) {
          audioManager.selectTrack(track);
          const titleEl = document.getElementById('audioCurrentTrackTitle');
          const subEl = document.getElementById('audioCurrentTrackSub');
          if (titleEl) titleEl.textContent = track.name;
          if (subEl) subEl.textContent = 'Custom User Track';
          _populateRoutineAudioSelectors();
          alert(`Successfully loaded custom audio track: ${track.name}`);
        }
      }
    });
  }

  // Load previously saved tracks from IndexedDB
  await audioManager.loadUserTracks();
  let activeAudioCatFilter = 'all';

  if (audioManager.userTracks.length > 0) {
    const latest = audioManager.userTracks[audioManager.userTracks.length - 1];
    audioManager.selectTrack(latest);
    const titleEl = document.getElementById('audioCurrentTrackTitle');
    const subEl = document.getElementById('audioCurrentTrackSub');
    if (titleEl) titleEl.textContent = latest.name;
    if (subEl) subEl.textContent = 'Custom User Track (Saved)';
  }

  // --- Unified Custom Timer Studio Logic ---
  let selectedStudioType = 'countdown';

  function updateStudioTypeVisibility() {
    const typeSelect = document.getElementById('studioTimerTypeSelect');
    selectedStudioType = typeSelect ? typeSelect.value : 'countdown';

    const helpEl = document.getElementById('studioTypeHelpText');
    const displayCard = document.getElementById('studioActiveTimerDisplayCard');
    const cdFields = document.getElementById('studioFieldsCountdown');
    const repFields = document.getElementById('studioFieldsRepeating');
    const clkFields = document.getElementById('studioFieldsClock');

    if (selectedStudioType === 'countdown') {
      if (helpEl) helpEl.textContent = 'Targeted countdown for focused work blocks, tests, or cooking.';
      if (displayCard) displayCard.style.display = 'block';
      if (cdFields) cdFields.style.display = 'block';
      if (repFields) repFields.style.display = 'none';
      if (clkFields) clkFields.style.display = 'none';
      ui.renderStudioUnifiedTimer('countdown', customStudio.getCountdownState());
    } else if (selectedStudioType === 'repeating') {
      if (helpEl) helpEl.textContent = 'Recurring alerts for hydration, posture checks, or eye rest.';
      if (displayCard) displayCard.style.display = 'block';
      if (cdFields) cdFields.style.display = 'none';
      if (repFields) repFields.style.display = 'block';
      if (clkFields) clkFields.style.display = 'none';
      ui.renderStudioUnifiedTimer('repeating', customStudio.getRepeatingState());
    } else if (selectedStudioType === 'clock') {
      if (helpEl) helpEl.textContent = 'Triggers real-time alerts aligned with wall-clock hourly minutes or fixed daily times.';
      if (displayCard) displayCard.style.display = 'none';
      if (cdFields) cdFields.style.display = 'none';
      if (repFields) repFields.style.display = 'none';
      if (clkFields) clkFields.style.display = 'block';
      ui.renderClockAlarms(customStudio.getClockAlarms());
    }
  }

  document.getElementById('studioTimerTypeSelect')?.addEventListener('change', updateStudioTypeVisibility);

  // Studio Timer Engine Listeners
  customStudio.on('countdown:tick', (state) => {
    if (selectedStudioType === 'countdown') ui.renderStudioUnifiedTimer('countdown', state);
  });
  customStudio.on('countdown:update', (state) => {
    if (selectedStudioType === 'countdown') ui.renderStudioUnifiedTimer('countdown', state);
  });
  customStudio.on('countdown:start', (state) => {
    if (selectedStudioType === 'countdown') ui.renderStudioUnifiedTimer('countdown', state);
  });
  customStudio.on('countdown:pause', (state) => {
    if (selectedStudioType === 'countdown') ui.renderStudioUnifiedTimer('countdown', state);
  });
  customStudio.on('countdown:complete', (state) => {
    if (selectedStudioType === 'countdown') ui.renderStudioUnifiedTimer('countdown', state);
    audioManager.playIntervalCompleteChime();
    ui.showNotificationBanner(`Countdown Complete: ${state.title}`, 'Your countdown timer has finished.', () => {});
  });

  customStudio.on('repeating:tick', (state) => {
    if (selectedStudioType === 'repeating') ui.renderStudioUnifiedTimer('repeating', state);
  });
  customStudio.on('repeating:update', (state) => {
    if (selectedStudioType === 'repeating') ui.renderStudioUnifiedTimer('repeating', state);
  });
  customStudio.on('repeating:start', (state) => {
    if (selectedStudioType === 'repeating') ui.renderStudioUnifiedTimer('repeating', state);
  });
  customStudio.on('repeating:pause', (state) => {
    if (selectedStudioType === 'repeating') ui.renderStudioUnifiedTimer('repeating', state);
  });
  customStudio.on('repeating:cycle_complete', (state) => {
    audioManager.playRestBeep();
  });
  customStudio.on('repeating:complete', (state) => {
    if (selectedStudioType === 'repeating') ui.renderStudioUnifiedTimer('repeating', state);
    audioManager.playRoutineCompleteFanfare();
    ui.showNotificationBanner(`Repeating Alert Finished: ${state.title}`, 'All repetitions have been completed.', () => {});
  });

  // Unified Start / Pause / Resume Control
  document.getElementById('btnStudioStart')?.addEventListener('click', () => {
    unlockAudio();
    if (selectedStudioType === 'countdown') {
      const state = customStudio.countdown.state;
      if (state === 'running') {
        customStudio.pauseCountdown();
      } else if (state === 'paused') {
        customStudio.resumeCountdown();
      } else {
        customStudio.startCountdown();
      }
    } else if (selectedStudioType === 'repeating') {
      const state = customStudio.repeating.state;
      if (state === 'running') {
        customStudio.pauseRepeating();
      } else if (state === 'paused') {
        customStudio.resumeRepeating();
      } else {
        customStudio.startRepeating();
      }
    }
  });

  document.getElementById('btnStudioReset')?.addEventListener('click', () => {
    if (selectedStudioType === 'countdown') {
      customStudio.resetCountdown();
    } else if (selectedStudioType === 'repeating') {
      customStudio.resetRepeating();
    }
  });

  document.getElementById('btnStudioStop')?.addEventListener('click', () => {
    if (selectedStudioType === 'countdown') {
      customStudio.stopCountdown();
    } else if (selectedStudioType === 'repeating') {
      customStudio.stopRepeating();
    }
  });

  // Apply Countdown Configuration
  document.getElementById('btnApplyStudioCd')?.addEventListener('click', () => {
    const title = document.getElementById('studioCdName')?.value.trim() || 'Countdown';
    const h = parseInt(document.getElementById('studioCdHours')?.value, 10) || 0;
    const m = parseInt(document.getElementById('studioCdMins')?.value, 10) || 0;
    const s = parseInt(document.getElementById('studioCdSecs')?.value, 10) || 0;
    const sound = document.getElementById('studioCdSound')?.value || 'chime';
    const durSec = Math.max(1, h * 3600 + m * 60 + s);

    customStudio.configureCountdown({ title, durationSeconds: durSec, sound });
    ui.showNotificationBanner('Countdown Configured', `Set to ${title} (${h > 0 ? h + 'h ' : ''}${m}m ${s}s).`, () => {});
  });

  // Apply Repeating Configuration
  document.getElementById('btnApplyStudioRep')?.addEventListener('click', () => {
    const title = document.getElementById('studioRepName')?.value.trim() || 'Repeating Alert';
    const h = parseInt(document.getElementById('studioRepHours')?.value, 10) || 0;
    const m = parseInt(document.getElementById('studioRepMins')?.value, 10) || 0;
    const s = parseInt(document.getElementById('studioRepSecs')?.value, 10) || 0;
    const cycles = parseInt(document.getElementById('studioRepCycles')?.value, 10) || 0;
    const sound = document.getElementById('studioRepSound')?.value || 'bell';
    const durSec = Math.max(1, h * 3600 + m * 60 + s);

    customStudio.configureRepeating({ title, intervalSeconds: durSec, totalCycles: cycles, sound });
    ui.showNotificationBanner('Repeating Timer Configured', `Set to ${title} every ${m}m ${s}s.`, () => {});
  });

  // Clock Alarms Handling
  customStudio.loadClockAlarms([
    { id: 'al_hourly_stand', label: 'Stand & Stretch', type: 'hourly', minute: 50, sound: 'bell', soundCategory: 'Notification Sounds', enabled: true },
    { id: 'al_daily_lunch', label: 'Midday Reset', type: 'daily', time: '12:00', sound: 'chime', soundCategory: 'Notification Sounds', enabled: true }
  ]);

  customStudio.on('alarms:change', (alarms) => {
    ui.renderClockAlarms(alarms);
  });

  customStudio.on('alarm:trigger', (alarm) => {
    audioManager.playIntervalCompleteChime();
    ui.showNotificationBanner(
      `Alarm Triggered: ${alarm.label}`,
      `Wall-clock scheduled alert fired at ${alarm.type === 'hourly' ? ':' + alarm.minute : alarm.time}.`,
      () => {}
    );
  });

  // Inline New Alarm Form Toggle
  document.getElementById('btnToggleNewAlarmForm')?.addEventListener('click', () => {
    const form = document.getElementById('studioNewAlarmFormContainer');
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('btnCancelNewAlarm')?.addEventListener('click', () => {
    const form = document.getElementById('studioNewAlarmFormContainer');
    if (form) form.style.display = 'none';
  });

  document.getElementById('newAlarmScheduleType')?.addEventListener('change', (e) => {
    const isHourly = e.target.value === 'hourly';
    document.getElementById('groupAlarmMinuteInput').style.display = isHourly ? 'block' : 'none';
    document.getElementById('groupAlarmTimeInput').style.display = isHourly ? 'none' : 'block';
  });

  document.getElementById('btnSaveNewAlarm')?.addEventListener('click', () => {
    const name = document.getElementById('newAlarmName')?.value.trim() || 'Alarm';
    const type = document.getElementById('newAlarmScheduleType')?.value || 'hourly';
    const sound = document.getElementById('newAlarmSound')?.value || 'bell';
    const minute = parseInt(document.getElementById('newAlarmMinuteValue')?.value, 10) || 0;
    const time = document.getElementById('newAlarmTimeValue')?.value || '09:30';

    customStudio.addClockAlarm({
      label: name,
      type,
      minute,
      time,
      sound,
      soundCategory: 'Notification Sounds'
    });

    document.getElementById('studioNewAlarmFormContainer').style.display = 'none';
    document.getElementById('newAlarmName').value = '';
  });

  document.getElementById('clockAlarmsListContainer')?.addEventListener('click', (e) => {
    const toggle = e.target.closest('.toggle-clock-alarm');
    if (toggle) {
      customStudio.toggleClockAlarm(toggle.dataset.id);
      return;
    }
    const del = e.target.closest('.btn-delete-alarm');
    if (del) {
      customStudio.deleteClockAlarm(del.dataset.id);
      return;
    }
  });

  // Sound selectors preview button helper
  document.addEventListener('click', (e) => {
    const previewBtn = e.target.closest('.btn-preview-sound-select');
    if (previewBtn) {
      const selectId = previewBtn.dataset.select;
      const selectEl = document.getElementById(selectId);
      if (selectEl) {
        unlockAudio();
        const soundKey = selectEl.value;
        if (soundKey === 'chime') audioManager.playIntervalCompleteChime();
        else if (soundKey === 'bell') audioManager._playTone({ freq: 659, type: 'sine', duration: 0.4 });
        else if (soundKey === 'digital') audioManager._playTone({ freq: 880, type: 'square', duration: 0.15 });
        else if (soundKey === 'warning') audioManager.playWarningBeep();
        else {
          const track = audioManager.getTrackById(soundKey);
          if (track) audioManager.playPreview(track);
        }
      }
    }
  });

  // --- Wire Audio Library (Dedicated Tab + Settings) ---
  const modalAddAudio = document.getElementById('modalAddAudio');
  const btnOpenAddAudio = document.getElementById('btnOpenAddAudioModal');
  const btnCloseAddAudio = document.getElementById('btnCloseAddAudioModal');
  const btnCancelAddAudio = document.getElementById('btnCancelAddAudioModal');
  const btnConfirmAddAudio = document.getElementById('btnConfirmAddAudioModal');
  const inputAudioFile = document.getElementById('addAudioFileInput');
  const selectAudioCat = document.getElementById('addAudioCategorySelect');

  btnOpenAddAudio?.addEventListener('click', () => {
    if (modalAddAudio) modalAddAudio.classList.add('active');
  });

  const closeAddAudioModal = () => {
    if (modalAddAudio) modalAddAudio.classList.remove('active');
    if (inputAudioFile) inputAudioFile.value = '';
  };

  btnCloseAddAudio?.addEventListener('click', closeAddAudioModal);
  btnCancelAddAudio?.addEventListener('click', closeAddAudioModal);

  btnConfirmAddAudio?.addEventListener('click', async () => {
    const file = inputAudioFile?.files[0];
    const category = selectAudioCat?.value || 'Custom Sounds';

    if (!file) {
      alert('Please select an audio file first.');
      return;
    }

    unlockAudio();
    const track = await audioManager.uploadUserTrack(file, category);
    closeAddAudioModal();

    if (track) {
      ui.renderAudioLibrary(audioManager.userTracks, activeAudioCatFilter, 'mainAudioLibraryContainer');
      ui.renderAudioLibrary(audioManager.userTracks, activeAudioCatFilter, 'audio-lib-container');
      _populateRoutineAudioSelectors();
      ui.showNotificationBanner('Audio Added', `Successfully saved "${track.name}" to ${category}.`, () => {});
    }
  });

  // Filter chips in both main audio lib and settings
  document.querySelectorAll('.audio-lib-filter-bar').forEach(bar => {
    bar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (chip) {
        bar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeAudioCatFilter = chip.dataset.cat;
        ui.renderAudioLibrary(audioManager.userTracks, activeAudioCatFilter, 'mainAudioLibraryContainer');
        ui.renderAudioLibrary(audioManager.userTracks, activeAudioCatFilter, 'audio-lib-container');
      }
    });
  });

  // Audio track card delegations (mainAudioLibraryContainer and audio-lib-container)
  ['mainAudioLibraryContainer', 'audio-lib-container'].forEach(containerId => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', async (e) => {
      const previewBtn = e.target.closest('.btn-preview-track');
      if (previewBtn) {
        const track = audioManager.getTrackById(previewBtn.dataset.id);
        if (track) {
          if (audioManager.isPreviewPlaying) {
            audioManager.stopPreview();
            previewBtn.textContent = 'Preview';
          } else {
            await audioManager.playPreview(track);
            previewBtn.textContent = 'Stop';
          }
        }
        return;
      }

      const renameBtn = e.target.closest('.btn-rename-track');
      if (renameBtn) {
        const track = audioManager.getTrackById(renameBtn.dataset.id);
        if (track) {
          const newName = prompt('Enter new track name:', track.name);
          if (newName && newName.trim()) {
            await audioManager.updateTrackMetadata(track.id, { name: newName.trim() });
            ui.renderAudioLibrary(audioManager.userTracks, activeAudioCatFilter, 'mainAudioLibraryContainer');
            ui.renderAudioLibrary(audioManager.userTracks, activeAudioCatFilter, 'audio-lib-container');
            _populateRoutineAudioSelectors();
          }
        }
        return;
      }

      const delBtn = e.target.closest('.btn-delete-track');
      if (delBtn) {
        if (confirm('Delete this track permanently from IndexedDB?')) {
          await audioManager.deleteTrack(delBtn.dataset.id);
          ui.renderAudioLibrary(audioManager.userTracks, activeAudioCatFilter, 'mainAudioLibraryContainer');
          ui.renderAudioLibrary(audioManager.userTracks, activeAudioCatFilter, 'audio-lib-container');
          _populateRoutineAudioSelectors();
        }
        return;
      }
    });

    container.addEventListener('change', async (e) => {
      const selectCat = e.target.closest('.select-track-category');
      if (selectCat) {
        await audioManager.updateTrackMetadata(selectCat.dataset.id, { category: selectCat.value });
        ui.renderAudioLibrary(audioManager.userTracks, activeAudioCatFilter, 'mainAudioLibraryContainer');
        ui.renderAudioLibrary(audioManager.userTracks, activeAudioCatFilter, 'audio-lib-container');
        _populateRoutineAudioSelectors();
      }
    });
  });

  function _populateRoutineAudioSelectors() {
    const workMusicSelect = document.getElementById('routineWorkMusicSelect');
    const restMusicSelect = document.getElementById('routineRestMusicSelect');
    const workStartSoundSelect = document.getElementById('routineWorkStartSoundSelect');
    const restStartSoundSelect = document.getElementById('routineRestStartSoundSelect');
    const completionSoundSelect = document.getElementById('routineCompletionSoundSelect');

    const studioCdSound = document.getElementById('studioCdSound');
    const studioRepSound = document.getElementById('studioRepSound');
    const newAlarmSound = document.getElementById('newAlarmSound');

    const defaultWorkSelect = document.getElementById('settingsSelectDefaultWorkMusic');
    const defaultRestSelect = document.getElementById('settingsSelectDefaultRestMusic');

    const userTracks = audioManager.userTracks || [];

    // Helper for notification sounds (built-ins + uploaded)
    const populateNotificationSelect = (sel, defaultLabel = 'Default Tone') => {
      if (!sel) return;
      const cur = sel.value;
      sel.innerHTML = `
        <option value="default">${defaultLabel}</option>
        <option value="chime">Chime (Harmonic)</option>
        <option value="bell">Soft Bell</option>
        <option value="digital">Digital Beep</option>
        <option value="warning">Warning Pulse</option>
        <option value="fanfare">Completion Fanfare</option>
        <option value="none">None / Silent</option>
      `;

      if (userTracks.length > 0) {
        const optGroup = document.createElement('optgroup');
        optGroup.label = 'Custom Uploaded Tracks';
        userTracks.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = `${t.name} (${t.category || 'Sound'})`;
          optGroup.appendChild(opt);
        });
        sel.appendChild(optGroup);
      }
      if (cur) sel.value = cur;
    };

    // Helper for background music selects
    const populateMusicSelect = (sel, isRest = false) => {
      if (!sel) return;
      const cur = sel.value;
      sel.innerHTML = '';

      if (isRest) {
        const pauseOpt = document.createElement('option');
        pauseOpt.value = 'none';
        pauseOpt.textContent = 'Pause Music (Silent Rest)';
        sel.appendChild(pauseOpt);
      } else {
        const noneOpt = document.createElement('option');
        noneOpt.value = 'none';
        noneOpt.textContent = 'None / Silent';
        sel.appendChild(noneOpt);
      }

      const ambientOpt = document.createElement('option');
      ambientOpt.value = 'ambient_focus';
      ambientOpt.textContent = 'Ambient Focus (Built-in Synth)';
      sel.appendChild(ambientOpt);

      if (userTracks.length > 0) {
        const optGroup = document.createElement('optgroup');
        optGroup.label = 'Custom Uploaded Music';
        userTracks.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = `${t.name} (${t.category || 'Music'})`;
          optGroup.appendChild(opt);
        });
        sel.appendChild(optGroup);
      }

      if (cur) sel.value = cur;
    };

    populateNotificationSelect(workStartSoundSelect, 'Default Start Beep');
    populateNotificationSelect(restStartSoundSelect, 'Default Rest Beep');
    populateNotificationSelect(completionSoundSelect, 'Default Fanfare');
    populateNotificationSelect(studioCdSound, 'Chime (Harmonic)');
    populateNotificationSelect(studioRepSound, 'Soft Bell');
    populateNotificationSelect(newAlarmSound, 'Soft Bell');

    populateMusicSelect(workMusicSelect, false);
    populateMusicSelect(restMusicSelect, true);
    populateMusicSelect(defaultWorkSelect, false);
    populateMusicSelect(defaultRestSelect, true);
  }

  _populateRoutineAudioSelectors();

  // 11. Routine Editor Modal & Management
  const modalRoutine = document.getElementById('modalRoutineEditor');
  const btnCloseRoutine = document.getElementById('btnCloseRoutineModal');
  const btnCancelRoutine = document.getElementById('btnCancelRoutineModal');
  const btnSaveRoutine = document.getElementById('btnSaveRoutineModal');

  const openRoutineEditor = (routineToEdit = null) => {
    _populateRoutineAudioSelectors();
    document.getElementById('modalRoutineTitle').textContent = routineToEdit ? 'Edit Routine' : 'Create Routine';
    document.getElementById('routineEditorId').value = routineToEdit ? routineToEdit.id : '';
    document.getElementById('routineEditorName').value = routineToEdit ? routineToEdit.name : '';
    const modeSelect = document.getElementById('routineEditorMode');
    modeSelect.value = routineToEdit ? routineToEdit.mode : currentMode;

    const audioCfg = routineToEdit && routineToEdit.audioConfig ? routineToEdit.audioConfig : {};
    const workMusicEl = document.getElementById('routineWorkMusicSelect');
    const restMusicEl = document.getElementById('routineRestMusicSelect');
    const workSoundEl = document.getElementById('routineWorkStartSoundSelect');
    const restSoundEl = document.getElementById('routineRestStartSoundSelect');
    const compSoundEl = document.getElementById('routineCompletionSoundSelect');

    if (workMusicEl) workMusicEl.value = audioCfg.workMusic || 'ambient_focus';
    if (restMusicEl) restMusicEl.value = audioCfg.restMusic || 'none';
    if (workSoundEl) workSoundEl.value = audioCfg.workStartSound || 'default';
    if (restSoundEl) restSoundEl.value = audioCfg.restStartSound || 'default';
    if (compSoundEl) compSoundEl.value = audioCfg.completionSound || 'default';

    _updateEditorModeFields(modeSelect.value, routineToEdit ? routineToEdit.config : null);
    modalRoutine.classList.add('active');
  };

  const closeRoutineEditor = () => {
    modalRoutine.classList.remove('active');
  };

  btnCloseRoutine?.addEventListener('click', closeRoutineEditor);
  btnCancelRoutine?.addEventListener('click', closeRoutineEditor);

  document.getElementById('btnHeaderNewRoutine')?.addEventListener('click', () => openRoutineEditor());
  document.getElementById('btnCreateNewRoutine')?.addEventListener('click', () => openRoutineEditor());

  document.getElementById('btnEditActiveRoutine')?.addEventListener('click', () => {
    if (activeRoutine) openRoutineEditor(activeRoutine);
  });

  document.getElementById('routineEditorMode')?.addEventListener('change', (e) => {
    _updateEditorModeFields(e.target.value);
  });

  function _updateEditorModeFields(mode, existingConfig = null) {
    const pomoFields = document.getElementById('routineEditorPomodoroFields');
    const exFields = document.getElementById('routineEditorExerciseFields');
    const tradingFields = document.getElementById('routineEditorTradingFields');

    pomoFields.style.display = (mode === 'pomodoro') ? 'block' : 'none';
    exFields.style.display = (mode === 'exercise') ? 'block' : 'none';
    tradingFields.style.display = (mode === 'trading' || mode === 'study') ? 'block' : 'none';

    if (mode === 'pomodoro') {
      const focusSec = existingConfig ? (existingConfig.focusDuration || 1500) : 3000;
      const sBreakSec = existingConfig ? (existingConfig.shortBreakDuration || 300) : 600;
      const lBreakSec = existingConfig ? (existingConfig.longBreakDuration || 1800) : 1800;

      document.getElementById('routineFocusMins').value = Math.floor(focusSec / 60);
      document.getElementById('routineFocusSecs').value = focusSec % 60;
      document.getElementById('routineShortBreakMins').value = Math.floor(sBreakSec / 60);
      document.getElementById('routineShortBreakSecs').value = sBreakSec % 60;
      document.getElementById('routineLongBreakMins').value = Math.floor(lBreakSec / 60);
      document.getElementById('routineLongBreakSecs').value = lBreakSec % 60;

      document.getElementById('routineSessionsBeforeLong').value = existingConfig ? (existingConfig.sessionsBeforeLongBreak || 4) : 4;
      document.getElementById('routinePomodoroCycles').value = existingConfig ? (existingConfig.totalCycles !== undefined ? existingConfig.totalCycles : 1) : 1;
    } else if (mode === 'exercise') {
      document.getElementById('routineExercisePrep').value = existingConfig ? (existingConfig.prepDuration || 10) : 10;
      document.getElementById('routineExerciseRoundRest').value = existingConfig ? (existingConfig.roundRestDuration || 60) : 60;
      document.getElementById('routineExerciseRounds').value = existingConfig ? (existingConfig.rounds !== undefined ? existingConfig.rounds : 4) : 4;

      const exercises = existingConfig && existingConfig.exercises ? existingConfig.exercises : [
        { name: 'Jumping Jacks', workDuration: 45, restDuration: 10 },
        { name: 'Push-ups', workDuration: 45, restDuration: 10 }
      ];
      _renderExerciseRowInputs(exercises);
    } else if (mode === 'trading' || mode === 'study') {
      document.getElementById('routineTradingCycles').value = existingConfig ? (existingConfig.totalCycles !== undefined ? existingConfig.totalCycles : 1) : 1;
      const intervals = existingConfig && existingConfig.intervals ? existingConfig.intervals : [
        { name: 'Deep Focus / Analysis', duration: 30 * 60, type: 'work' },
        { name: 'Short Rest', duration: 5 * 60, type: 'rest' }
      ];
      _renderTradingRowInputs(intervals);
    }
  }

  function _renderExerciseRowInputs(exercises) {
    const container = document.getElementById('exerciseListBuilder');
    container.innerHTML = '';
    exercises.forEach((ex) => {
      const row = document.createElement('div');
      row.className = 'interval-row-item';
      row.innerHTML = `
        <input type="text" class="ex-name" placeholder="Exercise Name" value="${ex.name || ''}" style="flex:2;" required>
        <div style="display:flex; align-items:center; gap:4px;">
          <input type="number" class="ex-work" placeholder="Work (s)" value="${ex.workDuration || 45}" style="width:75px;" min="1" max="3600" required>
          <span style="font-size:0.75rem; color:var(--text-muted);">work</span>
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <input type="number" class="ex-rest" placeholder="Rest (s)" value="${ex.restDuration || 10}" style="width:75px;" min="0" max="3600" required>
          <span style="font-size:0.75rem; color:var(--text-muted);">rest</span>
        </div>
        <button type="button" class="btn-icon btn-remove-row" style="color:var(--status-danger);">&times;</button>
      `;
      row.querySelector('.btn-remove-row').onclick = () => row.remove();
      container.appendChild(row);
    });
  }

  function _renderTradingRowInputs(intervals) {
    const container = document.getElementById('tradingListBuilder');
    container.innerHTML = '';
    intervals.forEach((step) => {
      const row = document.createElement('div');
      row.className = 'interval-row-item';
      const dur = step.duration || 1800;
      const mins = Math.floor(dur / 60);
      const secs = dur % 60;

      row.innerHTML = `
        <input type="text" class="step-name" placeholder="Step Name" value="${step.name || ''}" style="flex:2;" required>
        <div style="display:flex; align-items:center; gap:4px;">
          <input type="number" class="step-mins" placeholder="M" value="${mins}" style="width:55px;" min="0" max="300" required>
          <span style="font-size:0.75rem; color:var(--text-muted);">m</span>
          <input type="number" class="step-secs" placeholder="S" value="${secs}" style="width:55px;" min="0" max="59" required>
          <span style="font-size:0.75rem; color:var(--text-muted);">s</span>
        </div>
        <select class="step-type" style="width:85px;">
          <option value="work" ${step.type === 'work' ? 'selected' : ''}>Work</option>
          <option value="rest" ${step.type === 'rest' ? 'selected' : ''}>Break</option>
        </select>
        <button type="button" class="btn-icon btn-remove-row" style="color:var(--status-danger);">&times;</button>
      `;
      row.querySelector('.btn-remove-row').onclick = () => row.remove();
      container.appendChild(row);
    });
  }

  document.getElementById('btnAddExerciseRow')?.addEventListener('click', () => {
    const container = document.getElementById('exerciseListBuilder');
    const row = document.createElement('div');
    row.className = 'interval-row-item';
    row.innerHTML = `
      <input type="text" class="ex-name" placeholder="Exercise Name" value="New Exercise" style="flex:2;" required>
      <div style="display:flex; align-items:center; gap:4px;">
        <input type="number" class="ex-work" value="45" style="width:75px;" min="1" max="3600" required>
        <span style="font-size:0.75rem; color:var(--text-muted);">work</span>
      </div>
      <div style="display:flex; align-items:center; gap:4px;">
        <input type="number" class="ex-rest" value="15" style="width:75px;" min="0" max="3600" required>
        <span style="font-size:0.75rem; color:var(--text-muted);">rest</span>
      </div>
      <button type="button" class="btn-icon btn-remove-row" style="color:var(--status-danger);">&times;</button>
    `;
    row.querySelector('.btn-remove-row').onclick = () => row.remove();
    container.appendChild(row);
  });

  document.getElementById('btnAddTradingRow')?.addEventListener('click', () => {
    const container = document.getElementById('tradingListBuilder');
    const row = document.createElement('div');
    row.className = 'interval-row-item';
    row.innerHTML = `
      <input type="text" class="step-name" placeholder="Step Name" value="New Step" style="flex:2;" required>
      <div style="display:flex; align-items:center; gap:4px;">
        <input type="number" class="step-mins" value="25" style="width:55px;" min="0" max="300" required>
        <span style="font-size:0.75rem; color:var(--text-muted);">m</span>
        <input type="number" class="step-secs" value="0" style="width:55px;" min="0" max="59" required>
        <span style="font-size:0.75rem; color:var(--text-muted);">s</span>
      </div>
      <select class="step-type" style="width:85px;">
        <option value="work">Work</option>
        <option value="rest">Break</option>
      </select>
      <button type="button" class="btn-icon btn-remove-row" style="color:var(--status-danger);">&times;</button>
    `;
    row.querySelector('.btn-remove-row').onclick = () => row.remove();
    container.appendChild(row);
  });

  // Save routine from modal
  btnSaveRoutine?.addEventListener('click', () => {
    const id = document.getElementById('routineEditorId').value;
    const name = document.getElementById('routineEditorName').value.trim() || 'Untitled Routine';
    const mode = document.getElementById('routineEditorMode').value;

    const workMusic = document.getElementById('routineWorkMusicSelect')?.value || 'ambient_focus';
    const restMusic = document.getElementById('routineRestMusicSelect')?.value || 'none';
    const workStartSound = document.getElementById('routineWorkStartSoundSelect')?.value || 'default';
    const restStartSound = document.getElementById('routineRestStartSoundSelect')?.value || 'default';
    const completionSound = document.getElementById('routineCompletionSoundSelect')?.value || 'default';

    let config = {};

    if (mode === 'pomodoro') {
      const fM = parseInt(document.getElementById('routineFocusMins').value) || 0;
      const fS = parseInt(document.getElementById('routineFocusSecs').value) || 0;
      const sbM = parseInt(document.getElementById('routineShortBreakMins').value) || 0;
      const sbS = parseInt(document.getElementById('routineShortBreakSecs').value) || 0;
      const lbM = parseInt(document.getElementById('routineLongBreakMins').value) || 0;
      const lbS = parseInt(document.getElementById('routineLongBreakSecs').value) || 0;

      config = {
        focusDuration: Math.max(1, fM * 60 + fS),
        shortBreakDuration: Math.max(1, sbM * 60 + sbS),
        longBreakDuration: Math.max(1, lbM * 60 + lbS),
        sessionsBeforeLongBreak: parseInt(document.getElementById('routineSessionsBeforeLong').value) || 4,
        totalCycles: parseInt(document.getElementById('routinePomodoroCycles').value) || 1,
        autoTransitions: true,
        musicOnFocus: true
      };
    } else if (mode === 'exercise') {
      const rows = document.querySelectorAll('#exerciseListBuilder .interval-row-item');
      const exercises = [];
      rows.forEach(r => {
        const exName = r.querySelector('.ex-name').value.trim() || 'Exercise';
        const work = Math.max(1, parseInt(r.querySelector('.ex-work').value) || 45);
        const rest = Math.max(0, parseInt(r.querySelector('.ex-rest').value) || 15);
        exercises.push({ name: exName, workDuration: work, restDuration: rest });
      });

      config = {
        prepDuration: parseInt(document.getElementById('routineExercisePrep').value) || 10,
        roundRestDuration: parseInt(document.getElementById('routineExerciseRoundRest').value) || 60,
        rounds: parseInt(document.getElementById('routineExerciseRounds').value) || 3,
        musicOnWork: true,
        exercises: exercises.length > 0 ? exercises : [{ name: 'Jumping Jacks', workDuration: 45, restDuration: 15 }]
      };
    } else if (mode === 'trading' || mode === 'study') {
      const rows = document.querySelectorAll('#tradingListBuilder .interval-row-item');
      const intervals = [];
      rows.forEach(r => {
        const stepName = r.querySelector('.step-name').value.trim() || 'Step';
        const sM = parseInt(r.querySelector('.step-mins').value) || 0;
        const sS = parseInt(r.querySelector('.step-secs').value) || 0;
        const dur = Math.max(1, sM * 60 + sS);
        const type = r.querySelector('.step-type').value;
        intervals.push({ name: stepName, duration: dur, type: type, music: type === 'work' });
      });

      config = {
        totalCycles: parseInt(document.getElementById('routineTradingCycles').value) || 1,
        autoTransitions: true,
        intervals: intervals.length > 0 ? intervals : [{ name: 'Deep Focus', duration: 1500, type: 'work', music: true }]
      };
    }

    const savedId = routineManager.saveRoutine({
      id: id || undefined,
      name,
      mode,
      audioConfig: {
        workMusic,
        restMusic,
        workStartSound,
        restStartSound,
        completionSound
      },
      config
    });

    closeRoutineEditor();

    routinesForMode = routineManager.getByMode(currentMode);
    ui.renderRoutinesList(routineManager.getAll(), routineManager);
    ui.renderRoutineOptions(routinesForMode, savedId);

    const savedRoutine = routineManager.getById(savedId);
    if (savedRoutine) {
      activeRoutine = savedRoutine;
      timerEngine.loadRoutine(activeRoutine);
      ui.updateTimer(timerEngine.getTimeData());
    }
  });

  // Routine Card Actions Event Delegation
  document.getElementById('routinesGrid')?.addEventListener('click', (e) => {
    const target = e.target;

    const runBtn = target.closest('.btn-load-routine');
    if (runBtn) {
      const routine = routineManager.getById(runBtn.dataset.id);
      if (routine) {
        activeRoutine = routine;
        currentMode = routine.mode === 'study' ? 'trading' : routine.mode;

        document.querySelectorAll('.mode-tab-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.mode === currentMode);
        });

        routinesForMode = routineManager.getByMode(currentMode);
        ui.renderRoutineOptions(routinesForMode, activeRoutine.id);
        timerEngine.loadRoutine(activeRoutine);
        ui.switchTab('dashboard');
        ui.updateTimer(timerEngine.getTimeData());
      }
      return;
    }

    const editBtn = target.closest('.btn-edit-routine');
    if (editBtn) {
      const routine = routineManager.getById(editBtn.dataset.id);
      if (routine) openRoutineEditor(routine);
      return;
    }

    const dupBtn = target.closest('.btn-duplicate-routine');
    if (dupBtn) {
      const copy = routineManager.duplicateRoutine(dupBtn.dataset.id);
      if (copy) {
        ui.renderRoutinesList(routineManager.getAll(), routineManager);
      }
      return;
    }

    const delBtn = target.closest('.btn-delete-routine');
    if (delBtn) {
      if (confirm('Are you sure you want to delete this routine?')) {
        routineManager.deleteRoutine(delBtn.dataset.id);
        ui.renderRoutinesList(routineManager.getAll(), routineManager);
      }
      return;
    }

    const favBtn = target.closest('.btn-icon.favorite');
    if (favBtn) {
      routineManager.toggleFavorite(favBtn.dataset.favId);
      ui.renderRoutinesList(routineManager.getAll(), routineManager);
      return;
    }
  });

  // 12. Weekly Scheduler Modal & Actions
  const modalSchedule = document.getElementById('modalScheduleEditor');
  const btnCloseSchedule = document.getElementById('btnCloseScheduleModal');
  const btnCancelSchedule = document.getElementById('btnCancelScheduleModal');
  const btnSaveSchedule = document.getElementById('btnSaveScheduleModal');

  const openScheduleModal = (dayKey = 'mon') => {
    document.getElementById('scheduleEditorDay').value = dayKey;
    const routineSelect = document.getElementById('scheduleEditorRoutine');
    routineSelect.innerHTML = '';
    routineManager.getAll().forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.name} (${r.mode})`;
      routineSelect.appendChild(opt);
    });
    modalSchedule.classList.add('active');
  };

  const closeScheduleModal = () => {
    modalSchedule.classList.remove('active');
  };

  btnCloseSchedule?.addEventListener('click', closeScheduleModal);
  btnCancelSchedule?.addEventListener('click', closeScheduleModal);

  document.getElementById('schedulerCalendar')?.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.btn-open-schedule-modal');
    if (addBtn) {
      openScheduleModal(addBtn.dataset.day);
      return;
    }

    const toggle = e.target.closest('.toggle-schedule-item');
    if (toggle) {
      scheduler.toggleSchedule(toggle.dataset.id);
      ui.renderWeeklyScheduler(scheduler, routineManager);
      ui.renderTodaySchedule(scheduler, routineManager);
      return;
    }

    const delBtn = e.target.closest('.btn-delete-schedule');
    if (delBtn) {
      scheduler.deleteSchedule(delBtn.dataset.id);
      ui.renderWeeklyScheduler(scheduler, routineManager);
      ui.renderTodaySchedule(scheduler, routineManager);
      return;
    }

    const runBtn = e.target.closest('.btn-run-schedule-now');
    if (runBtn) {
      const routine = routineManager.getById(runBtn.dataset.routineId);
      if (routine) {
        activeRoutine = routine;
        timerEngine.loadRoutine(activeRoutine);
        ui.switchTab('dashboard');
        ui.updateTimer(timerEngine.getTimeData());
      }
      return;
    }
  });

  btnSaveSchedule?.addEventListener('click', () => {
    const day = document.getElementById('scheduleEditorDay').value;
    const time = document.getElementById('scheduleEditorTime').value || '09:00';
    const routineId = document.getElementById('scheduleEditorRoutine').value;

    scheduler.addSchedule({ day, time, routineId, enabled: true });
    closeScheduleModal();
    ui.renderWeeklyScheduler(scheduler, routineManager);
    ui.renderTodaySchedule(scheduler, routineManager);
  });

  document.getElementById('todayScheduleList')?.addEventListener('click', (e) => {
    const runBtn = e.target.closest('.btn-run-today-item');
    if (runBtn) {
      const routine = routineManager.getById(runBtn.dataset.routineId);
      if (routine) {
        activeRoutine = routine;
        timerEngine.loadRoutine(activeRoutine);
        ui.updateTimer(timerEngine.getTimeData());
      }
    }
  });

  // Start Real-time Scheduler Monitoring Loop
  scheduler.startMonitoring(({ schedule, routine }) => {
    if (!routine) return;

    audioManager.playIntervalCompleteChime();

    ui.showNotificationBanner(
      `Scheduled Routine: ${routine.name}`,
      `It's ${schedule.time}. Ready to start your session?`,
      () => {
        activeRoutine = routine;
        timerEngine.loadRoutine(activeRoutine);
        ui.switchTab('dashboard');
        timerEngine.start();
      }
    );

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`TempoFlow: ${routine.name}`, {
        body: `It's time for your ${routine.name} routine!`,
        icon: 'assets/icons/icon.png'
      });
    }
  });

  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    document.addEventListener('click', () => {
      Notification.requestPermission().catch(() => {});
    }, { once: true });
  }

  // 13. Settings Page Form Handlers
  const selectTheme = document.getElementById('settingsSelectTheme');
  const selectDefaultMode = document.getElementById('settingsSelectDefaultMode');
  const toggleAutoTransitions = document.getElementById('settingsToggleAutoTransitions');
  const toggleWarning = document.getElementById('settingsToggleWarningCountdown');
  const selectNotifTone = document.getElementById('settingsSelectNotifTone');
  const selectDefaultWorkMusic = document.getElementById('settingsSelectDefaultWorkMusic');
  const selectDefaultRestMusic = document.getElementById('settingsSelectDefaultRestMusic');

  if (selectTheme) {
    selectTheme.value = settings.theme || 'dark';
    selectTheme.addEventListener('change', (e) => {
      document.documentElement.setAttribute('data-theme', e.target.value);
      settings.theme = e.target.value;
      storage.saveSettings(settings);
    });
  }

  if (selectDefaultMode) {
    selectDefaultMode.value = settings.defaultMode || 'pomodoro';
    selectDefaultMode.addEventListener('change', (e) => {
      settings.defaultMode = e.target.value;
      storage.saveSettings(settings);
    });
  }

  if (toggleAutoTransitions) {
    toggleAutoTransitions.checked = settings.autoTransitions !== false;
    toggleAutoTransitions.addEventListener('change', (e) => {
      settings.autoTransitions = e.target.checked;
      storage.saveSettings(settings);
    });
  }

  if (toggleWarning) {
    toggleWarning.checked = settings.warningCountdown !== false;
    toggleWarning.addEventListener('change', (e) => {
      settings.warningCountdown = e.target.checked;
      storage.saveSettings(settings);
    });
  }

  if (selectNotifTone) {
    selectNotifTone.value = settings.notificationSound || 'chime';
    selectNotifTone.addEventListener('change', (e) => {
      settings.notificationSound = e.target.value;
      storage.saveSettings(settings);
    });
  }

  if (selectDefaultWorkMusic) {
    selectDefaultWorkMusic.value = settings.defaultWorkMusic || 'ambient_focus';
    selectDefaultWorkMusic.addEventListener('change', (e) => {
      settings.defaultWorkMusic = e.target.value;
      storage.saveSettings(settings);
    });
  }

  if (selectDefaultRestMusic) {
    selectDefaultRestMusic.value = settings.defaultRestMusic || 'none';
    selectDefaultRestMusic.addEventListener('change', (e) => {
      settings.defaultRestMusic = e.target.value;
      storage.saveSettings(settings);
    });
  }

  // JSON Export & Import
  document.getElementById('btnExportData')?.addEventListener('click', () => {
    const backup = storage.exportAllData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `tempoflow_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  });

  const btnImportTrigger = document.getElementById('btnImportDataTrigger');
  const inputImport = document.getElementById('inputImportData');

  btnImportTrigger?.addEventListener('click', () => inputImport.click());

  inputImport?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = storage.importAllData(event.target.result);
        if (result.success) {
          alert('Data successfully imported! TempoFlow will now reload.');
          location.reload();
        } else {
          alert('Failed to import data: ' + result.error);
        }
      };
      reader.readAsText(file);
    }
  });
});
