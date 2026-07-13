# Plan — Card Browser Interface (`cards.html`)

A new, self-contained web page for reviewing all cards, viewing deck statistics on an interactive hand-rolled SVG radar chart, and writing per-card notes persisted to localStorage. Sits alongside the daily-ritual app as a **separate Vite HTML entry** (no router added to the ritual app). Styled to match the neumorphic theme.

---

## User Stories

These will be committed as `docs/CARD_BROWSER.md` (the feature spec / acceptance-criteria source).

| ID | Story |
|---|---|
| **US-CB-001** | As a card author, I want to see a list of **all cards** in the deck, so I can review the full inventory. |
| **US-CB-002** | As a reviewer, I want to **filter by domain** (physical/mental/spiritual) and search by text/id/tag, so I can focus on a slice of the deck. |
| **US-CB-003** | As a reviewer, I want to **open a card** and see its full details (all three intensity texts, context, tags, tradition, passage ref, agnostic interpretation), so I can assess the content. |
| **US-CB-004** | As a reviewer, I want **summary statistics** — cards per domain, per intensity level, per sub-category, and per spiritual tradition — so I can understand the deck's distribution. |
| **US-CB-005** | As a reviewer, I want an **interactive radar chart** that I can switch between groupings (Domain / Traditions / Categories / Intensity), so I can visualise distribution at a glance; hovering an axis shows its count. |
| **US-CB-006** | As a reviewer, I want to **add a free-text note** to any card, persisted locally between sessions, so I can record observations for later revision. |
| **US-CB-007** | As a user, I want the browser to **match the main app's neumorphic look** (beige surface, soft dual shadows, gold accents, domain colours), so the experience is consistent. |

---

## Architecture Decisions

1. **Separate HTML entry** (`apps/web/cards.html` + `apps/web/src/cards.tsx`), configured via `build.rollupOptions.input` in `vite.config.ts`. Both `/` (ritual) and `/cards.html` (browser) are emitted to `dist/` and served by GitHub Pages. Dev: `http://localhost:5173/cards.html`. No router dependency, no change to the ritual app.
2. **Statistics logic lives in `packages/cards`** — a new `stats.ts` module. It's pure (no framework deps), testable in the node Vitest project, and reusable by the future `@doodat/physical` generator. Honours the layer contract (`packages/cards` owns card data + domain logic).
3. **Notes are a separate Solid store** (`apps/web/src/store/notes.ts`), not part of the RxJS ritual state machine. Notes are tangential CRUD with no time-based/event-flow semantics; routing them through `intent → reducer → state$` would pollute the ritual pipeline. Persistence pattern mirrors the existing `store/index.ts` (raw `localStorage` + `createEffect`). Components read from the store, never touch localStorage directly.
4. **Radar chart geometry extracted as pure math** (`radarGeometry.ts`) — the error-prone polygon-point computation is unit-testable in node; the SVG component stays thin.
5. **Hand-rolled SVG, zero new dependencies.** Matches "simplest thing that could possibly work" and gives full control over the neumorphic theme.
6. **Shipped ungated under the MVP exemption** (AGENTS.md). The feature touches no auth/keys/uploads — pure local data viewing + localStorage notes. No flag created (avoids dead permanently-true conditional code).

> **Honest note on intensity (US-CB-004):** every `ContentCard` carries all three intensity texts (`intensity_low`/`_medium`/`_high`), so "cards per intensity level" is structurally always 90/90/90 (today) — adding cards keeps the 1:1:1 ratio. You've asked to keep the metric anyway, so I'll display it truthfully as a count per level. A *real* intensity spread would require a new schema field (e.g. a per-card `difficulty` rating) — flagging it here, not blocking on it.

---

## Implementation Steps (test-first, small commits)

### Step 1 — Statistics module (`packages/cards`) 🔴 test-first
- **Write** `packages/cards/src/stats.test.ts` (failing): assert `countByDomain()` = `{physical:30, mental:30, spiritual:30}`, `countByTradition()` totals 24 tradition'd + 6 agnostic, `countByIntensity()` = `{low:90, medium:90, high:90}`, `countByCategory('physical')` returns known categories, `radarSeries()` shape.
- **Implement** `packages/cards/src/stats.ts`:
  - `countByDomain(): Record<Domain, number>`
  - `countByCategory(domain?: Domain): Record<string, number>`
  - `countByTradition(): Record<string, number>` (cards with no `tradition` bucketed as `'agnostic'`)
  - `countByIntensity(): Record<IntensityLevel, number>`
  - `radarSeries(grouping): { axes: string[]; values: number[] }` — adapts tallies for the chart.
- **Export** from `packages/cards/src/index.ts`.

### Step 2 — Radar geometry (pure math) 🔴 test-first
- **Write** `apps/web/src/components/browse/radarGeometry.test.ts` (failing): vertex coordinates for known axes/values/max/radius, clamping of over-max values, label positions.
- **Implement** `apps/web/src/components/browse/radarGeometry.ts`: `radarVertices(axes, values, max, radius, center)`, `polygonPath(points)`, `axisLabelPos(i, n, radius)`.

### Step 3 — Radar chart component
- **Implement** `apps/web/src/components/browse/RadarChart.tsx`: hand-rolled SVG — concentric polygon grid (`shadowDark` strokes, `neu-inset` feel), radiating axes, data polygon (domain/gold fill, low opacity), axis labels (`textSecondary`), hover/tap highlight. Props: `axes`, `values`, `max`, `color`, `onHoverAxis`.

### Step 4 — Notes store
- **Implement** `apps/web/src/store/notes.ts`: `createStore<Record<cardId, string>>` seeded from `localStorage['dodaat_card_notes']`, `createEffect` to persist, exported `notes`, `getNote(id)`, `setNote(id, text)`, `clearNote(id)`. Pure helper `withNote(record, id, text)` kept testable.

### Step 5 — Browse UI components
- `apps/web/src/components/browse/CardStats.tsx` — neumorphic stat tiles (domain counts, intensity counts, total).
- `apps/web/src/components/browse/CardList.tsx` — filterable/searchable list (domain filter pills + text search over id/tags/text); reads `allCards`.
- `apps/web/src/components/browse/CardDetail.tsx` — full card view + embedded notes editor (`CardNotes`).
- `apps/web/src/components/browse/CardNotes.tsx` — `<textarea>` bound to the notes store.
- `apps/web/src/components/browse/CardBrowser.tsx` — layout: header, stat tiles, radar + grouping selector (Domain/Traditions/Categories/Intensity, with a domain sub-picker for Categories mode), card list, detail panel. `data-testid` on all interactive elements.

### Step 6 — Multi-page Vite entry
- **Create** `apps/web/cards.html` (mirrors `index.html`, title "dodaat — card browser", script `/src/cards.tsx`).
- **Create** `apps/web/src/cards.tsx`: `render(() => <CardBrowser />, root)`, imports `./index.css`.
- **Update** `apps/web/vite.config.ts`: add `build.rollupOptions.input = { main: 'index.html', cards: 'cards.html' }`.

### Step 7 — Docs
- **Create** `docs/CARD_BROWSER.md` — the user stories above + acceptance criteria + the intensity caveat.
- **Update** `AGENTS.md` architecture diagram to list `cards.html` + `src/cards.tsx` + the `components/browse/` folder.

### Step 8 — Verify
- `pnpm --filter @doodat/cards test`
- `pnpm --filter @doodat/web test`
- `pnpm --filter @doodat/web typecheck`
- `pnpm --filter @doodat/web build` (confirm both `dist/index.html` and `dist/cards.html` emitted)
- `pnpm dev` → smoke-test `http://localhost:5173/cards.html` (list, filters, radar switching, open a card, write a note, reload, confirm note persists).

---

## Files Touched

**New:**
- `packages/cards/src/stats.ts`, `packages/cards/src/stats.test.ts`
- `apps/web/src/cards.tsx`, `apps/web/cards.html`
- `apps/web/src/store/notes.ts`
- `apps/web/src/components/browse/{CardBrowser,RadarChart,CardStats,CardList,CardDetail,CardNotes}.tsx`
- `apps/web/src/components/browse/radarGeometry.ts`, `.test.ts`
- `docs/CARD_BROWSER.md`

**Modified:**
- `packages/cards/src/index.ts` (re-export stats)
- `apps/web/vite.config.ts` (multi-entry)
- `AGENTS.md` (architecture diagram)

---

## Out of Scope
- Editing/adding card *content* (cards stay authored in `packages/cards/src/data/`).
- Syncing notes beyond localStorage (no Nostr/Blossom — future social layer).
- Playwright E2E for the browser (no E2E layer exists in the repo yet; covered by Vitest units + manual smoke).