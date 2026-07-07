// @doodat/cards — shared source of truth.
// Card content, domain types, and the dealing engine. Pure TypeScript,
// no framework deps. Consumed by apps/web and packages/physical.

export type {
  Domain,
  IntensityLevel,
  SwipeDirection,
  ContentCard,
  PhysicalPreferences,
  MentalPreferences,
  SpiritualPreferences,
  UserPreferences,
  CardOutcome,
} from './types';

export {
  physicalCards,
  mentalCards,
  spiritualCards,
  allCards,
  cardById,
} from './data';

export { dealDailyCards, getCardTask, cardWeight, todayString, weekString } from './deck';
export type { DailyDealOptions } from './deck';

export { shouldTriggerAccountability, countSkips } from './accountability';
