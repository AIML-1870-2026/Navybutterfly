// ========== AUDIO ANALYZER - Sound Reactive Mode ==========
// Uses Web Audio API to analyze microphone or file input
// and extract frequency band levels for boid parameter modulation.

class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.stream = null;
    this.audioElement = null;

    // Frequency band levels (0.0 - 1.0)
    this.bassLevel = 0;
    this.midLevel = 0;
    this.trebleLevel = 0;

    // Smoothed levels for less jittery visuals
    this.smoothBass = 0;
    this.smoothMid = 0;
    this.smoothTreble = 0;

    // Beat detection
    this.beatThreshold = 0.6;
    this.lastBeatTime = 0;
    this.beatCooldown = 200; // ms between beats
    this.beatDetected = false;
    this.previousBassLevel = 0;

    // Sensitivity multipliers (controlled by UI sliders)
    this.bassSensitivity = 2.0;
    this.midSensitivity = 2.0;
    this.trebleSensitivity = 2.0;

    // State
    this.active = false;
    this.muted = false;
    this.sourceType = 'none'; // 'microphone', 'file', 'none'

    // Smoothing factor (0 = no smoothing, 1 = infinite smoothing)
    this.smoothingFactor = 0.8;
  }

  /**
   * Initialize microphone input for audio analysis.
   * @returns {Promise<boolean>} True if initialization succeeded
   */
  async initMicrophone() {
    try {
      this.cleanup();

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.source = this.audioContext.createMediaStreamSource(this.stream);

      this.setupAnalyser();
      this.source.connect(this.analyser);

      this.active = true;
      this.sourceType = 'microphone';
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err.message);
      this.active = false;
      this.sourceType = 'none';
      return false;
    }
  }

  /**
   * Initialize file-based audio input.
   * @param {File} file - Audio file to analyze
   * @returns {Promise<boolean>} True if initialization succeeded
   */
  async initFile(file) {
    try {
      this.cleanup();

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.audioElement = new Audio();
      this.audioElement.src = URL.createObjectURL(file);
      this.audioElement.loop = true;

      this.source = this.audioContext.createMediaElementSource(this.audioElement);
      this.setupAnalyser();
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination); // Play audio through speakers

      await this.audioElement.play();

      this.active = true;
      this.sourceType = 'file';
      return true;
    } catch (err) {
      console.warn('Audio file playback failed:', err.message);
      this.active = false;
      this.sourceType = 'none';
      return false;
    }
  }

  /** Set up the AnalyserNode with appropriate settings. */
  setupAnalyser() {
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  /**
   * Analyze current audio frame and update frequency band levels.
   * Call this every frame in the draw loop.
   */
  analyze() {
    if (!this.analyser || !this.active || this.muted) {
      // Decay levels when not active
      this.smoothBass *= 0.95;
      this.smoothMid *= 0.95;
      this.smoothTreble *= 0.95;
      this.beatDetected = false;
      return;
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    // Split frequency data into bands
    // FFT bin resolution = sampleRate / fftSize
    // With 44100Hz sample rate and 512 FFT: ~86Hz per bin
    // Bass: bins 0-2 (~0-258 Hz)
    // Mid: bins 3-23 (~258-2064 Hz)
    // Treble: bins 24+ (~2064+ Hz)
    const bassEnd = 3;
    const midEnd = 24;

    this.bassLevel = this.averageRange(0, bassEnd);
    this.midLevel = this.averageRange(bassEnd, midEnd);
    this.trebleLevel = this.averageRange(midEnd, this.dataArray.length);

    // Smooth the levels
    this.smoothBass = this.lerp(this.smoothBass, this.bassLevel, 1 - this.smoothingFactor);
    this.smoothMid = this.lerp(this.smoothMid, this.midLevel, 1 - this.smoothingFactor);
    this.smoothTreble = this.lerp(this.smoothTreble, this.trebleLevel, 1 - this.smoothingFactor);

    // Beat detection: look for sudden bass increase
    this.beatDetected = false;
    const now = performance.now();
    const bassDelta = this.bassLevel - this.previousBassLevel;
    if (bassDelta > this.beatThreshold && now - this.lastBeatTime > this.beatCooldown) {
      this.beatDetected = true;
      this.lastBeatTime = now;
    }
    this.previousBassLevel = this.bassLevel;
  }

  /**
   * Calculate average level for a range of frequency bins.
   * @param {number} start - Start bin index
   * @param {number} end - End bin index (exclusive)
   * @returns {number} Normalized average (0.0 - 1.0)
   */
  averageRange(start, end) {
    if (end <= start) return 0;
    let sum = 0;
    for (let i = start; i < end && i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    return (sum / (end - start)) / 255;
  }

  /**
   * Linear interpolation helper.
   * @param {number} a - Start value
   * @param {number} b - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated value
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Apply audio levels to simulation parameters.
   * @param {object} params - Current simulation parameters
   * @returns {object} Modified parameters based on audio
   */
  getModulatedParams(params) {
    if (!this.active || this.muted) return params;

    return {
      cohesionWeight: params.baseCohesion + (this.smoothBass * this.bassSensitivity),
      alignmentWeight: params.baseAlignment + (this.smoothMid * this.midSensitivity),
      separationWeight: params.baseSeparation + (this.smoothTreble * this.trebleSensitivity)
    };
  }

  /**
   * Get the overall audio intensity (0-1).
   * Used for background pulse effects.
   * @returns {number} Combined intensity level
   */
  getIntensity() {
    return (this.smoothBass + this.smoothMid + this.smoothTreble) / 3;
  }

  /**
   * Get dominant frequency band color for color sync feature.
   * @returns {{r: number, g: number, b: number}} RGB color based on dominant band
   */
  getDominantColor() {
    const maxLevel = Math.max(this.smoothBass, this.smoothMid, this.smoothTreble);
    if (maxLevel < 0.05) return { r: 128, g: 128, b: 128 };

    // Bass = red, Mid = green, Treble = blue
    const total = this.smoothBass + this.smoothMid + this.smoothTreble;
    if (total === 0) return { r: 128, g: 128, b: 128 };

    return {
      r: Math.floor((this.smoothBass / total) * 255),
      g: Math.floor((this.smoothMid / total) * 255),
      b: Math.floor((this.smoothTreble / total) * 255)
    };
  }

  /** Toggle mute state. */
  toggleMute() {
    this.muted = !this.muted;
    if (this.audioElement) {
      this.audioElement.muted = this.muted;
    }
  }

  /** Clean up all audio resources. */
  cleanup() {
    if (this.source) {
      try { this.source.disconnect(); } catch (e) { /* ignore */ }
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      if (this.audioElement.src) URL.revokeObjectURL(this.audioElement.src);
      this.audioElement = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch (e) { /* ignore */ }
      this.audioContext = null;
    }
    this.analyser = null;
    this.dataArray = null;
    this.active = false;
    this.sourceType = 'none';
    this.smoothBass = 0;
    this.smoothMid = 0;
    this.smoothTreble = 0;
  }
}
