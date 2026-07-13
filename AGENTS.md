# dodaat — Development Guidelines

> **Canonical name:** `dodaat` (lowercase). The repo directory is `Doodat`; packages are `@doodat/*`. Historical misspellings (`Doodat`, `dodaat`) appear in older commits — tolerate them in history, do not propagate them in new code or docs.

## Product

**dodaat** — *do one day at a time*. A daily-ritual app that deals a small deck of practice cards across three life domains (physical, mental, spiritual). The user completes or skips each card. The deck reshuffles daily.

**The cards are the product.** Card content and the daily-ritual mechanics are the core; everything else exists to serve them.

## Vision & Philosophy

1. **Cards first.** Card authoring, calibration, and the daily-ritual loop are the primary work. Gamification, social, and identity layers come later and must not distract from the card core.
2. **Physical/digital boundary.** A parallel paper-and-pen version of the system exists IRL. The repo enforces the boundary via a shared source of truth: `packages/cards` holds all card content and dealing logic. The digital app (`apps/web`) and the printable generator (`packages/physical`) both derive from it. One edit to a card updates both surfaces.
3. **State and UI are separate concerns.** **RxJS owns all state and event flow** (daily reset, weekly reset, the swipe pipeline, streak accumulation, time-based mechanics). **SolidJS owns rendering only** — components read derived signals and emit intents; they hold no business logic and no state beyond local UI ephemera. This separation is the architecture's load-bearing wall. Do not put state management in components.
4. **Neumorphic theme.** Light beige `#F5F0E8` base, gold `#C4A882` accent, soft dual-shadow depth. Full palette in **Theme & Design** below; encoded in `apps/web/tailwind.config.ts`.
5. **Web first.** Android/native development is paused. The MVP targets the web. A mobile return is a future decision, not an assumption.

## Engineering Paradigm: Extreme Programming (XP)

- **Test-first** — write a failing test before implementation. Vitest for units (cards, dealing engine, RxJS pipelines); Playwright for behavioural/E2E.
- **Continuous integration** — all code on `main`. No feature branches. Every push leaves `main` green.
- **Small, frequent releases** — commit often; each commit is a shippable increment.
- **Simple design** — simplest thing that could possibly work. No speculative abstractions.
- **Refactor mercilessly** — clean up continuously; don't let debt accumulate.
- **Collective ownership** — any contributor can improve any part.

## Trunk-Based Development

No feature branches. All work lands on `main` directly.

- Commit small, working increments.
- Every commit must pass CI (web build + test workflow + Pages deploy).
- If a change is too large to land safely in one go, gate it behind a **feature flag** (see below) — never behind a branch.

## Architecture

```
Doodat/
├── pnpm-workspace.yaml
├── flake.nix                    # Nix devshell: nodejs_22 + pnpm
├── tsconfig.base.json
├── packages/
│   ├── cards/                   # @doodat/cards — SHARED source of truth
│   │   └── src/{data, types, deck, stats}.ts   # 90 cards + domain types + dealing engine + deck stats
│   └── physical/                # @doodat/physical — printable Markdown generator
├── apps/
│   └── web/                     # @doodat/web — SolidJS + RxJS + Tailwind
│       ├── index.html           # daily-ritual app entry
│       ├── cards.html           # card browser entry (review + stats + notes)
│       └── src/{components, streams, store}   # + cards.tsx (browser root)
├── tests/                       # Playwright E2E (root-level, targets apps/web)
├── docs/                        # DEVELOPMENT_PLAN.md, CARD_DESIGN.md, CARD_BROWSER.md
└── archive/                     # old dodaat/ tree, reference only
```

**Layer contracts:**

| Layer | Owns | Forbidden from |
|---|---|---|
| `packages/cards` | card data, domain types, dealing engine, deck statistics | any framework dependency |
| `apps/web/src/streams/` | RxJS observables — the state/event layer | importing Solid |
| `apps/web/src/store/` | Solid `createStore` bridging streams → signals + localStorage | business logic (delegate to streams) |
| `apps/web/src/components/` | rendering + intent emission | holding state, importing RxJS directly |

UI subscribes to streams via `@solid-primitives/rxjs`. Components emit intents (swipe, select, confirm) into stream Subjects; they never mutate state directly.

## Tech Stack

| Layer | Library |
|---|---|
| UI | SolidJS |
| State / events | RxJS |
| State↔UI bridge | `@solid-primitives/rxjs` |
| Persistence | `@solid-primitives/storage` (localStorage) |
| Styling | Tailwind CSS v3 (neumorphic) |
| Build / dev server | Vite |
| Monorepo | pnpm workspaces |
| Unit tests | Vitest |
| E2E tests | Playwright |
| Dev environment | Nix flake (`nodejs_22`, `pnpm`) |

## Theme & Design

Neumorphic, ported from the original `dodaat/src/theme/index.ts`. Canonical tokens:

| Token | Value | Use |
|---|---|---|
| `background` | `#F5F0E8` | page surface |
| `shadowLight` | `#FFFFFF` | neumorphic light side |
| `shadowDark` | `#C8C0B2` | neumorphic dark side |
| `physical` | `#8B6F5E` | terracotta — physical domain |
| `mental` | `#5E7A8B` | slate blue — mental domain |
| `spiritual` | `#7A6B8B` | muted violet — spiritual domain |
| `gold` | `#C4A882` | accent / completion |
| `goldLight` / `goldDark` | `#EDD9B8` / `#A8875A` | gold range |
| `textPrimary` | `#38322C` | body text |
| `textSecondary` | `#7A7068` | secondary text |
| `textMuted` | `#B0A89E` | context / hints |
| `systemCard` | `#EDE8DE` | recessed system cards |

Radii: card `24`, button `16`, pill `50`, small `8`. Spacing scale: `4 / 8 / 16 / 24 / 32 / 48`. These land in `apps/web/tailwind.config.ts` as theme extensions (`colors.dodaat.*`, `borderRadius`, `spacing`).

Neumorphic depth = dual box-shadow: dark side offset `+6,+6`, light side offset `-6,-6`, radius `12`. Encode as Tailwind utilities or a `@layer components` `.neu-raised` / `.neu-inset` pair.

## Card Design Workflow

Cards are authored in `packages/cards/src/data/`. The full workflow — anatomy, authoring process, intensity calibration, domain-coverage balance, spiritual-tradition handling — is in [`docs/CARD_DESIGN.md`](docs/CARD_DESIGN.md). **Read it before adding or revising any card.**

## Feature Flags

All new user-facing features **must be gated behind a flag** before landing on `main`. Flags live in `apps/web/src/config/flags.ts`.

```ts
export const FLAGS = {
  TIME_OF_DAY_REVEAL: false,   // RxJS-driven card unlock at ritual times
  GOLD_CARDS: false,           // voice-note social layer
  PRESTIGE_BADGES: false,
  NOSTR_IDENTITY: false,
  BLOSSOM_UPLOAD: false,
} as const;
export type Flag = keyof typeof FLAGS;
```

**Rules:**
- Defaults to `false` (off).
- Flip to `true` only when fully tested and ready.
- Remove the flag (and its conditional) once the feature has been live and stable for a release cycle.
- Never ship a permanently-`true` flag — that is dead conditional code.

**MVP v1 exemption:** the initial local-only mechanics (onboarding, daily deck, accountability, weekly intensity, streaks, completion) touch no auth, keys, or uploads, so they ship ungated. The flag policy re-activates the moment the social/identity layer returns.

## Testing

- **Units:** Vitest, co-located with source (`*.test.ts`). Covers `packages/cards` (dealing logic, weights, recent-card de-duplication, accountability triggers) and `apps/web/src/streams/` (RxJS pipelines: daily reset, weekly reset, swipe pipeline, streak scan).
- **E2E:** Playwright at repo root (`tests/`), targets the Vite dev server at `http://localhost:5173`. Covers the user journey end-to-end.
- **Run units:** `pnpm test`
- **Run E2E:** `pnpm exec playwright test --project=chromium-desktop`
- Every feature or fix ships with a test that would have caught the regression.

## CI / CD

| Workflow | Trigger | Output |
|---|---|---|
| `test.yml` | push / PR to `main` | Vitest units + Playwright E2E |
| `deploy-pages.yml` | push to `main` | Vite build → GitHub Pages |

Both must stay green. A red `main` is a P0. The old `build-android.yml` is removed — Android development is paused.

## Naming Conventions

- Product: `dodaat` (lowercase).
- Repo directory: `Doodat` (GitHub default; not renamed).
- Packages: `@doodat/cards`, `@doodat/physical`, `@doodat/web`.
- Dev-mode store global on `window`: `__dodaatStore` (single-o, single-d, single-a). The old `__doodaatStore` double-o typo is extinct; do not reintroduce it.
- Card IDs: `phys-###`, `ment-###`, `spir-###` (zero-padded to 3 digits).

## Ways of Working

- **Commit cadence:** small commits, each shippable. Multiple commits per session is normal; one logical change per commit.
- **Test-first is non-negotiable.** A change without a failing-test-first trail is out of process.
- **"Done" means:** tests green, typecheck clean, docs updated if behaviour changed, committed to `main`.
- **Questions over assumptions:** when a requirement is ambiguous, ask. Do not guess and ship.

## Roadmap Snapshot

See [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) for the full phased plan. Current phase: **Phase 0 — repo scaffold** (not yet started). Deferred explicitly: gamification integration, social layer (Nostr / Blossom / gold cards / voice), PDF generation, mobile/native.
