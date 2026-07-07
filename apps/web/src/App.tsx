import type { Component } from 'solid-js';
import { allCards } from '@doodat/cards';

const App: Component = () => {
  return (
    <main class="min-h-screen flex items-center justify-center p-6">
      <article class="neu-raised w-full max-w-sm p-8 text-center">
        <h1 class="text-3xl font-extrabold tracking-wide text-dodaat-textPrimary">
          dodaat
        </h1>
        <p class="mt-2 text-sm tracking-wide text-dodaat-textMuted">
          do one day at a time
        </p>

        <div class="neu-inset mt-8 p-4">
          <p class="text-sm leading-relaxed text-dodaat-textSecondary">
            Rebuilding. The web-first MVP is in progress.
          </p>
          <p class="mt-3 text-xs tracking-wide text-dodaat-textMuted">
            {allCards.length} cards loaded
          </p>
        </div>
      </article>
    </main>
  );
};

export default App;
