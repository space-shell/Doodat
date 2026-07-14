# US-009 — Free navigation via card number grid

**As a** user working through my daily deck,  
**I want** to jump to any card by tapping its number,  
**So that** I can revisit cards I skipped or review cards I completed.

---

## Acceptance criteria

**Given** I am viewing a content card  
**When** I look at the top of the screen  
**Then** I see a row of numbered buttons (one per content card) and a settings gear button to the right

**Given** I am on card 3 and tap number 1  
**When** the navigation fires  
**Then** I jump to card 1 (with a two-phase neumorphic transition)

**Given** I have completed card 2 and skipped card 3  
**When** I look at the number grid  
**Then** card 2's number is green (complete) and card 3's number is red (skip)

**Given** I am viewing a content card  
**When** the screen is narrow  
**Then** the number grid wraps onto two rows; the settings button stays right-aligned with extra space separating it from the numbers

**Given** I swipe a card (Done/Skip)  
**When** the deck auto-advances  
**Then** the current number in the grid updates to show the neu-inset (active) state

---

## Notes

- The number grid (CardNav) replaces the former Back/Forward buttons. Navigation is non-sequential — any card can be jumped to at any time.
- Each number button shows its 1-based index. Colour reflects completion status: muted (unseen), green (complete), red (skip).
- The settings gear button toggles the settings view (US-010). It stays visible when settings is open so the user can tap it again to return to cards.
- Swiping a card auto-advances to the next unresolved card (not necessarily the next sequential one).

## Status

**Implemented.** `CardNav.tsx` (flex-wrap layout, numbered buttons, settings gear), `reducer.ts` (`NAVIGATE` intent, `nextUnresolvedIndex`).

## Test coverage

Unit tests in `reducer.test.ts`: NAVIGATE jumps to specified index, clamps to valid range.
