import type { Component } from 'solid-js';
import { createSignal, createMemo, Show, For } from 'solid-js';
import { radarSeries, type Domain, type StatGrouping } from '@doodat/cards';
import RadarChart from './RadarChart';
import CardStats from './CardStats';
import CardList from './CardList';
import CardDetail from './CardDetail';
import type { ContentCard } from '@doodat/cards';

const GROUPINGS: { id: StatGrouping; label: string }[] = [
  { id: 'domain', label: 'Domain' },
  { id: 'tradition', label: 'Traditions' },
  { id: 'category', label: 'Categories' },
  { id: 'intensity', label: 'Intensity' },
];

const DOMAIN_COLOR: Record<Domain, string> = {
  physical: '#8B6F5E',
  mental: '#5E7A8B',
  spiritual: '#7A6B8B',
};

const CardBrowser: Component = () => {
  const [grouping, setGrouping] = createSignal<StatGrouping>('domain');
  const [categoryDomain, setCategoryDomain] = createSignal<Domain>('physical');
  const [selected, setSelected] = createSignal<ContentCard | null>(null);

  const series = createMemo(() => {
    const g = grouping();
    return g === 'category' ? radarSeries(g, categoryDomain()) : radarSeries(g);
  });

  // Map the active grouping to a chart colour.
  const chartColor = createMemo(() => {
    switch (grouping()) {
      case 'tradition':
        return DOMAIN_COLOR.spiritual;
      case 'category':
        return DOMAIN_COLOR[categoryDomain()];
      default:
        return '#C4A882'; // gold
    }
  });

  return (
    <main class="min-h-screen p-6">
      <div class="max-w-3xl mx-auto space-y-8">
        <header>
          <a
            href="/"
            class="text-xs font-semibold uppercase tracking-widest text-dodaat-textMuted hover:text-dodaat-goldDark"
          >
            ← Back to dodaat
          </a>
          <h1 class="mt-2 text-2xl font-bold text-dodaat-textPrimary">Card browser</h1>
          <p class="text-sm text-dodaat-textSecondary">
            Review all cards, deck statistics, and your reviewer notes.
          </p>
        </header>

        {/* Statistics tiles */}
        <CardStats />

        {/* Radar chart with switchable grouping */}
        <section data-testid="radar-section" class="neu-raised rounded-card p-6">
          <h2 class="text-xs font-semibold tracking-widest uppercase text-dodaat-textMuted mb-3">
            Distribution
          </h2>
          <div class="flex gap-2 flex-wrap mb-4">
            <For each={GROUPINGS}>
              {(g) => (
                <button
                  data-testid={`grouping-${g.id}`}
                  class="neu-button rounded-pill px-3 py-1.5 text-xs font-semibold"
                  classList={{
                    'text-dodaat-goldDark': grouping() === g.id,
                    'text-dodaat-textSecondary': grouping() !== g.id,
                  }}
                  onClick={() => setGrouping(g.id)}
                >
                  {g.label}
                </button>
              )}
            </For>
          </div>

          <Show when={grouping() === 'category'}>
            <div class="flex gap-2 flex-wrap mb-4">
              <For each={Object.keys(DOMAIN_COLOR) as Domain[]}>
                {(d) => (
                  <button
                    data-testid={`category-domain-${d}`}
                    class="neu-button rounded-pill px-3 py-1 text-xs font-semibold"
                    classList={{
                      'text-dodaat-goldDark': categoryDomain() === d,
                      'text-dodaat-textSecondary': categoryDomain() !== d,
                    }}
                    onClick={() => setCategoryDomain(d)}
                  >
                    {d}
                  </button>
                )}
              </For>
            </div>
          </Show>

          <RadarChart axes={series().axes} values={series().values} color={chartColor()} />
        </section>

        {/* Two-column: list + detail */}
        <div class="grid gap-6 md:grid-cols-2">
          <CardList selectedId={selected()?.id ?? null} onSelect={setSelected} />
          <Show
            when={selected()}
            fallback={
              <div class="neu-inset rounded-card p-6 text-sm text-dodaat-textMuted">
                Select a card to review its details and add a note.
              </div>
            }
          >
            <CardDetail card={selected()!} />
          </Show>
        </div>
      </div>
    </main>
  );
};

export default CardBrowser;
