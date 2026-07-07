# US-002 — Daily card deck

**As a** returning user who has completed onboarding,  
**I want** to see my nine daily ritual cards stacked on screen,  
**So that** I can work through my physical, mental, and spiritual practices one at a time.

---

## Acceptance criteria

**Given** I have completed onboarding  
**When** the app loads  
**Then** I see a card at the centre of the screen with a domain pill (Physical, Mental, or Spiritual), an intensity badge, a task description, and swipe hints ("← skip" / "done →")

**Given** I am viewing a content card  
**When** I look at the card  
**Then** the domain pill colour matches the card's domain (green for Physical, blue for Mental, amber for Spiritual)

**Given** I am viewing a content card  
**When** I look at the card  
**Then** the task text corresponds to my selected intensity level (Low / Medium / High)

**Given** I am viewing a content card  
**When** there are more cards behind it  
**Then** I can see up to two additional cards peeking behind the top card, offset vertically

**Given** I have already swiped some cards today  
**When** I reload the app  
**Then** previously swiped cards are not shown again (deck resumes from where I left off)

**Given** today's date has changed since my last visit  
**When** the app loads  
**Then** a fresh deck of nine cards is dealt for today

---

## Notes

- Deck is deterministically seeded from `pubkey + date` so the same user always gets the same nine cards on a given day.
- Cards from the last 63 days (9 cards × 7 days) are excluded to prevent repetition.

## Test suite

`tests/daily-deck.spec.ts`
