import {
  dealDailyCards,
  shouldTriggerAccountability,
  todayString,
  weekString,
  INTENSITY_VOLUME,
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
    { id: 'sys-wizard-physical', type: 'wizard_physical' },
    { id: 'sys-wizard-mental', type: 'wizard_mental' },
    { id: 'sys-wizard-spiritual', type: 'wizard_spiritual' },
    { id: 'sys-wizard-intensity', type: 'wizard_intensity' },
  ];
}

/** True when the ISO week of intensitySetAt differs from the week of `today`. */
function needsWeeklyIntensity(profile: UserProfile, today: string): boolean {
  if (!profile.intensitySetAt) return true;
  return weekString(new Date(profile.intensitySetAt)) !== weekString(new Date(today));
}

export function buildDailyDeck(profile: UserProfile, today: string, recentCardIds: string[]): DeckCard[] {
  const content = dealDailyCards({
    date: today,
    pubkey: profile.localId,
    volume: INTENSITY_VOLUME[profile.currentIntensity],
    preferences: profile.preferences,
    recentCardIds,
  });
  const cards: DeckCard[] = [];
  if (needsWeeklyIntensity(profile, today)) {
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
    daily: { date: today, outcomes: [], accountabilityShown: false },
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
      return handleSwipe(state, intent.card, intent.direction);

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

    case 'DISMISS_ACCOUNTABILITY':
      return handleDismissAccountability(state);

    case 'DAILY_RESET':
      return handleDailyReset(state, intent.date);

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
  direction: 'complete' | 'skip',
): AppState {
  const current = state.deck[state.currentIndex];
  if (!current || !isContentCard(current)) return state;

  const now = Date.now();
  const outcome: CardOutcome = {
    cardId: card.id,
    domain: card.domain,
    swipeDirection: direction,
    intensity: state.profile.currentIntensity,
    difficulty: card.difficulty,
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
  let deck = state.deck;

  // Accountability injection (US-005): on the 3rd skip, splice a prompt card.
  const hasAccCard = deck.some((c) => c.type === 'accountability');
  if (shouldTriggerAccountability(outcomes, daily.accountabilityShown) && !hasAccCard) {
    const insertAt = state.currentIndex + 1;
    const accountabilityCard: DeckCard = { id: 'sys-accountability-' + now, type: 'accountability' };
    deck = [...deck.slice(0, insertAt), accountabilityCard, ...deck.slice(insertAt)];
    return { ...state, daily, recentCardIds, streak, deck, currentIndex: insertAt };
  }

  // Navigate to the next unresolved content card (or completion if all done).
  const nextIndex = nextUnresolvedIndex(deck, outcomes, state.currentIndex + 1);
  return { ...state, daily, recentCardIds, streak, deck, currentIndex: nextIndex };
}

function handleDismissAccountability(state: AppState): AppState {
  const daily = { ...state.daily, accountabilityShown: true };
  const nextIndex = nextUnresolvedIndex(state.deck, state.daily.outcomes, 0);
  return { ...state, daily, currentIndex: nextIndex };
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
    daily: { date, outcomes: [], accountabilityShown: false },
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
