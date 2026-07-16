// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { decideSwipe, createSwipeHandlers } from './swipeNav';

describe('decideSwipe', () => {
  it('returns "next" for a leftward swipe past threshold', () => {
    expect(decideSwipe({ x: 200, y: 100 }, { x: 120, y: 100 })).toBe('next');
  });

  it('returns "prev" for a rightward swipe past threshold', () => {
    expect(decideSwipe({ x: 100, y: 100 }, { x: 180, y: 100 })).toBe('prev');
  });

  it('treats the threshold (50px) as sufficient (inclusive)', () => {
    expect(decideSwipe({ x: 100, y: 0 }, { x: 50, y: 0 })).toBe('next');
  });

  it('returns null when below threshold', () => {
    expect(decideSwipe({ x: 100, y: 100 }, { x: 140, y: 100 })).toBeNull();
  });

  it('returns null when motion is vertical-dominant', () => {
    expect(decideSwipe({ x: 100, y: 100 }, { x: 30, y: 300 })).toBeNull();
  });

  it('returns null when dx and dy are equal (diagonal)', () => {
    expect(decideSwipe({ x: 0, y: 0 }, { x: 80, y: 80 })).toBeNull();
  });

  it('honours a custom threshold', () => {
    expect(decideSwipe({ x: 0, y: 0 }, { x: 60, y: 0 }, { thresholdPx: 100 })).toBeNull();
    expect(decideSwipe({ x: 0, y: 0 }, { x: 110, y: 0 }, { thresholdPx: 100 })).toBe('prev');
  });
});

describe('createSwipeHandlers', () => {
  function fakeTouch(x: number, y: number): Touch {
    return { clientX: x, clientY: y } as Touch;
  }

  function emit(
    handlers: ReturnType<typeof createSwipeHandlers>,
    start: { x: number; y: number; target?: Element },
    end: { x: number; y: number },
  ): void {
    handlers.onTouchStart({
      touches: [fakeTouch(start.x, start.y)],
      changedTouches: [],
      target: start.target ?? document.body,
    } as unknown as TouchEvent);
    handlers.onTouchEnd({
      touches: [],
      changedTouches: [fakeTouch(end.x, end.y)],
      target: start.target ?? document.body,
    } as unknown as TouchEvent);
  }

  it('fires onSwipe("next") on a leftward swipe past threshold', () => {
    const onSwipe = vi.fn();
    const h = createSwipeHandlers(onSwipe);
    emit(h, { x: 200, y: 100 }, { x: 100, y: 100 });
    expect(onSwipe).toHaveBeenCalledWith('next');
  });

  it('does not fire when below threshold', () => {
    const onSwipe = vi.fn();
    const h = createSwipeHandlers(onSwipe);
    emit(h, { x: 100, y: 100 }, { x: 130, y: 100 });
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('does not fire when the touch starts on a textarea', () => {
    const onSwipe = vi.fn();
    const h = createSwipeHandlers(onSwipe);
    const ta = document.createElement('textarea');
    document.body.append(ta);
    emit(h, { x: 200, y: 100, target: ta }, { x: 50, y: 100 });
    expect(onSwipe).not.toHaveBeenCalled();
    ta.remove();
  });

  it('does not fire when the touch starts on a link', () => {
    const onSwipe = vi.fn();
    const h = createSwipeHandlers(onSwipe);
    const a = document.createElement('a');
    document.body.append(a);
    emit(h, { x: 200, y: 100, target: a }, { x: 50, y: 100 });
    expect(onSwipe).not.toHaveBeenCalled();
    a.remove();
  });

  it('ignores multi-touch starts', () => {
    const onSwipe = vi.fn();
    const h = createSwipeHandlers(onSwipe);
    h.onTouchStart({
      touches: [fakeTouch(200, 100), fakeTouch(210, 110)],
      changedTouches: [],
      target: document.body,
    } as unknown as TouchEvent);
    h.onTouchEnd({
      touches: [],
      changedTouches: [fakeTouch(50, 100)],
      target: document.body,
    } as unknown as TouchEvent);
    expect(onSwipe).not.toHaveBeenCalled();
  });
});
