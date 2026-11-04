/**
 * TEMPOFLOW - Main Application Orchestrator
 * Connects TimerEngine, AudioManager, RoutineManager, Scheduler, StatisticsTracker, and UIController
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Core Singletons
  const storage = new StorageManager();
  const settings = storage.getSettings();

  const routineManager = new RoutineManager(storage);
  const audioManager = new AudioManager(storage);
  const timerEngine = new TimerEngine();
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

  // 7. Navigation Tabs
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      ui.switchTab(tab);

      if (tab === 'routines') {
        ui.renderRoutinesList(routineManager.getAll(), routineManager);
      } else if (tab === 'scheduler') {
        ui.renderWeeklyScheduler(scheduler, routineManager);
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
          alert(`Successfully loaded custom audio track: ${track.name}`);
        }
      }
    });
  }

  // Load previously saved tracks from IndexedDB
  audioManager.loadUserTracks().then(tracks => {
    if (tracks.length > 0) {
      const latest = tracks[tracks.length - 1];
      audioManager.selectTrack(latest);
      const titleEl = document.getElementById('audioCurrentTrackTitle');
      const subEl = document.getElementById('audioCurrentTrackSub');
      if (titleEl) titleEl.textContent = latest.name;
      if (subEl) subEl.textContent = 'Custom User Track (Saved)';
    }
  });

  // 11. Routine Editor Modal & Management
  const modalRoutine = document.getElementById('modalRoutineEditor');
  const btnCloseRoutine = document.getElementById('btnCloseRoutineModal');
  const btnCancelRoutine = document.getElementById('btnCancelRoutineModal');
  const btnSaveRoutine = document.getElementById('btnSaveRoutineModal');

  const openRoutineEditor = (routineToEdit = null) => {
    document.getElementById('modalRoutineTitle').textContent = routineToEdit ? 'Edit Routine' : 'Create Routine';
    document.getElementById('routineEditorId').value = routineToEdit ? routineToEdit.id : '';
    document.getElementById('routineEditorName').value = routineToEdit ? routineToEdit.name : '';
    const modeSelect = document.getElementById('routineEditorMode');
    modeSelect.value = routineToEdit ? routineToEdit.mode : currentMode;

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

  // Mode switcher inside Routine Editor
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
      document.getElementById('routineFocusDuration').value = existingConfig ? Math.round((existingConfig.focusDuration || 1500) / 60) : 50;
      document.getElementById('routineShortBreakDuration').value = existingConfig ? Math.round((existingConfig.shortBreakDuration || 300) / 60) : 10;
      document.getElementById('routineLongBreakDuration').value = existingConfig ? Math.round((existingConfig.longBreakDuration || 1800) / 60) : 30;
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
    exercises.forEach((ex, idx) => {
      const row = document.createElement('div');
      row.className = 'interval-row-item';
      row.innerHTML = `
        <input type="text" class="ex-name" placeholder="Exercise Name" value="${ex.name || ''}" style="flex:2;" required>
        <div style="display:flex; align-items:center; gap:4px;">
          <input type="number" class="ex-work" placeholder="Work (s)" value="${ex.workDuration || 45}" style="width:75px;" min="5" max="300" required>
          <span style="font-size:0.75rem; color:var(--text-muted);">work</span>
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <input type="number" class="ex-rest" placeholder="Rest (s)" value="${ex.restDuration || 10}" style="width:75px;" min="0" max="300" required>
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
    intervals.forEach((step, idx) => {
      const row = document.createElement('div');
      row.className = 'interval-row-item';
      const mins = Math.round((step.duration || 1800) / 60);
      row.innerHTML = `
        <input type="text" class="step-name" placeholder="Step Name" value="${step.name || ''}" style="flex:2;" required>
        <div style="display:flex; align-items:center; gap:4px;">
          <input type="number" class="step-duration" placeholder="Mins" value="${mins}" style="width:70px;" min="1" max="300" required>
          <span style="font-size:0.75rem; color:var(--text-muted);">mins</span>
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
        <input type="number" class="ex-work" value="45" style="width:75px;" min="5" max="300" required>
        <span style="font-size:0.75rem; color:var(--text-muted);">work</span>
      </div>
      <div style="display:flex; align-items:center; gap:4px;">
        <input type="number" class="ex-rest" value="15" style="width:75px;" min="0" max="300" required>
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
        <input type="number" class="step-duration" value="25" style="width:70px;" min="1" max="300" required>
        <span style="font-size:0.75rem; color:var(--text-muted);">mins</span>
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

    let config = {};

    if (mode === 'pomodoro') {
      config = {
        focusDuration: (parseInt(document.getElementById('routineFocusDuration').value) || 25) * 60,
        shortBreakDuration: (parseInt(document.getElementById('routineShortBreakDuration').value) || 5) * 60,
        longBreakDuration: (parseInt(document.getElementById('routineLongBreakDuration').value) || 15) * 60,
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
        const work = parseInt(r.querySelector('.ex-work').value) || 45;
        const rest = parseInt(r.querySelector('.ex-rest').value) || 15;
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
        const dur = (parseInt(r.querySelector('.step-duration').value) || 25) * 60;
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
      config
    });

    closeRoutineEditor();

    // Reload routine in UI
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

    // Run routine
    const runBtn = target.closest('.btn-load-routine');
    if (runBtn) {
      const routine = routineManager.getById(runBtn.dataset.id);
      if (routine) {
        activeRoutine = routine;
        currentMode = routine.mode === 'study' ? 'trading' : routine.mode;

        // Switch to dashboard and load routine
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

    // Edit routine
    const editBtn = target.closest('.btn-edit-routine');
    if (editBtn) {
      const routine = routineManager.getById(editBtn.dataset.id);
      if (routine) openRoutineEditor(routine);
      return;
    }

    // Duplicate routine
    const dupBtn = target.closest('.btn-duplicate-routine');
    if (dupBtn) {
      const copy = routineManager.duplicateRoutine(dupBtn.dataset.id);
      if (copy) {
        ui.renderRoutinesList(routineManager.getAll(), routineManager);
      }
      return;
    }

    // Delete routine
    const delBtn = target.closest('.btn-delete-routine');
    if (delBtn) {
      if (confirm('Are you sure you want to delete this routine?')) {
        routineManager.deleteRoutine(delBtn.dataset.id);
        ui.renderRoutinesList(routineManager.getAll(), routineManager);
      }
      return;
    }

    // Toggle favorite
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

  // Today Schedule List Play Button
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

    // Play notification sound
    audioManager.playIntervalCompleteChime();

    // Show in-app banner
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

    // Browser Notification if granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`TempoFlow: ${routine.name}`, {
        body: `It's time for your ${routine.name} routine!`,
        icon: 'assets/icons/icon.png'
      });
    }
  });

  // Request Notification Permission on first user interaction
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
