# US-005 — Accountability prompt

**As a** user who has skipped three or more cards,  
**I want** to be prompted to reflect on why,  
**So that** I stay honest with myself and maintain the habit of reflection.

---

## Acceptance criteria

**Given** I have skipped exactly 3 cards in a session  
**When** the third skip is processed  
**Then** an accountability card appears as the next card in the deck

**Given** the accountability card is showing  
**When** I view it  
**Then** it shows a reflection prompt and a "Continue" button (voice notes return with the social layer)

**Given** I have already been shown the accountability card today  
**When** I skip further cards  
**Then** the accountability card is not injected again

---

## Notes

- Voice note recording is deferred (returns with the social layer / `GOLD_CARDS` flag).
- The accountability card injection and visibility is fully testable.
- `accountabilityShown: true` in `DailyState` suppresses further injection.

## Status

**Implemented.** `AccountabilityCard.tsx`, `accountability.ts` (`shouldTriggerAccountability`), `reducer.ts` (accountability card splicing in `handleSwipe`).

## Test coverage

Unit tests in `accountability.test.ts`: trigger fires after exactly 3 skips. `reducer.test.ts`: accountability card injected after 3rd skip, not re-injected when already shown.
