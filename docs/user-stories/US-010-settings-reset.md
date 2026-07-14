# US-010 — Settings: reset day to setup wizard

**As a** user who wants to re-evaluate my preferences or redo my day,  
**I want** to reset the current day back to the setup wizard,  
**So that** I can re-select my focus areas, traditions, and intensity.

---

## Acceptance criteria

**Given** I am viewing a content card  
**When** I tap the settings gear button in the CardNav row  
**Then** a full-screen settings view replaces the card content (CardNav stays visible at the top)

**Given** the settings view is open  
**When** I tap the settings gear again  
**Then** the settings view closes and I return to my card

**Given** the settings view is open  
**When** I tap "Reset day to setup wizard"  
**Then** today's outcomes are cleared, the full 5-card wizard deck is loaded, and I start at the welcome card

**Given** I have reset to the wizard  
**When** I complete the wizard (select intensity and tap "Begin practice")  
**Then** a fresh daily deck is dealt for today with my new preferences and intensity

---

## Notes

- `RESET_DAY_TO_WIZARD` intent clears `daily.outcomes` and `daily.accountabilityShown`, sets the deck to `buildOnboardingDeck()`, and sets `currentIndex` to 0. Profile, streak, and `recentCardIds` are preserved.
- Draft signals (`drafts.ts`) are reset to defaults before entering the wizard, so the user starts with a clean slate.
- The settings view is a full-screen replacement (not a modal). No back button — tapping the gear toggles it closed.
- The settings view has a `neu-raised` surface so the neumorphic transition applies.

## Status

**Implemented.** `SettingsView.tsx`, `drafts.ts` (`settingsOpen` signal, `resetDrafts`), `reducer.ts` (`handleResetDayToWizard`), `App.tsx` (settings conditional in `viewKey`).

## Test coverage

Unit tests in `reducer.test.ts`: `RESET_DAY_TO_WIZARD` clears outcomes, shows full wizard deck, preserves profile/streak/recentCardIds.
