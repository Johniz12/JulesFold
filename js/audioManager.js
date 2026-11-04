/**
 * TEMPOFLOW - Centralized Audio Manager
 * Web Audio API synthesizer for clean notification beeps, chimes, and ambient soundscapes
 * HTML5 Audio element for user-uploaded MP3/WAV tracks stored in IndexedDB
 * Timer synchronization: Work -> plays/resumes music, Rest -> pauses music, Stop -> stops music
 * Handles browser autoplay policies and audio context unlock gracefully
 */

class AudioManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.audioCtx = null;
    this.musicAudio = new Audio();
    this.musicAudio.loop = true;

    // State
    this.isAudioUnlocked = false;
    this.isMusicPlaying = false;
    this.currentTrack = { id: 'ambient_focus', name: 'Ambient Focus (Synth)', type: 'synth' };

    // Synth generator for ambient soundscape
    this.synthOscillators = [];
    this.synthGain = null;
    this.isSynthPlaying = false;

    // Volumes
    const settings = this.storage ? this.storage.getSettings() : {};
    this.notificationVolume = settings.notificationVolume !== undefined ? settings.notificationVolume : 0.8;
    this.musicVolume = settings.musicVolume !== undefined ? settings.musicVolume : 0.5;
    this.audioEnabled = settings.audioEnabled !== false;

    this.musicAudio.volume = this.musicVolume;

    // Custom uploaded tracks cache
    this.userTracks = [];
  }

  // --- Audio Context Initialization & Unlock ---
  initAudioContext() {
    if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.isAudioUnlocked = true;
    return this.audioCtx;
  }

  // --- Volume Controls ---
  setNotificationVolume(volume) {
    this.notificationVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.musicAudio.volume = this.musicVolume;
    if (this.synthGain) {
      this.synthGain.gain.setValueAtTime(this.musicVolume * 0.15, this.audioCtx.currentTime);
    }
  }

  setAudioEnabled(enabled) {
    this.audioEnabled = !!enabled;
    if (!this.audioEnabled) {
      this.stopMusic();
    }
  }

  // --- Web Audio API Notification Sounds ---
  // Start Beep (Crisp high-mid tone)
  playStartBeep() {
    if (!this.audioEnabled) return;
    this._playTone({ freq: 880, type: 'sine', duration: 0.15, gain: this.notificationVolume });
  }

  // Rest Beep (Softer, lower descending tone)
  playRestBeep() {
    if (!this.audioEnabled) return;
    this._playTone({ freq: 520, type: 'triangle', duration: 0.25, gain: this.notificationVolume });
  }

  // Warning Tick (Brief 100ms pulse for 3-2-1 countdown)
  playWarningBeep() {
    if (!this.audioEnabled) return;
    this._playTone({ freq: 740, type: 'sine', duration: 0.08, gain: this.notificationVolume * 0.7 });
  }

  // Interval Completion Chime (Pleasant 2-chord chime)
  playIntervalCompleteChime() {
    if (!this.audioEnabled) return;
    const now = Date.now();
    this._playTone({ freq: 659.25, type: 'sine', duration: 0.2, gain: this.notificationVolume }); // E5
    setTimeout(() => {
      this._playTone({ freq: 880, type: 'sine', duration: 0.35, gain: this.notificationVolume }); // A5
    }, 150);
  }

  // Routine Completion Fanfare
  playRoutineCompleteFanfare() {
    if (!this.audioEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this._playTone({
          freq,
          type: 'triangle',
          duration: idx === notes.length - 1 ? 0.6 : 0.2,
          gain: this.notificationVolume
        });
      }, idx * 160);
    });
  }

  _playTone({ freq = 440, type = 'sine', duration = 0.2, gain = 0.5 }) {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Smooth attack and release envelope to prevent audible clicks
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration + 0.05);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  // --- Background Music: Synthesizer & Custom Audio ---
  async playMusic() {
    if (!this.audioEnabled) return;

    if (this.currentTrack.type === 'synth') {
      this._startSynthMusic();
    } else if (this.currentTrack.type === 'user' && this.currentTrack.objectUrl) {
      try {
        if (this.musicAudio.src !== this.currentTrack.objectUrl) {
          this.musicAudio.src = this.currentTrack.objectUrl;
        }
        await this.musicAudio.play();
        this.isMusicPlaying = true;
      } catch (e) {
        console.warn('Playback error (user interaction might be needed):', e);
      }
    }
  }

  pauseMusic() {
    if (this.isSynthPlaying) {
      this._stopSynthMusic();
    }
    if (!this.musicAudio.paused) {
      this.musicAudio.pause();
    }
    this.isMusicPlaying = false;
  }

  resumeMusic() {
    if (!this.audioEnabled) return;
    this.playMusic();
  }

  stopMusic() {
    this.pauseMusic();
    if (this.musicAudio.src) {
      this.musicAudio.currentTime = 0;
    }
  }

  // Synthesized peaceful ambient chord drone (calming focus/study soundscape)
  _startSynthMusic() {
    try {
      if (this.isSynthPlaying) return;
      const ctx = this.initAudioContext();
      if (!ctx) return;

      this.synthGain = ctx.createGain();
      this.synthGain.gain.setValueAtTime(this.musicVolume * 0.12, ctx.currentTime);
      this.synthGain.connect(ctx.destination);

      // Ambient chord frequencies: C3, G3, C4, E4
      const frequencies = [130.81, 196.00, 261.63, 329.63];
      this.synthOscillators = frequencies.map((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f + (i * 0.5), ctx.currentTime); // gentle natural detuning
        osc.connect(this.synthGain);
        osc.start();
        return osc;
      });

      this.isSynthPlaying = true;
      this.isMusicPlaying = true;
    } catch (e) {
      console.warn('Synth music start failed:', e);
    }
  }

  _stopSynthMusic() {
    if (this.synthOscillators && this.synthOscillators.length > 0) {
      this.synthOscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      });
      this.synthOscillators = [];
    }
    if (this.synthGain) {
      try {
        this.synthGain.disconnect();
      } catch (e) {}
      this.synthGain = null;
    }
    this.isSynthPlaying = false;
  }

  // --- Track Selection & Custom Upload Management ---
  selectTrack(track) {
    const wasPlaying = this.isMusicPlaying;
    this.stopMusic();
    this.currentTrack = track;
    if (wasPlaying) {
      this.playMusic();
    }
  }

  async loadUserTracks() {
    if (!this.storage) return [];
    try {
      const stored = await this.storage.getAllAudioTracks();
      this.userTracks = stored.map(item => ({
        id: item.id,
        name: item.name,
        type: 'user',
        objectUrl: URL.createObjectURL(item.blob)
      }));
      return this.userTracks;
    } catch (e) {
      console.warn('Failed to load user audio tracks from IndexedDB:', e);
      return [];
    }
  }

  async uploadUserTrack(file) {
    if (!file || !this.storage) return null;
    const id = 'user_track_' + Date.now();
    const success = await this.storage.saveAudioTrack(id, file.name, file);
    if (success) {
      const track = {
        id,
        name: file.name,
        type: 'user',
        objectUrl: URL.createObjectURL(file)
      };
      this.userTracks.push(track);
      return track;
    }
    return null;
  }

  // --- Synchronize with Timer Engine Events ---
  bindToTimerEngine(timerEngine) {
    timerEngine.on('intervalChange', (data) => {
      const interval = data.interval;
      if (!interval) return;

      // Check interval type and play appropriate sound
      if (interval.type === 'rest' || interval.type === 'exercise_rest') {
        this.playRestBeep();
        this.pauseMusic();
      } else if (interval.type === 'work' || interval.type === 'exercise_work') {
        this.playStartBeep();
        if (interval.music !== false && timerEngine.state === 'running') {
          this.resumeMusic();
        } else {
          this.pauseMusic();
        }
      } else if (interval.type === 'prep') {
        this.playStartBeep();
        this.pauseMusic();
      }
    });

    timerEngine.on('warning', () => {
      this.playWarningBeep();
    });

    timerEngine.on('stateChange', (data) => {
      const current = timerEngine.getCurrentInterval();
      const isWork = current && (current.type === 'work' || current.type === 'exercise_work');

      if (data.state === 'running') {
        if (isWork && current.music !== false) {
          this.playMusic();
        }
      } else if (data.state === 'paused') {
        this.pauseMusic();
      } else if (data.state === 'idle') {
        this.stopMusic();
      } else if (data.state === 'completed') {
        this.stopMusic();
        this.playRoutineCompleteFanfare();
      }
    });

    timerEngine.on('complete', () => {
      this.stopMusic();
      this.playRoutineCompleteFanfare();
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioManager };
} else if (typeof window !== 'undefined') {
  window.AudioManager = AudioManager;
}
