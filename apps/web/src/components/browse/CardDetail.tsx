import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import type { ContentCard } from '@doodat/cards';
import CardNotes from './CardNotes';

const DOMAIN_LABEL = { physical: 'Physical', mental: 'Mental', spiritual: 'Spiritual' } as const;
const DOMAIN_DOT = {
  physical: 'bg-dodaat-physical',
  mental: 'bg-dodaat-mental',
  spiritual: 'bg-dodaat-spiritual',
} as const;
const INTENSITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' } as const;
const INTENSITY_FIELDS = {
  low: 'intensity_low',
  medium: 'intensity_medium',
  high: 'intensity_high',
} as const;

const CardDetail: Component<{ card: ContentCard }> = (props) => {
  return (
    <article data-testid={`card-detail-${props.card.id}`} class="neu-raised rounded-card p-6">
      <header class="flex items-center gap-2 mb-4">
        <span class={`inline-block w-3 h-3 rounded-full ${DOMAIN_DOT[props.card.domain]}`} />
        <span class="text-xs font-semibold tracking-widest uppercase text-dodaat-textMuted">
          {DOMAIN_LABEL[props.card.domain]}
        </span>
        <span class="ml-auto text-xs font-mono text-dodaat-textMuted">{props.card.id}</span>
      </header>

      <div class="flex items-center gap-2 mb-4">
        <span class="text-xs font-semibold uppercase tracking-wide text-dodaat-goldDark rounded-pill bg-dodaat-goldLight px-2 py-0.5">
          {props.card.category}
        </span>
        <Show when={props.card.tradition}>
          <span class="text-xs font-semibold uppercase tracking-wide text-dodaat-spiritual">
            {props.card.tradition}
          </span>
        </Show>
      </div>

      {/* All three intensity texts */}
      <div class="space-y-3">
        {(['low', 'medium', 'high'] as const).map((level) => (
          <div>
            <div class="text-xs font-bold uppercase tracking-widest text-dodaat-textMuted mb-0.5">
              {INTENSITY_LABEL[level]}
            </div>
            <p class="text-sm leading-relaxed text-dodaat-textPrimary">
              {props.card[INTENSITY_FIELDS[level]]}
            </p>
          </div>
        ))}
      </div>

      <Show when={props.card.context}>
        <p class="mt-4 text-sm italic leading-relaxed text-dodaat-textMuted">{props.card.context}</p>
      </Show>

      <Show when={props.card.passage_ref}>
        <p class="mt-2 text-xs text-dodaat-textMuted">
          {props.card.tradition} · {props.card.passage_ref}
        </p>
      </Show>

      <Show when={props.card.agnostic_interpretation}>
        <div class="mt-4 neu-inset rounded-button p-3">
          <div class="text-xs font-bold uppercase tracking-widest text-dodaat-textMuted mb-1">
            Agnostic interpretation
          </div>
          <p class="text-sm italic leading-relaxed text-dodaat-textSecondary">
            {props.card.agnostic_interpretation}
          </p>
        </div>
      </Show>

      <Show when={props.card.tags.length > 0}>
        <div class="mt-4 flex flex-wrap gap-1.5">
          {props.card.tags.map((tag) => (
            <span class="text-xs text-dodaat-textMuted bg-dodaat-systemCard rounded-pill px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      </Show>

      <CardNotes cardId={props.card.id} />
    </article>
  );
};

export default CardDetail;
