# dodaat

> *do one day at a time.*

A daily-ritual app that deals a small deck of practice cards across three life domains — physical, mental, spiritual. The user completes or skips each card; the deck reshuffles daily. A parallel paper-and-pen version exists IRL; the repo enforces a shared source of truth so both surfaces stay in sync.

## Status

**Pivoting to a web-first MVP.** The legacy Expo/React Native tree is being retired in favour of a SolidJS + RxJS + Tailwind architecture. Documentation reflects the target state; the code migration follows the phased plan in [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md).

| Artifact | State |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Current — philosophies, stack, ways of working |
| [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) | Current — phased roadmap |
| [`docs/CARD_DESIGN.md`](docs/CARD_DESIGN.md) | Current — card anatomy + authoring workflow |
| `packages/cards` | Pending (Phase 1) — will hold the 90 validated cards + dealing engine |
| `apps/web` | Pending (Phase 2) — SolidJS MVP |
| `packages/physical` | Pending (Phase 3) — printable Markdown generator |

## Architecture

```
packages/cards    # shared source of truth — card data + types + dealing engine
apps/web          # SolidJS + RxJS + Tailwind — the digital surface
packages/physical # printable Markdown deck generator — the paper surface
```

`packages/cards` is imported by both surfaces. One edit to a card updates both.

## Tech stack

| Layer | Choice |
|---|---|
| UI | SolidJS (render only — no state in components) |
| State / events | RxJS (owns all state and event flow) |
| Styling | Tailwind CSS v3 (neumorphic) |
| Build | Vite |
| Monorepo | pnpm workspaces |
| Tests | Vitest (units) + Playwright (E2E) |
| Dev env | Nix flake (`nodejs_22`, `pnpm`) |

See [`AGENTS.md`](AGENTS.md) for the full layer contracts.

## Setup (target — once Phase 0 lands)

```sh
# enter the devshell (Nix)
direnv allow

# install workspace deps
pnpm install

# run the web dev server
pnpm --filter @doodat/web dev      # → http://localhost:5173

# run the unit + E2E tests
pnpm test
pnpm exec playwright test --project=chromium-desktop

# regenerate the printable deck
pnpm --filter @doodat/physical gen  # → writes decks.md
```

## Contributing

Trunk-based, test-first, small commits. Read [`AGENTS.md`](AGENTS.md) before opening a change. Cards are the product — read [`docs/CARD_DESIGN.md`](docs/CARD_DESIGN.md) before touching card content.

## License

TBD.
