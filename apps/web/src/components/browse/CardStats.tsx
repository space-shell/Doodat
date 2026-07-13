import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { countByDomain } from '@doodat/cards';

const DOMAIN_LABEL = { physical: 'Physical', mental: 'Mental', spiritual: 'Spiritual' } as const;
const DOMAIN_DOT = {
  physical: 'bg-dodaat-physical',
  mental: 'bg-dodaat-mental',
  spiritual: 'bg-dodaat-spiritual',
} as const;

const CardStats: Component = () => {
  const byDomain = () => countByDomain();
  const total = () => byDomain().physical + byDomain().mental + byDomain().spiritual;

  return (
    <section data-testid="card-stats" class="space-y-4">
      <div>
        <h2 class="text-xs font-semibold tracking-widest uppercase text-dodaat-textMuted mb-2">
          Total cards
        </h2>
        <div class="neu-inset rounded-card px-5 py-4">
          <span class="text-3xl font-bold text-dodaat-textPrimary">{total()}</span>
        </div>
      </div>

      <div>
        <h2 class="text-xs font-semibold tracking-widest uppercase text-dodaat-textMuted mb-2">
          By domain
        </h2>
        <div class="grid grid-cols-3 gap-3">
          <For each={Object.keys(DOMAIN_LABEL) as ('physical' | 'mental' | 'spiritual')[]}>
            {(domain) => (
              <div data-testid={`stat-domain-${domain}`} class="neu-raised rounded-card p-4 text-center">
                <span class={`inline-block w-3 h-3 rounded-full mb-2 ${DOMAIN_DOT[domain]}`} />
                <div class="text-2xl font-bold text-dodaat-textPrimary">{byDomain()[domain]}</div>
                <div class="text-xs font-semibold uppercase tracking-wide text-dodaat-textMuted">
                  {DOMAIN_LABEL[domain]}
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
};

export default CardStats;
