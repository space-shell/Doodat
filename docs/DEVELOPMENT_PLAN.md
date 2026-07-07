# Development Plan

> Living document. The phased breakdown is the agreed roadmap; each phase lands on `main` as many small, test-first commits. See [`../AGENTS.md`](../AGENTS.md) for philosophies and ways of working.

## Confirmed scope (v1 MVP)

| Decision | Value |
|---|---|
| Stack | SolidJS + RxJS + Tailwind v3 + Vite |
| Monorepo | pnpm workspaces (`packages/*`, `apps/*`) |
| State/event layer | RxJS (owns all state, events, time mechanics) |
| UI layer | SolidJS (render only — no business logic in components) |
| Persistence | `@solid-primitives/storage` (localStorage) |
| Theme | Neumorphic — beige `#F5F0E8`, gold `#C4A882` |
| Cards | Port the 90 existing validated cards into `packages/cards` |
| Old code | Delete the `dodaat/` tree + root Expo shims; archive for reference only |
| Tests | Vitest (units) + Playwright (E2E, re-pointed at Vite dev server) |
| Dev env | Nix flake (`nodejs_22` + `pnpm`) |

### MVP mechanics — IN

- Daily deck dealing (9 cards: 3 physical, 3 mental, 3 spiritual)
- Complete / skip an action (button-driven, no gesture complexity)
- Persistence across reload + daily reset
- Onboarding wizard (domain preferences + weekly intensity)
- Accountability card prompt (after 3 consecutive skips)
- Weekly intensity re-selection (on ISO-week boundary)
- Streak tracking (consecutive completion days, via RxJS `scan`)
- Daily completion summary

### MVP mechanics — OUT (deferred)

- Time-of-day card reveal (`TIME_OF_DAY_REVEAL` flag)
- Gold cards / voice notes / Blossom upload (`GOLD_CARDS`, `BLOSSOM_UPLOAD`)
- Nostr identity + event publishing (`NOSTR_IDENTITY`)
- Prestige badges (`PRESTIGE_BADGES`)
- Gamification integration (later phase)
- PDF generation (Markdown generator only, for now)
- Mobile / native (Android paused)

### RxJS justification

RxJS earns its weight on the time/event mechanics: `dailyReset$` (midnight tick), `weeklyReset$` (ISO-week boundary), `swipe$` pipeline (persist → accountability trigger → streak update → completion check), `streak$` (`scan` accumulator). If `TIME_OF_DAY_REVEAL` returns, it slots in as another time-gated observable — the natural RxJS fit.

---

## Phase 0 — Repo scaffold & teardown

1. Update `flake.nix` devshell: add `pnpm` alongside `nodejs_22`
2. Create `pnpm-workspace.yaml` globbing `packages/*` and `apps/*`
3. Create `tsconfig.base.json` (strict TS, shared path map)
4. Update `.gitignore`: drop Expo entries; add `node_modules`, `dist`, `.vite`, `coverage`
5. Delete root `App.tsx`, `index.ts`, `app.json`, `playwright.config.ts`, `assets/`, `dodaat/`, `tests/`, `stories/`, `.expo/`
6. Move old tree to `archive/` for reference (or delete outright — decided per commit)
7. Delete `.github/workflows/build-android.yml`

**Done when:** `pnpm install` runs clean at repo root with no packages yet.

## Phase 1 — `packages/cards` (shared source of truth)

Framework-agnostic TypeScript. No Solid, no RxJS, no DOM.

1. Scaffold `packages/cards/package.json` as `@doodat/cards` with `exports` map + `tsc` build
2. **Test-first (Vitest):** `dealDailyCards()` returns 9 cards, 3 per domain, deterministic for a fixed date+seed
3. Port `types/index.ts` → `src/types.ts`
4. Port `data/cards/{physical,mental,spiritual}.ts` → `src/data/` verbatim (90 cards)
5. **Test-first:** `selectCards()` respects weights and excludes recent IDs within the 63-card / 7-day window
6. Port `utils/deck.ts` → `src/deck.ts` (`mulberry32`, `dateSeed`, `cardWeight`, `selectCards`, `dealDailyCards`, `getCardTask`)
7. **Test-first:** accountability trigger fires after exactly 3 consecutive skips
8. Port accountability logic
9. Export barrel `src/index.ts`

**Done when:** `pnpm --filter @doodat/cards test` is green and the package imports cleanly from a consumer.

## Phase 2 — `apps/web` (SolidJS MVP)

1. Scaffold `apps/web` via `pnpm create vite --template solid-ts`
2. Install: `solid-js`, `rxjs`, `@solid-primitives/rxjs`, `@solid-primitives/storage`, `tailwindcss@3`, `postcss`, `autoprefixer`, `@doodat/cards@workspace:*`
3. Configure Tailwind: `tailwind.config.ts` (encode the neumorphic palette as `colors.dodaat.*` + radii + spacing), `postcss.config.js`, `src/index.css` with `@tailwind base/components/utilities`
4. Add `@layer components` `.neu-raised` / `.neu-inset` utility pair for dual-shadow depth
5. Configure Vite: `vite.config.ts`, port `5173`, workspace dep resolution
6. **Test-first (Vitest):** `dailyReset$` emits on date change
7. Implement `src/streams/dailyReset.ts`
8. **Test-first:** `weeklyReset$` emits on ISO-week boundary
9. Implement `src/streams/weeklyReset.ts`
10. **Test-first:** `swipe$` pipeline persists outcome, triggers accountability after 3 skips, updates streak
11. Implement `src/streams/swipe.ts` (Subject + pipe)
12. **Test-first:** `streak$` scan accumulates consecutive completion days, resets on a miss
13. Implement `src/streams/streak.ts`
14. **Test-first:** store persists profile, dailyState, deck, currentIndex across reload
15. Implement `src/store/index.ts` — Solid `createStore` + `@solid-primitives/storage` bridge; expose `window.__dodaatStore` in dev mode
16. Implement `src/components/CurrentCard.tsx` — single card, Complete/Skip buttons (no gestures)
17. Implement `src/components/Onboarding.tsx` — 6-step wizard as Solid components
18. Implement `src/components/AccountabilityCard.tsx`
19. Implement `src/components/IntensitySelector.tsx` (weekly re-commit)
20. Implement `src/components/CompletionSummary.tsx`
21. Wire `src/App.tsx` — compose store + streams + conditional rendering
22. Implement `src/main.tsx` — root mount, Tailwind import

**Done when:** `pnpm --filter @doodat/web dev` serves at `http://localhost:5173`, the full user journey runs (onboarding → daily deck → completion), and Vitest is green.

## Phase 3 — `packages/physical` (printable Markdown generator)

PDF is deferred. Markdown only for now.

1. Scaffold `packages/physical/package.json` as `@doodat/physical`, bin entry
2. **Test-first (Vitest):** generator emits all 90 cards grouped by domain in Markdown
3. Implement Markdown emitter: imports `@doodat/cards`, outputs `decks.md` with one section per domain, one block per card (title, low/medium/high, context, tags)
4. Add CLI: `pnpm --filter @doodat/physical gen` writes `decks.md` to repo root
5. PDF generation tracked as a follow-up issue, not in this plan

**Done when:** `pnpm --filter @doodat/physical gen` produces a printable `decks.md`.

## Phase 4 — Playwright E2E

1. New root `playwright.config.ts`:
   - Drop the `/nix/store/...` Chromium hardcode → Playwright's bundled Chromium
   - `baseURL: http://localhost:5173`
   - `webServer.command: pnpm --filter @doodat/web dev`, `reuseExistingServer: true`
   - Two projects: `chromium-mobile` (390×844), `chromium-desktop`
2. Rewrite specs for button-driven UI (no swipe-gesture helpers):
   - `wizard.spec.ts` — 6-step onboarding
   - `daily-deck.spec.ts` — complete/skip advances index, persists across reload
   - `accountability.spec.ts` — 3-skip trigger
   - `intensity.spec.ts` — weekly re-selection via ISO-week time travel
   - `completion.spec.ts` — end-of-deck summary renders (fixes the weak null-render assertion from the old suite)
   - `streak.spec.ts` — new, covers streak increment + reset

**Done when:** `pnpm exec playwright test --project=chromium-desktop` is green locally.

## Phase 5 — CI

1. Confirm `.github/workflows/build-android.yml` deleted (Phase 0)
2. Rewrite `.github/workflows/deploy-pages.yml`:
   - Node 22 + pnpm setup
   - `pnpm install --frozen-lockfile`
   - `pnpm --filter @doodat/web build` (Vite → `apps/web/dist/`)
   - upload `apps/web/dist/` as the Pages artifact
3. New `.github/workflows/test.yml`:
   - Triggers: push to `main`, PR to `main`
   - `pnpm install --frozen-lockfile`
   - `pnpm test` (Vitest across all workspaces)
   - `pnpm exec playwright test` with cached browser binaries
   - This restores the missing green-test signal flagged in the audit

**Done when:** a push to `main` triggers both workflows and both pass on GitHub Actions.

## Phase 6 — Documentation (ongoing)

- [`AGENTS.md`](../AGENTS.md) — kept current with stack, contracts, policies
- [`docs/CARD_DESIGN.md`](CARD_DESIGN.md) — card authoring workflow
- `README.md` — setup, dev, test, build, physical-generator commands
- Update docs whenever behaviour or architecture changes (part of "done")

---

## Future phases (not started)

- **Gamification integration** — streaks already in MVP; prestige badges, praise points, social completion come later, all behind flags
- **Social layer** — Nostr identity, Blossom voice upload, gold cards. Revives the existing (now-archived) service code behind feature flags
- **Time-of-day reveal** — RxJS-driven card unlock at ritual times (`TIME_OF_DAY_REVEAL`)
- **PDF generation** — when the paper workflow needs it
- **Mobile / native** — revisit only when the web product is stable
