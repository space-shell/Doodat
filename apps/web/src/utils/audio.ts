let ctx: AudioContext | null = null;

export function beep(frequency = 800, durationMs = 150): void {
  if (typeof window === 'undefined') return;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = frequency;
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
  osc.start(now);
  osc.stop(now + durationMs / 1000);
}
