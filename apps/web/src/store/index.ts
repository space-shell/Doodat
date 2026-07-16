import { createStore, reconcile } from 'solid-js/store';
import { createEffect } from 'solid-js';
import { state$ } from '../streams/stateMachine';
import { wireNostrEffects } from '../streams/nostrEffects';
import { initialState, buildDailyDeck, nextUnresolvedIndex } from '../streams/reducer';
import { todayString } from '@doodat/cards';
import { FLAGS } from '../config/flags';
import { loadKeyPair } from '../nostr/keys';
import type { AppState, UserProfile, DailyState, StreakState, BootPhase } from '../types';

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
  // Under the NOSTR_IDENTITY flag, the pubkey becomes the deterministic deck
  // seed (so every device deals identically) and boot blocks on a Nostr fetch.
  const key = FLAGS.NOSTR_IDENTITY ? loadKeyPair() : null;

  const persistedProfile = read<UserProfile>(KEYS.PROFILE);

  // First launch: no profile → onboarding.
  if (!persistedProfile) {
    return initialState(freshProfile());
  }

  const today = todayString();
  const persistedDaily = read<DailyState>(KEYS.DAILY);
  const recentCardIds = read<string[]>(KEYS.RECENT) ?? [];
  const rawStreak = read<Partial<StreakState>>(KEYS.STREAK);
  const streak: StreakState = {
    count: rawStreak?.count ?? 0,
    lastCompletedDate: rawStreak?.lastCompletedDate ?? null,
    dayStartCount: rawStreak?.dayStartCount ?? rawStreak?.count ?? 0,
    dayStartLastCompletedDate: rawStreak?.dayStartLastCompletedDate ?? rawStreak?.lastCompletedDate ?? null,
  };

  // When a key exists, it is the deck seed; boot blocks on a fetch once onboarded.
  const profile = key ? { ...persistedProfile, localId: key.pk } : persistedProfile;
  const bootPhase: BootPhase | undefined =
    key && profile.onboardingComplete ? 'loading' : undefined;

  // New day since last run → reset daily state + rebuild deck from today.
  if (!persistedDaily || persistedDaily.date !== today) {
    return {
      profile,
      daily: { date: today, outcomes: [] },
      recentCardIds,
      streak,
      deck: buildDailyDeck(profile, today, recentCardIds),
      currentIndex: 0,
      bootPhase,
    };
  }

  // Same day → resume at the first unresolved content card (free navigation).
  const deck = buildDailyDeck(profile, today, recentCardIds);
  return {
    profile,
    daily: persistedDaily,
    recentCardIds,
    streak,
    deck,
    currentIndex: nextUnresolvedIndex(deck, persistedDaily.outcomes, 0),
    bootPhase,
  };
}

// ─── The store ────────────────────────────────────────────────────────────────

const seed = loadSeed();
const [state, setState] = createStore<AppState>(seed);

// Single state stream; bridge to Solid, and run Nostr side-effects (inert when
// the flag is off / no key).
const stateStream = state$(seed);
stateStream.subscribe((next) => setState(reconcile(next)));
wireNostrEffects(stateStream, seed);

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
