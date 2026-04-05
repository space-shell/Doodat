import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dealDailyCards, todayString, weekString } from '../utils/deck';
import type {
  ContentCard,
  GoldCard,
  SystemCard,
  DeckCard,
  UserProfile,
  DailyState,
  CardOutcome,
  SwipeDirection,
  IntensityLevel,
  UserPreferences,
  NostrKeypair,
} from '../types';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  USER_PROFILE: 'dodaat_user_profile',
  DAILY_STATE: 'dodaat_daily_state',
  RECENT_CARD_IDS: 'dodaat_recent_card_ids',
  GOLD_CARD: 'dodaat_gold_card',
} as const;

// ─── Store State ──────────────────────────────────────────────────────────────

interface DoodaatState {
  // Identity
  keypair: NostrKeypair | null;
  setKeypair: (kp: NostrKeypair) => void;

  // User profile
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (partial: Partial<UserProfile>) => Promise<void>;

  // Onboarding
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: (preferences: UserPreferences, intensity: IntensityLevel) => Promise<void>;

  // Deck
  deck: DeckCard[];
  currentIndex: number;
  goldCard: GoldCard | null;

  // Daily state
  dailyState: DailyState | null;

  // Initialization
  initialized: boolean;
  initializeApp: (keypair: NostrKeypair) => Promise<void>;

  // Card actions
  swipeCard: (direction: SwipeDirection) => Promise<void>;
  injectSystemCard: (card: SystemCard, atIndex?: number) => void;
  setGoldCard: (card: GoldCard | null) => Promise<void>;
  respondToGoldCard: () => Promise<void>;

  // Intensity
  setWeeklyIntensity: (intensity: IntensityLevel) => Promise<void>;
  needsIntensitySelection: () => boolean;

  // Review
  getWeeklyStats: () => { completed: number; skipped: number; breakdown: Record<string, number> };
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useDoodaatStore = create<DoodaatState>((set, get) => ({
  keypair: null,
  profile: null,
  onboardingStep: 0,
  deck: [],
  currentIndex: 0,
  goldCard: null,
  dailyState: null,
  initialized: false,

  setKeypair: (keypair) => set({ keypair }),

  setProfile: async (profile) => {
    set({ profile });
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  updateProfile: async (partial) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...partial };
    set({ profile: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
  },

  setOnboardingStep: (step) => set({ onboardingStep: step }),

  completeOnboarding: async (preferences, intensity) => {
    const { profile, updateProfile, initializeApp, keypair } = get();
    if (!keypair) return;

    await updateProfile({
      preferences,
      currentIntensity: intensity,
      intensitySetAt: Date.now(),
      onboardingComplete: true,
    });

    // Build the initial deck after onboarding
    await initializeApp(keypair);
  },

  initializeApp: async (keypair) => {
    const profileJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const dailyJson = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_STATE);
    const recentJson = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_CARD_IDS);
    const goldJson = await AsyncStorage.getItem(STORAGE_KEYS.GOLD_CARD);

    let profile: UserProfile | null = profileJson ? JSON.parse(profileJson) : null;
    const today = todayString();

    // Bootstrap profile if first launch
    if (!profile) {
      profile = {
        pubkey: keypair.publicKey,
        praisePoints: 0,
        prestigeBadges: [],
        currentIntensity: 'medium',
        intensitySetAt: 0,
        onboardingComplete: false,
        notificationTime: 'morning',
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    }

    let dailyState: DailyState | null = dailyJson ? JSON.parse(dailyJson) : null;

    // Reset daily state if it's a new day
    if (!dailyState || dailyState.date !== today) {
      dailyState = {
        date: today,
        outcomes: [],
        voiceNoteSubmitted: false,
        goldCardResponded: false,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_STATE, JSON.stringify(dailyState));
    }

    const recentIds: string[] = recentJson ? JSON.parse(recentJson) : [];
    const goldCard: GoldCard | null = goldJson ? JSON.parse(goldJson) : null;

    // Build deck
    let deck: DeckCard[] = [];

    if (!profile.onboardingComplete) {
      // Inject onboarding wizard cards
      deck = buildOnboardingDeck();
    } else {
      // Check if weekly intensity selection is needed.
      // Use local profile variable — store's profile is still null at this point.
      const needsIntensity =
        !profile.intensitySetAt ||
        weekString(new Date(profile.intensitySetAt)) !== weekString();

      deck = await buildDailyDeck(profile, today, recentIds, dailyState);

      if (needsIntensity) {
        // Inject intensity selector at top
        const intensityCard: SystemCard = {
          id: 'sys-intensity-' + weekString(),
          type: 'system_intensity',
        };
        deck = [intensityCard, ...deck];
      }
    }

    set({ keypair, profile, dailyState, deck, goldCard, currentIndex: 0, initialized: true });
  },

  swipeCard: async (direction) => {
    const { deck, currentIndex, dailyState, profile } = get();
    const card = deck[currentIndex];
    if (!card || card.type === 'gold') return;

    const now = Date.now();

    // Record outcome for content cards
    if (card.type === 'content') {
      const outcome: CardOutcome = {
        cardId: card.id,
        domain: card.domain,
        swipeDirection: direction,
        intensity: profile?.currentIntensity ?? 'medium',
        timestamp: now,
      };

      const updatedDaily: DailyState = {
        ...dailyState!,
        outcomes: [...(dailyState?.outcomes ?? []), outcome],
      };

      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_STATE, JSON.stringify(updatedDaily));

      // Check if accountability prompt needed (3 incompletes)
      const skipped = updatedDaily.outcomes.filter((o) => o.swipeDirection === 'skip').length;
      const shouldPrompt = skipped >= 3 && !updatedDaily.voiceNoteSubmitted;

      set({ dailyState: updatedDaily });

      if (shouldPrompt && currentIndex < deck.length - 1) {
        // Inject accountability card
        const accountabilityCard: SystemCard = {
          id: 'sys-accountability-' + now,
          type: 'system_accountability',
        };
        const newDeck = [
          ...deck.slice(0, currentIndex + 1),
          accountabilityCard,
          ...deck.slice(currentIndex + 1),
        ];
        set({ deck: newDeck });
      }

      // Update recent card IDs to avoid repeats
      const recentJson = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_CARD_IDS);
      const recent: string[] = recentJson ? JSON.parse(recentJson) : [];
      const updated = [...recent, card.id].slice(-63); // Keep last 63 (7 days × 9 cards)
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_CARD_IDS, JSON.stringify(updated));
    }

    set({ currentIndex: currentIndex + 1 });
  },

  injectSystemCard: (card, atIndex) => {
    const { deck, currentIndex } = get();
    const insertAt = atIndex ?? currentIndex;
    const newDeck = [
      ...deck.slice(0, insertAt),
      card,
      ...deck.slice(insertAt),
    ];
    set({ deck: newDeck });
  },

  setGoldCard: async (card) => {
    set({ goldCard: card });
    if (card) {
      await AsyncStorage.setItem(STORAGE_KEYS.GOLD_CARD, JSON.stringify(card));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.GOLD_CARD);
    }
  },

  respondToGoldCard: async () => {
    const { dailyState, goldCard, updateProfile, profile } = get();
    if (!goldCard || !dailyState) return;

    // Award praise point
    await updateProfile({ praisePoints: (profile?.praisePoints ?? 0) + 1 });

    const updatedDaily = { ...dailyState, goldCardResponded: true };
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_STATE, JSON.stringify(updatedDaily));
    set({ dailyState: updatedDaily, goldCard: null });
    await AsyncStorage.removeItem(STORAGE_KEYS.GOLD_CARD);
  },

  setWeeklyIntensity: async (intensity) => {
    await get().updateProfile({
      currentIntensity: intensity,
      intensitySetAt: Date.now(),
    });
  },

  needsIntensitySelection: () => {
    const { profile } = get();
    if (!profile) return true;
    const lastWeek = weekString(new Date(profile.intensitySetAt));
    return lastWeek !== weekString();
  },

  getWeeklyStats: () => {
    const { dailyState } = get();
    const outcomes = dailyState?.outcomes ?? [];
    const completed = outcomes.filter((o) => o.swipeDirection === 'complete').length;
    const skipped = outcomes.filter((o) => o.swipeDirection === 'skip').length;
    const breakdown: Record<string, number> = {};
    for (const o of outcomes) {
      if (o.swipeDirection === 'complete') {
        breakdown[o.domain] = (breakdown[o.domain] ?? 0) + 1;
      }
    }
    return { completed, skipped, breakdown };
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildOnboardingDeck(): DeckCard[] {
  const cards: SystemCard[] = [
    { id: 'sys-welcome', type: 'system_welcome' },
    { id: 'sys-wizard-physical', type: 'system_wizard', payload: { step: 'physical' } },
    { id: 'sys-wizard-mental', type: 'system_wizard', payload: { step: 'mental' } },
    { id: 'sys-wizard-spiritual', type: 'system_wizard', payload: { step: 'spiritual' } },
    { id: 'sys-wizard-intensity', type: 'system_intensity', payload: { onboarding: true } },
    { id: 'sys-wizard-allset', type: 'system_wizard', payload: { step: 'allset' } },
  ];
  return cards;
}

async function buildDailyDeck(
  profile: UserProfile,
  today: string,
  recentIds: string[],
  dailyState: DailyState
): Promise<DeckCard[]> {
  const contentCards = dealDailyCards({
    date: today,
    pubkey: profile.pubkey,
    intensity: profile.currentIntensity,
    preferences: profile.preferences,
    recentCardIds: recentIds,
  });

  // Restore swipe state — skip already-swiped cards
  const swipedIds = new Set(dailyState.outcomes.map((o) => o.cardId));
  const remaining = contentCards.filter((c) => !swipedIds.has(c.id));

  // Append completion card
  const completionCard: SystemCard = {
    id: 'sys-completion-' + today,
    type: 'system_completion',
  };

  return [...remaining, completionCard];
}
