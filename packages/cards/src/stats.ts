// Deck statistics — pure aggregations over card content.
// No framework deps; co-tested with the rest of @doodat/cards.
import { allCards } from './data';
import type { ContentCard, Domain, IntensityLevel } from './types';

export type StatGrouping = 'domain' | 'tradition' | 'category' | 'intensity';

/** Count cards per domain, across the full deck by default. */
export function countByDomain(cards: ContentCard[] = allCards): Record<Domain, number> {
  const out: Record<Domain, number> = { physical: 0, mental: 0, spiritual: 0 };
  for (const c of cards) out[c.domain]++;
  return out;
}

/**
 * Count cards per sub-category within a domain.
 * With no domain argument returns `{}` — category names are not unique across
 * domains, so a mixed tally would be misleading. The UI should pick a domain.
 */
export function countByCategory(
  domain?: Domain,
  cards: ContentCard[] = allCards,
): Record<string, number> {
  if (!domain) return {};
  const out: Record<string, number> = {};
  for (const c of cards) {
    if (c.domain !== domain) continue;
    out[c.category] = (out[c.category] ?? 0) + 1;
  }
  return out;
}

/**
 * Count spiritual cards per tradition. Cards with no `tradition` field are
 * bucketed as `'agnostic'` (matching the CARD_DESIGN taxonomy). Only spiritual
 * cards are counted.
 */
export function countByTradition(cards: ContentCard[] = allCards): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of cards) {
    if (c.domain !== 'spiritual') continue;
    const key = c.tradition ?? 'agnostic';
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/**
 * Count cards per intensity level. Every ContentCard carries all three
 * intensity texts, so this is structurally equal to the total per level —
 * shown truthfully. A real spread would need a per-card difficulty field.
 */
export function countByIntensity(cards: ContentCard[] = allCards): Record<IntensityLevel, number> {
  const out: Record<IntensityLevel, number> = { low: 0, medium: 0, high: 0 };
  const total = cards.length;
  out.low = total;
  out.medium = total;
  out.high = total;
  return out;
}

export interface RadarSeries {
  axes: string[];
  values: number[];
}

/**
 * Adapt a tally into the axes/values pair a radar chart needs.
 * Domain and intensity use their canonical ordinal order; traditions and
 * categories are sorted alphabetically for stable rendering. For the
 * `'category'` grouping a domain must be chosen (defaults to physical).
 */
export function radarSeries(grouping: StatGrouping, domain: Domain = 'physical'): RadarSeries {
  let tally: Record<string, number>;
  let ordinal = true;
  switch (grouping) {
    case 'domain': {
      const d = countByDomain();
      tally = { physical: d.physical, mental: d.mental, spiritual: d.spiritual };
      break;
    }
    case 'intensity': {
      const i = countByIntensity();
      tally = { low: i.low, medium: i.medium, high: i.high };
      break;
    }
    case 'tradition':
      tally = countByTradition();
      ordinal = false;
      break;
    case 'category':
      tally = countByCategory(domain);
      ordinal = false;
      break;
  }
  // Preserve insertion order for ordinal groupings; sort the rest.
  const axes = ordinal ? Object.keys(tally) : Object.keys(tally).sort();
  return { axes, values: axes.map((a) => tally[a]) };
}
