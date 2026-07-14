import { describe, it, expect } from 'vitest';
import { reduce, initialState, dayBefore } from './reducer';
import type { AppState, UserProfile, StreakState } from '../types';
import type { UserPreferences } from '@doodat/cards';
import { dealDailyCards } from '@doodat/cards';

const DATE = '2026-01-15'; // a Thursday

const ZERO_STREAK: StreakState = {
  count: 0,
  lastCompletedDate: null,
  dayStartCount: 0,
  dayStartLastCompletedDate: null,
};

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
    ...dealDailyCards({ date: DATE, pubkey: profile.localId, volume: 6 }),
    { id: `sys-completion-${DATE}`, type: 'completion' as const },
  ];
  return {
    profile,
    daily: { date: DATE, outcomes: [], accountabilityShown: false },
    recentCardIds: [],
    streak: { ...ZERO_STREAK },
    deck,
    currentIndex: 0,
    ...over,
  };
}

/** Helper: get the content card at a deck index, narrowed. */
function contentAt(s: AppState, i: number) {
  const c = s.deck[i];
  if (!c || c.type !== 'content') throw new Error(`expected content card at ${i}`);
  return c;
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

describe('NAVIGATE', () => {
  it('jumps to the specified deck index', () => {
    const next = reduce(makeState({ currentIndex: 0 }), { type: 'NAVIGATE', index: 5 });
    expect(next.currentIndex).toBe(5);
  });

  it('clamps to the last valid index', () => {
    const s = makeState();
    const lastIndex = s.deck.length - 1;
    const next = reduce(s, { type: 'NAVIGATE', index: 999 });
    expect(next.currentIndex).toBe(lastIndex);
  });

  it('clamps to 0 for negative indices', () => {
    const next = reduce(makeState({ currentIndex: 3 }), { type: 'NAVIGATE', index: -5 });
    expect(next.currentIndex).toBe(0);
  });
});

describe('SWIPE', () => {
  it('records a complete outcome and navigates to next incomplete', () => {
    const s = makeState({ currentIndex: 0 });
    const card = contentAt(s, 0);
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.daily.outcomes).toHaveLength(1);
    expect(next.daily.outcomes[0].swipeDirection).toBe('complete');
    expect(next.daily.outcomes[0].cardId).toBe(card.id);
    // card 0 is resolved, next incomplete is card 1
    expect(next.currentIndex).toBe(1);
  });

  it('stamps actionResponses on the outcome when provided', () => {
    const s = makeState({ currentIndex: 0 });
    const card = contentAt(s, 0);
    const next = reduce(s, {
      type: 'SWIPE',
      card,
      direction: 'complete',
      actionResponses: { 'c:journal': 'my reflection' },
    });
    expect(next.daily.outcomes[0].actionResponses).toEqual({ 'c:journal': 'my reflection' });
  });

  it('omits actionResponses when none are provided', () => {
    const s = makeState({ currentIndex: 0 });
    const card = contentAt(s, 0);
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.daily.outcomes[0].actionResponses).toBeUndefined();
  });

  it('records a skip outcome', () => {
    const s = makeState();
    const card = contentAt(s, 0);
    const next = reduce(s, { type: 'SWIPE', card, direction: 'skip' });
    expect(next.daily.outcomes[0].swipeDirection).toBe('skip');
  });

  it('appends the swiped card id to recentCardIds (capped at 63)', () => {
    const s = makeState({ recentCardIds: Array.from({ length: 63 }, (_, i) => `phys-${i}`) });
    const card = contentAt(s, 0);
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.recentCardIds).toHaveLength(63);
    expect(next.recentCardIds[62]).toBe(card.id);
  });

  it('updates the outcome in place when re-swiping the same card', () => {
    const s = makeState({ currentIndex: 0 });
    const card = contentAt(s, 0);
    const skipped = reduce(s, { type: 'SWIPE', card, direction: 'skip' });
    expect(skipped.daily.outcomes).toHaveLength(1);
    expect(skipped.daily.outcomes[0].swipeDirection).toBe('skip');
    // Navigate back to card 0 and complete it
    const navBack = reduce(skipped, { type: 'NAVIGATE', index: 0 });
    const completed = reduce(navBack, { type: 'SWIPE', card: contentAt(navBack, 0), direction: 'complete' });
    // Still only 1 outcome — replaced, not appended
    expect(completed.daily.outcomes).toHaveLength(1);
    expect(completed.daily.outcomes[0].swipeDirection).toBe('complete');
  });

  it('does not duplicate the card id in recentCardIds on re-swipe', () => {
    const s = makeState({ currentIndex: 0 });
    const card = contentAt(s, 0);
    const first = reduce(s, { type: 'SWIPE', card, direction: 'skip' });
    const navBack = reduce(first, { type: 'NAVIGATE', index: 0 });
    const second = reduce(navBack, { type: 'SWIPE', card: contentAt(navBack, 0), direction: 'complete' });
    expect(second.recentCardIds.filter((id) => id === card.id)).toHaveLength(1);
  });

  it('navigates to the next incomplete card, skipping already-resolved ones', () => {
    // Pre-resolve cards 0 and 1, then complete card 2 → should jump to card 3
    const s = makeState({
      currentIndex: 2,
      daily: {
        date: DATE,
        outcomes: [
          { cardId: 'pre-0', domain: 'physical', swipeDirection: 'complete', intensity: 'medium', difficulty: 'medium', timestamp: 1 },
          { cardId: 'pre-1', domain: 'mental', swipeDirection: 'complete', intensity: 'medium', difficulty: 'medium', timestamp: 2 },
        ],
        accountabilityShown: false,
      },
    });
    // Override the outcome cardIds to match the actual deck card ids
    const card0 = contentAt(s, 0);
    const card1 = contentAt(s, 1);
    s.daily.outcomes[0].cardId = card0.id;
    s.daily.outcomes[1].cardId = card1.id;
    const card2 = contentAt(s, 2);
    const next = reduce(s, { type: 'SWIPE', card: card2, direction: 'complete' });
    // Cards 0, 1, 2 are now resolved → next incomplete is card 3
    expect(next.currentIndex).toBe(3);
  });

  it('auto-navigates to completion when all content cards are resolved', () => {
    const s = makeState();
    const contentCount = s.deck.filter((c) => c.type === 'content').length;
    let state = s;
    for (let i = 0; i < contentCount; i++) {
      const card = contentAt(state, i);
      state = reduce(state, { type: 'SWIPE', card, direction: 'complete' });
    }
    // All content resolved → should be on the completion card
    expect(state.deck[state.currentIndex].type).toBe('completion');
  });

  it('injects an accountability card after the 3rd skip', () => {
    let s = makeState();
    for (let i = 0; i < 3; i++) {
      const card = contentAt(s, s.currentIndex);
      s = reduce(s, { type: 'SWIPE', card, direction: 'skip' });
    }
    expect(s.deck[s.currentIndex].type).toBe('accountability');
  });

  it('does not inject accountability once already shown', () => {
    let s = makeState({ daily: { date: DATE, outcomes: [], accountabilityShown: true } });
    for (let i = 0; i < 3; i++) {
      const card = contentAt(s, s.currentIndex);
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
  it('marks accountability shown and navigates to the first unresolved card', () => {
    // 3 skips on cards 0-2, accountability spliced at index 3
    let s = makeState();
    for (let i = 0; i < 3; i++) {
      const card = contentAt(s, s.currentIndex);
      s = reduce(s, { type: 'SWIPE', card, direction: 'skip' });
    }
    expect(s.deck[s.currentIndex].type).toBe('accountability');
    const next = reduce(s, { type: 'DISMISS_ACCOUNTABILITY' });
    expect(next.daily.accountabilityShown).toBe(true);
    // Cards 0-2 are resolved (skipped) → first unresolved is card 3 (now at index 4 due to splice)
    expect(next.deck[next.currentIndex].type).toBe('content');
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
      daily: { date: DATE, outcomes: [{ cardId: 'x', domain: 'physical', swipeDirection: 'complete', intensity: 'medium', difficulty: 'medium', timestamp: 1 }], accountabilityShown: true },
      currentIndex: 5,
    });
    const next = reduce(s, { type: 'DAILY_RESET', date: '2026-01-16' });
    expect(next.daily.date).toBe('2026-01-16');
    expect(next.daily.outcomes).toEqual([]);
    expect(next.daily.accountabilityShown).toBe(false);
    expect(next.currentIndex).toBe(0);
    expect(next.deck.length).toBe(7); // 6 content + completion (medium volume)
  });

  it('prepends an intensity_select card on a new ISO week', () => {
    const s = makeState();
    const next = reduce(s, { type: 'DAILY_RESET', date: '2026-01-22' }); // next week
    expect(next.deck[0].type).toBe('intensity_select');
  });

  it('snapshots streak base when yesterday had completions', () => {
    const s = makeState({
      streak: { count: 3, lastCompletedDate: DATE, dayStartCount: 2, dayStartLastCompletedDate: dayBefore(DATE) },
    });
    const next = reduce(s, { type: 'DAILY_RESET', date: '2026-01-16' });
    // Yesterday (DATE) had completions → dayStartCount = count (3), dayStartLastDate = DATE
    expect(next.streak.dayStartCount).toBe(3);
    expect(next.streak.dayStartLastCompletedDate).toBe(DATE);
    // count starts at dayStartCount (no outcomes yet today)
    expect(next.streak.count).toBe(3);
  });

  it('resets streak base to 0 when yesterday had no completions', () => {
    const s = makeState({
      streak: { count: 3, lastCompletedDate: '2026-01-10', dayStartCount: 0, dayStartLastCompletedDate: '2026-01-10' },
    });
    const next = reduce(s, { type: 'DAILY_RESET', date: '2026-01-16' });
    expect(next.streak.dayStartCount).toBe(0);
    expect(next.streak.count).toBe(0);
  });
});

describe('streak tracking', () => {
  it('starts the streak at 1 on first completion', () => {
    const s = makeState({ streak: { ...ZERO_STREAK } });
    const card = contentAt(s, 0);
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.streak.count).toBe(1);
    expect(next.streak.lastCompletedDate).toBe(DATE);
  });

  it('does not double-count same-day completions', () => {
    const s = makeState({ streak: { count: 1, lastCompletedDate: DATE, dayStartCount: 0, dayStartLastCompletedDate: null } });
    const card = contentAt(s, 1);
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.streak.count).toBe(1);
  });

  it('increments when completing on the day after lastCompletedDate', () => {
    const yesterday = dayBefore(DATE);
    const s = makeState({
      streak: { count: 3, lastCompletedDate: yesterday, dayStartCount: 3, dayStartLastCompletedDate: yesterday },
      daily: { date: DATE, outcomes: [], accountabilityShown: false },
    });
    const card = contentAt(s, 0);
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.streak.count).toBe(4);
    expect(next.streak.lastCompletedDate).toBe(DATE);
  });

  it('resets to 1 when there is a gap > 1 day', () => {
    const s = makeState({
      streak: { count: 0, lastCompletedDate: '2026-01-10', dayStartCount: 0, dayStartLastCompletedDate: '2026-01-10' },
      daily: { date: DATE, outcomes: [], accountabilityShown: false },
    });
    const card = contentAt(s, 0);
    const next = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(next.streak.count).toBe(1);
    expect(next.streak.lastCompletedDate).toBe(DATE);
  });

  it('reverts the streak when flipping a completion to a skip', () => {
    // Start with a streak of 3 from yesterday
    const yesterday = dayBefore(DATE);
    const s = makeState({
      streak: { count: 3, lastCompletedDate: yesterday, dayStartCount: 3, dayStartLastCompletedDate: yesterday },
    });
    // Complete card 0 → streak extends to 4
    const card = contentAt(s, 0);
    const completed = reduce(s, { type: 'SWIPE', card, direction: 'complete' });
    expect(completed.streak.count).toBe(4);
    // Navigate back and flip to skip
    const navBack = reduce(completed, { type: 'NAVIGATE', index: 0 });
    const flipped = reduce(navBack, { type: 'SWIPE', card: contentAt(navBack, 0), direction: 'skip' });
    // No completions today → streak reverts to dayStart (3)
    expect(flipped.streak.count).toBe(3);
    expect(flipped.streak.lastCompletedDate).toBe(yesterday);
  });

  it('increments the streak when flipping a skip to a completion', () => {
    const yesterday = dayBefore(DATE);
    const s = makeState({
      streak: { count: 3, lastCompletedDate: yesterday, dayStartCount: 3, dayStartLastCompletedDate: yesterday },
    });
    // Skip card 0
    const card = contentAt(s, 0);
    const skipped = reduce(s, { type: 'SWIPE', card, direction: 'skip' });
    expect(skipped.streak.count).toBe(3); // no change
    // Navigate back and flip to complete
    const navBack = reduce(skipped, { type: 'NAVIGATE', index: 0 });
    const flipped = reduce(navBack, { type: 'SWIPE', card: contentAt(navBack, 0), direction: 'complete' });
    expect(flipped.streak.count).toBe(4);
    expect(flipped.streak.lastCompletedDate).toBe(DATE);
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
