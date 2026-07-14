# US-007 — Daily completion

**As a** user who has worked through all my cards,  
**I want** to see a completion card acknowledging my effort,  
**So that** I get a clear sense of closure for the day.

---

## Acceptance criteria

**Given** I have processed all content cards for today (complete or skip)  
**When** the last card is dismissed  
**Then** a completion summary card appears

**Given** the completion card is showing  
**When** I view it  
**Then** it shows the count of completed and skipped cards, my streak count, and a domain breakdown

**Given** I completed the day  
**When** I reload the app on the same day  
**Then** the completion card is shown immediately (no cards to re-do)

**Given** I want to go back and review a card  
**When** I tap "← Back to cards"  
**Then** I return to the first content card (free navigation via the number grid)

---

## Notes

- The completion card is always the last card in the deck (`sys-completion-<date>`).
- Streak count is shown only if > 0.
- Domain breakdown shows completed cards per domain.

## Status

**Implemented.** `CompletionSummary.tsx`, `reducer.ts` (`nextUnresolvedIndex` falls back to completion card).

## Test coverage

Unit tests in `reducer.test.ts`: auto-navigates to completion when all content cards resolved.
