import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import { state } from '../store';

const DOMAIN_LABEL = { physical: 'Physical', mental: 'Mental', spiritual: 'Spiritual' } as const;

const CompletionSummary: Component = () => {
  const outcomes = () => state.daily.outcomes;
  const completed = () => outcomes().filter((o) => o.swipeDirection === 'complete').length;
  const skipped = () => outcomes().filter((o) => o.swipeDirection === 'skip').length;
  const breakdown = () => {
    const b: Record<string, number> = {};
    for (const o of outcomes()) {
      if (o.swipeDirection === 'complete') b[o.domain] = (b[o.domain] ?? 0) + 1;
    }
    return b;
  };

  return (
    <article data-testid="completion-card" class="neu-raised w-full max-w-md p-6 text-center">
      <h2 class="text-xl font-bold text-dodaat-textPrimary">That's the deck.</h2>
      <p class="mt-2 text-sm text-dodaat-textMuted">do one day at a time.</p>

      <div class="neu-inset mt-6 p-4">
        <div class="flex justify-around">
          <div>
            <div class="text-3xl font-bold text-dodaat-goldDark">{completed()}</div>
            <div class="text-xs uppercase tracking-wide text-dodaat-textMuted">completed</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-dodaat-textSecondary">{skipped()}</div>
            <div class="text-xs uppercase tracking-wide text-dodaat-textMuted">skipped</div>
          </div>
        </div>

        <Show when={state.streak.count > 0}>
          <div class="mt-4 pt-4 border-t border-dodaat-border text-sm text-dodaat-goldDark">
            {state.streak.count}-day streak
          </div>
        </Show>

        <Show when={Object.keys(breakdown()).length > 0}>
          <div class="mt-3 flex flex-wrap justify-center gap-3 text-xs text-dodaat-textMuted">
            <For each={Object.entries(breakdown())}>
              {([d, n]) => <span>{DOMAIN_LABEL[d as keyof typeof DOMAIN_LABEL]}: {n}</span>}
            </For>
          </div>
        </Show>
      </div>
    </article>
  );
};

export default CompletionSummary;
