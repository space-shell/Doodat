import {
  dealDailyCards,
  todayString,
  dailyVolume,
} from '@doodat/cards';
import type { CardOutcome, ContentCard } from '@doodat/cards';
import type { AppState, Intent, UserProfile, StreakState, DeckCard } from '../types';
import type { UserPreferences } from '@doodat/cards';
import { isContentCard } from '../types';

// ─── Date helpers (pure) ──────────────────────────────────────────────────────

/** Returns the previous calendar day as YYYY-MM-DD. */
export function dayBefore(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Deck builders ────────────────────────────────────────────────────────────

function buildOnboardingDeck(): DeckCard[] {
  return [
    { id: 'sys-welcome', type: 'welcome' },
    { id: 'sys-wizard-intensity', type: 'wizard_intensity' },
  ];
}

/** True when intensity was not set today (new day → daily check-in). */
function needsDailyIntensity(profile: UserProfile, today: string): boolean {
  if (!profile.intensitySetAt) return true;
  return new Date(profile.intensitySetAt).toISOString().slice(0, 10) !== today;
}

export function buildDailyDeck(profile: UserProfile, today: string, recentCardIds: string[]): DeckCard[] {
  const volume = dailyVolume(profile.currentIntensity, today, profile.localId);
  const content = dealDailyCards({
    date: today,
    pubkey: profile.localId,
    intensity: profile.currentIntensity,
    volume,
    preferences: profile.preferences,
    recentCardIds,
  });
  const cards: DeckCard[] = [];
  if (needsDailyIntensity(profile, today)) {
    cards.push({ id: 'sys-intensity-' + today, type: 'intensity_select' });
  }
  cards.push(...content);
  cards.push({ id: 'sys-completion-' + today, type: 'completion' });
  return cards;
}

// ─── Streak (recomputed from outcomes + day-start snapshot) ───────────────────

const ZERO_STREAK: StreakState = {
  count: 0,
  lastCompletedDate: null,
  dayStartCount: 0,
  dayStartLastCompletedDate: null,
};

/**
 * Recompute the streak from today's outcomes plus the day-start snapshot.
 * Because outcomes can be updated in place (free navigation), the streak must
 * be derivable, not incremental. `dayStart*` fields are frozen at daily reset.
 */
function recomputeStreak(streak: StreakState, outcomes: CardOutcome[], today: string): StreakState {
  const hasCompleteToday = outcomes.some((o) => o.swipeDirection === 'complete');
  if (hasCompleteToday) {
    if (streak.dayStartLastCompletedDate === dayBefore(today)) {
      return { ...streak, count: streak.dayStartCount + 1, lastCompletedDate: today };
    }
    return { ...streak, count: 1, lastCompletedDate: today };
  }
  return { ...streak, count: streak.dayStartCount, lastCompletedDate: streak.dayStartLastCompletedDate };
}

// ─── Navigation helpers ───────────────────────────────────────────────────────

/**
 * Find the next unresolved content card, scanning forward from `fromIndex`
 * then wrapping. Falls back to the completion card if all are resolved.
 */
export function nextUnresolvedIndex(deck: DeckCard[], outcomes: CardOutcome[], fromIndex: number): number {
  const resolved = new Set(outcomes.map((o) => o.cardId));
  for (let i = fromIndex; i < deck.length; i++) {
    if (isContentCard(deck[i]) && !resolved.has(deck[i].id)) return i;
  }
  for (let i = 0; i < fromIndex; i++) {
    if (isContentCard(deck[i]) && !resolved.has(deck[i].id)) return i;
  }
  const completion = deck.findIndex((c) => c.type === 'completion');
  return completion !== -1 ? completion : deck.length - 1;
}

// ─── Initial state ────────────────────────────────────────────────────────────

export function initialState(profile: UserProfile, today: string = todayString()): AppState {
  const deck = profile.onboardingComplete
    ? buildDailyDeck(profile, today, [])
    : buildOnboardingDeck();
  return {
    profile,
    daily: { date: today, outcomes: [] },
    recentCardIds: [],
    streak: { ...ZERO_STREAK },
    deck,
    currentIndex: 0,
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

export function reduce(state: AppState, intent: Intent): AppState {
  switch (intent.type) {
    case 'SET_PREFERENCES':
      return {
        ...state,
        profile: {
          ...state.profile,
          preferences: { ...(state.profile.preferences ?? ({} as UserPreferences)), ...intent.preferences },
        },
      };

    case 'SET_INTENSITY':
      return handleSetIntensity(state, intent.intensity);

    case 'SWIPE':
      return handleSwipe(state, intent.card, intent.actionResponses);

    case 'ADVANCE':
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, state.deck.length - 1),
      };

    case 'NAVIGATE':
      return {
        ...state,
        currentIndex: Math.max(0, Math.min(intent.index, state.deck.length - 1)),
      };

    case 'DAILY_RESET':
      return handleDailyReset(state, intent.date);

    case 'RESET_DAY_TO_WIZARD':
      return handleResetDayToWizard(state);

    default:
      return state;
  }
}

function handleSetIntensity(state: AppState, intensity: AppState['profile']['currentIntensity']): AppState {
  const profile: UserProfile = {
    ...state.profile,
    currentIntensity: intensity,
    intensitySetAt: Date.now(),
    onboardingComplete: true,
  };
  const deck = buildDailyDeck(profile, state.daily.date, state.recentCardIds);
  return { ...state, profile, deck, currentIndex: 0 };
}

function handleSwipe(
  state: AppState,
  card: ContentCard,
  actionResponses?: Record<string, string>,
): AppState {
  const current = state.deck[state.currentIndex];
  if (!current || !isContentCard(current)) return state;

  const now = Date.now();
  const hasResponses = actionResponses && Object.keys(actionResponses).length > 0;
  const outcome: CardOutcome = {
    cardId: card.id,
    domain: card.domain,
    swipeDirection: 'complete',
    intensity: state.profile.currentIntensity,
    difficulty: card.difficulty,
    ...(hasResponses ? { actionResponses } : {}),
    timestamp: now,
  };

  // Update-in-place: replace existing outcome for this card, or append.
  const existingIdx = state.daily.outcomes.findIndex((o) => o.cardId === card.id);
  const outcomes =
    existingIdx >= 0
      ? state.daily.outcomes.map((o, i) => (i === existingIdx ? outcome : o))
      : [...state.daily.outcomes, outcome];

  const recentCardIds =
    existingIdx >= 0
      ? state.recentCardIds // already tracked — don't duplicate
      : [...state.recentCardIds, card.id].slice(-63);

  const streak = recomputeStreak(state.streak, outcomes, state.daily.date);

  const daily = { ...state.daily, outcomes };

  // Navigate to the next unresolved content card (or completion if all done).
  const nextIndex = nextUnresolvedIndex(state.deck, outcomes, state.currentIndex + 1);
  return { ...state, daily, recentCardIds, streak, deck: state.deck, currentIndex: nextIndex };
}

function handleDailyReset(state: AppState, date: string): AppState {
  if (state.daily.date === date) return state;

  const yesterday = dayBefore(date);
  const wasYesterdayCompleted = state.streak.lastCompletedDate === yesterday;
  const dayStartCount = wasYesterdayCompleted ? state.streak.count : 0;
  const dayStartLastCompletedDate = wasYesterdayCompleted ? yesterday : state.streak.lastCompletedDate;

  const deck = state.profile.onboardingComplete
    ? buildDailyDeck(state.profile, date, state.recentCardIds)
    : buildOnboardingDeck();

  return {
    ...state,
    daily: { date, outcomes: [] },
    streak: {
      count: dayStartCount,
      lastCompletedDate: dayStartLastCompletedDate,
      dayStartCount,
      dayStartLastCompletedDate,
    },
    deck,
    currentIndex: 0,
  };
}

function handleResetDayToWizard(state: AppState): AppState {
  return {
    ...state,
    daily: { ...state.daily, outcomes: [] },
    deck: buildOnboardingDeck(),
    currentIndex: 0,
  };
}
