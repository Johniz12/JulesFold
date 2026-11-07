/**
 * TEMPOFLOW - Centralized Audio Manager
 * Web Audio API synthesizer for clean notification beeps, chimes, and ambient soundscapes
 * HTML5 Audio element for user-uploaded MP3/WAV tracks stored in IndexedDB
 * Timer synchronization: Work -> plays/resumes music, Rest -> pauses or switches music, Stop -> stops music
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

    // Preview audio player
    this.previewAudio = new Audio();
    this.isPreviewPlaying = false;

    // Synth generator for ambient soundscape
    this.synthOscillators = [];
    this.synthGain = null;
    this.isSynthPlaying = false;

    // Volumes & preferences
    const settings = this.storage ? this.storage.getSettings() : {};
    this.notificationVolume = settings.notificationVolume !== undefined ? settings.notificationVolume : 0.8;
    this.musicVolume = settings.musicVolume !== undefined ? settings.musicVolume : 0.5;
    this.audioEnabled = settings.audioEnabled !== false;
    this.notificationSound = settings.notificationSound || 'chime';

    this.musicAudio.volume = this.musicVolume;
    this.previewAudio.volume = this.musicVolume;

    // Uploaded audio tracks cache
    this.userTracks = [];
  }

  // --- Audio Context Initialization & Unlock ---
  initAudioContext() {
    if (!this.audioCtx && (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext)) {
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
    this.previewAudio.volume = this.musicVolume;
    if (this.synthGain && this.audioCtx) {
      this.synthGain.gain.setValueAtTime(this.musicVolume * 0.15, this.audioCtx.currentTime);
    }
  }

  setAudioEnabled(enabled) {
    this.audioEnabled = !!enabled;
    if (!this.audioEnabled) {
      this.stopMusic();
      this.stopPreview();
    }
  }

  // --- Web Audio API Notification Sounds ---
  playStartBeep() {
    if (!this.audioEnabled) return;
    this._playTone({ freq: 880, type: 'sine', duration: 0.15, gain: this.notificationVolume });
  }

  playRestBeep() {
    if (!this.audioEnabled) return;
    this._playTone({ freq: 520, type: 'triangle', duration: 0.25, gain: this.notificationVolume });
  }

  playWarningBeep() {
    if (!this.audioEnabled) return;
    this._playTone({ freq: 740, type: 'sine', duration: 0.08, gain: this.notificationVolume * 0.7 });
  }

  playIntervalCompleteChime() {
    if (!this.audioEnabled) return;
    this._playTone({ freq: 659.25, type: 'sine', duration: 0.2, gain: this.notificationVolume });
    setTimeout(() => {
      this._playTone({ freq: 880, type: 'sine', duration: 0.35, gain: this.notificationVolume });
    }, 150);
  }

  playRoutineCompleteFanfare() {
    if (!this.audioEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
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
  async playMusic(trackOverride = null) {
    if (!this.audioEnabled) return;

    const track = trackOverride || this.currentTrack;
    if (!track || track.id === 'none') {
      this.stopMusic();
      return;
    }

    if (track.type === 'synth') {
      if (this.musicAudio.src) {
        this.musicAudio.pause();
      }
      this._startSynthMusic();
    } else if (track.type === 'user' && track.objectUrl) {
      try {
        this._stopSynthMusic();
        if (this.musicAudio.src !== track.objectUrl) {
          this.musicAudio.src = track.objectUrl;
        }
        await this.musicAudio.play();
        this.isMusicPlaying = true;
      } catch (e) {
        console.warn('Playback error:', e);
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

  // Ambient chord drone
  _startSynthMusic() {
    try {
      if (this.isSynthPlaying) return;
      const ctx = this.initAudioContext();
      if (!ctx) return;

      this.synthGain = ctx.createGain();
      this.synthGain.gain.setValueAtTime(this.musicVolume * 0.12, ctx.currentTime);
      this.synthGain.connect(ctx.destination);

      const frequencies = [130.81, 196.00, 261.63, 329.63];
      this.synthOscillators = frequencies.map((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f + (i * 0.5), ctx.currentTime);
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

  // --- Track Previewing ---
  async playPreview(track) {
    this.stopPreview();
    if (!track) return;

    if (track.type === 'synth') {
      this._startSynthMusic();
      this.isPreviewPlaying = true;
    } else if (track.objectUrl) {
      try {
        this.previewAudio.src = track.objectUrl;
        await this.previewAudio.play();
        this.isPreviewPlaying = true;
      } catch (e) {
        console.warn('Preview error:', e);
      }
    }
  }

  stopPreview() {
    if (this.isPreviewPlaying) {
      if (this.isSynthPlaying && !this.isMusicPlaying) {
        this._stopSynthMusic();
      }
      this.previewAudio.pause();
      this.previewAudio.currentTime = 0;
      this.isPreviewPlaying = false;
    }
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

  getTrackById(id) {
    if (id === 'ambient_focus') {
      return { id: 'ambient_focus', name: 'Ambient Focus (Synth)', type: 'synth' };
    }
    if (id === 'none') {
      return { id: 'none', name: 'None (Silent)', type: 'none' };
    }
    return this.userTracks.find(t => t.id === id) || null;
  }

  getAllAvailableTracks() {
    return [
      { id: 'ambient_focus', name: 'Ambient Focus (Synth)', type: 'synth' },
      ...this.userTracks
    ];
  }

  async loadUserTracks() {
    if (!this.storage) return [];
    try {
      const stored = await this.storage.getAllAudioTracks();
      this.userTracks = stored.map(item => ({
        id: item.id,
        name: item.name,
        type: 'user',
        category: item.category || 'Custom Sounds',
        duration: item.duration || null,
        size: item.size || (item.blob ? item.blob.size : 0),
        objectUrl: URL.createObjectURL(item.blob)
      }));
      return this.userTracks;
    } catch (e) {
      console.warn('Failed to load user audio tracks from IndexedDB:', e);
      return [];
    }
  }

  async uploadUserTrack(file, category = 'Custom Sounds') {
    if (!file || !this.storage) return null;
    const id = 'user_track_' + Date.now();

    // Attempt duration estimation via HTMLAudio
    let duration = null;
    try {
      const tempAudio = new Audio(URL.createObjectURL(file));
      await new Promise(res => {
        tempAudio.onloadedmetadata = () => { duration = Math.round(tempAudio.duration); res(); };
        tempAudio.onerror = () => res();
        setTimeout(res, 400);
      });
    } catch (e) {}

    const success = await this.storage.saveAudioTrack(id, file.name, file, {
      category,
      duration,
      size: file.size
    });

    if (success) {
      const track = {
        id,
        name: file.name,
        type: 'user',
        category,
        duration,
        size: file.size,
        objectUrl: URL.createObjectURL(file)
      };
      this.userTracks.push(track);
      return track;
    }
    return null;
  }

  async updateTrackMetadata(id, updates = {}) {
    if (!this.storage) return false;
    const ok = await this.storage.updateAudioMetadata(id, updates);
    if (ok) {
      const track = this.userTracks.find(t => t.id === id);
      if (track) {
        Object.assign(track, updates);
      }
      return true;
    }
    return false;
  }

  async deleteTrack(id) {
    if (!this.storage) return false;
    const ok = await this.storage.deleteAudioTrack(id);
    if (ok) {
      const idx = this.userTracks.findIndex(t => t.id === id);
      if (idx >= 0) {
        if (this.userTracks[idx].objectUrl) {
          URL.revokeObjectURL(this.userTracks[idx].objectUrl);
        }
        this.userTracks.splice(idx, 1);
      }
      if (this.currentTrack.id === id) {
        this.selectTrack({ id: 'ambient_focus', name: 'Ambient Focus (Synth)', type: 'synth' });
      }
      return true;
    }
    return false;
  }

  // --- Play Sound by Identifier or Custom Track ---
  playSoundKey(soundKey, defaultAction = 'start') {
    if (!this.audioEnabled || !soundKey || soundKey === 'none' || soundKey === 'disable') return;

    if (soundKey === 'default') {
      if (defaultAction === 'start') this.playStartBeep();
      else if (defaultAction === 'rest') this.playRestBeep();
      else if (defaultAction === 'complete') this.playRoutineCompleteFanfare();
      return;
    }

    if (soundKey === 'chime') {
      this.playIntervalCompleteChime();
    } else if (soundKey === 'bell') {
      this._playTone({ freq: 659.25, type: 'sine', duration: 0.35, gain: this.notificationVolume });
    } else if (soundKey === 'digital') {
      this._playTone({ freq: 880, type: 'square', duration: 0.15, gain: this.notificationVolume * 0.7 });
    } else if (soundKey === 'fanfare') {
      this.playRoutineCompleteFanfare();
    } else {
      // Check user track
      const track = this.getTrackById(soundKey);
      if (track && track.objectUrl) {
        try {
          const soundAudio = new Audio(track.objectUrl);
          soundAudio.volume = this.notificationVolume;
          soundAudio.play().catch(e => console.warn('Sound play error:', e));
        } catch (e) {
          console.warn('Track audio error:', e);
        }
      } else {
        // Fallback
        if (defaultAction === 'start') this.playStartBeep();
        else if (defaultAction === 'rest') this.playRestBeep();
        else if (defaultAction === 'complete') this.playRoutineCompleteFanfare();
      }
    }
  }

  // --- Synchronize with Timer Engine Events ---
  bindToTimerEngine(timerEngine) {
    timerEngine.on('intervalChange', (data) => {
      const interval = data.interval;
      if (!interval) return;

      const routineAudio = timerEngine.routine && timerEngine.routine.audioConfig ? timerEngine.routine.audioConfig : {};

      if (interval.type === 'rest' || interval.type === 'exercise_rest') {
        const soundKey = routineAudio.restStartSound || 'default';
        this.playSoundKey(soundKey, 'rest');

        // Rest music handling
        if (routineAudio.restMusic && routineAudio.restMusic !== 'none') {
          const restTrack = this.getTrackById(routineAudio.restMusic);
          if (restTrack) {
            this.playMusic(restTrack);
          } else {
            this.pauseMusic();
          }
        } else {
          this.pauseMusic();
        }
      } else if (interval.type === 'work' || interval.type === 'exercise_work') {
        const soundKey = routineAudio.workStartSound || 'default';
        this.playSoundKey(soundKey, 'start');

        if (interval.music !== false && timerEngine.state === 'running') {
          if (routineAudio.workMusic && routineAudio.workMusic !== 'none') {
            const track = this.getTrackById(routineAudio.workMusic);
            this.playMusic(track || this.currentTrack);
          } else if (routineAudio.workMusic === 'none') {
            this.pauseMusic();
          } else {
            this.resumeMusic();
          }
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
      const routineAudio = timerEngine.routine && timerEngine.routine.audioConfig ? timerEngine.routine.audioConfig : {};

      if (data.state === 'running') {
        if (isWork && current.music !== false) {
          if (routineAudio.workMusic && routineAudio.workMusic !== 'none') {
            const track = this.getTrackById(routineAudio.workMusic);
            this.playMusic(track || this.currentTrack);
          } else if (routineAudio.workMusic === 'none') {
            this.pauseMusic();
          } else {
            this.playMusic();
          }
        }
      } else if (data.state === 'paused') {
        this.pauseMusic();
      } else if (data.state === 'idle') {
        this.stopMusic();
      } else if (data.state === 'completed') {
        this.stopMusic();
        const compSound = routineAudio.completionSound || 'default';
        this.playSoundKey(compSound, 'complete');
      }
    });

    timerEngine.on('complete', () => {
      this.stopMusic();
      const routineAudio = timerEngine.routine && timerEngine.routine.audioConfig ? timerEngine.routine.audioConfig : {};
      const compSound = routineAudio.completionSound || 'default';
      this.playSoundKey(compSound, 'complete');
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioManager };
} else if (typeof window !== 'undefined') {
  window.AudioManager = AudioManager;
}
