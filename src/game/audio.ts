/**
 * Web Audio API procedural sound synthesizer for Highway Racer
 * Synthesizes engine noise, pitch changes, tire squeal, horn, nitro boost, and crash sounds
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  // Engine sound nodes
  private engineOsc: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Skid sound nodes
  private skidNoise: AudioBufferSourceNode | null = null;
  private skidGain: GainNode | null = null;

  // Nitro sound nodes
  private nitroGain: GainNode | null = null;

  private isRunning: boolean = false;

  constructor() {
    // Lazy init audio context on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch {
      console.warn("Web Audio API not supported");
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(muted ? 0 : this.volume * 0.15, this.ctx.currentTime);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.engineGain && this.ctx && !this.isMuted) {
      this.engineGain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
    }
  }

  public startEngine() {
    this.init();
    if (!this.ctx || this.isRunning || this.isMuted) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      // Main engine harmonic oscillator
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      
      this.engineOsc.type = 'sawtooth';
      this.engineOsc2.type = 'triangle';

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(300, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.frequency.setValueAtTime(40, this.ctx.currentTime); // Base idle RPM tone
      this.engineOsc2.frequency.setValueAtTime(80, this.ctx.currentTime);

      this.engineOsc.start();
      this.engineOsc2.start();

      this.isRunning = true;
    } catch {
      // Handle audio start errors
    }
  }

  public updateEngine(speedKmh: number, maxSpeedKmh: number, isAccelerating: boolean, isNitro: boolean) {
    if (!this.ctx || !this.isRunning || !this.engineOsc || !this.engineOsc2 || !this.engineFilter) return;

    const ratio = Math.max(0, Math.min(1.2, speedKmh / maxSpeedKmh));
    // Base frequency shift based on RPM / speed ratio
    let targetFreq = 40 + ratio * 220; 
    if (isAccelerating) targetFreq += 25;
    if (isNitro) targetFreq += 60;

    const filterFreq = 250 + ratio * 1200;

    const now = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 1.5, now, 0.05);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
  }

  public stopEngine() {
    if (!this.engineOsc) return;
    try {
      this.engineOsc.stop();
      this.engineOsc2?.stop();
      this.engineOsc.disconnect();
      this.engineOsc2?.disconnect();
    } catch {
      // ignore
    }
    this.isRunning = false;
  }

  public playHorn() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
      osc2.frequency.setValueAtTime(554.37, this.ctx.currentTime); // C#5

      gain.gain.setValueAtTime(this.volume * 0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 0.4);
      osc2.stop(this.ctx.currentTime + 0.4);
    } catch {
      // ignore
    }
  }

  public playCrash() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      // White noise burst for crash
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
    } catch {
      // ignore
    }
  }

  public playNitroWhoosh() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      filter.Q.setValueAtTime(3, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // ignore
    }
  }
}

export const soundSynth = new SoundSynthesizer();
