export class AudioManager {
  constructor(report = console.warn) { this.tracks = new Map(); this.voices = new Set(); this.unlocked = false; this.report = report; }
  register(id, element) { this.tracks.set(id, element); }
  // Call directly from the trusted click/keyboard handler, never from a timer.
  unlock() {
    this.unlocked = true;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) {
      try { this.context ??= new Context(); void this.context.resume().catch(this.report); }
      catch (error) { this.report(error); }
    }
  }
  async play(id, { loop = false, volume = 1 } = {}) {
    const audio = this.tracks.get(id);
    if (!this.unlocked || !audio) return false;
    audio.loop = loop;
    audio.volume = Math.max(0, Math.min(1, volume));
    try { await audio.play(); return true; }
    catch (error) { this.report(error); return false; }
  }
  impact({ impactVolume, impactDuration }) {
    if (!this.unlocked || !this.context) return;
    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(92, now);
    oscillator.frequency.exponentialRampToValueAtTime(34, now + impactDuration * 0.8);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(impactVolume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + impactDuration);
    oscillator.connect(gain); gain.connect(ctx.destination);
    this.voices.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.voices.delete(oscillator); };
    oscillator.start(now); oscillator.stop(now + impactDuration);
  }
  reset() {
    for (const voice of this.voices) { voice.stop(); voice.disconnect(); }
    this.voices.clear();
    for (const audio of this.tracks.values()) { audio.pause(); if (audio.readyState) audio.currentTime = 0; }
  }
  dispose() { this.reset(); void this.context?.close(); this.tracks.clear(); }
}
