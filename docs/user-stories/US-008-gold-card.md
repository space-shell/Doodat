# US-008 — Gold card (voice note from someone who cares)

**As a** user who has received a gold card,  
**I want** to hear a voice note from someone who sent it,  
**So that** I feel supported and can respond with my own voice note.

---

## Acceptance criteria

**Given** a gold card has been received via Nostr  
**When** the app loads  
**Then** the gold card peeks from the bottom of the screen beneath the deck

**Given** the gold card is visible  
**When** I interact with it  
**Then** I can play the audio voice note

**Given** I have listened to the voice note  
**When** I record and send a response  
**Then** a praise point is awarded and the gold card is dismissed

**Given** I dismiss the gold card without responding  
**When** the app reloads  
**Then** the gold card is still present

---

## Notes

- Gold card receipt requires a live Nostr relay connection — not testable in automated web tests.
- Audio playback and recording require native device capabilities (expo-av) — not testable on web.
- This story is **feature flagged** (`FLAGS.GOLD_CARD_SEND`); UI is present but sending is disabled until the flag is enabled.
- Store-level logic (setGoldCard, respondToGoldCard) is unit-testable independently of the UI.

## Test suite

No automated behavioural test (native audio + live Nostr dependency). Covered by manual QA checklist.
