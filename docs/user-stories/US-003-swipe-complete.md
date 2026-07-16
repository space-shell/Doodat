# US-003 — Completing a card

**As a** user who has done today's ritual task,  
**I want** to tap "Done" to mark it complete,  
**So that** my progress is recorded and the next card appears.

---

## Acceptance criteria

**Given** I am viewing a content card  
**When** I tap the "Done" button  
**Then** the outcome is recorded with `swipeDirection: "complete"` and the next unresolved card appears (with a two-phase neumorphic transition)

**Given** I complete a card  
**When** the outcome is recorded  
**Then** it includes the card's `difficulty`, the current `intensity`, and any `actionResponses` from text-input fields

**Given** I complete a card that has text-action prompts  
**When** I write in the textarea and tap "Done"  
**Then** my written responses are stamped on the outcome as `actionResponses`

**Given** I complete the last content card  
**When** the card is dismissed  
**Then** the completion summary appears

---

## Notes

- The Done button is the only way to complete a card. Swipe gestures exist but are pure navigation (see US-015) — they never record an outcome.
- The SWIPE intent is an update-in-place: re-swiping a card replaces the existing outcome, not appends.
- On completion, the deck auto-advances to the next unresolved content card (scanning forward, then wrapping).
- `recentCardIds` is appended (capped at 63) on first swipe; not duplicated on re-swipe.

## Status

**Implemented.** `ContentCardView.tsx` (Done button + `commit()`), `reducer.ts` (`handleSwipe`).

## Test coverage

Unit tests in `reducer.test.ts`: complete outcome recorded, actionResponses stamped, auto-advance to next unresolved, completion card appears when all resolved.
