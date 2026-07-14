import type {
  ContentCard,
  Domain,
  IntensityLevel,
  UserPreferences,
} from './types';
import { physicalCards, mentalCards, spiritualCards } from './data';

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
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Seeded pseudo-random number generator (Mulberry32).
 * The same seed yields the same daily card set — the deck is stable per user per day.
 */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derives an integer seed from a date string and pubkey. */
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
 * Higher = more likely to be selected. Exported for testing + visibility.
 */
export function cardWeight(
  card: ContentCard,
  preferences: UserPreferences | undefined,
  domain: Domain,
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

// ─── Daily volume + difficulty distribution ───────────────────────────────────

/** Per-intensity card-count ranges. dailyVolume picks deterministically within the range. */
export const INTENSITY_VOLUME_RANGE: Record<IntensityLevel, readonly [number, number]> = {
  low: [2, 5],
  medium: [4, 7],
  high: [6, 9],
};

/** Deterministic daily volume within the intensity range (seeded by date + pubkey). */
export function dailyVolume(intensity: IntensityLevel, date: string, pubkey: string): number {
  const [min, max] = INTENSITY_VOLUME_RANGE[intensity];
  const rng = mulberry32(dateSeed(date, pubkey));
  return min + Math.floor(rng() * (max - min + 1));
}

const DIFFICULTY_WEIGHTS: Record<IntensityLevel, Record<IntensityLevel, number>> = {
  low: { low: 0.62, medium: 0.33, high: 0.05 },
  medium: { low: 0.30, medium: 0.55, high: 0.15 },
  high: { low: 0.30, medium: 0.45, high: 0.25 },
};

const DOMAIN_ORDER: Domain[] = ['physical', 'mental', 'spiritual'];
const DOMAIN_POOL: Record<Domain, ContentCard[]> = {
  physical: physicalCards,
  mental: mentalCards,
  spiritual: spiritualCards,
};

function weightedDifficulty(weights: Record<IntensityLevel, number>, rng: () => number): IntensityLevel {
  let r = rng() * (weights.low + weights.medium + weights.high);
  for (const lvl of ['low', 'medium', 'high'] as const) {
    r -= weights[lvl];
    if (r <= 0) return lvl;
  }
  return 'high';
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build the day's difficulty plan: `volume` labels. Guaranteed highs are placed
 * first, the remainder drawn from DIFFICULTY_WEIGHTS, then the whole plan is
 * shuffled so guarantees scatter across the three domains. Exported so the
 * distribution policy is unit-testable in isolation.
 */
export function planDifficulties(intensity: IntensityLevel, volume: number, rng: () => number): IntensityLevel[] {
  const guaranteedHigh = intensity === 'low' ? 0 : intensity === 'medium' ? 1 : 2 + (rng() < 0.5 ? 0 : 1);
  const plan: IntensityLevel[] = [];
  for (let i = 0; i < guaranteedHigh; i++) plan.push('high');
  const weights = DIFFICULTY_WEIGHTS[intensity];
  while (plan.length < volume) plan.push(weightedDifficulty(weights, rng));
  return shuffle(plan, rng);
}

/**
 * Pick one card of `difficulty` from a domain pool, weighted by preferences and
 * avoiding already-used + recent ids. Falls back gracefully: relax recent
 * exclusion, then relax the difficulty filter, so a thin per-difficulty pool
 * never shortens the deal.
 */
function pickOne(
  pool: ContentCard[],
  domain: Domain,
  difficulty: IntensityLevel,
  used: Set<string>,
  recentSet: Set<string>,
  preferences: UserPreferences | undefined,
  rng: () => number,
): ContentCard | undefined {
  const byDiff = pool.filter((c) => c.difficulty === difficulty && !used.has(c.id));
  let candidates = byDiff.filter((c) => !recentSet.has(c.id));
  if (candidates.length === 0) candidates = byDiff; // relax recent exclusion
  if (candidates.length === 0) candidates = pool.filter((c) => !used.has(c.id)); // relax difficulty
  if (candidates.length === 0) return undefined;

  const total = candidates.reduce((s, c) => s + cardWeight(c, preferences, domain), 0);
  let r = rng() * total;
  for (const c of candidates) {
    r -= cardWeight(c, preferences, domain);
    if (r <= 0) return c;
  }
  return candidates[candidates.length - 1];
}

export interface DailyDealOptions {
  date: string;
  pubkey: string;
  intensity: IntensityLevel;
  volume: number;
  preferences?: UserPreferences;
  recentCardIds?: string[];
}

/**
 * Deal today's cards for a given volume: split evenly across the three domains
 * (physical → mental → spiritual) and draw each slot's difficulty from
 * planDifficulties. Deterministic for a given date + pubkey + volume.
 */
export function dealDailyCards(options: DailyDealOptions): ContentCard[] {
  const { date, pubkey, intensity, volume, preferences, recentCardIds = [] } = options;
  const recentSet = new Set(recentCardIds);
  const rng = mulberry32(dateSeed(date, pubkey));
  const plan = planDifficulties(intensity, volume, rng);

  const labelsByDomain: Record<Domain, IntensityLevel[]> = {
    physical: [],
    mental: [],
    spiritual: [],
  };
  plan.forEach((lvl, i) => labelsByDomain[DOMAIN_ORDER[i % 3]].push(lvl));

  const used = new Set<string>();
  const out: ContentCard[] = [];
  for (const domain of DOMAIN_ORDER) {
    for (const difficulty of labelsByDomain[domain]) {
      const card = pickOne(DOMAIN_POOL[domain], domain, difficulty, used, recentSet, preferences, rng);
      if (card) {
        used.add(card.id);
        out.push(card);
      }
    }
  }
  return out;
}


/** Get the task text for a card — selected by the card's own `difficulty`. */
export function getCardTask(card: ContentCard): string {
  switch (card.difficulty) {
    case 'low':
      return card.intensity_low;
    case 'medium':
      return card.intensity_medium;
    case 'high':
      return card.intensity_high;
  }
}
