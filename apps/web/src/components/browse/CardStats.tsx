import type { Component } from 'solid-js';
import { allCards } from '@doodat/cards';

const CardStats: Component = () => {
  return (
    <section data-testid="card-stats">
      <h2 class="text-xs font-semibold tracking-widest uppercase text-dodaat-textMuted mb-2">
        Total cards
      </h2>
      <div class="neu-inset rounded-card px-5 py-4">
        <span class="text-3xl font-bold text-dodaat-textPrimary">{allCards.length}</span>
      </div>
    </section>
  );
};

export default CardStats;
