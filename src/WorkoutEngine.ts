export interface ExerciseSegment {
  name: string;
  durationSeconds: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  durationSeconds: number;
  image: string;
  segments?: ExerciseSegment[];
}

const BASE = import.meta.env.BASE_URL;

export const routine: Exercise[] = [
  { id: 'plank', name: 'Plank', sets: 4, durationSeconds: 30, image: `${BASE}images/plank.png` },
  { id: 'hollow', name: 'Hollow Body Hold', sets: 3, durationSeconds: 20, image: `${BASE}images/hollow.png` },
  {
    id: 'alternating-lunges',
    name: 'Alternating Lunges',
    sets: 2,
    durationSeconds: 45,
    image: `${BASE}images/lunge.png`,
    segments: [
      { name: 'Left Leg', durationSeconds: 20 },
      { name: 'Switch', durationSeconds: 5 },
      { name: 'Right Leg', durationSeconds: 20 },
    ],
  },
  { id: 'hip', name: 'Hip Movement', sets: 1, durationSeconds: 60, image: `${BASE}images/hip.png` },
];

class AudioController {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    // Play a silent oscillator immediately to fully unlock iOS Web Audio
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0;
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.01);
  }

  playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playTick() {
    this.playTone(400, 0.1, 'square');
  }

  playStartBell() {
    this.playTone(800, 0.5, 'sine');
  }

  playEndBell() {
    this.playTone(600, 0.8, 'triangle');
  }
}

export const audioController = new AudioController();
