import { describe, it, expect } from 'vitest';
import { dealDailyCards, getCardTask, cardWeight, planDifficulties, INTENSITY_VOLUME_RANGE, dailyVolume } from './deck';
import { physicalCards, cardById } from './data';
import type { ContentCard, UserPreferences } from './types';

const FIXED = { date: '2026-01-15', pubkey: 'test-pubkey-abc', intensity: 'high' as const, volume: 9 };

describe('dealDailyCards — structure', () => {
  it('deals exactly 9 cards', () => {
    expect(dealDailyCards(FIXED)).toHaveLength(9);
  });

  it('deals 3 per domain (even split)', () => {
    const deck = dealDailyCards(FIXED);
    const counts = { physical: 0, mental: 0, spiritual: 0 };
    for (const c of deck) counts[c.domain]++;
    expect(counts.physical).toBe(3);
    expect(counts.mental).toBe(3);
    expect(counts.spiritual).toBe(3);
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
    const dealtPhysical = deck.filter((c) => c.domain === 'physical').map((c) => c.id);
    for (const id of recent) {
      expect(dealtPhysical, `recent card ${id} should not be dealt`).not.toContain(id);
    }
  });

  it('falls back to the full pool when too few non-recent cards remain', () => {
    // Mark 28 of 30 physical cards recent → only 2 available < 3 needed → fallback
    const recent = physicalCards.slice(0, 28).map((c) => c.id);
    const deck = dealDailyCards({ ...FIXED, recentCardIds: recent });
    const physicalCount = deck.filter((c) => c.domain === 'physical').length;
    expect(physicalCount).toBe(3); // still deals 3 physical, from full pool
  });
});

describe('INTENSITY_VOLUME_RANGE', () => {
  it('maps intensity levels to card-count ranges', () => {
    expect(INTENSITY_VOLUME_RANGE).toEqual({ low: [2, 5], medium: [4, 7], high: [6, 9] });
  });
});

describe('dailyVolume', () => {
  it('returns a value within the range for each intensity', () => {
    for (const intensity of ['low', 'medium', 'high'] as const) {
      const [min, max] = INTENSITY_VOLUME_RANGE[intensity];
      for (let i = 0; i < 100; i++) {
        const v = dailyVolume(intensity, '2026-01-15', `seed-${i}`);
        expect(v, `intensity=${intensity} seed=${i}`).toBeGreaterThanOrEqual(min);
        expect(v, `intensity=${intensity} seed=${i}`).toBeLessThanOrEqual(max);
      }
    }
  });

  it('is deterministic for the same date + pubkey', () => {
    expect(dailyVolume('medium', '2026-01-15', 'test-id')).toBe(dailyVolume('medium', '2026-01-15', 'test-id'));
  });
});

describe('dealDailyCards — volume + domain split', () => {
  it('deals exactly `volume` cards for each volume', () => {
    expect(dealDailyCards({ ...FIXED, volume: 3, intensity: 'low' })).toHaveLength(3);
    expect(dealDailyCards({ ...FIXED, volume: 6, intensity: 'medium' })).toHaveLength(6);
    expect(dealDailyCards({ ...FIXED, volume: 9, intensity: 'high' })).toHaveLength(9);
  });

  it('splits the volume evenly across domains (6 -> 2/2/2)', () => {
    const deck = dealDailyCards({ ...FIXED, volume: 6, intensity: 'medium' });
    const counts = { physical: 0, mental: 0, spiritual: 0 };
    for (const c of deck) counts[c.domain]++;
    expect(counts.physical).toBe(2);
    expect(counts.mental).toBe(2);
    expect(counts.spiritual).toBe(2);
  });

  it('never deals the same card twice within one deck, at every volume', () => {
    for (const v of [3, 6, 9]) {
      const ids = dealDailyCards({ ...FIXED, volume: v, intensity: v === 3 ? 'low' : v === 6 ? 'medium' : 'high' }).map((c) => c.id);
      expect(new Set(ids).size, `volume ${v}`).toBe(ids.length);
    }
  });
});

describe('dealDailyCards — randomized domain offset', () => {
  it('volume 7: the domain with 3 cards varies across seeds', () => {
    const domainsWith3 = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const deck = dealDailyCards({ ...FIXED, volume: 7, intensity: 'medium', pubkey: `seed-${i}` });
      const counts = { physical: 0, mental: 0, spiritual: 0 };
      for (const c of deck) counts[c.domain]++;
      for (const [domain, count] of Object.entries(counts)) {
        if (count === 3) domainsWith3.add(domain);
      }
    }
    expect(domainsWith3.size).toBeGreaterThan(1);
  });

  it('volume 8: the domain with 2 cards varies across seeds', () => {
    const domainsWith2 = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const deck = dealDailyCards({ ...FIXED, volume: 8, intensity: 'high', pubkey: `seed-${i}` });
      const counts = { physical: 0, mental: 0, spiritual: 0 };
      for (const c of deck) counts[c.domain]++;
      for (const [domain, count] of Object.entries(counts)) {
        if (count === 2) domainsWith2.add(domain);
      }
    }
    expect(domainsWith2.size).toBeGreaterThan(1);
  });

  it('each domain gets at least floor(volume/3) cards', () => {
    for (const v of [4, 5, 7, 8]) {
      for (let i = 0; i < 50; i++) {
        const deck = dealDailyCards({ ...FIXED, volume: v, intensity: 'medium', pubkey: `seed-${i}` });
        const counts = { physical: 0, mental: 0, spiritual: 0 };
        for (const c of deck) counts[c.domain]++;
        const min = Math.floor(v / 3);
        for (const domain of ['physical', 'mental', 'spiritual'] as const) {
          expect(counts[domain], `volume=${v} seed=${i} domain=${domain}`).toBeGreaterThanOrEqual(min);
        }
      }
    }
  });

  it('output order is not always physical → mental → spiritual', () => {
    let physicalFirst = 0;
    for (let i = 0; i < 30; i++) {
      const deck = dealDailyCards({ ...FIXED, volume: 9, intensity: 'high', pubkey: `seed-${i}` });
      if (deck[0].domain === 'physical') physicalFirst++;
    }
    expect(physicalFirst).toBeLessThan(30);
  });
});

// Seeded RNG (mulberry32) so the distribution assertions are deterministic, never flaky.
function rngFrom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('planDifficulties — distribution policy', () => {
  it('low intensity: no guaranteed highs, length matches volume', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(planDifficulties('low', 3, rngFrom(seed))).toHaveLength(3);
    }
  });

  it('medium intensity: always at least one high (guaranteed)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const plan = planDifficulties('medium', 6, rngFrom(seed));
      expect(plan).toHaveLength(6);
      expect(plan.filter((l) => l === 'high').length).toBeGreaterThanOrEqual(1);
    }
  });

  it('high intensity: always at least two highs (guaranteed 2 or 3)', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const highs = planDifficulties('high', 9, rngFrom(seed)).filter((l) => l === 'high').length;
      expect(highs).toBeGreaterThanOrEqual(2);
    }
  });

  it('high intensity: the guaranteed floor is exactly 2 over many seeds (2-or-3 varies)', () => {
    let minHighs = Infinity;
    for (let seed = 1; seed <= 200; seed++) {
      minHighs = Math.min(minHighs, planDifficulties('high', 9, rngFrom(seed)).filter((l) => l === 'high').length);
    }
    expect(minHighs).toBe(2);
  });

  it('low intensity: highs are rare but reachable across many seeds', () => {
    let withHigh = 0;
    for (let seed = 1; seed <= 1000; seed++) {
      if (planDifficulties('low', 3, rngFrom(seed)).includes('high')) withHigh++;
    }
    expect(withHigh).toBeGreaterThan(0);
    expect(withHigh).toBeLessThan(300);
  });
});

describe('dealDailyCards — dealt difficulty distribution', () => {
  it('medium-intensity decks always include at least one high-difficulty card', () => {
    for (let i = 0; i < 40; i++) {
      const deck = dealDailyCards({ ...FIXED, volume: 6, intensity: 'medium', pubkey: `seed-${i}` });
      expect(deck.some((c) => c.difficulty === 'high'), `seed i=${i}`).toBe(true);
    }
  });

  it('high-intensity decks always include at least two high-difficulty cards', () => {
    for (let i = 0; i < 40; i++) {
      const deck = dealDailyCards({ ...FIXED, volume: 9, intensity: 'high', pubkey: `seed-${i}` });
      expect(deck.filter((c) => c.difficulty === 'high').length, `seed i=${i}`).toBeGreaterThanOrEqual(2);
    }
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
