import { describe, it, expect } from 'vitest';
import { physicalCards, mentalCards, spiritualCards, allCards, cardById } from './index';

describe('card data integrity', () => {
  it('contains exactly 90 cards (30 per domain)', () => {
    expect(physicalCards).toHaveLength(30);
    expect(mentalCards).toHaveLength(30);
    expect(spiritualCards).toHaveLength(30);
    expect(allCards).toHaveLength(90);
  });

  it('has unique ids across the whole deck', () => {
    const ids = allCards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses zero-padded domain-prefixed ids (phys-###, ment-###, spir-###)', () => {
    const prefixOf: Record<string, string> = {
      physical: 'phys',
      mental: 'ment',
      spiritual: 'spir',
    };
    const pattern = /^(\w{4,5})-(\d{3})$/;
    for (const card of allCards) {
      const match = card.id.match(pattern);
      expect(match, `id ${card.id} should match <prefix>-<###>`).not.toBeNull();
      expect(match![1]).toBe(prefixOf[card.domain]);
    }
  });

  it('cardById lookups every card', () => {
    for (const card of allCards) {
      expect(cardById.get(card.id)).toBe(card);
    }
  });

  it('every card has non-empty intensities and at least one tag', () => {
    for (const card of allCards) {
      expect(card.intensity_low.length).toBeGreaterThan(0);
      expect(card.intensity_medium.length).toBeGreaterThan(0);
      expect(card.intensity_high.length).toBeGreaterThan(0);
      expect(card.tags.length).toBeGreaterThan(0);
    }
  });

  it('every spiritual card has an agnostic_interpretation (no exceptions)', () => {
    for (const card of spiritualCards) {
      expect(
        card.agnostic_interpretation,
        `${card.id} missing agnostic_interpretation`,
      ).toBeTruthy();
    }
  });

  // KNOWN CARD-DATA ISSUE (found by this test on port).
  // Three cross_tradition_pair references are not reciprocal:
  //   spir-007 -> spir-002   (spir-002 is mutual with spir-015)
  //   spir-012 -> spir-005   (spir-005 has no pair)
  //   spir-026 -> spir-025   (spir-025 has no pair)
  // Pairing semantics is a card-content decision (cards are the product);
  // skipped pending content review. Un-skip once the data is corrected.
  it.fails('cross_tradition_pair references are mutual (known data issue)', () => {
    for (const card of allCards) {
      if (!card.cross_tradition_pair) continue;
      const partner = cardById.get(card.cross_tradition_pair);
      expect(partner, `${card.id} pairs with missing ${card.cross_tradition_pair}`).toBeDefined();
      expect(
        partner!.cross_tradition_pair,
        `${card.id} -> ${card.cross_tradition_pair} is not reciprocal`,
      ).toBe(card.id);
    }
  });

  it('reports the known broken cross_tradition_pairs', () => {
    const broken: string[] = [];
    for (const card of allCards) {
      if (!card.cross_tradition_pair) continue;
      const partner = cardById.get(card.cross_tradition_pair);
      if (!partner || partner.cross_tradition_pair !== card.id) {
        broken.push(`${card.id} -> ${card.cross_tradition_pair}`);
      }
    }
    // Snapshot the known set; shrinks as pairs are fixed. Update when fixing.
    expect(broken.sort()).toEqual([
      'spir-007 -> spir-002',
      'spir-012 -> spir-005',
      'spir-026 -> spir-025',
    ]);
  });

  it('spiritual cards that cite a passage expose it via sources', () => {
    for (const card of spiritualCards) {
      if (card.tradition && card.tradition !== 'agnostic') {
        expect(card.sources, `${card.id} has tradition but no sources`).toBeDefined();
        expect(card.sources![0].citation, `${card.id} sources[0].citation`).toBeTruthy();
      }
    }
  });

  it('every card has a difficulty of low|medium|high', () => {
    for (const card of allCards) {
      expect(['low', 'medium', 'high']).toContain(card.difficulty);
    }
  });

  it('timer actions have positive durationSec and valid difficulties', () => {
    for (const card of allCards) {
      for (const action of card.actions ?? []) {
        if (action.type !== 'timer') continue;
        expect(action.durationSec, `${card.id} timer missing durationSec`).toBeGreaterThan(0);
        expect(action.difficulties, `${card.id} timer missing difficulties`).toBeDefined();
        expect(action.difficulties!.length).toBeGreaterThan(0);
      }
    }
  });

  it('timer actions for the same card do not overlap difficulties', () => {
    for (const card of allCards) {
      const timers = (card.actions ?? []).filter((a) => a.type === 'timer');
      const seen = new Set<string>();
      for (const t of timers) {
        for (const d of t.difficulties ?? []) {
          expect(seen.has(d), `${card.id} has overlapping timer difficulty ${d}`).toBe(false);
          seen.add(d);
        }
      }
    }
  });
});
