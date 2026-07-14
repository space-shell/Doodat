// ─── Card domain types ───────────────────────────────────────────────────────
// Pure, framework-agnostic. Shared by every surface (digital app, printable
// generator). See docs/CARD_DESIGN.md for the card anatomy and authoring workflow.

export type Domain = 'physical' | 'mental' | 'spiritual';

export type IntensityLevel = 'low' | 'medium' | 'high';

export type SwipeDirection = 'complete' | 'skip';

/**
 * A single practice card. The three intensity fields hold the actionable
 * instruction at each dose; `difficulty` decides WHICH dose renders (and drives
 * the dealing distribution). `context` explains why. `sources` cites material;
 * `actions` declares any input the card collects (e.g. a journal text field).
 * Spiritual cards add tradition-specific fields. See docs/CARD_DESIGN.md.
 */
export interface ContentCard {
  id: string;                  // 'phys-001' — stable, zero-padded, never reused
  type: 'content';
  domain: Domain;
  category: string;            // sub-category, e.g. 'upper_body', 'reflection'
  difficulty: IntensityLevel;  // intrinsic; selects which intensity_* text renders
  intensity_low: string;       // imperative action at low intensity
  intensity_medium: string;    // imperative action at medium intensity
  intensity_high: string;      // imperative action at high intensity
  context?: string;            // the "why" — one sentence
  tags: string[];              // lowercase, reused vocabulary; drive weighting + de-dup
  created_at: number;          // unix seconds
  sources?: CardSource[];      // citations / references for the card's material
  actions?: CardAction[];      // inputs the card collects (journaling, etc.)

  // Spiritual-only:
  tradition?: string;                   // 'Christianity', 'Stoicism', …
  agnostic_interpretation?: string;     // secular framing of the same insight
  cross_tradition_pair?: string;        // id of a paired card from another tradition
}

/** A citation or reference backing a card's material (esp. religious text). */
export interface CardSource {
  citation: string;                        // 'Philippians 4:6-7' | 'Atomic Habits, p.42'
  url?: string;                            // optional link to the source
  kind?: 'scripture' | 'book' | 'article' | 'paper' | 'web';
}

/** Input a card collects from the user. v1 renders only `type: 'text'`. */
export interface CardAction {
  id: string;                  // stable per-card, e.g. 'spir-001:journal'
  type: ActionType;
  prompt?: string;             // helper text above the input
  required?: boolean;          // default false; if true, blocks marking Done
  difficulties?: IntensityLevel[];  // when set, activates only at these card difficulties
  options?: string[];          // 'checklist' choices
  scaleMin?: number;           // 'scale' lower bound
  scaleMax?: number;           // 'scale' upper bound
}

export type ActionType = 'text' | 'checklist' | 'scale' | 'timer' | 'none';

// ─── Onboarding preferences (drive card weighting) ───────────────────────────

export interface PhysicalPreferences {
  focusAreas: ('upper_body' | 'lower_body' | 'full_body' | 'flexibility' | 'cardio')[];
  fastingInterest: boolean;
  dietaryPreferences: string[];
}

export interface MentalPreferences {
  challenges: ('focus' | 'anxiety' | 'creativity' | 'discipline')[];
  readingPreferences: string[];
  writingComfort: boolean;
}

export interface SpiritualPreferences {
  // 0 = secular, 100 = tradition-specific
  traditionProximity: number;
  traditions: string[];
}

export interface UserPreferences {
  physical: PhysicalPreferences;
  mental: MentalPreferences;
  spiritual: SpiritualPreferences;
}

// ─── Daily outcomes (input to accountability) ─────────────────────────────────

export interface CardOutcome {
  cardId: string;
  domain: Domain;
  swipeDirection: SwipeDirection;
  intensity: IntensityLevel;   // the day's volume level (low=3 / medium=6 / high=9 cards)
  difficulty: IntensityLevel;  // the dealt card's intrinsic difficulty
  actionResponses?: Record<string, string>; // keyed by CardAction.id
  timestamp: number;
}
