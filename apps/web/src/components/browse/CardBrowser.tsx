import type { Component } from 'solid-js';
import { createSignal, createMemo, Show, For, onMount, onCleanup } from 'solid-js';
import { radarSeries, type Domain, type StatGrouping } from '@doodat/cards';
import RadarChart from './RadarChart';
import CardStats from './CardStats';
import CardList from './CardList';
import CardDetail from './CardDetail';
import { notes, clearAllNotes } from '../../store/notes';
import type { ContentCard } from '@doodat/cards';

const GROUPINGS: { id: StatGrouping; label: string }[] = [
  { id: 'domain', label: 'Domain' },
  { id: 'tradition', label: 'Traditions' },
  { id: 'category', label: 'Categories' },
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

  const noteCount = () => Object.keys(notes).length;

  /** Download all notes as a JSON file: { [cardId]: note }. */
  const exportNotes = () => {
    const blob = new Blob([JSON.stringify({ ...notes }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dodaat-card-notes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Two-stage clear confirmation: arming turns the button red ("Confirm…"),
  // a second click deletes. Click-away (via the backdrop) or Escape cancels.
  const [armed, setArmed] = createSignal(false);
  const arm = () => noteCount() > 0 && setArmed(true);
  const disarm = () => setArmed(false);
  const confirmClear = () => {
    clearAllNotes();
    setArmed(false);
  };
  const onKey = (e: KeyboardEvent) => e.key === 'Escape' && disarm();
  onMount(() => window.addEventListener('keydown', onKey));
  onCleanup(() => window.removeEventListener('keydown', onKey));

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
          <div class="mt-2 flex items-center justify-between gap-3 flex-wrap">
            <h1 class="text-2xl font-bold text-dodaat-textPrimary">Card browser</h1>
            <div class="flex gap-2 relative">
              <button
                data-testid="export-notes"
                class="neu-button rounded-button px-3 py-2 text-xs font-semibold text-dodaat-textSecondary"
                onClick={exportNotes}
              >
                Export notes
              </button>
              <button
                data-testid="clear-notes"
                class="neu-button rounded-button px-3 py-2 text-xs font-semibold"
                classList={{
                  'text-dodaat-skip': !armed(),
                  'bg-dodaat-skip text-white': armed(),
                }}
                disabled={noteCount() === 0}
                title={noteCount() === 0 ? 'No notes to clear' : ''}
                onClick={() => (armed() ? confirmClear() : arm())}
              >
                {armed() ? 'Confirm delete all notes' : 'Clear all'}
              </button>
              {/* Click-away backdrop — visible only while armed */}
              <Show when={armed()}>
                <div
                  class="fixed inset-0 z-40"
                  onClick={disarm}
                  aria-hidden="true"
                />
              </Show>
            </div>
          </div>
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
          <CardList selectedId={selected()?.id ?? null} onSelect={setSelected} notes={notes} />
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
