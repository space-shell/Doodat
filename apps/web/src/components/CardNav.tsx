import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { state } from '../store';
import { emit } from '../streams/intents';
import { isContentCard } from '../types';
import { settingsOpen, setSettingsOpen } from './drafts';

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
    <div class="flex flex-wrap items-center gap-1.5" data-testid="card-nav">
      <For each={contentCards()}>
        {(item, i) => (
          <button
            class="h-9 w-9 rounded-lg text-xs font-bold transition-colors duration-300"
            classList={{
              'neu-button': state.currentIndex !== item.deckIndex,
              'neu-inset': state.currentIndex === item.deckIndex,
              'text-dodaat-textMuted': statusOf(item.cardId) === undefined,
              'text-dodaat-complete': statusOf(item.cardId) === 'complete',
            }}
            onClick={() => emit({ type: 'NAVIGATE', index: item.deckIndex })}
            data-testid={`nav-btn-${i() + 1}`}
          >
            {i() + 1}
          </button>
        )}
      </For>
      <button
        class="ml-auto h-9 w-9 rounded-lg text-sm font-bold transition-colors duration-300"
        classList={{
          'neu-button': !settingsOpen(),
          'neu-inset': settingsOpen(),
          'text-dodaat-textSecondary': true,
        }}
        onClick={() => setSettingsOpen(!settingsOpen())}
        data-testid="settings-btn"
      >
        &#9881;
      </button>
    </div>
  );
};

export default CardNav;
