// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { neuOnEnter, neuOnExit, PHASE_MS } from './neuTransition';

function makeEl(children = 2): HTMLElement {
  const el = document.createElement('article');
  el.className = 'neu-raised';
  for (let i = 0; i < children; i++) el.append(document.createElement('div'));
  return el;
}

describe('neuOnExit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('fades children opacity to 0 immediately', () => {
    const el = makeEl(2);
    neuOnExit(el, vi.fn());
    const [c1, c2] = [...el.children] as HTMLElement[];
    expect(c1.style.opacity).toBe('0');
    expect(c2.style.opacity).toBe('0');
  });

  it('flattens box-shadow to none after PHASE_MS', () => {
    const el = makeEl();
    neuOnExit(el, vi.fn());
    vi.advanceTimersByTime(PHASE_MS);
    expect(el.style.boxShadow).toBe('none');
  });

  it('calls done after 2 × PHASE_MS', () => {
    const done = vi.fn();
    neuOnExit(makeEl(), done);
    vi.advanceTimersByTime(PHASE_MS);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(PHASE_MS);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('calls done immediately when prefers-reduced-motion is set', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    const done = vi.fn();
    neuOnExit(makeEl(), done);
    expect(done).toHaveBeenCalledTimes(1);
  });
});

describe('neuOnEnter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sets children opacity to 0 and triggers shadow raise (boxShadow cleared)', () => {
    const el = makeEl(2);
    neuOnEnter(el, vi.fn());
    expect(el.style.boxShadow).toBe('');
    const [c1, c2] = [...el.children] as HTMLElement[];
    expect(c1.style.opacity).toBe('0');
    expect(c2.style.opacity).toBe('0');
  });

  it('fades in children (clears opacity) after PHASE_MS', () => {
    const el = makeEl(2);
    neuOnEnter(el, vi.fn());
    vi.advanceTimersByTime(PHASE_MS);
    const [c1, c2] = [...el.children] as HTMLElement[];
    expect(c1.style.opacity).toBe('');
    expect(c2.style.opacity).toBe('');
  });

  it('calls done and cleans up inline transitions after 2 × PHASE_MS', () => {
    const el = makeEl(2);
    const done = vi.fn();
    neuOnEnter(el, done);
    vi.advanceTimersByTime(PHASE_MS);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(PHASE_MS);
    expect(done).toHaveBeenCalledTimes(1);
    expect(el.style.transition).toBe('');
    const [c1] = [...el.children] as HTMLElement[];
    expect(c1.style.transition).toBe('');
  });

  it('calls done immediately when prefers-reduced-motion is set', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    const done = vi.fn();
    neuOnEnter(makeEl(), done);
    expect(done).toHaveBeenCalledTimes(1);
  });
});
