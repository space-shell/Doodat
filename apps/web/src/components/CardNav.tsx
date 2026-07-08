import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { state } from '../store';
import { emit } from '../streams/intents';
import { isContentCard } from '../types';

const CardNav: Component = () => {
  const contentCards = () => {
    const cards: { deckIndex: number; cardId: string }[] = [];
    state.deck.forEach((card, i) => {
      if (isContentCard(card)) cards.push({ deckIndex: i, cardId: card.id });
    });
    return cards;
  };

  const statusOf = (cardId: string) =>
    state.daily.outcomes.find((o) => o.cardId === cardId)?.swipeDirection;

  return (
    <div class="grid grid-cols-9 gap-1.5" data-testid="card-nav">
      <For each={contentCards()}>
        {(item, i) => (
          <button
            class="aspect-square rounded-lg text-xs font-bold transition-colors duration-300"
            classList={{
              'neu-button': state.currentIndex !== item.deckIndex,
              'neu-inset': state.currentIndex === item.deckIndex,
              'text-dodaat-textMuted': statusOf(item.cardId) === undefined,
              'text-dodaat-complete': statusOf(item.cardId) === 'complete',
              'text-dodaat-skip': statusOf(item.cardId) === 'skip',
            }}
            onClick={() => emit({ type: 'NAVIGATE', index: item.deckIndex })}
            data-testid={`nav-btn-${i() + 1}`}
          >
            {i() + 1}
          </button>
        )}
      </For>
    </div>
  );
};

export default CardNav;
