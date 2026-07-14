# US-004 — Skipping a card

**As a** user who cannot do today's task,  
**I want** to tap "Skip" to move on,  
**So that** I can continue through my deck without being blocked.

---

## Acceptance criteria

**Given** I am viewing a content card  
**When** I tap the "Skip" button  
**Then** the outcome is recorded with `swipeDirection: "skip"` and the next unresolved card appears

**Given** I have skipped fewer than 3 cards today  
**When** I skip a card  
**Then** no accountability prompt is injected

**Given** I have skipped exactly 3 cards today and the accountability card has not yet been shown  
**When** I skip a third card  
**Then** an accountability card is spliced into the deck immediately after the current position

---

## Notes

- The accountability prompt is injected once per day (`accountabilityShown` flag).
- Skipped cards still count toward the daily total; the day is still "complete" when all cards are processed.
- Re-swiping a skipped card to "complete" updates the outcome in place and recomputes the streak.

## Status

**Implemented.** `ContentCardView.tsx` (Skip button + `commit()`), `reducer.ts` (`handleSwipe` with accountability injection).

## Test coverage

Unit tests in `reducer.test.ts`: skip outcome recorded, accountability injected after 3rd skip, not injected when already shown.
