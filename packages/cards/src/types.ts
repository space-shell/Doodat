// ─── Card domain types ───────────────────────────────────────────────────────
// Pure, framework-agnostic. Shared by every surface (digital app, printable
// generator). See docs/CARD_DESIGN.md for the card anatomy and authoring workflow.

export type Domain = 'physical' | 'mental' | 'spiritual';

export type IntensityLevel = 'low' | 'medium' | 'high';

export type SwipeDirection = 'complete' | 'skip';

/**
 * A single practice card. The three intensity fields hold the actionable
 * instruction at each dose; `context` explains why. Spiritual cards add
 * tradition-specific fields. See docs/CARD_DESIGN.md.
 */
export interface ContentCard {
  id: string;                  // 'phys-001' — stable, zero-padded, never reused
  type: 'content';
  domain: Domain;
  category: string;            // sub-category, e.g. 'upper_body', 'reflection'
  intensity_low: string;       // imperative action at low intensity
  intensity_medium: string;    // imperative action at medium intensity
  intensity_high: string;      // imperative action at high intensity
  context?: string;            // the "why" — one sentence
  tags: string[];              // lowercase, reused vocabulary; drive weighting + de-dup
  created_at: number;          // unix seconds

  // Spiritual-only:
  tradition?: string;                   // 'Christianity', 'Stoicism', …
  passage_ref?: string;                 // citation, e.g. 'Philippians 4:6-7'
  agnostic_interpretation?: string;     // secular framing of the same insight
  cross_tradition_pair?: string;        // id of a paired card from another tradition
  expanded_link?: string;               // optional external URL for deeper reading
}

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
  intensity: IntensityLevel;
  timestamp: number;
}
