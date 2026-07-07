import {
  dealDailyCards,
  shouldTriggerAccountability,
  todayString,
  weekString,
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
    intensity: profile.currentIntensity,
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

// ─── Streak ───────────────────────────────────────────────────────────────────

/** Update the streak on a completion, keyed by the current daily date. */
function updateStreakOnCompletion(streak: StreakState, today: string): StreakState {
  if (streak.lastCompletedDate === today) return streak;
  if (streak.lastCompletedDate === dayBefore(today)) {
    return { count: streak.count + 1, lastCompletedDate: today };
  }
  return { count: 1, lastCompletedDate: today };
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
    streak: { count: 0, lastCompletedDate: null },
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

    case 'DISMISS_ACCOUNTABILITY':
      return {
        ...state,
        daily: { ...state.daily, accountabilityShown: true },
        currentIndex: state.currentIndex + 1,
      };

    case 'DAILY_RESET':
      return handleDailyReset(state, intent.date);

    default:
      return state;
  }
}

function handleSetIntensity(state: AppState, intensity: AppState['profile']['currentIntensity']): AppState {
  // Setting intensity always (re)builds the daily deck without an intensity_select
  // card (intensitySetAt is now in the current week). For onboarding this also
  // marks onboardingComplete. Dealt content cards are intensity-independent, so
  // a weekly re-commit doesn't change which cards were dealt — only their dose.
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
  // Only content cards are swipeable; ignore swipes on system cards or off the end.
  if (!current || !isContentCard(current)) return state;

  const now = Date.now();
  const outcome: CardOutcome = {
    cardId: card.id,
    domain: card.domain,
    swipeDirection: direction,
    intensity: state.profile.currentIntensity,
    timestamp: now,
  };
  const outcomes = [...state.daily.outcomes, outcome];
  const recentCardIds = [...state.recentCardIds, card.id].slice(-63);
  const streak =
    direction === 'complete'
      ? updateStreakOnCompletion(state.streak, state.daily.date)
      : state.streak;

  const daily = { ...state.daily, outcomes };
  const nextIndex = state.currentIndex + 1;

  // Accountability injection (US-005): on the 3rd skip, splice a prompt card in.
  let deck = state.deck;
  if (shouldTriggerAccountability(outcomes, daily.accountabilityShown) && nextIndex < deck.length) {
    const accountabilityCard: DeckCard = { id: 'sys-accountability-' + now, type: 'accountability' };
    deck = [...deck.slice(0, nextIndex), accountabilityCard, ...deck.slice(nextIndex)];
  }

  return { ...state, daily, recentCardIds, streak, deck, currentIndex: nextIndex };
}

function handleDailyReset(state: AppState, date: string): AppState {
  if (state.daily.date === date) return state;
  const deck = state.profile.onboardingComplete
    ? buildDailyDeck(state.profile, date, state.recentCardIds)
    : buildOnboardingDeck();
  return {
    ...state,
    daily: { date, outcomes: [], accountabilityShown: false },
    deck,
    currentIndex: 0,
  };
}
