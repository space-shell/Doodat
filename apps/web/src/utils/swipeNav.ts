// Pure swipe-gesture logic + a thin touch-handler factory for the daily card.
// Kept framework-agnostic and RxJS-free so the threshold decision is unit-testable
// in isolation. Components wire this to the DOM and emit intents (architecture:
// components render + emit; they hold no business logic).

export type SwipeDirection = 'next' | 'prev';

export interface TouchPoint {
  x: number;
  y: number;
}

export interface SwipeDecisionOptions {
  /** Minimum horizontal travel in px to count as a swipe. Default 50. */
  thresholdPx?: number;
}

/** Default horizontal travel required before a touch is treated as a swipe. */
export const DEFAULT_SWIPE_THRESHOLD_PX = 50;

/**
 * Decide whether a touch gesture (start → end) is a horizontal swipe.
 *
 * Convention: swipe left (finger travels left, dx < 0) reveals the NEXT card;
 * swipe right (dx > 0) reveals the PREVIOUS card (gallery/e-reader convention).
 *
 * Returns `null` when the travel is below threshold or not horizontal-dominant
 * (so vertical scrolling inside textareas / the page is never hijacked).
 */
export function decideSwipe(
  start: TouchPoint,
  end: TouchPoint,
  options: SwipeDecisionOptions = {},
): SwipeDirection | null {
  const threshold = options.thresholdPx ?? DEFAULT_SWIPE_THRESHOLD_PX;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < threshold) return null; // too small
  if (absDy >= absDx) return null; // vertical or perfectly diagonal — not a horizontal swipe

  return dx < 0 ? 'next' : 'prev';
}

/** Elements whose native touch behaviour must be preserved (no swipe capture). */
const INTERACTIVE_SELECTOR = 'textarea, input, a, [contenteditable]';

export interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

/**
 * Build a set of TouchEvent handlers that detect a horizontal swipe and invoke
 * `onSwipe` with the resolved direction (or nothing for a non-swipe touch).
 *
 * - Only single-finger touches are tracked.
 * - Touches originating on a text-entry element or link are ignored so their
 *   native behaviour (scroll, caret placement, link tap) is preserved.
 * - `onTouchMove` is a no-op: this is a threshold-fling detector, not a
 *   drag-follows-finger implementation, so the card never moves mid-gesture.
 */
export function createSwipeHandlers(
  onSwipe: (dir: SwipeDirection) => void,
  options: SwipeDecisionOptions = {},
): SwipeHandlers {
  let start: TouchPoint | null = null;
  const threshold = options.thresholdPx ?? DEFAULT_SWIPE_THRESHOLD_PX;

  const point = (t: Touch): TouchPoint => ({ x: t.clientX, y: t.clientY });

  return {
    onTouchStart(e) {
      // Only track unambiguous single-finger touches.
      if (e.touches.length !== 1) {
        start = null;
        return;
      }
      const target = e.target as Element | null;
      if (target && typeof target.closest === 'function' && target.closest(INTERACTIVE_SELECTOR)) {
        start = null;
        return;
      }
      start = point(e.touches[0]);
    },
    onTouchMove() {
      // Intentionally passive: no preventDefault. Vertical scrolling stays native.
    },
    onTouchEnd(e) {
      const s = start;
      start = null;
      if (!s) return;
      const endTouch = e.changedTouches[0];
      if (!endTouch) return;
      const dir = decideSwipe(s, point(endTouch), { thresholdPx: threshold });
      if (dir) onSwipe(dir);
    },
  };
}
