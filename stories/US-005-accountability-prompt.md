# US-005 — Accountability prompt

**As a** user who has skipped three or more cards,  
**I want** to be offered the chance to record a short voice note explaining why,  
**So that** I stay honest with myself and maintain the habit of reflection.

---

## Acceptance criteria

**Given** I have skipped exactly 3 cards in a session  
**When** the third skip is processed  
**Then** an accountability card appears as the next card in the deck

**Given** the accountability card is showing  
**When** I view it  
**Then** it offers me a way to record a voice note (or dismiss)

**Given** I have already been shown the accountability card today  
**When** I skip further cards  
**Then** the accountability card is not injected again

**Given** I have submitted a voice note  
**When** I skip further cards  
**Then** the accountability card is not injected

---

## Notes

- Voice note recording is a native feature (expo-av); not testable on web.
- The accountability card injection and visibility is testable on web.
- `voiceNoteSubmitted: true` suppresses further injection.

## Test suite

`tests/accountability.spec.ts`
