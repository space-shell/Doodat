# US-004 — Skipping a card

**As a** user who cannot do today's task,  
**I want** to swipe the card to the left to skip it,  
**So that** I can move on without being blocked.

---

## Acceptance criteria

**Given** I am viewing a content card  
**When** I swipe it to the left past the threshold  
**Then** the card flies off to the left and the next card appears

**Given** I skip a card  
**When** the card is dismissed  
**Then** the outcome is recorded with `swipeDirection: "skip"` in the daily state

**Given** I have skipped fewer than 3 cards today  
**When** I skip a card  
**Then** no accountability prompt is injected

**Given** I have skipped exactly 3 cards today and have not yet submitted a voice note  
**When** I skip a third card  
**Then** an accountability card is injected immediately after the current card

---

## Notes

- The accountability prompt is injected once per session (not again if already shown).
- Skipped cards still count toward the daily total; the day is still "complete" when all cards are processed.

## Test suite

`tests/card-swipe.spec.ts`
