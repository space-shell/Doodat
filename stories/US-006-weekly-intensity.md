# US-006 — Weekly intensity selection

**As a** returning user at the start of a new week,  
**I want** to be asked how hard I want to push this week,  
**So that** my card tasks are calibrated to my current capacity.

---

## Acceptance criteria

**Given** I completed onboarding in a previous week  
**When** the app loads in a new ISO week  
**Then** the intensity selection card appears as the first card in my deck

**Given** the intensity card is showing  
**When** I select Low, Medium, or High and tap "Confirm →"  
**Then** the intensity is saved and the intensity card is dismissed

**Given** I have already selected intensity this week  
**When** the app loads  
**Then** the intensity card does not appear

**Given** I selected Medium intensity  
**When** I view a content card  
**Then** each card's task text corresponds to the medium intensity variant

---

## Notes

- Intensity is keyed to the ISO week string (e.g. `2026-W14`).
- Checked in `initializeApp` using the locally-read profile (not the store getter, which is null at init time).

## Test suite

`tests/intensity.spec.ts`
