# Card Design

> Cards are the product. This document defines the anatomy of a card, the authoring process, and the calibration standards. Read it before adding or revising any card in `packages/cards/src/data/`.

## Source of truth

All card content lives in **one place**: `packages/cards/src/data/`. Both surfaces — the digital app (`apps/web`) and the printable generator (`packages/physical`) — import from it. Editing a card in one place updates both. There is no parallel content store.

```
packages/cards/src/data/
├── physical.ts     # phys-001 … phys-030
├── mental.ts       # ment-001 … ment-030
└── spiritual.ts    # spir-001 … spir-030
```

Card IDs are zero-padded to 3 digits, prefixed by domain: `phys-###`, `ment-###`, `spir-###`. IDs are stable forever — once shipped, an ID is never reused and never repurposed. To retire a card, mark it (TBD: `retired` flag) rather than reassigning the ID.

## Card anatomy

Every card is a `ContentCard`:

```ts
type IntensityLevel = 'low' | 'medium' | 'high';

interface ContentCard {
  id: string;                  // 'phys-001' — stable, zero-padded
  type: 'content';
  domain: 'physical' | 'mental' | 'spiritual';
  category: string;            // sub-category, e.g. 'upper_body', 'reflection'
  difficulty: IntensityLevel;  // intrinsic: selects which intensity_* text renders + drives dealing
  intensity_low: string;       // actionable instruction at low intensity
  intensity_medium: string;    // actionable instruction at medium intensity
  intensity_high: string;      // actionable instruction at high intensity
  context?: string;            // the "why" — italic in UI, optional
  tags: string[];              // lowercase, used for filtering and weighting
  created_at: number;          // unix seconds
  sources?: CardSource[];      // citations / references backing the card (esp. religious text)
  actions?: CardAction[];      // inputs the card collects (e.g. a journal text field)

  // Spiritual-only fields:
  tradition?: string;          // 'Christianity', 'Stoicism', 'Buddhism', …
  agnostic_interpretation?: string;  // secular framing of the same insight
  cross_tradition_pair?: string;     // id of a paired card from another tradition
}

interface CardSource { citation: string; url?: string; kind?: 'scripture' | 'book' | 'article' | 'paper' | 'web' }
interface CardAction { id: string; type: 'text' | 'checklist' | 'scale' | 'timer' | 'none'; prompt?: string; required?: boolean; difficulties?: IntensityLevel[]; /* + type-specific fields */ }
```

### What each field is for

- **`difficulty`** — the card's intrinsic level. It picks which of the three `intensity_*` texts renders, and it drives the daily dealing distribution (see *Intensity vs difficulty vs volume* below). One card = one difficulty; the same practice never shows at different levels across days.
- **`intensity_*`** — the action the user takes at each dose, written as an imperative starting with a verb. All three are authored and calibrated (see below); only the one matching `difficulty` is shown. Written as a palette so a card can be re-pinned to a different difficulty without re-authoring.
- **`context`** — one sentence explaining *why* this practice matters. Not the instructions; the rationale. Shown in muted italic beneath the action.
- **`tags`** — drive preference weighting and de-duplication. Reuse existing tags; don't invent synonyms (`upper_body`, not `upperbody` or `upper-body`).
- **`sources`** — citations for any material the card references (scripture, books, papers, articles). Every claim or quotation must be sourced; `url` makes it a link in the UI. Replaces the old `passage_ref` / `expanded_link`.
- **`actions`** — optional inputs the card collects (v1 renders `type: 'text'` only; other types are schema/plumbing). Use `difficulties` to scope an action to specific card difficulties; omit it for all difficulties.
- **`agnostic_interpretation`** (spiritual only) — the same insight rendered without the religious frame. Every spiritual card must work for both a tradition-rooted user and a secular one.

## The three domains

| Domain | Colour | Sub-categories (current) |
|---|---|---|
| physical | `#8B6F5E` terracotta | upper_body, lower_body, full_body, flexibility/mobility, cardio, meditation, fasting, dietary |
| mental | `#5E7A8B` slate blue | reading, writing, focus/discipline, anxiety, creativity, sharing/social |
| spiritual | `#7A6B8B` muted violet | by tradition: Christianity, Stoicism, Buddhism, Islam, Hinduism, Taoism, Judaism, Sikhism, agnostic |

**Coverage balance target:** each domain holds 30 cards. Sub-category distribution should be roughly even — no single sub-category dominates. Before adding a card, check whether its sub-category is already over-represented.

## Intensity calibration

The three intensities are not arbitrary — they map to time + depth. Use both dials.

| Level | Time | Depth |
|---|---|---|
| **low** | ≤ 5 min | minimal effort, accessible from any starting point, no equipment/skill required |
| **medium** | 10–20 min | focused, intentional; requires commitment but not expertise |
| **high** | 20–30+ min (or 15+ min contemplative) | pushes the edge of current capacity; the user should finish feeling they worked |

Calibration test: a beginner should be able to complete `low` without preparation. `high` should be genuinely demanding for someone who has practised for a month. If `low` and `medium` feel indistinguishable, the card is mis-calibrated.

### Worked example (physical, `phys-001` push-ups)

```
low:    'Do 10 push-ups at your own pace. Rest when needed.'
medium: 'Complete 3 sets of 15 push-ups with 60 seconds rest between sets.'
high:   'Complete 5 sets of 20 push-ups with a 30-second plank between each set.'
```

Time scales (seconds → minutes), reps scale (10 → 45 → 100+), and a new element enters at high (the plank). All three are unmistakably the *same practice* at different doses.

## Intensity vs difficulty vs volume

These three words are easy to conflate. They mean different things:

| Term | What it is | Where it lives |
|---|---|---|
| **`intensity_*` texts** | Three authored doses of one practice (the calibration table above). | on each card |
| **`difficulty`** | A card's *intrinsic* level (`low` / `medium` / `high`). Picks which `intensity_*` text renders and weights the daily deal. One per card, fixed. | on each card |
| **daily volume** | How many cards the user draws per day. The user-facing "intensity" selector: **Light = 3, Medium = 6, High = 9**. | on the profile (`currentIntensity`), mapped via `INTENSITY_VOLUME` |

The dealing engine (`packages/cards/src/deck.ts`) splits the day's volume evenly across the three domains, then draws each slot's difficulty from `planDifficulties`. Difficulty is biased by volume — a High (9-card) day guarantees 2–3 high-difficulty cards; a Medium (6-card) day guarantees 1; a Light (3-card) day guarantees none but high cards remain rare-but-possible.

**Authoring implication:** because `difficulty` selects which text shows, only one of the three `intensity_*` texts renders for a given card. Author all three anyway (the palette is retained) — but make sure the text at the card's pinned `difficulty` is the one you want users to see.

## Authoring process

1. **Pick the domain and sub-category.** Check the existing distribution in that file — favour under-represented sub-categories.
2. **Draft the practice in one line.** What does the user actually *do*? If you can't say it in one line, the card is two cards.
3. **Write the three intensities.** Apply the calibration table above. Read them aloud in sequence — each should feel like a clear step up.
4. **Write the context.** One sentence on why this matters. No filler.
5. **Add tags.** Reuse existing tags where possible. 2–5 tags is the right range.
6. **If spiritual:** choose the tradition, cite the passage under `sources` (`{ citation, url?, kind? }`), write the `agnostic_interpretation`. Consider a `cross_tradition_pair` if a parallel exists in another tradition.
7. **Validate** (see below).
8. **Regenerate the physical deck** — `pnpm --filter @doodat/physical gen` — so the printable Markdown picks up the change.

## Spiritual-tradition handling

Spiritual cards are the most editorially sensitive part of the deck. Rules:

- **Every spiritual card has an `agnostic_interpretation`.** No exceptions. The card must land for a user who does not share the tradition.
- **Cite the source honestly.** Every spiritual card that references a text carries a `sources` entry; `citation` must point to a real passage. Do not paraphrase as if quoting. Give a `url` where the reader can verify it.
- **Cross-tradition pairs are optional but encouraged.** If two traditions teach the same insight (e.g. Christian "do not be anxious" ↔ Buddhist mindfulness of anxiety), link them via `cross_tradition_pair` referencing the paired card's ID. The pair must be mutual (both cards reference each other).
- **Respect, don't syncretise.** Present each tradition on its own terms in the intensity text; the `agnostic_interpretation` is where the shared human insight is drawn out — not where the traditions are blurred together.
- **Agnostic cards stand alone.** Cards with `tradition: 'agnostic'` carry no `sources`; their `context` carries the weight.

## Validation

Every card must pass before it lands:

1. **Schema test** (Vitest, in `packages/cards`): the card object matches `ContentCard`, `id` matches the domain prefix and is zero-padded, `tags` is non-empty, intensities are non-empty strings.
2. **Uniqueness test:** no duplicate `id` across the whole deck; no duplicate `id` within a file.
3. **Pair-mutuality test:** if `cross_tradition_pair` is set, the referenced card must exist and must point back.
4. **Coverage check:** after adding, domain totals still balance (target 30 each during v1; flag if any sub-category exceeds ~40% of its domain).

The review checklist (manual, before commit):

- [ ] The practice is one thing, not two.
- [ ] All three intensities are the same practice at different doses.
- [ ] `difficulty` is set and the text at that level is the one users should see.
- [ ] `low` is achievable by a beginner with no prep.
- [ ] `high` is genuinely demanding.
- [ ] `context` explains *why*, not *how*.
- [ ] Tags reuse existing vocabulary.
- [ ] Any claim, quotation, or referenced material has a `sources` entry (with `url` where possible).
- [ ] (Spiritual) `agnostic_interpretation` present and honest.
- [ ] (Spiritual) `sources[0].citation` is a real citation.

## Editing existing cards

Changing a card's content is a behaviour change. Do it deliberately:

- **Wording polish** (typos, clarity): ship directly.
- **Re-calibrating intensities** (making `high` harder, `low` easier): ship, but note it in the commit message — users in flight may notice the shift.
- **Changing the practice itself** (push-ups → pull-ups): do not edit in place. Retire the old card and add a new one with a new ID. The old ID stays in history; dealing logic must respect retirement so it stops surfacing retired cards.
