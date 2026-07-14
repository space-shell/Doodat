# US-002 — Daily card deck

**As a** returning user who has completed onboarding,  
**I want** to see my daily ritual cards one at a time,  
**So that** I can work through my physical, mental, and spiritual practices.

---

## Acceptance criteria

**Given** I have completed onboarding  
**When** the app loads on a new day  
**Then** I see the daily intensity check-in card first (US-011), followed by my content cards

**Given** I have selected today's intensity  
**When** the daily deck is dealt  
**Then** I see a card with a domain label (Physical, Mental, or Spiritual), a difficulty badge, a task description, and Done/Skip buttons

**Given** I am viewing a content card  
**When** I look at the domain label  
**Then** the colour matches the card's domain (terracotta for Physical, slate blue for Mental, muted violet for Spiritual)

**Given** I am viewing a content card  
**When** I look at the task text  
**Then** it corresponds to the card's intrinsic `difficulty` (low/medium/high), which selects which of the three authored `intensity_*` texts renders

**Given** I have already processed some cards today  
**When** I reload the app  
**Then** the deck resumes at the first unresolved content card (free navigation — I can jump to any card via the number grid)

**Given** today's date has changed since my last visit  
**When** the app loads  
**Then** a fresh deck is dealt for today (volume based on intensity: 3, 6, or 9 cards)

---

## Notes

- Deck is deterministically seeded from `localId + date` so the same user always gets the same cards on a given day.
- Cards from the last 63 days are excluded to prevent repetition.
- Volume (3/6/9) is set by the daily intensity check-in. Difficulty distribution is biased by volume: low day is pure-weighted; medium guarantees 1 high; high guarantees 2–3 high (seeded).
- The card fills the available vertical space; Done/Skip buttons stick to the bottom.

## Status

**Implemented.** `ContentCardView.tsx`, `deck.ts` (`dealDailyCards`, `planDifficulties`), `store/index.ts` (`loadSeed` same-day resume).

## Test coverage

Unit tests in `deck.test.ts`: dealing returns correct volume per domain, difficulty distribution guarantees, recent-card exclusion. `reducer.test.ts`: SWIPE advances to next unresolved card.
