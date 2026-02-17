import { Howl } from 'howler';

class SoundManager {
  bgm: Howl | null = null;
  sfx: Record<string, Howl> = {};
  isMuted: boolean = false;

  constructor() {
    // We will generate audio buffers procedurally to avoid external assets
    // This is a bit complex but ensures the game works without external files
    this.initAudio();
  }

  initAudio() {
    // Placeholder for procedural audio generation
    // In a real scenario, we'd load files, but here we'll try to synthesize simple sounds
    // using Web Audio API directly if Howler doesn't support synthesis easily.
    // Actually, let's use standard Web Audio API for synthesis and wrap it.
  }
  
  // We'll use a simple synth approach for now
  ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

  async resume() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  bgmInterval: number | null = null;
  celebrationInterval: number | null = null;

  stopBGM() {
    if (this.bgmInterval !== null) {
      window.clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.celebrationInterval !== null) {
      window.clearInterval(this.celebrationInterval);
      this.celebrationInterval = null;
    }
  }

  playBGM() {
    this.stopBGM();
    this.resume();
    if (this.isMuted) return;

    // Simple techno loop (approx 120 BPM = 500ms per beat)
    const beat = 0.5;
    let step = 0;

    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted) return;
      const time = this.ctx.currentTime;
      
      // Bass (Kick-ish) on every beat
      this.playTone(110, time, 0.1, 'sawtooth', 0.3);
      
      // Off-beat Hi-hat
      this.playNoise(time + beat / 2);

      // Simple Bassline pattern
      if (step % 4 === 0) {
        this.playTone(55, time, 0.2, 'square', 0.4);
      } else if (step % 4 === 2) {
        this.playTone(55, time, 0.2, 'square', 0.4);
      }

      // Random melody blips
      if (Math.random() > 0.7) {
         const note = [440, 554, 659, 880][Math.floor(Math.random() * 4)];
         this.playTone(note, time + Math.random() * beat, 0.1, 'square', 0.1);
      }

      step++;
    }, 500); 
  }

  playCelebration() {
    this.stopBGM();
    this.resume();
    if (this.isMuted) return;

    // Upbeat Celebration Loop (Faster, Major Key)
    const beat = 0.25; // Faster tempo
    let step = 0;

    this.celebrationInterval = window.setInterval(() => {
      if (this.isMuted) return;
      const time = this.ctx.currentTime;

      // Happy Arpeggio (C Major: C, E, G, C)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const note = notes[step % 4];
      
      this.playTone(note, time, 0.1, 'triangle', 0.2);
      
      // Snare/Clap on 2 and 4
      if (step % 4 === 2 || step % 4 === 0) {
        this.playNoise(time);
      }

      step++;
    }, 250);
  }

  playTone(freq: number, startTime: number, duration: number, type: OscillatorType = 'sine', vol: number = 0.1) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playNoise(startTime: number) {
    const bufferSize = this.ctx.sampleRate * 0.05; // Short burst
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
    
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start(startTime);
  }

  scheduleNote(freq: number, delay: number, dur: number, type: OscillatorType) {
    this.playTone(freq, this.ctx.currentTime + delay, dur, type);
  }

  playPickup() {
    this.playTone(880, this.ctx.currentTime, 0.1, 'square', 0.1);
    this.playTone(1760, this.ctx.currentTime + 0.1, 0.1, 'square', 0.1);
  }

  playError() {
    this.playTone(150, this.ctx.currentTime, 0.3, 'sawtooth', 0.2);
    this.playTone(100, this.ctx.currentTime + 0.1, 0.3, 'sawtooth', 0.2);
  }
  
  playWin() {
    this.playTone(440, this.ctx.currentTime, 0.1, 'square', 0.2);
    this.playTone(554, this.ctx.currentTime + 0.1, 0.1, 'square', 0.2);
    this.playTone(659, this.ctx.currentTime + 0.2, 0.4, 'square', 0.2);
  }
  
  playLose() {
    this.playTone(300, this.ctx.currentTime, 0.5, 'sawtooth', 0.2);
    this.playTone(200, this.ctx.currentTime + 0.5, 0.5, 'sawtooth', 0.2);
  }
}

export const soundManager = new SoundManager();
