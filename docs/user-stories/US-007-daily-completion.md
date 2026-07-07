# US-007 — Daily completion

**As a** user who has worked through all nine cards,  
**I want** to see a completion card acknowledging my effort,  
**So that** I get a clear sense of closure for the day.

---

## Acceptance criteria

**Given** I have swiped through all content cards for today  
**When** the last card is dismissed  
**Then** a completion card appears

**Given** the completion card is showing  
**When** I view it  
**Then** it does not have swipe gesture enabled (it is a resting state)

**Given** I completed the day  
**When** I reload the app on the same day  
**Then** the completion card is shown immediately (no cards to re-do)

---

## Test suite

`tests/daily-deck.spec.ts`
