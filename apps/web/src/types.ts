// App-level types for @doodat/web. Card-domain types come from @doodat/cards;
// these are the state/event types that live in the app's RxJS layer.
import type {
  ContentCard,
  IntensityLevel,
  SwipeDirection,
  UserPreferences,
  CardOutcome,
} from '@doodat/cards';

// ─── Profile + daily state (local-only MVP; no Nostr/identity) ────────────────

export interface UserProfile {
  localId: string; // random persistent id — seeds the daily deal (replaces pubkey)
  currentIntensity: IntensityLevel;
  intensitySetAt: number; // timestamp; ISO-week boundary drives re-selection
  preferences?: UserPreferences;
  onboardingComplete: boolean;
}

export interface DailyState {
  date: string; // YYYY-MM-DD
  outcomes: CardOutcome[];
  accountabilityShown: boolean; // suppresses re-trigger (US-005)
}

export interface StreakState {
  count: number;
  lastCompletedDate: string | null; // YYYY-MM-DD of last day with ≥1 completion
  /** Snapshot of count at the start of today — enables revert on update-in-place. */
  dayStartCount: number;
  /** Snapshot of lastCompletedDate at the start of today. */
  dayStartLastCompletedDate: string | null;
}

// ─── Deck composition ─────────────────────────────────────────────────────────

export type SystemCardType =
  | 'welcome'
  | 'wizard_physical'
  | 'wizard_mental'
  | 'wizard_spiritual'
  | 'wizard_intensity'
  | 'intensity_select' // weekly re-commit
  | 'accountability'
  | 'completion';

export interface SystemCard {
  id: string;
  type: SystemCardType;
}

export type DeckCard = ContentCard | SystemCard;

// ─── App state ────────────────────────────────────────────────────────────────

export interface AppState {
  profile: UserProfile;
  daily: DailyState;
  recentCardIds: string[];
  streak: StreakState;
  deck: DeckCard[];
  currentIndex: number;
}

// ─── Intents (emitted by UI, processed by the reducer) ────────────────────────

export type Intent =
  | { type: 'SET_PREFERENCES'; preferences: Partial<UserPreferences> }
  | { type: 'SET_INTENSITY'; intensity: IntensityLevel }
  | { type: 'SWIPE'; card: ContentCard; direction: SwipeDirection; actionResponses?: Record<string, string> }
  | { type: 'ADVANCE' } // move to next card (system cards)
  | { type: 'NAVIGATE'; index: number } // jump to a specific deck position (free navigation)
  | { type: 'DISMISS_ACCOUNTABILITY' }
  | { type: 'DAILY_RESET'; date: string };

export function isContentCard(card: DeckCard): card is ContentCard {
  return card.type === 'content';
}

export function isSystemCard(card: DeckCard): card is SystemCard {
  return card.type !== 'content';
}
