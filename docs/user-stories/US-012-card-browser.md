# US-012 — Card browser

**As a** user who wants to review the full card library,  
**I want** to browse all 90 cards, see statistics, and write per-card notes,  
**So that** I can learn from the practices and track my reflections.

---

## Acceptance criteria

**Given** I open the card browser (`cards.html`)  
**When** the page loads  
**Then** I see a scrollable list of all 90 cards grouped by domain, with a search filter

**Given** I tap a card in the list  
**When** the detail view opens  
**Then** I see the card's domain, difficulty badge, task text, context, sources (with links), and a notes textarea

**Given** I write a note on a card  
**When** I navigate away and return  
**Then** my note is persisted (localStorage) and displayed

**Given** I have written notes on multiple cards  
**When** I open the notes filter  
**Then** I can filter to show only cards with notes, and export all notes as JSON

**Given** I want to clear all notes  
**When** I tap the clear button  
**Then** a two-stage confirmation appears (armed red button + click-away to disarm)

**Given** I am viewing the stats panel  
**When** I look at the radar chart  
**Then** I see the per-difficulty distribution (low/medium/high) as a radar polygon across the three domains

---

## Notes

- The card browser is a separate app entry (`cards.html` + `cards.tsx`), not part of the daily-ritual flow.
- Notes are stored in `localStorage` under `dodaat_notes`, keyed by card ID.
- The radar chart is pure SVG — `radarGeometry.ts` computes vertex/path math, `RadarChart.tsx` renders.
- Card stats use `countByDifficulty` from `@doodat/cards/stats.ts` — truthful per-card difficulty spread (30/30/30 across the deck).

## Status

**Implemented.** `cards.html`, `cards.tsx`, `components/browse/{CardBrowser,CardList,CardDetail,CardNotes,CardStats,RadarChart,radarGeometry}.tsx`, `store/notes.ts`.

## Test coverage

Unit tests in `radarGeometry.test.ts` (16 tests): SVG vertex math, path generation, edge cases.
