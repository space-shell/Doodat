# US-003 — Completing a card

**As a** user who has done today's ritual task,  
**I want** to swipe the card to the right to mark it complete,  
**So that** my progress is recorded and the next card appears.

---

## Acceptance criteria

**Given** I am viewing a content card  
**When** I swipe it to the right past the threshold (or with sufficient velocity)  
**Then** the card flies off to the right and the next card becomes the top card

**Given** I complete a card  
**When** the card is dismissed  
**Then** the outcome is recorded with `swipeDirection: "complete"` in the daily state

**Given** I swipe a card but do not reach the threshold  
**When** I release  
**Then** the card springs back to centre

---

## Notes

- Swipe threshold is 35% of screen width or velocity > 800 px/s.
- Haptic feedback (success pattern) fires on completion.

## Test suite

`tests/card-swipe.spec.ts`
