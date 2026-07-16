# Development Plan

> Living document. The phased breakdown is the agreed roadmap; each phase lands on `main` as many small, test-first commits. See [`../AGENTS.md`](../AGENTS.md) for philosophies and ways of working.

## Confirmed scope (v1 MVP)

| Decision | Value |
|---|---|
| Stack | SolidJS + RxJS + Tailwind v3 + Vite |
| Monorepo | pnpm workspaces (`packages/*`, `apps/*`) |
| State/event layer | RxJS (owns all state, events, time mechanics) |
| UI layer | SolidJS (render only — no business logic in components) |
| Persistence | raw `localStorage` (JSON serialize/deserialize) |
| View transitions | `solid-transition-group` (two-phase neumorphic) |
| Theme | Neumorphic — beige `#F5F0E8`, gold `#C4A882` |
| Cards | 90 cards in `packages/cards` (v2 schema: difficulty/sources/actions) |
| Tests | Vitest units (+ `jsdom` for DOM-based tests); Playwright E2E (planned) |
| Dev env | Nix flake (`nodejs_22` + `pnpm`) |

### MVP mechanics — IN

- Daily deck dealing (3/6/9 cards based on intensity: Light/Medium/High; balanced across physical/mental/spiritual domains)
- Card schema v2: per-card `difficulty` (low/medium/high), `sources[]` (citations), `actions[]` (text-input prompts, difficulty-scoped)
- Volume-based dealing with difficulty distribution (low day: weighted random; medium: 1 high guaranteed; high day: 2–3 high guaranteed, seeded)
- Complete / skip via button (Done/Skip). Swipe gestures navigate (left = next card, right = previous card) but never complete — completion stays on the Done button.
- Free navigation via card number grid (CardNav — tap any number to jump) and via swipe gestures on content cards
- Daily intensity check-in (on day boundary; replaces the former weekly re-commit)
- Onboarding wizard (welcome → physical prefs → mental prefs → spiritual prefs → intensity; shown on first launch and on settings reset)
- Accountability card prompt (after 3 skips in a session; once per day)
- Streak tracking (consecutive completion days; recompute from outcomes + day-start snapshot for update-in-place)
- Daily completion summary
- Card browser (review all 90 cards, radar chart stats, per-card notes with filter/export/clear)
- Settings view (reset day to setup wizard — clears today's outcomes, re-triggers full wizard)
- Two-phase neumorphic transitions (content fades → shadow flattens on exit; shadow raises → content fades in on enter; 200ms per phase, `outin` mode)
- Persistence across reload + daily reset (raw `localStorage`)

### MVP mechanics — OUT (deferred)

- Time-of-day card reveal (`TIME_OF_DAY_REVEAL` flag)
- Gold cards / voice notes / Blossom upload (`GOLD_CARDS`, `BLOSSOM_UPLOAD`)
- Nostr identity + event publishing (`NOSTR_IDENTITY`)
- Prestige badges (`PRESTIGE_BADGES`)
- Gamification integration (later phase)
- PDF generation (Markdown generator only, for now)
- Mobile / native (Android paused)

### RxJS justification

RxJS earns its weight on the time/event mechanics: `dailyReset$` (midnight tick), the swipe pipeline (persist → accountability trigger → streak update → completion check), streak accumulation (recompute from outcomes + day-start snapshot). The daily intensity check-in is structural (an `intensity_select` card prepended to the deck when `intensitySetAt` doesn't match today), not a separate observable. If `TIME_OF_DAY_REVEAL` returns, it slots in as another time-gated observable — the natural RxJS fit.

---

## Phase 0 — Repo scaffold & teardown ✅

1. Update `flake.nix` devshell: add `pnpm` alongside `nodejs_22`
2. Create `pnpm-workspace.yaml` globbing `packages/*` and `apps/*`
3. Create `tsconfig.base.json` (strict TS, shared path map)
4. Update `.gitignore`: drop Expo entries; add `node_modules`, `dist`, `.vite`, `coverage`
5. Delete root `App.tsx`, `index.ts`, `app.json`, `playwright.config.ts`, `assets/`, `dodaat/`, `tests/`, `stories/`, `.expo/`
6. Move old tree to `archive/` for reference
7. Delete `.github/workflows/build-android.yml`

**Done.** `pnpm install` runs clean at repo root.

## Phase 1 — `packages/cards` (shared source of truth) ✅

Framework-agnostic TypeScript. No Solid, no RxJS, no DOM.

1. Scaffold `packages/cards/package.json` as `@doodat/cards` with `exports` map + `tsc` build
2. Port `types/index.ts` → `src/types.ts` (v2 schema: `ContentCard` with `difficulty`, `sources[]`, `actions[]`; `CardSource`, `CardAction`, `CardOutcome`)
3. Port 90 cards → `src/data/{physical,mental,spiritual}.ts` (migrated via `scripts/migrate-v2.mjs`: difficulty by per-domain tertile of demand score; 24 spiritual cards got sources)
4. Port dealing logic → `src/deck.ts` (`mulberry32`, `dateSeed`, `cardWeight`, `pickOne`, `planDifficulties`, `dealDailyCards`, `getCardTask`, `INTENSITY_VOLUME`, `todayString`, `weekString`)
5. Port accountability logic → `src/accountability.ts` (`shouldTriggerAccountability`)
6. Deck statistics → `src/stats.ts` (`countByDifficulty`, `countByDomain`, radar series)
7. Export barrel `src/index.ts`

**Done.** 53 unit tests green. Package imports cleanly from `@doodat/web`.

## Phase 2 — `apps/web` (SolidJS MVP) ✅

1. Scaffold `apps/web` via Vite solid-ts template
2. Install: `solid-js`, `rxjs`, `tailwindcss@3`, `@doodat/cards@workspace:*`, `solid-transition-group`
3. Configure Tailwind: neumorphic palette as `colors.dodaat.*` + radii; `@layer components` `.neu-raised` / `.neu-inset` / `.neu-button` / `.neu-fade-in`
4. Implement `src/streams/` — `reducer.ts` (pure reducer: SET_PREFERENCES, SET_INTENSITY, SWIPE, ADVANCE, NAVIGATE, DISMISS_ACCOUNTABILITY, DAILY_RESET, RESET_DAY_TO_WIZARD), `stateMachine.ts` (merge intent$ + dailyReset$ → scan), `time.ts` (dailyReset$), `intents.ts` (Subject + emit)
5. Implement `src/store/index.ts` — Solid `createStore` + `reconcile` + raw localStorage; `loadSeed` with first-launch / new-day / same-day resume paths
6. Implement `src/components/` — ContentCardView (card + sources + actions + Done/Skip), CardNav (flex-wrap number grid + settings button), BottomBar (contextual buttons per card type), Onboarding (5-step wizard), IntensitySelect (Light/Medium/High), AccountabilityCard, CompletionSummary, SettingsView (reset day to wizard)
7. Implement `src/neuTransition.ts` — two-phase enter/exit callbacks for `<Transition>` (children opacity + box-shadow, `prefers-reduced-motion` guard)
8. Implement `src/App.tsx` — `viewKey` memo + keyed `<Show>` inside `<Transition mode="outin" appear>`; `settledKey` delays CardNav/BottomBar visibility until exit completes; `isExiting` fades BottomBar with card content
9. Implement card browser (`cards.html` + `cards.tsx` + `components/browse/`) — CardBrowser, CardList, CardDetail (sources + difficulty badge), CardNotes (filter/export/clear), CardStats, RadarChart (pure SVG)

**Done.** 66 unit tests green. Full user journey runs: onboarding → daily intensity check-in → daily deck → completion. Card browser operational.

## Shipped beyond the original plan

These features were not in the phased breakdown but have been implemented:

- **Card schema v2** — `difficulty` (low/medium/high per card), `sources[]` (citations replacing `passage_ref`/`expanded_link`), `actions[]` (text-input prompts, difficulty-scoped). Migration script `packages/cards/scripts/migrate-v2.mjs`.
- **Volume-based dealing** — intensity selector controls card count (Light=3, Medium=6, High=9) instead of per-card intensity text. Difficulty distribution biased by volume (low: weighted; medium: 1 high guaranteed; high: seeded 2–3 high).
- **Daily intensity check-in** — replaced the weekly ISO-week re-commit with a daily check-in (`needsDailyIntensity` checks day boundary, not week boundary).
- **Free navigation** — CardNav number grid allows jumping to any card. Back/forward buttons removed; navigation is via number grid, Done-driven auto-advance, and swipe gestures.
- **Swipe navigation** — on content cards, a horizontal touch swipe (left = next, right = previous, threshold-fling) hops to the adjacent content card via the `STEP` intent (`adjacentContentIndex` skips system cards; no-op at the first/last content card). Pure browsing: no outcome is recorded. Completion remains on the Done button. Touch only (Pointer Events not used); vertical scrolls inside textareas are preserved.
- **Settings + reset-to-wizard** — settings button in CardNav; settings view with "reset day to setup wizard" button (`RESET_DAY_TO_WIZARD` intent clears today's outcomes, re-triggers full 5-card wizard).
- **Two-phase neumorphic transitions** — `neuTransition.ts` with `onEnter`/`onExit` callbacks: children fade → shadow flattens (exit); shadow raises → children fade in (enter). `settledKey` + `isExiting` synchronize CardNav/BottomBar appearance with the transition cycle.
- **Card browser** — separate `cards.html` entry; review all 90 cards with detail view, radar chart stats, per-card notes (localStorage, filter/export/clear).

## Phase 3 — `packages/physical` (printable Markdown generator) — not started

PDF is deferred. Markdown only for now.

1. Scaffold `packages/physical/package.json` as `@doodat/physical`, bin entry
2. **Test-first (Vitest):** generator emits all 90 cards grouped by domain in Markdown
3. Implement Markdown emitter: imports `@doodat/cards`, outputs `decks.md` with one section per domain, one block per card (title, difficulty, task text, context, sources, tags)
4. Add CLI: `pnpm --filter @doodat/physical gen` writes `decks.md` to repo root
5. PDF generation tracked as a follow-up issue, not in this plan

**Done when:** `pnpm --filter @doodat/physical gen` produces a printable `decks.md`.

## Phase 4 — Playwright E2E — not started

1. New root `playwright.config.ts`:
   - `baseURL: http://localhost:5173`
   - `webServer.command: pnpm --filter @doodat/web dev`, `reuseExistingServer: true`
   - Two projects: `chromium-mobile` (390×844), `chromium-desktop`
2. Specs for button-driven UI (no swipe-gesture helpers):
   - `wizard.spec.ts` — 5-step onboarding
   - `daily-deck.spec.ts` — Done/Skip advances, persists across reload
   - `accountability.spec.ts` — 3-skip trigger
   - `intensity.spec.ts` — daily re-selection
   - `completion.spec.ts` — end-of-deck summary
   - `streak.spec.ts` — streak increment + reset
   - `settings.spec.ts` — reset day to wizard
   - `transitions.spec.ts` — two-phase neumorphic transitions

**Done when:** `pnpm exec playwright test --project=chromium-desktop` is green locally.

## Phase 5 — CI — partially complete

1. ✅ `.github/workflows/build-android.yml` deleted (Phase 0)
2. ✅ `.github/workflows/deploy-pages.yml`: Node 22 + pnpm, `pnpm --filter @doodat/web build`, upload `apps/web/dist/` as Pages artifact
3. ❌ `.github/workflows/test.yml`: not yet created. Planned: triggers on push/PR to `main`, runs `pnpm test` (Vitest) + Playwright E2E

**Done when:** both workflows exist and pass on GitHub Actions.

## Phase 6 — Documentation (ongoing)

- [`AGENTS.md`](../AGENTS.md) — kept current with stack, contracts, policies ✅
- [`docs/CARD_DESIGN.md`](CARD_DESIGN.md) — card authoring workflow (v2 schema) ✅
- [`docs/CARD_BROWSER.md`](CARD_BROWSER.md) — card browser feature spec ✅
- [`docs/user-stories/`](user-stories/) — US-001 through US-014 ✅
- `README.md` — setup, dev, test, build commands (not yet created)
- Update docs whenever behaviour or architecture changes (part of "done")

---

## Future phases (not started)

- **Gamification integration** — streaks already in MVP; prestige badges, praise points, social completion come later, all behind flags
- **Social layer** — Nostr identity, Blossom voice upload, gold cards. Revives the existing (now-archived) service code behind feature flags
- **Time-of-day reveal** — RxJS-driven card unlock at ritual times (`TIME_OF_DAY_REVEAL`)
- **PDF generation** — when the paper workflow needs it
- **Mobile / native** — revisit only when the web product is stable
