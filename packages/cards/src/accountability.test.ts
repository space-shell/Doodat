import { describe, it, expect } from 'vitest';
import { shouldTriggerAccountability } from './accountability';
import type { CardOutcome } from './types';

const skip = (cardId = 'phys-001'): CardOutcome => ({
  cardId,
  domain: 'physical',
  swipeDirection: 'skip',
  intensity: 'medium',
  timestamp: Date.now(),
});

const complete = (cardId = 'phys-002'): CardOutcome => ({
  cardId,
  domain: 'physical',
  swipeDirection: 'complete',
  intensity: 'medium',
  timestamp: Date.now(),
});

describe('shouldTriggerAccountability — US-005', () => {
  it('does not trigger before 3 skips', () => {
    expect(shouldTriggerAccountability([], false)).toBe(false);
    expect(shouldTriggerAccountability([skip()], false)).toBe(false);
    expect(shouldTriggerAccountability([skip(), skip()], false)).toBe(false);
  });

  it('triggers on exactly the 3rd skip', () => {
    const outcomes = [skip('a'), skip('b'), skip('c')];
    expect(shouldTriggerAccountability(outcomes, false)).toBe(true);
  });

  it('counts total skips, not consecutive (a complete between skips still counts)', () => {
    const outcomes = [skip('a'), complete(), skip('b'), skip('c')];
    expect(shouldTriggerAccountability(outcomes, false)).toBe(true);
  });

  it('does not trigger again once already prompted', () => {
    const outcomes = [skip('a'), skip('b'), skip('c')];
    expect(shouldTriggerAccountability(outcomes, true)).toBe(false);
  });

  it('does not trigger when there are fewer skips than completes+skips suggest', () => {
    // 2 skips + 7 completes = full deck but only 2 skips → no trigger
    const outcomes = [skip(), skip(), complete(), complete(), complete(), complete(), complete(), complete(), complete()];
    expect(shouldTriggerAccountability(outcomes, false)).toBe(false);
  });
});
