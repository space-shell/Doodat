# US-013 — Card schema v2: difficulty, sources, actions

**As a** user working through my daily deck,  
**I want** cards to show their difficulty, cite sources, and offer text-input prompts,  
**So that** I understand the level of each practice, verify its claims, and reflect in writing.

---

## Acceptance criteria

**Given** I am viewing a content card  
**When** I look at the card header  
**Then** I see a difficulty badge (low / medium / high) in gold uppercase

**Given** a card has a `difficulty` of `medium`  
**When** the task text renders  
**Then** only the `intensity_medium` text is shown (the card's fixed difficulty selects which of the three authored texts renders)

**Given** a spiritual card references a scripture or text  
**When** I look below the task text  
**Then** I see a sources list with citations and optional links

**Given** a card has text-action prompts scoped to its difficulty  
**When** I view the card  
**Then** I see a textarea where I can write my reflection, and my response is stamped on the outcome when I swipe

**Given** a card has no actions  
**When** I view the card  
**Then** no textarea is shown

---

## Notes

- **`difficulty`** (low/medium/high): intrinsic to the card, fixed at authoring time. Selects which `intensity_*` text renders. Also weights the daily deal (high-difficulty cards are rarer on low-volume days).
- **`sources[]`**: replaces the old `passage_ref` / `expanded_link`. Each source has `citation` (string), optional `url` (renders as link), optional `kind`. Every spiritual card that references a text carries a source.
- **`actions[]`**: each action has `id`, `type` (v1 renders `text` only), `prompt`, optional `difficulties` (scopes the action to specific difficulty levels). An action activates when its `difficulties` is unset or includes the card's own `difficulty`.
- **`CardOutcome`**: gains `difficulty` (stamped from the card) and optional `actionResponses` (keyed by action ID).
- The migration script (`packages/cards/scripts/migrate-v2.mjs`) assigned difficulty by per-domain tertile of a content demand score (10/10/10 per domain). This is a heuristic pending human re-authoring.
- All three `intensity_*` texts are still authored per card as a palette, but only the one matching `difficulty` ever renders.

## Status

**Implemented.** `packages/cards/src/types.ts` (`ContentCard`, `CardSource`, `CardAction`, `CardOutcome`), `packages/cards/src/data/` (90 migrated cards), `ContentCardView.tsx` (difficulty badge, sources render, text-action inputs), `CardDetail.tsx` (browser view), `reducer.ts` (stamps `difficulty` + `actionResponses` on swipe).

## Test coverage

Unit tests in `data/index.test.ts`: all 90 cards have valid v2 schema fields. `reducer.test.ts`: actionResponses stamped on outcome, omitted when none provided.
