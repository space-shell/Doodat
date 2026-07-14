import type { Component } from 'solid-js';
import { Show, For, createSignal } from 'solid-js';
import { getCardTask, type CardAction, type ContentCard as Card } from '@doodat/cards';
import { emit } from '../streams/intents';

const DOMAIN_LABEL = { physical: 'Physical', mental: 'Mental', spiritual: 'Spiritual' } as const;
const DOMAIN_DOT = {
  physical: 'bg-dodaat-physical',
  mental: 'bg-dodaat-mental',
  spiritual: 'bg-dodaat-spiritual',
} as const;

const ContentCardView: Component<{ card: Card }> = (props) => {
  const task = () => getCardTask(props.card);
  const [responses, setResponses] = createSignal<Record<string, string>>({});

  // v1 renders only text actions; non-text types are schema/plumbing only.
  // An action activates when its `difficulties` is unset or includes the card's own difficulty.
  const textActions = (): CardAction[] =>
    (props.card.actions ?? []).filter(
      (a) => a.type === 'text' && (!a.difficulties || a.difficulties.includes(props.card.difficulty)),
    );

  const commit = (direction: 'complete' | 'skip') => {
    const r = responses();
    emit({
      type: 'SWIPE',
      card: props.card,
      direction,
      actionResponses: Object.keys(r).length ? r : undefined,
    });
  };

  return (
    <article data-testid="content-card" class="neu-raised w-full max-w-md p-6">
      <header class="flex items-center gap-2 mb-4">
        <span class={`inline-block w-3 h-3 rounded-full ${DOMAIN_DOT[props.card.domain]}`} />
        <span class="text-xs font-semibold tracking-widest uppercase text-dodaat-textMuted">
          {DOMAIN_LABEL[props.card.domain]}
        </span>
        <span class="ml-auto text-xs font-semibold uppercase tracking-wide text-dodaat-gold">
          {props.card.difficulty}
        </span>
      </header>

      <p class="text-base leading-relaxed text-dodaat-textPrimary">{task()}</p>

      <Show when={props.card.context}>
        <p class="mt-4 text-sm italic leading-relaxed text-dodaat-textMuted">{props.card.context}</p>
      </Show>
      <Show when={props.card.sources?.length}>
        <ul class="mt-2 space-y-1">
          <For each={props.card.sources}>
            {(src) => (
              <li class="text-xs text-dodaat-textMuted">
                {src.url ? (
                  <a href={src.url} target="_blank" rel="noopener noreferrer" class="underline">
                    {props.card.tradition ? `${props.card.tradition} · ` : ''}
                    {src.citation}
                  </a>
                ) : (
                  <span>
                    {props.card.tradition ? `${props.card.tradition} · ` : ''}
                    {src.citation}
                  </span>
                )}
              </li>
            )}
          </For>
        </ul>
      </Show>

      <Show when={textActions().length > 0}>
        <div class="mt-6 space-y-4">
          <For each={textActions()}>
            {(action) => (
              <label class="block">
                <Show when={action.prompt}>
                  <span class="block text-xs font-semibold uppercase tracking-wide text-dodaat-textMuted mb-1">
                    {action.prompt}
                  </span>
                </Show>
                <textarea
                  data-testid={`action-${action.id}`}
                  class="neu-inset w-full rounded-button p-3 text-sm text-dodaat-textPrimary"
                  rows="3"
                  placeholder="Write here…"
                  value={responses()[action.id] ?? ''}
                  onInput={(e) => setResponses({ ...responses(), [action.id]: e.currentTarget.value })}
                />
              </label>
            )}
          </For>
        </div>
      </Show>

      <div class="flex gap-3 mt-8">
        <button
          data-testid="skip-btn"
          class="neu-button flex-1 py-3 text-sm font-semibold text-dodaat-textSecondary"
          onClick={() => commit('skip')}
        >
          Skip
        </button>
        <button
          data-testid="complete-btn"
          class="neu-button flex-1 py-3 text-sm font-semibold text-dodaat-goldDark"
          onClick={() => commit('complete')}
        >
          Done
        </button>
      </div>
    </article>
  );
};

export default ContentCardView;
