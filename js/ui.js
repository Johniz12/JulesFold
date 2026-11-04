/**
 * TEMPOFLOW - UI Controller
 * Renders views, handles interactions, timer display & ring, modals, tabs,
 * duration components with seconds precision, and routine audio dropdowns.
 */

class UIController {
  constructor() {
    this.timerDisplay = document.getElementById('timerDisplay');
    this.timerRingCircle = document.getElementById('timerRingCircle');
    this.timerIntervalBadge = document.getElementById('timerIntervalBadge');
    this.timerCycleBadge = document.getElementById('timerCycleBadge');
    this.timerIntervalName = document.getElementById('timerIntervalName');
    this.timerMetaText = document.getElementById('timerMetaText');
    this.upcomingIntervalText = document.getElementById('upcomingIntervalText');
    this.timerCenterpiece = document.getElementById('timerCenterpiece');

    this.btnTimerMain = document.getElementById('btnTimerMain');
    this.btnTimerMainIcon = document.getElementById('btnTimerMainIcon');
    this.btnTimerSkip = document.getElementById('btnTimerSkip');
    this.btnTimerReset = document.getElementById('btnTimerReset');
    this.btnTimerStop = document.getElementById('btnTimerStop');

    this.selectActiveRoutine = document.getElementById('selectActiveRoutine');
    this.routinesGrid = document.getElementById('routinesGrid');
    this.schedulerCalendar = document.getElementById('schedulerCalendar');
    this.todayScheduleList = document.getElementById('todayScheduleList');

    this.ringCircumference = 628.318;
  }

  updateHeaderDate() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[now.getDay()];
    const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    const dayEl = document.getElementById('headerCurrentDay');
    const dateEl = document.getElementById('headerCurrentDate');
    if (dayEl) dayEl.textContent = dayName;
    if (dateEl) dateEl.textContent = dateStr;
  }

  switchTab(tabName) {
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.tab === tabName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    document.querySelectorAll('.tab-content').forEach(section => {
      if (section.id === `tab-${tabName}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
  }

  updateTimer(timeData) {
    if (!timeData) return;

    const remainingSecs = Math.max(0, timeData.remainingSeconds || 0);
    const hrs = Math.floor(remainingSecs / 3600);
    const mins = Math.floor((remainingSecs % 3600) / 60);
    const secs = remainingSecs % 60;

    let formatted = '';
    if (hrs > 0) {
      formatted = `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
      formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    if (this.timerDisplay) {
      this.timerDisplay.textContent = formatted;
      document.title = `${formatted} — TempoFlow`;
    }

    if (this.timerRingCircle) {
      const progress = Math.min(1, Math.max(0, timeData.progress || 0));
      const offset = this.ringCircumference * progress;
      this.timerRingCircle.style.strokeDashoffset = offset;
    }

    const current = timeData.currentInterval;
    const next = timeData.nextInterval;

    if (current) {
      if (this.timerIntervalName) {
        this.timerIntervalName.textContent = current.name || 'Interval';
      }

      this._updateTimerStateVisuals(current.type, timeData.state);

      if (this.timerCycleBadge) {
        const cycleText = timeData.totalCycles === 0
          ? `Cycle ${timeData.currentCycle} (Loop)`
          : `Round ${timeData.currentCycle} / ${timeData.totalCycles}`;
        this.timerCycleBadge.textContent = cycleText;
      }

      if (this.timerMetaText) {
        if (current.type === 'exercise_work') {
          this.timerMetaText.textContent = current.notes ? current.notes : 'PUMP IT!';
        } else if (current.type === 'exercise_rest') {
          this.timerMetaText.textContent = 'Catch your breath';
        } else if (current.type === 'work') {
          this.timerMetaText.textContent = 'Stay in the flow';
        } else if (current.type === 'rest') {
          this.timerMetaText.textContent = 'Relax and recharge';
        } else if (current.type === 'prep') {
          this.timerMetaText.textContent = 'Get ready to begin';
        }
      }
    }

    if (this.upcomingIntervalText) {
      if (next) {
        const nSec = next.duration || 0;
        const nMins = Math.floor(nSec / 60);
        const nRemainingSec = nSec % 60;
        const durStr = nMins > 0
          ? (nRemainingSec > 0 ? `${nMins}m ${nRemainingSec}s` : `${nMins}m`)
          : `${nRemainingSec}s`;
        this.upcomingIntervalText.textContent = `${next.name} (${durStr})`;
      } else {
        this.upcomingIntervalText.textContent = 'End of Routine';
      }
    }

    this._updateMainButtonState(timeData.state);
  }

  _updateMainButtonState(state) {
    if (!this.btnTimerMainIcon) return;

    if (state === 'running') {
      this.btnTimerMainIcon.innerHTML = `
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      `;
      this.btnTimerMain.title = 'Pause Timer';
    } else {
      this.btnTimerMainIcon.innerHTML = `
        <polygon points="5 3 19 12 5 21 5 3"/>
      `;
      this.btnTimerMain.title = 'Start / Resume';
    }
  }

  _updateTimerStateVisuals(type, state) {
    if (!this.timerCenterpiece || !this.timerIntervalBadge) return;

    this.timerCenterpiece.className = 'card timer-centerpiece';
    this.timerIntervalBadge.className = 'interval-badge';

    if (type === 'exercise_work') {
      this.timerCenterpiece.classList.add('state-exercise-work');
      this.timerIntervalBadge.classList.add('badge-exercise-work');
      this.timerIntervalBadge.textContent = 'WORK';
      if (this.timerRingCircle) this.timerRingCircle.style.stroke = 'var(--mode-exercise-work)';
    } else if (type === 'exercise_rest') {
      this.timerCenterpiece.classList.add('state-exercise-rest');
      this.timerIntervalBadge.classList.add('badge-exercise-rest');
      this.timerIntervalBadge.textContent = 'REST';
      if (this.timerRingCircle) this.timerRingCircle.style.stroke = 'var(--mode-exercise-rest)';
    } else if (type === 'prep') {
      this.timerIntervalBadge.classList.add('badge-rest');
      this.timerIntervalBadge.textContent = 'PREPARE';
      if (this.timerRingCircle) this.timerRingCircle.style.stroke = 'var(--mode-exercise-rest)';
    } else if (type === 'work') {
      this.timerCenterpiece.classList.add('state-work');
      this.timerIntervalBadge.classList.add('badge-work');
      this.timerIntervalBadge.textContent = 'FOCUS INTERVAL';
      if (this.timerRingCircle) this.timerRingCircle.style.stroke = 'var(--mode-pomodoro)';
    } else if (type === 'rest') {
      this.timerCenterpiece.classList.add('state-rest');
      this.timerIntervalBadge.classList.add('badge-rest');
      this.timerIntervalBadge.textContent = 'BREAK INTERVAL';
      if (this.timerRingCircle) this.timerRingCircle.style.stroke = 'var(--mode-pomodoro-break)';
    }
  }

  renderRoutineOptions(routines, activeRoutineId) {
    if (!this.selectActiveRoutine) return;
    this.selectActiveRoutine.innerHTML = '';

    routines.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.name} (${r.mode.toUpperCase()})`;
      if (r.id === activeRoutineId) {
        opt.selected = true;
      }
      this.selectActiveRoutine.appendChild(opt);
    });
  }

  renderRoutinesList(routines, routineManager) {
    if (!this.routinesGrid) return;
    this.routinesGrid.innerHTML = '';

    routines.forEach(routine => {
      const card = document.createElement('div');
      card.className = 'routine-card';
      const summary = routineManager.getRoutineSummary(routine);

      const favClass = routine.favorite ? 'btn-icon favorite active' : 'btn-icon favorite';

      card.innerHTML = `
        <div class="routine-card-header">
          <span class="routine-badge ${routine.mode}">${routine.mode}</span>
          <button class="${favClass}" data-fav-id="${routine.id}" title="Toggle Favorite">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${routine.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
        </div>
        <h4 class="routine-title">${routine.name}</h4>
        <div class="routine-summary">${summary}</div>
        <div class="routine-card-actions">
          <button class="btn-primary btn-load-routine" data-id="${routine.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Run</span>
          </button>
          <div class="btn-action-group">
            <button class="btn-icon btn-edit-routine" data-id="${routine.id}" title="Edit Routine">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="btn-icon btn-duplicate-routine" data-id="${routine.id}" title="Duplicate Routine">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            ${!routine.isPreset ? `
            <button class="btn-icon btn-delete-routine" data-id="${routine.id}" title="Delete Routine">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>` : ''}
          </div>
        </div>
      `;
      this.routinesGrid.appendChild(card);
    });
  }

  renderWeeklyScheduler(scheduler, routineManager) {
    if (!this.schedulerCalendar) return;
    this.schedulerCalendar.innerHTML = '';

    const days = [
      { key: 'mon', label: 'Monday' },
      { key: 'tue', label: 'Tuesday' },
      { key: 'wed', label: 'Wednesday' },
      { key: 'thu', label: 'Thursday' },
      { key: 'fri', label: 'Friday' },
      { key: 'sat', label: 'Saturday' },
      { key: 'sun', label: 'Sunday' }
    ];

    const todayKey = scheduler.getTodayKey();

    days.forEach(day => {
      const col = document.createElement('div');
      col.className = 'day-column' + (day.key === todayKey ? ' today' : '');

      const entries = scheduler.getByDay(day.key);
      let entriesHtml = '';

      entries.forEach(entry => {
        const routine = routineManager.getById(entry.routineId);
        const name = routine ? routine.name : 'Unknown Routine';

        entriesHtml += `
          <div class="schedule-card ${!entry.enabled ? 'disabled' : ''}" data-schedule-id="${entry.id}">
            <div class="schedule-card-time">${entry.time}</div>
            <div class="schedule-card-title">${name}</div>
            <div class="schedule-card-controls">
              <label class="switch" style="width:30px; height:16px;">
                <input type="checkbox" class="toggle-schedule-item" data-id="${entry.id}" ${entry.enabled ? 'checked' : ''}>
                <span class="slider" style="border-radius:16px;"></span>
              </label>
              <div style="display:flex; gap:4px;">
                <button class="btn-mini-play btn-run-schedule-now" data-routine-id="${entry.routineId}" title="Run Now">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </button>
                <button class="btn-icon btn-delete-schedule" data-id="${entry.id}" style="width:20px; height:20px; padding:0;" title="Delete">
                  &times;
                </button>
              </div>
            </div>
          </div>
        `;
      });

      col.innerHTML = `
        <div class="day-header">
          <div class="day-name">${day.label}</div>
        </div>
        <div class="day-entries">
          ${entriesHtml || '<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding-top:10px;">No routines</div>'}
        </div>
        <button class="btn-day-add btn-open-schedule-modal" data-day="${day.key}">+ Add Routine</button>
      `;

      this.schedulerCalendar.appendChild(col);
    });
  }

  renderTodaySchedule(scheduler, routineManager) {
    if (!this.todayScheduleList) return;
    this.todayScheduleList.innerHTML = '';

    const todayItems = scheduler.getTodaySchedules();
    if (todayItems.length === 0) {
      this.todayScheduleList.innerHTML = '<div style="font-size:0.8rem; color:var(--text-muted); padding:10px 0;">No activities scheduled for today.</div>';
      return;
    }

    todayItems.forEach(item => {
      const routine = routineManager.getById(item.routineId);
      if (!routine) return;

      const row = document.createElement('div');
      row.className = `schedule-item-mini mode-${routine.mode}`;
      row.innerHTML = `
        <div>
          <div class="schedule-item-time">${item.time}</div>
          <div class="schedule-item-name">${routine.name}</div>
        </div>
        <button class="btn-mini-play btn-run-today-item" data-routine-id="${routine.id}" title="Run Now">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      `;
      this.todayScheduleList.appendChild(row);
    });
  }

  renderStatistics(statsTracker) {
    const summary = statsTracker.getSummary();
    const todaySummary = statsTracker.getTodaySummary();

    const focusMins = Math.round((todaySummary.focusSeconds || 0) / 60);
    const exerciseMins = Math.round((todaySummary.exerciseSeconds || 0) / 60);

    const miniFocus = document.getElementById('miniStatFocus');
    const miniPomodoro = document.getElementById('miniStatPomodoros');
    const miniExercise = document.getElementById('miniStatExercise');
    const miniRoutines = document.getElementById('miniStatRoutines');

    if (miniFocus) miniFocus.textContent = `${focusMins}m`;
    if (miniPomodoro) miniPomodoro.textContent = `${summary.completedPomodoros || 0}`;
    if (miniExercise) miniExercise.textContent = `${exerciseMins}m`;
    if (miniRoutines) miniRoutines.textContent = `${summary.completedRoutines || 0}`;

    const totalFocusHours = ((summary.totalFocusSeconds || 0) / 3600).toFixed(1);
    const totalWorkoutHours = ((summary.totalExerciseSeconds || 0) / 3600).toFixed(1);

    const statTotalFocus = document.getElementById('statTotalFocus');
    const statCompletedPomodoros = document.getElementById('statCompletedPomodoros');
    const statTotalWorkout = document.getElementById('statTotalWorkout');
    const statTotalRoutines = document.getElementById('statTotalRoutines');

    if (statTotalFocus) statTotalFocus.textContent = `${totalFocusHours}h`;
    if (statCompletedPomodoros) statCompletedPomodoros.textContent = `${summary.completedPomodoros || 0}`;
    if (statTotalWorkout) statTotalWorkout.textContent = `${totalWorkoutHours}h`;
    if (statTotalRoutines) statTotalRoutines.textContent = `${summary.completedRoutines || 0}`;

    const tableBody = document.getElementById('statsHistoryTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';
      const history = summary.history || [];
      if (history.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:20px;">No completed sessions recorded yet. Start a timer to build momentum!</td></tr>';
        return;
      }

      history.forEach(h => {
        const tr = document.createElement('tr');
        const dateFormatted = new Date(h.timestamp).toLocaleString();
        const durationFormatted = `${Math.round((h.durationSeconds || 0) / 60)} mins`;

        tr.innerHTML = `
          <td>${dateFormatted}</td>
          <td style="font-weight:600;">${h.routineName}</td>
          <td><span class="routine-badge ${h.mode}">${h.mode}</span></td>
          <td>${durationFormatted}</td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  showNotificationBanner(title, desc, onStartNow) {
    const banner = document.getElementById('scheduledNotificationBanner');
    const titleEl = document.getElementById('notifBannerTitle');
    const descEl = document.getElementById('notifBannerDesc');
    const startBtn = document.getElementById('btnStartScheduledNow');
    const dismissBtn = document.getElementById('btnDismissNotification');

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (banner) banner.classList.add('show');

    if (startBtn) {
      startBtn.onclick = () => {
        banner.classList.remove('show');
        if (onStartNow) onStartNow();
      };
    }

    if (dismissBtn) {
      dismissBtn.onclick = () => {
        banner.classList.remove('show');
      };
    }
  }

  // --- Custom Timer Studio Rendering ---
  renderStudioCountdown(state) {
    const titleEl = document.getElementById('studioCountdownTitleDisplay');
    const dispEl = document.getElementById('studioCountdownDisplay');
    const iconEl = document.getElementById('btnStudioCountdownIcon');
    const btn = document.getElementById('btnStudioCountdownToggle');

    if (titleEl) titleEl.textContent = state.title;

    if (dispEl) {
      const rem = state.remainingSeconds || 0;
      const hrs = Math.floor(rem / 3600);
      const mins = Math.floor((rem % 3600) / 60);
      const secs = rem % 60;
      if (hrs > 0) {
        dispEl.textContent = `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      } else {
        dispEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    }

    if (iconEl && btn) {
      if (state.state === 'running') {
        iconEl.innerHTML = `<rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />`;
        btn.title = 'Pause Countdown';
      } else {
        iconEl.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
        btn.title = 'Start Countdown';
      }
    }
  }

  renderStudioRepeating(state) {
    const titleEl = document.getElementById('studioRepeatingTitleDisplay');
    const dispEl = document.getElementById('studioRepeatingDisplay');
    const cyclesEl = document.getElementById('studioRepeatingCyclesDisplay');
    const iconEl = document.getElementById('btnStudioRepeatingIcon');
    const btn = document.getElementById('btnStudioRepeatingToggle');

    if (titleEl) titleEl.textContent = state.title;

    if (dispEl) {
      const rem = state.remainingSeconds || 0;
      const mins = Math.floor(rem / 60);
      const secs = rem % 60;
      dispEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    if (cyclesEl) {
      cyclesEl.textContent = state.totalCycles > 0
        ? `${state.completedCycles} / ${state.totalCycles}`
        : `${state.completedCycles} (indefinite)`;
    }

    if (iconEl && btn) {
      if (state.state === 'running') {
        iconEl.innerHTML = `<rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />`;
        btn.title = 'Pause Interval';
      } else {
        iconEl.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
        btn.title = 'Start Interval';
      }
    }
  }

  renderClockAlarms(alarms) {
    const container = document.getElementById('clockAlarmsListContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!alarms || alarms.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.85rem;">No clock-aligned alarms configured yet. Click "+ Add Alarm" to create one.</div>`;
      return;
    }

    alarms.forEach(alarm => {
      const item = document.createElement('div');
      item.className = 'audio-track-item';
      const timeBadge = alarm.type === 'hourly'
        ? `Hourly at :${String(alarm.minute).padStart(2, '0')}`
        : `Daily at ${alarm.time}`;

      item.innerHTML = `
        <div class="audio-track-details">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="audio-track-name">${alarm.label}</span>
            <span class="routine-badge ${alarm.type === 'hourly' ? 'pomodoro' : 'trading'}">${timeBadge}</span>
          </div>
          <div class="audio-track-meta">
            <span>Sound: ${alarm.sound}</span>
            <span>Category: ${alarm.soundCategory || 'Notification Sounds'}</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <label class="switch" style="width:34px; height:18px;">
            <input type="checkbox" class="toggle-clock-alarm" data-id="${alarm.id}" ${alarm.enabled ? 'checked' : ''}>
            <span class="slider" style="border-radius:18px;"></span>
          </label>
          <button class="btn-icon btn-delete-alarm" data-id="${alarm.id}" title="Delete Alarm" style="width:28px; height:28px;">
            &times;
          </button>
        </div>
      `;
      container.appendChild(item);
    });
  }

  // --- Audio Library Manager Rendering ---
  renderAudioLibrary(tracks, activeCategoryFilter = 'all') {
    const container = document.getElementById('audio-lib-container');
    if (!container) return;
    container.innerHTML = '';

    let filtered = tracks || [];
    if (activeCategoryFilter !== 'all') {
      filtered = filtered.filter(t => (t.category || 'Custom Sounds') === activeCategoryFilter);
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.85rem;">No audio tracks found in this category. Upload tracks via the audio toolbar.</div>`;
      return;
    }

    const categories = [
      'Background Music',
      'Work Sounds',
      'Rest Sounds',
      'Notification Sounds',
      'Completion Sounds',
      'Custom Sounds'
    ];

    filtered.forEach(track => {
      const row = document.createElement('div');
      row.className = 'audio-track-item';

      const sizeKb = track.size ? `${(track.size / 1024).toFixed(1)} KB` : '';
      const durSec = track.duration ? `${track.duration}s` : '';
      const metaInfo = [track.category || 'Custom Sounds', sizeKb, durSec].filter(Boolean).join(' • ');

      const catOptions = categories.map(cat => `
        <option value="${cat}" ${cat === track.category ? 'selected' : ''}>${cat}</option>
      `).join('');

      row.innerHTML = `
        <div class="audio-track-details">
          <span class="audio-track-name">${track.name}</span>
          <span class="audio-track-meta">${metaInfo}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <select class="form-control select-track-category" data-id="${track.id}" style="padding:4px 8px; font-size:0.78rem; width:140px;">
            ${catOptions}
          </select>
          <button class="btn-header btn-preview-track" data-id="${track.id}" style="padding:4px 8px; font-size:0.75rem;">Preview</button>
          <button class="btn-icon btn-rename-track" data-id="${track.id}" title="Rename Track" style="width:28px; height:28px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button class="btn-icon btn-delete-track" data-id="${track.id}" title="Delete Track" style="width:28px; height:28px;">
            &times;
          </button>
        </div>
      `;
      container.appendChild(row);
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UIController };
} else if (typeof window !== 'undefined') {
  window.UIController = UIController;
}
