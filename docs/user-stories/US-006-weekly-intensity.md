# US-006 — Daily intensity check-in

**As a** returning user at the start of a new day,  
**I want** to be asked how much energy I have today,  
**So that** my card count is calibrated to my daily capacity.

---

## Acceptance criteria

**Given** I completed onboarding on a previous day  
**When** the app loads on a new day  
**Then** the intensity check-in card appears as the first card in my deck

**Given** the intensity check-in card is showing  
**When** I select Light (3 cards), Medium (6 cards), or High (9 cards) and tap "Confirm for today"  
**Then** the intensity is saved, `intensitySetAt` is stamped to today, and the daily deck is dealt

**Given** I have already selected intensity today  
**When** the app loads  
**Then** the intensity check-in card does not appear and I go straight to my content cards

**Given** I selected Medium intensity (6 cards)  
**When** I view my content cards  
**Then** 6 cards are dealt (2 per domain), with at least 1 high-difficulty card guaranteed

---

## Notes

- Intensity is checked via `needsDailyIntensity(profile, today)`: compares `intensitySetAt`'s date string with today's. If they differ, the `intensity_select` card is prepended to the deck.
- After `SET_INTENSITY`, `intensitySetAt = Date.now()` (today), so `needsDailyIntensity` returns false and the deck rebuilds without the intensity card.
- Replaces the former weekly ISO-week re-commit (removed in favour of daily check-in).
- The first-ever intensity selection happens during the onboarding wizard (`wizard_intensity` type).

## Status

**Implemented.** `IntensitySelect.tsx` (`mode="daily"`), `reducer.ts` (`needsDailyIntensity`, `buildDailyDeck`, `handleSetIntensity`).

## Test coverage

Unit tests in `reducer.test.ts`: `buildDailyDeck` does not prepend intensity_select when set today; prepends when set on a previous day or never set. DAILY_RESET prepends intensity_select on a new day.
