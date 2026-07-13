import type { Component } from 'solid-js';
import { For, createSignal, createMemo, Show } from 'solid-js';
import { allCards, type ContentCard, type Domain } from '@doodat/cards';

const DOMAIN_LABEL = { physical: 'Physical', mental: 'Mental', spiritual: 'Spiritual' } as const;
const DOMAIN_DOT = {
  physical: 'bg-dodaat-physical',
  mental: 'bg-dodaat-mental',
  spiritual: 'bg-dodaat-spiritual',
} as const;

interface CardListProps {
  selectedId: string | null;
  onSelect: (card: ContentCard) => void;
}

const CardList: Component<CardListProps> = (props) => {
  const [domain, setDomain] = createSignal<Domain | 'all'>('all');
  const [query, setQuery] = createSignal('');

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase();
    return allCards.filter((c) => {
      if (domain() !== 'all' && c.domain !== domain()) return false;
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.intensity_low.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    });
  });

  return (
    <section data-testid="card-list" class="space-y-3">
      <h2 class="text-xs font-semibold tracking-widest uppercase text-dodaat-textMuted">
        All cards ({allCards.length})
      </h2>

      {/* Domain filter pills */}
      <div class="flex gap-2 flex-wrap">
        <FilterPill active={domain() === 'all'} onClick={() => setDomain('all')}>
          All
        </FilterPill>
        <For each={Object.keys(DOMAIN_LABEL) as Domain[]}>
          {(d) => (
            <FilterPill active={domain() === d} onClick={() => setDomain(d)} dot={DOMAIN_DOT[d]}>
              {DOMAIN_LABEL[d]}
            </FilterPill>
          )}
        </For>
      </div>

      {/* Search */}
      <input
        data-testid="card-search"
        type="search"
        placeholder="Search id, tag, text…"
        class="neu-inset rounded-button w-full px-4 py-2 text-sm text-dodaat-textPrimary placeholder-dodaat-textMuted outline-none"
        value={query()}
        onInput={(e) => setQuery(e.currentTarget.value)}
      />

      <Show when={filtered().length > 0} fallback={<p class="text-sm text-dodaat-textMuted">No cards match.</p>}>
        <ul class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <For each={filtered()}>
            {(card) => (
              <li>
                <button
                  data-testid={`card-row-${card.id}`}
                  class="neu-button w-full text-left rounded-button px-4 py-3"
                  classList={{ 'ring-2 ring-dodaat-gold': props.selectedId === card.id }}
                  onClick={() => props.onSelect(card)}
                >
                  <div class="flex items-center gap-2">
                    <span class={`inline-block w-2.5 h-2.5 rounded-full ${DOMAIN_DOT[card.domain]}`} />
                    <span class="text-xs font-mono text-dodaat-textMuted">{card.id}</span>
                    <span class="ml-auto text-xs font-semibold uppercase tracking-wide text-dodaat-textSecondary">
                      {card.category}
                    </span>
                  </div>
                  <p class="mt-1 text-sm text-dodaat-textPrimary line-clamp-1">{card.intensity_low}</p>
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  );
};

const FilterPill: Component<{ active: boolean; onClick: () => void; dot?: string; children: any }> = (props) => (
  <button
    class="neu-button rounded-pill px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
    classList={{ 'text-dodaat-goldDark': props.active, 'text-dodaat-textSecondary': !props.active }}
    onClick={() => props.onClick()}
  >
    <Show when={props.dot}>
      <span class={`inline-block w-2 h-2 rounded-full ${props.dot}`} />
    </Show>
    {props.children}
  </button>
);

export default CardList;
