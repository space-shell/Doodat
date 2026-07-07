import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { getCardTask, type ContentCard as Card } from '@doodat/cards';
import { state } from '../store';
import { emit } from '../streams/intents';

const DOMAIN_LABEL = { physical: 'Physical', mental: 'Mental', spiritual: 'Spiritual' } as const;
const DOMAIN_DOT = {
  physical: 'bg-dodaat-physical',
  mental: 'bg-dodaat-mental',
  spiritual: 'bg-dodaat-spiritual',
} as const;

const ContentCardView: Component<{ card: Card }> = (props) => {
  const task = () => getCardTask(props.card, state.profile.currentIntensity);
  return (
    <article data-testid="content-card" class="neu-raised w-full max-w-md p-6">
      <header class="flex items-center gap-2 mb-4">
        <span class={`inline-block w-3 h-3 rounded-full ${DOMAIN_DOT[props.card.domain]}`} />
        <span class="text-xs font-semibold tracking-widest uppercase text-dodaat-textMuted">
          {DOMAIN_LABEL[props.card.domain]}
        </span>
        <span class="ml-auto text-xs font-semibold uppercase tracking-wide text-dodaat-gold">
          {state.profile.currentIntensity}
        </span>
      </header>

      <p class="text-base leading-relaxed text-dodaat-textPrimary">{task()}</p>

      <Show when={props.card.context}>
        <p class="mt-4 text-sm italic leading-relaxed text-dodaat-textMuted">{props.card.context}</p>
      </Show>
      <Show when={props.card.passage_ref}>
        <p class="mt-2 text-xs text-dodaat-textMuted">
          {props.card.tradition} · {props.card.passage_ref}
        </p>
      </Show>

      <div class="flex gap-3 mt-8">
        <button
          data-testid="skip-btn"
          class="neu-button flex-1 py-3 text-sm font-semibold text-dodaat-textSecondary"
          onClick={() => emit({ type: 'SWIPE', card: props.card, direction: 'skip' })}
        >
          ← Skip
        </button>
        <button
          data-testid="complete-btn"
          class="neu-button flex-1 py-3 text-sm font-semibold text-dodaat-goldDark"
          onClick={() => emit({ type: 'SWIPE', card: props.card, direction: 'complete' })}
        >
          Done →
        </button>
      </div>
    </article>
  );
};

export default ContentCardView;
