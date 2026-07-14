# US-011 — Two-phase neumorphic transitions

**As a** user moving between cards,  
**I want** smooth transitions that fade content and flatten/raise neumorphic boundaries,  
**So that** the app feels tactile and deliberate.

---

## Acceptance criteria

**Given** I am viewing a card  
**When** I swipe (Done/Skip) or navigate to another card  
**Then** the old card's content fades out (200ms), then its neumorphic shadow flattens (200ms)

**Given** the old card has fully exited  
**When** the new card enters  
**Then** the new card's neumorphic shadow raises (200ms), then its content fades in (200ms)

**Given** I am transitioning from a wizard card to a content card  
**When** the wizard exits  
**Then** the CardNav (number grid + settings button) does not appear until the wizard has fully exited, then fades in during the enter phase

**Given** I am transitioning from a content card to a wizard card  
**When** the content card exits  
**Then** the BottomBar fades out with the card content (not after), and the old button text stays visible during the fade

**Given** I have `prefers-reduced-motion` enabled  
**When** any transition occurs  
**Then** the transition is instant (no animation)

---

## Notes

- Mode: `outin` (exit fully completes before enter starts). Total round-trip: ~800ms (400ms exit + 400ms enter).
- The box-shadow lives on the root element (`.neu-raised` article). The "content" is the element's direct children — opacity is set on children, not on the root, so the shadow stays visible while content fades.
- `viewKey` memo returns a unique string per view (`'content:phys-001'`, `'wizard_physical'`, `'settings'`, etc.). Keyed `<Show>` forces component destruction/recreation on every view change, so `<Transition>` fires even when swapping one `ContentCardView` for another.
- `settledKey` lags behind `viewKey` by one transition cycle — updated in `onAfterExit` so CardNav/BottomBar don't appear/disappear until the old view has fully exited.
- `isExiting` signal controls BottomBar opacity during exit — set true at `onExit` start, false at `onAfterExit`. The BottomBar reads `settledCardType` (derived from `settledKey`) so the old button text stays visible during the fade-out.
- `appear` prop animates the first card in on app launch.

## Status

**Implemented.** `neuTransition.ts` (`neuOnEnter`, `neuOnExit`, `PHASE_MS`), `App.tsx` (`<Transition>`, `viewKey`, `settledKey`, `isExiting`, `settledCardType`), `index.css` (`.neu-fade-in` keyframe + `prefers-reduced-motion`).

## Test coverage

Unit tests in `neuTransition.test.ts` (8 tests, jsdom environment): exit fades children + flattens shadow + calls done; enter sets initial state + raises shadow + fades in children + cleans up; both short-circuit on `prefers-reduced-motion`.
