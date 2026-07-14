import { describe, it, expect } from 'vitest';
import { dealDailyCards, getCardTask, cardWeight } from './deck';
import { physicalCards, cardById } from './data';
import type { ContentCard, UserPreferences } from './types';

const FIXED = { date: '2026-01-15', pubkey: 'test-pubkey-abc', intensity: 'medium' as const };

describe('dealDailyCards — structure', () => {
  it('deals exactly 9 cards', () => {
    expect(dealDailyCards(FIXED)).toHaveLength(9);
  });

  it('deals 3 per domain in physical → mental → spiritual order', () => {
    const deck = dealDailyCards(FIXED);
    expect(deck.slice(0, 3).every((c) => c.domain === 'physical')).toBe(true);
    expect(deck.slice(3, 6).every((c) => c.domain === 'mental')).toBe(true);
    expect(deck.slice(6, 9).every((c) => c.domain === 'spiritual')).toBe(true);
  });

  it('never deals the same card twice within one deck', () => {
    const deck = dealDailyCards(FIXED);
    const ids = deck.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('dealDailyCards — determinism', () => {
  it('same date + pubkey yields the identical deck', () => {
    const a = dealDailyCards(FIXED).map((c) => c.id);
    const b = dealDailyCards(FIXED).map((c) => c.id);
    expect(a).toEqual(b);
  });

  it('a different date yields a different deck (high probability)', () => {
    const a = dealDailyCards(FIXED).map((c) => c.id);
    const b = dealDailyCards({ ...FIXED, date: '2026-01-16' }).map((c) => c.id);
    expect(a).not.toEqual(b);
  });

  it('a different pubkey yields a different deck (high probability)', () => {
    const a = dealDailyCards(FIXED).map((c) => c.id);
    const b = dealDailyCards({ ...FIXED, pubkey: 'other-pubkey-xyz' }).map((c) => c.id);
    expect(a).not.toEqual(b);
  });
});

describe('dealDailyCards — recent-card de-duplication', () => {
  it('excludes recent ids when enough other cards are available', () => {
    const recent = physicalCards.slice(0, 5).map((c) => c.id); // 5 recent, 25 available
    const deck = dealDailyCards({ ...FIXED, recentCardIds: recent });
    const dealt = deck.slice(0, 3).map((c) => c.id);
    for (const id of recent) {
      expect(dealt, `recent card ${id} should not be dealt`).not.toContain(id);
    }
  });

  it('falls back to the full pool when too few non-recent cards remain', () => {
    // Mark 28 of 30 physical cards recent → only 2 available < 3 needed → fallback
    const recent = physicalCards.slice(0, 28).map((c) => c.id);
    const deck = dealDailyCards({ ...FIXED, recentCardIds: recent });
    expect(deck.slice(0, 3)).toHaveLength(3); // still deals 3, from full pool
  });
});

describe('getCardTask', () => {
  it("returns the text matching the card's own difficulty", () => {
    const picks = [
      cardById.get('phys-001') as ContentCard,
      cardById.get('ment-001') as ContentCard,
      cardById.get('spir-001') as ContentCard,
    ];
    for (const card of picks) {
      const expected =
        card.difficulty === 'low' ? card.intensity_low
          : card.difficulty === 'medium' ? card.intensity_medium
            : card.intensity_high;
      expect(getCardTask(card), card.id).toBe(expected);
    }
  });
});

describe('cardWeight — preference influence', () => {
  const basePrefs: UserPreferences = {
    physical: { focusAreas: [], fastingInterest: false, dietaryPreferences: [] },
    mental: { challenges: [], readingPreferences: [], writingComfort: true },
    spiritual: { traditionProximity: 50, traditions: [] },
  };

  it('returns 1 when there are no preferences', () => {
    const card = physicalCards[0];
    expect(cardWeight(card, undefined, 'physical')).toBe(1);
  });

  it('boosts cards whose tags match a focus area (+2)', () => {
    const upper = physicalCards.find((c) => c.tags.includes('upper_body'))!;
    const prefs: UserPreferences = {
      ...basePrefs,
      physical: { focusAreas: ['upper_body'], fastingInterest: false, dietaryPreferences: [] },
    };
    expect(cardWeight(upper, prefs, 'physical')).toBe(3);
  });

  it('boosts fasting cards when fastingInterest is set (+3)', () => {
    const fasting = physicalCards.find((c) => c.category === 'fasting') ?? physicalCards[0];
    const prefs: UserPreferences = {
      ...basePrefs,
      physical: { focusAreas: [], fastingInterest: true, dietaryPreferences: [] },
    };
    if (fasting.category === 'fasting') {
      expect(cardWeight(fasting, prefs, 'physical')).toBe(4);
    }
  });

  it('clamps negative weights to a small positive floor', () => {
    const writing = { ...physicalCards[0], category: 'writing' } as ContentCard;
    const prefs: UserPreferences = {
      ...basePrefs,
      mental: { challenges: [], readingPreferences: [], writingComfort: false },
    };
    expect(cardWeight(writing, prefs, 'mental')).toBeGreaterThanOrEqual(0.1);
  });
});
