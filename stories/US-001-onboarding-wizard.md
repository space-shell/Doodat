# US-001 — First-time onboarding wizard

**As a** new user opening dodaat for the first time,  
**I want** to be guided through a short setup wizard,  
**So that** the app understands my physical, mental, and spiritual preferences before showing me my first deck.

---

## Acceptance criteria

**Given** I have never opened the app before  
**When** the app loads  
**Then** I see the welcome card with the dodaat tagline and a "Begin →" button

**Given** I am on the welcome card  
**When** I tap "Begin →"  
**Then** I see the Physical Preferences card with focus area options and a fasting toggle

**Given** I am on the Physical Preferences card  
**When** I tap one or more focus areas and tap "Confirm →"  
**Then** I see the Mental Preferences card with challenge areas and a writing comfort toggle

**Given** I am on the Mental Preferences card  
**When** I tap "Confirm →"  
**Then** I see the Spiritual Preferences card with a secular/tradition slider and tradition chips

**Given** I am on the Spiritual Preferences card  
**When** I tap "Confirm →"  
**Then** I see the Intensity Selection card offering Low, Medium, and High options

**Given** I am on the Intensity Selection card  
**When** I select an intensity and tap "Confirm →"  
**Then** I see the "All set." card confirming my first deck is ready

**Given** I am on the "All set." card  
**When** I tap "Start →"  
**Then** the wizard does not appear again and I see my daily deck

**Given** I have previously completed the wizard  
**When** I reload the app  
**Then** the wizard is not shown and I go straight to my daily deck

---

## Notes

- Preferences are persisted to AsyncStorage per step; no data is lost if the app is killed mid-wizard.
- `onboardingComplete: true` is written to the user profile when "Start →" is tapped.
- Weekly intensity is always set during the wizard; the intensity card will not appear again until the following week.

## Test suite

`tests/wizard.spec.ts`
