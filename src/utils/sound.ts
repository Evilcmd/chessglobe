// Authentic Lichess sound service with zero-latency Web Audio buffer caching and fallback

class SoundService {
  private ctx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private enabled: boolean = true;
  private soundTheme: 'lichess' = 'lichess';

  constructor() {
    if (typeof window !== 'undefined') {
      // Lazy load sound files on first interaction
      window.addEventListener('click', () => this.initBuffers(), { once: true });
      window.addEventListener('keydown', () => this.initBuffers(), { once: true });
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private async loadBuffer(name: string, url: string) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const resp = await fetch(url);
      if (!resp.ok) return;
      const arrayBuffer = await resp.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      this.buffers[name] = decoded;
    } catch (_) {
      // Fallback synthesizer will be used
    }
  }

  private initBuffers() {
    const ctx = this.getContext();
    if (!ctx) return;
    this.loadBuffer('move', '/sounds/Move.mp3');
    this.loadBuffer('capture', '/sounds/Capture.mp3');
    this.loadBuffer('check', '/sounds/Check.mp3');
    this.loadBuffer('error', '/sounds/Error.mp3');
    this.loadBuffer('success', '/sounds/Confirmation.mp3');
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private playBuffer(name: string, volume: number = 0.85): boolean {
    if (!this.enabled) return true;
    const ctx = this.getContext();
    if (!ctx) return false;

    const buffer = this.buffers[name];
    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      return true;
    }

    // Try HTMLAudioElement directly if buffer not yet decoded
    try {
      const map: Record<string, string> = {
        move: '/sounds/Move.mp3',
        capture: '/sounds/Capture.mp3',
        check: '/sounds/Check.mp3',
        error: '/sounds/Error.mp3',
        success: '/sounds/Confirmation.mp3'
      };
      if (map[name]) {
        const a = new Audio(map[name]);
        a.volume = volume;
        a.play().catch(() => {});
        return true;
      }
    } catch (_) {}

    return false;
  }

  public playMove() {
    if (this.playBuffer('move', 0.9)) return;
    this.synthMove();
  }

  public playCapture() {
    if (this.playBuffer('capture', 1.0)) return;
    this.synthCapture();
  }

  public playCheck() {
    if (this.playBuffer('check', 0.9)) return;
    this.playMove();
  }

  public playCastle() {
    this.playMove();
    setTimeout(() => this.playMove(), 120);
  }

  public playWrong() {
    if (this.playBuffer('error', 0.8)) return;
    this.synthWrong();
  }

  public playSuccess() {
    if (this.playBuffer('success', 0.9)) return;
    this.synthSuccess();
  }

  // Synthesizer fallbacks if offline / before audio loads
  private synthMove() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  private synthCapture() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  private synthWrong() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  private synthSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const now = ctx.currentTime + i * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    });
  }
}

export const sound = new SoundService();
