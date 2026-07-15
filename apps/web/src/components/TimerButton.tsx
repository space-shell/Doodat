import type { Component } from 'solid-js';
import { createSignal, onCleanup } from 'solid-js';
import { haptic } from '../utils/haptics';
import { beep } from '../utils/audio';

type Phase = 'idle' | 'arming' | 'countin' | 'running' | 'stopping' | 'finished';

const HOLD_MS = 3000;

const TimerButton: Component<{ durationSec: number }> = (props) => {
  const [phase, setPhase] = createSignal<Phase>('idle');
  const [holdProgress, setHoldProgress] = createSignal(0);
  const [remaining, setRemaining] = createSignal(props.durationSec);
  const [countinNum, setCountinNum] = createSignal(3);

  let holdRaf = 0;
  let holdStart = 0;
  let countinTimer: ReturnType<typeof setInterval> | undefined;
  let tickTimer: ReturnType<typeof setInterval> | undefined;

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const runHoldLoop = (onComplete: () => void) => {
    holdStart = performance.now();
    const tick = () => {
      const elapsed = performance.now() - holdStart;
      const p = Math.min(elapsed / HOLD_MS, 1);
      setHoldProgress(p);
      if (p < 1) {
        holdRaf = requestAnimationFrame(tick);
      } else {
        holdRaf = 0;
        onComplete();
      }
    };
    holdRaf = requestAnimationFrame(tick);
  };

  const cancelHold = () => {
    if (holdRaf) {
      cancelAnimationFrame(holdRaf);
      holdRaf = 0;
    }
    setHoldProgress(0);
  };

  const beginCountin = () => {
    haptic(20);
    beep(800, 150);
    setPhase('countin');
    setHoldProgress(0);
    setCountinNum(3);
    let n = 3;
    countinTimer = setInterval(() => {
      n--;
      if (n > 0) {
        setCountinNum(n);
      } else {
        clearInterval(countinTimer);
        countinTimer = undefined;
        startRunning();
      }
    }, 1000);
  };

  const startRunning = () => {
    beep(800, 200);
    haptic(30);
    setPhase('running');
    setRemaining(props.durationSec);
    tickTimer = setInterval(() => {
      const r = remaining() - 1;
      if (r <= 0) {
        setRemaining(0);
        clearInterval(tickTimer);
        tickTimer = undefined;
        finishTimer();
      } else {
        setRemaining(r);
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = undefined;
    beep(400, 150);
    haptic([10, 50, 10]);
    setPhase('idle');
    setHoldProgress(0);
    setRemaining(props.durationSec);
  };

  const finishTimer = () => {
    beep(800, 300);
    haptic([20, 100, 20]);
    setPhase('finished');
    setHoldProgress(0);
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    try { target.setPointerCapture(e.pointerId); } catch { /* noop */ }
    const p = phase();
    if (p === 'idle' || p === 'finished') {
      haptic(10);
      setPhase('arming');
      runHoldLoop(beginCountin);
    } else if (p === 'running') {
      haptic(10);
      setPhase('stopping');
      runHoldLoop(stopTimer);
    }
  };

  const onPointerUp = () => {
    const p = phase();
    if (p === 'arming') {
      cancelHold();
      setPhase('idle');
    } else if (p === 'stopping') {
      cancelHold();
      setPhase('running');
    }
  };

  onCleanup(() => {
    if (holdRaf) cancelAnimationFrame(holdRaf);
    if (countinTimer) clearInterval(countinTimer);
    if (tickTimer) clearInterval(tickTimer);
  });

  const display = () => {
    switch (phase()) {
      case 'idle':      return 'Hold to start';
      case 'arming':    return 'Starting…';
      case 'countin':   return String(countinNum());
      case 'running':   return fmt(remaining());
      case 'stopping':  return fmt(remaining());
      case 'finished':  return 'Done';
    }
  };

  const PATH_LEN = 100;
  const dashOffset = () => PATH_LEN * (1 - holdProgress());

  return (
    <button
      data-testid="timer-button"
      class="relative w-20 h-20 neu-button flex items-center justify-center select-none touch-none"
      style={{ "border-radius": "12px" }}
      aria-label={`Timer — ${display()}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full pointer-events-none">
        <rect
          x="10" y="10" width="80" height="80" rx="10" ry="10"
          fill="none"
          stroke="#B0A89E"
          stroke-width="2"
          opacity="0.3"
        />
        <rect
          x="10" y="10" width="80" height="80" rx="10" ry="10"
          fill="none"
          stroke="#6B9B6B"
          stroke-width="3"
          pathLength={PATH_LEN}
          stroke-dasharray={String(PATH_LEN)}
          stroke-dashoffset={dashOffset()}
          stroke-linecap="round"
        />
      </svg>
      <span class="relative z-10 text-sm text-dodaat-textPrimary">
        {display()}
      </span>
    </button>
  );
};

export default TimerButton;
