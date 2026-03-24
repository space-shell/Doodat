import type {
  ContentCard,
  Domain,
  IntensityLevel,
  UserPreferences,
} from '../types';
import { physicalCards, mentalCards, spiritualCards } from '../data/cards';

/**
 * Returns today's date as YYYY-MM-DD in local time.
 */
export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Returns the ISO week string "YYYY-Www" for a given date.
 */
export function weekString(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Simple seeded pseudo-random number generator (Mulberry32).
 * Ensures the same seed gives the same daily card set.
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Derives an integer seed from a date string and pubkey.
 */
function dateSeed(dateStr: string, pubkey: string): number {
  let hash = 0;
  const str = dateStr + pubkey;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i);
  }
  return hash;
}

/**
 * Compute a weight score for a card given user preferences.
 * Higher = more likely to be selected.
 */
function cardWeight(
  card: ContentCard,
  preferences: UserPreferences | undefined,
  domain: Domain
): number {
  if (!preferences) return 1;

  let weight = 1;

  if (domain === 'physical') {
    const prefs = preferences.physical;
    if (prefs.focusAreas.some((area) => card.tags.includes(area))) weight += 2;
    if (prefs.fastingInterest && card.category === 'fasting') weight += 3;
  }

  if (domain === 'mental') {
    const prefs = preferences.mental;
    if (prefs.challenges.some((c) => card.tags.includes(c))) weight += 2;
    if (!prefs.writingComfort && card.category === 'writing') weight -= 1;
    if (prefs.readingPreferences.some((r) => card.tags.includes(r))) weight += 2;
  }

  if (domain === 'spiritual') {
    const prefs = preferences.spiritual;
    if (prefs.traditionProximity < 30) {
      // Secular leaning — prefer agnostic cards
      if (!card.tradition) weight += 3;
      if (card.agnostic_interpretation) weight += 1;
    } else if (prefs.traditions.some((t) => card.tradition === t)) {
      weight += 4;
    }
  }

  return Math.max(weight, 0.1);
}

/**
 * Select 3 cards from a domain pool using weighted random selection,
 * avoiding recently used card IDs.
 */
function selectCards(
  pool: ContentCard[],
  domain: Domain,
  count: number,
  recentIds: Set<string>,
  preferences: UserPreferences | undefined,
  rng: () => number
): ContentCard[] {
  // Filter out recent cards
  const available = pool.filter((c) => !recentIds.has(c.id));
  const usablePool = available.length >= count ? available : pool;

  // Build weighted list
  const weighted: Array<{ card: ContentCard; weight: number }> = usablePool.map((card) => ({
    card,
    weight: cardWeight(card, preferences, domain),
  }));

  const selected: ContentCard[] = [];
  const usedInSelection = new Set<string>();

  for (let i = 0; i < count && weighted.length > 0; i++) {
    const totalWeight = weighted
      .filter((w) => !usedInSelection.has(w.card.id))
      .reduce((sum, w) => sum + w.weight, 0);

    let rand = rng() * totalWeight;

    for (const { card, weight } of weighted) {
      if (usedInSelection.has(card.id)) continue;
      rand -= weight;
      if (rand <= 0) {
        selected.push(card);
        usedInSelection.add(card.id);
        break;
      }
    }
  }

  return selected;
}

export interface DailyDealOptions {
  date: string;
  pubkey: string;
  intensity: IntensityLevel;
  preferences?: UserPreferences;
  recentCardIds?: string[]; // IDs of cards used in the last ~7 days
}

/**
 * Deal today's 9 cards: 3 physical, 3 mental, 3 spiritual.
 * Order: physical → mental → spiritual.
 */
export function dealDailyCards(options: DailyDealOptions): ContentCard[] {
  const { date, pubkey, preferences, recentCardIds = [] } = options;
  const recentSet = new Set(recentCardIds);
  const rng = mulberry32(dateSeed(date, pubkey));

  const physical = selectCards(physicalCards, 'physical', 3, recentSet, preferences, rng);
  const mental = selectCards(mentalCards, 'mental', 3, recentSet, preferences, rng);
  const spiritual = selectCards(spiritualCards, 'spiritual', 3, recentSet, preferences, rng);

  return [...physical, ...mental, ...spiritual];
}

/**
 * Get the task text for a card at the user's current intensity.
 */
export function getCardTask(card: ContentCard, intensity: IntensityLevel): string {
  switch (intensity) {
    case 'low': return card.intensity_low;
    case 'medium': return card.intensity_medium;
    case 'high': return card.intensity_high;
  }
}
