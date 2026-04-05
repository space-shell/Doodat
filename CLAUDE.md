# dodaat — Development Guidelines

## Engineering Paradigm: Extreme Programming (XP)

This project follows the [Extreme Programming](http://www.extremeprogramming.org/) methodology. The core practices we adhere to:

- **Test-first** — write a failing test before writing implementation code. Playwright for behavioural/E2E, Jest/RTL for units.
- **Continuous integration** — all code goes directly to `main`. No feature branches. Every push must leave `main` green.
- **Small, frequent releases** — commit often; each commit should be a shippable increment.
- **Pair/review** — prefer short feedback loops. Use Claude Code review for automated second opinions before pushing.
- **Simple design** — do the simplest thing that could possibly work. No speculative abstractions.
- **Refactor mercilessly** — clean up continuously; don't let debt accumulate.
- **Collective ownership** — any contributor can improve any part of the codebase.

## Branching Strategy: Trunk-Based Development

**There are no feature branches.** All development happens directly on `main`.

- Commit small, working increments directly to `main`.
- Every commit must pass CI (Android APK build + web deploy).
- If a change is too large to commit safely in one go, use a **feature flag** to hide it until it is complete (see below).

## Feature Flags

All new user-facing features **must be gated behind a feature flag** before merging to `main`. This serves two purposes:

1. **Testing** — flags let you ship code to production while keeping the feature hidden from users, allowing safe integration testing in the live environment.
2. **Security** — unfinished features that touch auth, Nostr keys, or Blossom uploads are not accidentally exposed.

Feature flags live in `src/config/flags.ts` (to be created when the first flag is needed). Example structure:

```ts
export const FLAGS = {
  VOICE_NOTE_UPLOAD: false,      // Blossom audio upload
  GOLD_CARD_SEND: false,         // Sending gold cards via Nostr DM
  PRESTIGE_BADGES: false,        // Prestige badge display
} as const;

export type Flag = keyof typeof FLAGS;
```

**Rules:**
- A flag defaults to `false` (off).
- Flip to `true` only when the feature is fully tested and ready to release.
- Remove the flag (and its conditional) once the feature has been live and stable for one release cycle.
- Never ship a flag that is permanently `true` — that is just dead conditional code.

## Testing

- **Framework:** Playwright (behavioural/E2E) — see `tests/`
- **Run:** `npx playwright test --project=chromium-desktop`
- **CI:** Tests run on every push to `main` via GitHub Actions.
- Every new feature or bug fix must be accompanied by a test that would have caught the issue.

## CI / CD

| Workflow | Trigger | Output |
|---|---|---|
| `build-android.yml` | push / PR to `main` | Debug APK artifact |
| `deploy-pages.yml` | push to `main` | GitHub Pages web deploy |

Both must stay green. A red `main` is a P0.

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 55 / React Native 0.83 |
| State | Zustand + AsyncStorage |
| Identity | Nostr (`nostr-tools`) + expo-secure-store (native) / localStorage (web) |
| Audio | expo-av |
| Gestures | react-native-gesture-handler + react-native-reanimated |
| Design | Neumorphic — warm off-white `#E8E0D8`, gold `#C4A882` |
| Backend | Nostr relays (custom event kinds 31000–31003) + Blossom audio storage |
