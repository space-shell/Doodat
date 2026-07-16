# US-015 — Swipe navigation between cards

**As a** user working through my daily deck on a touch device,  
**I want** to swipe left/right on a card to move between cards,  
**So that** I can browse forward and back without reaching for the number grid.

---

## Acceptance criteria

**Given** I am viewing a content card on a touch device  
**When** I swipe left past the threshold (~50px, horizontal-dominant)  
**Then** the next content card appears (with a two-phase neumorphic transition)

**Given** I am viewing a content card  
**When** I swipe right past the threshold  
**Then** the previous content card appears

**Given** I am viewing the last content card  
**When** I swipe left  
**Then** nothing happens (no completion card is reached by swiping — content-only scope)

**Given** I am viewing the first content card  
**When** I swipe right  
**Then** nothing happens (boundary no-op)

**Given** I am writing a reflection in a card's textarea (or a source link)  
**When** I drag horizontally  
**Then** the native behaviour is preserved — no swipe navigation fires

**Given** I drag vertically inside the card  
**When** the motion is vertical-dominant  
**Then** the page/textarea scrolls normally — no swipe navigation fires

**Given** I swipe to a card I already completed  
**When** I land on it  
**Then** I can review it; no new outcome is recorded (swipe is pure browsing)

---

## Notes

- Swipe left = next, swipe right = previous (gallery/e-reader convention).
- Touch only. Desktop remains grid + button driven (no mouse-drag).
- Threshold-fling mechanics: the card does not follow the finger during the drag; once the horizontal travel clears ~50px (and is horizontal-dominant), the `STEP` intent fires and the existing two-phase transition animates the change.
- The gesture is attached to the content card's surface. System cards (daily intensity check-in, completion summary) are not swipeable — scope is content cards only.
- The `STEP` intent (`delta: 1 | -1`) resolves the adjacent content card via `adjacentContentIndex`, which skips system cards and is a true no-op (same state reference) at a content-card boundary. Unlike `nextUnresolvedIndex`, it ignores completion status — it is browsing, not progression.
- Completion stays on the Done button (US-003). Swipe never records an outcome.
- A light haptic pulse fires on a successful swipe.

## Status

**Implemented.** `utils/swipeNav.ts` (`decideSwipe` pure logic + `createSwipeHandlers` factory), `components/ContentCardView.tsx` (touch handlers on the card surface, `touch-pan-y`), `streams/reducer.ts` (`adjacentContentIndex` + `STEP` case), `types.ts` (`STEP` intent).

## Test coverage

Unit tests in `utils/swipeNav.test.ts` (threshold/direction/axis-lock decisions, interactive-element guard, multi-touch guard) and `streams/reducer.test.ts` (`STEP` hops forward/backward, skips system cards, boundary no-ops return the same state reference, no outcome recorded; `adjacentContentIndex` direct cases).
