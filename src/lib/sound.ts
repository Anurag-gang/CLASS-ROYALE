// 8-Bit Web Audio Synthesizer for Class Royale retro arcade effects
class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.muted = localStorage.getItem("class_royale_muted") === "true";
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("class_royale_muted", this.muted ? "true" : "false");
    }
    return this.muted;
  }

  // 1. Retro Button Click / Beep
  public playClick() {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  // 2. XP Coin Pickup
  public playCoin() {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // 3. Quiz Battle Correct Hit
  public playCorrect() {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.15);
      });
    } catch {}
  }

  // 4. Incorrect Answer Buzz
  public playWrong() {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  // 5. Level Up Fanfare!
  public playLevelUp() {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [
        { f: 440, t: 0.1 },
        { f: 554.37, t: 0.1 },
        { f: 659.25, t: 0.1 },
        { f: 880, t: 0.3 },
      ];
      let offset = 0;
      notes.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(note.f, now + offset);
        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + note.t);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + offset);
        osc.stop(now + offset + note.t);
        offset += note.t * 0.8;
      });
    } catch {}
  }
}

export const retroSound = new RetroAudioEngine();