import { createStore, reconcile } from 'solid-js/store';
import { createEffect } from 'solid-js';
import { state$ } from '../streams/stateMachine';
import { initialState, buildDailyDeck } from '../streams/reducer';
import { todayString } from '@doodat/cards';
import type { AppState, UserProfile, DailyState, StreakState } from '../types';

// ─── Persistence keys ─────────────────────────────────────────────────────────

const KEYS = {
  PROFILE: 'dodaat_profile',
  DAILY: 'dodaat_daily',
  RECENT: 'dodaat_recent',
  STREAK: 'dodaat_streak',
} as const;

const read = <T>(key: string): T | null => {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
};
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

// ─── Profile bootstrap ────────────────────────────────────────────────────────

function randomLocalId(): string {
  // A stable per-user id for deck seeding. Not a secret — just a unique seed.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function freshProfile(): UserProfile {
  return {
    localId: randomLocalId(),
    currentIntensity: 'medium',
    intensitySetAt: 0,
    onboardingComplete: false,
  };
}

// ─── Seed (load persisted state, or start fresh) ──────────────────────────────

function loadSeed(): AppState {
  const persistedProfile = read<UserProfile>(KEYS.PROFILE);

  // First launch: no profile → onboarding.
  if (!persistedProfile) {
    return initialState(freshProfile());
  }

  const today = todayString();
  const persistedDaily = read<DailyState>(KEYS.DAILY);
  const recentCardIds = read<string[]>(KEYS.RECENT) ?? [];
  const streak = read<StreakState>(KEYS.STREAK) ?? { count: 0, lastCompletedDate: null };

  const profile = persistedProfile;

  // New day since last run → reset daily state + rebuild deck from today.
  if (!persistedDaily || persistedDaily.date !== today) {
    return {
      profile,
      daily: { date: today, outcomes: [], accountabilityShown: false },
      recentCardIds,
      streak,
      deck: buildDailyDeck(profile, today, recentCardIds),
      currentIndex: 0,
    };
  }

  // Same day → resume from the number of outcomes already recorded.
  return {
    profile,
    daily: persistedDaily,
    recentCardIds,
    streak,
    deck: buildDailyDeck(profile, today, recentCardIds),
    currentIndex: persistedDaily.outcomes.length,
  };
}

// ─── The store ────────────────────────────────────────────────────────────────

const seed = loadSeed();
const [state, setState] = createStore<AppState>(seed);

// Bridge the RxJS state stream → Solid store (fine-grained via reconcile).
state$(seed).subscribe((next) => setState(reconcile(next)));

// Persist slices whenever they change.
createEffect(() => write(KEYS.PROFILE, state.profile));
createEffect(() => write(KEYS.DAILY, state.daily));
createEffect(() => write(KEYS.RECENT, state.recentCardIds));
createEffect(() => write(KEYS.STREAK, state.streak));

/** Reset all persisted state (used by a future "reset" action / dev tooling). */
export function resetAll(): void {
  for (const k of Object.values(KEYS)) localStorage.removeItem(k);
  setState(reconcile(initialState(freshProfile())));
}

// Dev hook (mirrors the legacy __dodaatStore convention; single-o spelling).
if (import.meta.env.DEV) {
  (window as unknown as { __dodaatStore: unknown }).__dodaatStore = state;
}

export { state };
export type { AppState };
