# Card Browser

A standalone web page for reviewing all cards, deck statistics, and writing per-card reviewer notes. Lives at `cards.html`, separate from the daily-ritual app (`index.html`).

**Dev:** `http://localhost:5173/cards.html`
**Prod:** `https://space-shell.github.io/Doodat/cards.html`

## Why a separate page

The ritual app (`App.tsx`) is a single state-driven view with no router. The browser is a review/inspection surface, not part of the daily loop, so it ships as a second Vite HTML entry — no router dependency added, no change to the ritual app's architecture.

## User stories

| ID | Story |
|---|---|
| **US-CB-001** | As a card author, I want to see a list of **all cards** in the deck, so I can review the full inventory. |
| **US-CB-002** | As a reviewer, I want to **filter by domain** (physical/mental/spiritual) and search by text/id/tag, so I can focus on a slice of the deck. |
| **US-CB-003** | As a reviewer, I want to **open a card** and see its full details (all three intensity texts, context, tags, tradition, passage ref, agnostic interpretation), so I can assess the content. |
| **US-CB-004** | As a reviewer, I want **summary statistics** — cards per domain, per intensity level, per sub-category, and per spiritual tradition — so I can understand the deck's distribution. |
| **US-CB-005** | As a reviewer, I want an **interactive radar chart** that I can switch between groupings (Domain / Traditions / Categories / Intensity), so I can visualise distribution at a glance. |
| **US-CB-006** | As a reviewer, I want to **add a free-text note** to any card, persisted locally between sessions, so I can record observations for later revision. |
| **US-CB-007** | As a user, I want the browser to **match the main app's neumorphic look** (beige surface, soft dual shadows, gold accents, domain colours), so the experience is consistent. |

## Architecture

```
apps/web/
├── cards.html                          ← second HTML entry
├── src/cards.tsx                        ← its root: render(<CardBrowser/>)
└── src/components/browse/
    ├── CardBrowser.tsx                  ← container: stats + radar + list + detail
    ├── RadarChart.tsx                   ← hand-rolled SVG, zero chart deps
    ├── radarGeometry.ts                 ← pure vertex/path math (unit-tested)
    ├── radarGeometry.test.ts
    ├── CardStats.tsx                    ← neumorphic stat tiles
    ├── CardList.tsx                     ← filterable + searchable list
    ├── CardDetail.tsx                   ← full card view (all 3 intensities)
    └── CardNotes.tsx                    ← per-card textarea → notes store
```

- **Statistics logic** lives in `packages/cards/src/stats.ts` (pure, framework-free, unit-tested) and is exported from `@doodat/cards`. Reusable by the future `@doodat/physical` generator.
- **Radar geometry** is pure math in `radarGeometry.ts`, unit-tested in node; the `RadarChart` component stays a thin SVG wrapper.
- **Reviewer notes** are a small Solid store (`apps/web/src/store/notes.ts`) backed by `localStorage['dodaat_card_notes']`. Kept separate from the RxJS ritual state machine — notes are tangential CRUD with no time-based/event-flow semantics.
- **No new dependencies.** The radar chart is hand-rolled SVG.

## Intensity statistic — caveat

Every `ContentCard` carries all three intensity texts (`intensity_low` / `_medium` / `_high`). So "cards per intensity level" is structurally always equal to the total card count (today: 90/90/90). Adding more cards keeps the 1:1:1 ratio. The browser shows this truthfully.

A *real* intensity spread would require a new schema field (e.g. a per-card `difficulty` rating distinct from the three authored texts). That is a future card-design decision, not a browser feature.

## Vite multi-entry

`apps/web/vite.config.ts` registers both entries:

```ts
build: {
  rollupOptions: {
    input: { main: 'index.html', cards: 'cards.html' },
  },
},
```

Both HTML files emit to `dist/` and are served by GitHub Pages. The deploy workflow needs no change.
