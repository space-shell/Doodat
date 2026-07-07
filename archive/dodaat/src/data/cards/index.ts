export { physicalCards } from './physical';
export { mentalCards } from './mental';
export { spiritualCards } from './spiritual';

import { physicalCards } from './physical';
import { mentalCards } from './mental';
import { spiritualCards } from './spiritual';
import type { ContentCard } from '../../types';

export const allCards: ContentCard[] = [
  ...physicalCards,
  ...mentalCards,
  ...spiritualCards,
];

export const cardById = new Map<string, ContentCard>(
  allCards.map((card) => [card.id, card])
);
