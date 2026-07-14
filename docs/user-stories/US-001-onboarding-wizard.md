# US-001 — First-time onboarding wizard

**As a** new user opening dodaat for the first time,  
**I want** to be guided through a short setup wizard,  
**So that** the app understands my physical, mental, and spiritual preferences before showing me my first deck.

---

## Acceptance criteria

**Given** I have never opened the app before  
**When** the app loads  
**Then** I see the welcome card with the dodaat tagline and a "Begin" button

**Given** I am on the welcome card  
**When** I tap "Begin"  
**Then** I see the Physical Preferences card with focus area options and a fasting toggle

**Given** I am on the Physical Preferences card  
**When** I tap one or more focus areas and tap "Confirm"  
**Then** I see the Mental Preferences card with challenge areas and a writing comfort toggle

**Given** I am on the Mental Preferences card  
**When** I tap "Confirm"  
**Then** I see the Spiritual Preferences card with a secular/tradition slider and tradition chips

**Given** I am on the Spiritual Preferences card  
**When** I tap "Confirm"  
**Then** I see the Intensity Selection card offering Light (3 cards), Medium (6 cards), and High (9 cards)

**Given** I am on the Intensity Selection card  
**When** I select an intensity and tap "Begin practice"  
**Then** `onboardingComplete` is set to true, `intensitySetAt` is stamped, and I see my daily deck

**Given** I have previously completed the wizard  
**When** I reload the app on the same day  
**Then** the wizard is not shown and I resume my daily deck

---

## Notes

- Preferences are persisted to localStorage per step via `SET_PREFERENCES` intents; no data is lost if the app is killed mid-wizard.
- `onboardingComplete: true` is written to the user profile when "Begin practice" is tapped (the `SET_INTENSITY` handler flips this flag and builds the daily deck).
- Draft selections are held in module-level signals (`drafts.ts`) and committed on each step's "Confirm" button.
- The wizard can be re-triggered via the Settings "Reset day to setup wizard" button (US-010).

## Status

**Implemented.** `Onboarding.tsx`, `BottomBar.tsx` (wizard button cases), `reducer.ts` (`SET_PREFERENCES`, `SET_INTENSITY`).

## Test coverage

Unit tests in `reducer.test.ts`: `initialState` builds onboarding deck when `onboardingComplete: false`; `SET_INTENSITY` completes onboarding and builds daily deck.
