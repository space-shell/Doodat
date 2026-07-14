# US-014 — Volume-based dealing with difficulty distribution

**As a** user selecting my daily load,  
**I want** the number of cards and their difficulty mix to reflect my chosen intensity,  
**So that** a Light day is quick and easy, and a High day is demanding.

---

## Acceptance criteria

**Given** I select Light (3 cards)  
**When** the deck is dealt  
**Then** 3 content cards are dealt (1 per domain), with difficulty drawn from a weighted distribution (low 62%, medium 33%, high 5%) — no guarantee of a high card, but rare-but-possible

**Given** I select Medium (6 cards)  
**When** the deck is dealt  
**Then** 6 content cards are dealt (2 per domain), with at least 1 high-difficulty card guaranteed

**Given** I select High (9 cards)  
**When** the deck is dealt  
**Then** 9 content cards are dealt (3 per domain), with 2–3 high-difficulty cards guaranteed (seeded random pick of 2 or 3)

**Given** the deck is dealt  
**When** I look at the domain split  
**Then** cards are distributed evenly across physical, mental, and spiritual (volume / 3 per domain)

**Given** the same user opens the app on the same day  
**When** the deck is dealt  
**Then** the same cards appear (deterministic seed from `localId + date`)

---

## Notes

- `INTENSITY_VOLUME`: `{ low: 3, medium: 6, high: 9 }`.
- `planDifficulties(volume, date, pubkey)`: returns an array of difficulty strings. For low volume, all 3 are drawn from `DIFFICULTY_WEIGHTS` (`{ low: 0.62, medium: 0.33, high: 0.05 }`) via weighted `pickOne`. For medium, 1 high is guaranteed and the rest are weighted. For high, a seeded random pick of 2 or 3 highs is guaranteed, and the rest are weighted.
- `dealDailyCards`: splits volume evenly across domains (physical → mental → spiritual order), then for each domain slot, picks a card of the planned difficulty using `pickOne` (weighted by `cardWeight`, with fallback to any difficulty if the planned one is unavailable).
- Rare combos (e.g., 3 high cards on a Light day) are possible but unlikely — the weighted sampling doesn't hard-quota.
- Cards from the last 63 days are excluded to prevent repetition.

## Status

**Implemented.** `packages/cards/src/deck.ts` (`INTENSITY_VOLUME`, `planDifficulties`, `DIFFICULTY_WEIGHTS`, `pickOne`, `dealDailyCards`), `reducer.ts` (`buildDailyDeck` threads volume from `profile.currentIntensity`).

## Test coverage

Unit tests in `deck.test.ts`: dealing returns correct volume per domain, difficulty distribution (medium always ≥1 high, high always ≥2 high, low floor 0 with highs rare-but-reachable), recent-card exclusion, deterministic for fixed seed.
