import { describe, it, expect } from 'vitest';
import { reduce, initialState, dayBefore } from './reducer';
import type { AppState, UserProfile } from '../types';
import type { UserPreferences } from '@doodat/cards';
import { dealDailyCards } from '@doodat/cards';

const DATE = '2026-01-15'; // a Thursday

function makeProfile(over: Partial<UserProfile> = {}): UserProfile {
  return {
    localId: 'test-id',
    currentIntensity: 'medium',
    intensitySetAt: new Date(DATE).getTime(),
    onboardingComplete: true,
    ...over,
  };
}

function makeState(over: Partial<AppState> = {}): AppState {
  const profile = makeProfile();
  const deck = [
    ...dealDailyCards({ date: DATE, pubkey: profile.localId, intensity: 'medium' }),
    { id: `sys-completion-${DATE}`, type: 'completion' as const },
  ];
  return {
    profile,
    daily: { date: DATE, outcomes: [], accountabilityShown: false },
    recentCardIds: [],
    streak: { count: 0, lastCompletedDate: null },
    deck,
    currentIndex: 0,
    ...over,
  };
}

describe('initialState', () => {
  it('builds an onboarding deck when onboarding is not complete', () => {
    const s = initialState(makeProfile({ onboardingComplete: false }));
    expect(s.profile.onboardingComplete).toBe(false);
    expect(s.deck.map((c) => c.type)).toEqual([
      'welcome',
      'wizard_physical',
      'wizard_mental',
      'wizard_spiritual',
      'wizard_intensity',
    ]);
    expect(s.currentIndex).toBe(0);
  });
});

describe('SET_PREFERENCES', () => {
  it('merges preferences into the profile', () => {
    const prefs: UserPreferences = {
      physical: { focusAreas: ['upper_body'], fastingInterest: false, dietaryPreferences: [] },
      mental: { challenges: ['focus'], readingPreferences: [], writingComfort: true },
      spiritual: { traditionProximity: 50, traditions: [] },
    };
    const next = reduce(makeState(), { type: 'SET_PREFERENCES', preferences: prefs });
    expect(next.profile.preferences).toEqual(prefs);
  });
});

describe('SET_INTENSITY', () => {
  it('completes onboarding and builds the daily deck when onboarded = false', () => {
    const s = initialState(makeProfile({ onboardingComplete: false, intensitySetAt: 0 }));
    const next = reduce(s, { type: 'SET_INTENSITY', intensity: 'high' });
    expect(next.profile.onboardingComplete).toBe(true);
    expect(next.profile.currentIntensity).toBe('high');
    expect(next.profile.intensitySetAt).toBeGreaterThan(0);
    // deck is now content cards + completion, not wizard cards
    expect(next.deck.some((c) => c.type === 'content')).toBe(true);
    expect(next.deck[next.deck.length - 1].type).toBe('completion');
    expect(next.currentIndex).toBe(0);
  });

  it('updates intensitySetAt on weekly re-commit (already onboarded)', () => {
    const before = makeState({ profile: makeProfile({ intensitySetAt: 1000 }) });
    const next = reduce(before, { type: 'SET_INTENSITY', intensity: 'low' });
    expect(next.profile.currentIntensity).toBe('low');
    expect(next.profile.intensitySetAt).toBeGreaterThan(1000);
  });
});

describe('SWIPE', () => {
  it('records a complete outcome and advances the index', () => {
    const s = makeState({ currentIndex: 0 });
    const card = s.deck[0];
    if (card.type !== 'content') throw new Error('expected content card');
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.daily.outcomes).toHaveLength(1);
    expect(next.daily.outcomes[0].swipeDirection).toBe('complete');
    expect(next.daily.outcomes[0].cardId).toBe(card.id);
    expect(next.currentIndex).toBe(1);
  });

  it('records a skip outcome', () => {
    const s = makeState();
    const card = s.deck[0];
    if (card.type !== 'content') throw new Error('expected content card');
    const next = reduce(s, { type: 'SWIPE', card, direction: 'skip' });
    expect(next.daily.outcomes[0].swipeDirection).toBe('skip');
  });

  it('appends the swiped card id to recentCardIds (capped at 63)', () => {
    const s = makeState({ recentCardIds: Array.from({ length: 63 }, (_, i) => `phys-${i}`) });
    const card = s.deck[0];
    if (card.type !== 'content') throw new Error('expected content card');
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.recentCardIds).toHaveLength(63);
    expect(next.recentCardIds[62]).toBe(card.id);
  });

  it('injects an accountability card after the 3rd skip', () => {
    let s = makeState();
    // swipe 3 content cards, all skip
    for (let i = 0; i < 3; i++) {
      const card = s.deck[s.currentIndex];
      if (card.type !== 'content') throw new Error('expected content card');
      s = reduce(s, { type: 'SWIPE', card, direction: 'skip' });
    }
    // After 3rd skip, next card should be the accountability card
    expect(s.deck[s.currentIndex].type).toBe('accountability');
  });

  it('does not inject accountability once already shown', () => {
    let s = makeState({ daily: { date: DATE, outcomes: [], accountabilityShown: true } });
    for (let i = 0; i < 3; i++) {
      const card = s.deck[s.currentIndex];
      if (card.type !== 'content') throw new Error('expected content card');
      s = reduce(s, { type: 'SWIPE', card, direction: 'skip' });
    }
    expect(s.deck.some((c) => c.type === 'accountability')).toBe(false);
  });

  it('is a no-op when there is no current content card', () => {
    const s = makeState({ currentIndex: 99 });
    const before = JSON.parse(JSON.stringify(s));
    const next = reduce(s, { type: 'SWIPE', card: s.deck[0] as never, direction: 'complete' });
    expect(next).toEqual(before);
  });
});

describe('ADVANCE', () => {
  it('moves to the next card', () => {
    const next = reduce(makeState({ currentIndex: 2 }), { type: 'ADVANCE' });
    expect(next.currentIndex).toBe(3);
  });

  it('clamps at the last card', () => {
    const s = makeState();
    const lastIndex = s.deck.length - 1;
    const next = reduce(makeState({ currentIndex: lastIndex }), { type: 'ADVANCE' });
    expect(next.currentIndex).toBe(lastIndex);
  });
});

describe('DISMISS_ACCOUNTABILITY', () => {
  it('marks accountability shown and advances past it', () => {
    // build a deck with an accountability card at index 3
    const base = makeState();
    const acc = { id: 'sys-acc', type: 'accountability' as const };
    const deck = [...base.deck.slice(0, 3), acc, ...base.deck.slice(3)];
    const s = makeState({ deck, currentIndex: 3 });
    const next = reduce(s, { type: 'DISMISS_ACCOUNTABILITY' });
    expect(next.daily.accountabilityShown).toBe(true);
    expect(next.currentIndex).toBe(4);
  });
});

describe('DAILY_RESET', () => {
  it('is a no-op when the date is unchanged', () => {
    const s = makeState();
    const next = reduce(s, { type: 'DAILY_RESET', date: DATE });
    expect(next).toEqual(s);
  });

  it('resets daily state and rebuilds the deck on a new day', () => {
    const s = makeState({
      daily: { date: DATE, outcomes: [{ cardId: 'x', domain: 'physical', swipeDirection: 'complete', intensity: 'medium', timestamp: 1 }], accountabilityShown: true },
      currentIndex: 5,
    });
    const next = reduce(s, { type: 'DAILY_RESET', date: '2026-01-16' });
    expect(next.daily.date).toBe('2026-01-16');
    expect(next.daily.outcomes).toEqual([]);
    expect(next.daily.accountabilityShown).toBe(false);
    expect(next.currentIndex).toBe(0);
    expect(next.deck.length).toBe(10); // 9 content + completion
  });

  it('prepends an intensity_select card on a new ISO week', () => {
    // intensitySetAt is on DATE (2026-01-15, ISO week 3). Reset to a date in a different week.
    const s = makeState();
    const next = reduce(s, { type: 'DAILY_RESET', date: '2026-01-22' }); // next week
    expect(next.deck[0].type).toBe('intensity_select');
  });
});

describe('streak tracking', () => {
  it('starts the streak at 1 on first completion', () => {
    const s = makeState({ streak: { count: 0, lastCompletedDate: null } });
    const card = s.deck[0];
    if (card.type !== 'content') throw new Error('expected content card');
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.streak).toEqual({ count: 1, lastCompletedDate: DATE });
  });

  it('does not double-count same-day completions', () => {
    const s = makeState({ streak: { count: 1, lastCompletedDate: DATE } });
    const card = s.deck[1];
    if (card.type !== 'content') throw new Error('expected content card');
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.streak.count).toBe(1);
  });

  it('increments when completing on the day after lastCompletedDate', () => {
    const yesterday = dayBefore(DATE);
    const s = makeState({ streak: { count: 3, lastCompletedDate: yesterday }, daily: { date: DATE, outcomes: [], accountabilityShown: false } });
    const card = s.deck[0];
    if (card.type !== 'content') throw new Error('expected content card');
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.streak).toEqual({ count: 4, lastCompletedDate: DATE });
  });

  it('resets to 1 when there is a gap > 1 day', () => {
    const s = makeState({ streak: { count: 5, lastCompletedDate: '2026-01-10' }, daily: { date: DATE, outcomes: [], accountabilityShown: false } });
    const card = s.deck[0];
    if (card.type !== 'content') throw new Error('expected content card');
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.streak).toEqual({ count: 1, lastCompletedDate: DATE });
  });
});

describe('dayBefore', () => {
  it('returns the previous calendar day', () => {
    expect(dayBefore('2026-01-16')).toBe('2026-01-15');
    expect(dayBefore('2026-03-01')).toBe('2026-02-28'); // non-leap year Feb
    expect(dayBefore('2024-03-01')).toBe('2024-02-29'); // leap year
    expect(dayBefore('2026-01-01')).toBe('2025-12-31'); // year boundary
  });
});
