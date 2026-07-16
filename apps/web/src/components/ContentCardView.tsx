import type { Component } from 'solid-js';
import { Show, For, createSignal } from 'solid-js';
import { getCardTask, type CardAction, type ContentCard as Card } from '@doodat/cards';
import { emit } from '../streams/intents';
import { state } from '../store';
import { haptic } from '../utils/haptics';
import { createSwipeHandlers } from '../utils/swipeNav';
import TimerButton from './TimerButton';

const DOMAIN_LABEL = { physical: 'Physical', mental: 'Mental', spiritual: 'Spiritual' } as const;
const DOMAIN_DOT = {
  physical: 'bg-dodaat-physical',
  mental: 'bg-dodaat-mental',
  spiritual: 'bg-dodaat-spiritual',
} as const;

const ContentCardView: Component<{ card: Card }> = (props) => {
  const task = () => getCardTask(props.card);
  const [responses, setResponses] = createSignal<Record<string, string>>({});
  const completed = () => state.daily.outcomes.some((o) => o.cardId === props.card.id);

  // An action activates when its `difficulties` is unset or includes the card's own difficulty.
  const textActions = (): CardAction[] =>
    (props.card.actions ?? []).filter(
      (a) => a.type === 'text' && (!a.difficulties || a.difficulties.includes(props.card.difficulty)),
    );

  const timerAction = (): CardAction | undefined =>
    (props.card.actions ?? []).find(
      (a) => a.type === 'timer' && (!a.difficulties || a.difficulties.includes(props.card.difficulty)),
    );

  const commit = () => {
    if (completed()) return;
    haptic(15);
    const r = responses();
    emit({
      type: 'SWIPE',
      card: props.card,
      actionResponses: Object.keys(r).length ? r : undefined,
    });
  };

  // Swipe-to-navigate: left = next card, right = previous card. Pure browsing —
  // records no outcome. Emits STEP; the reducer hops to the adjacent content
  // card (skipping system cards) and the existing two-phase transition animates.
  const swipe = createSwipeHandlers((dir) => {
    haptic(10);
    emit({ type: 'STEP', delta: dir === 'next' ? 1 : -1 });
  });

  return (
    <article
      data-testid="content-card"
      class="neu-raised swipe-surface w-full max-w-md p-6 flex flex-col flex-1"
      onTouchStart={swipe.onTouchStart}
      onTouchMove={swipe.onTouchMove}
      onTouchEnd={swipe.onTouchEnd}
    >
      <header class="flex items-center gap-2 mb-4">
        <span class={`inline-block w-3 h-3 rounded-full ${DOMAIN_DOT[props.card.domain]}`} />
        <span class="text-xs font-semibold tracking-widest uppercase text-dodaat-textMuted">
          {DOMAIN_LABEL[props.card.domain]}
        </span>
        <span class="ml-auto text-xs font-semibold uppercase tracking-wide text-dodaat-gold">
          {props.card.difficulty}
        </span>
      </header>

      <p class="text-base leading-relaxed text-dodaat-textPrimary font-serif">{task()}</p>

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

      <div class="flex justify-center my-auto">
        <Show when={timerAction()?.durationSec}>
            <TimerButton durationSec={timerAction()!.durationSec!} />
        </Show>
      </div>

      <div>
        <button
          data-testid="complete-btn"
          class="neu-button w-full py-3 text-sm font-semibold text-dodaat-goldDark transition-opacity"
          classList={{ 'opacity-40 pointer-events-none': completed() }}
          disabled={completed()}
          onClick={() => commit()}
        >
          Done
        </button>
      </div>
    </article>
  );
};

export default ContentCardView;
