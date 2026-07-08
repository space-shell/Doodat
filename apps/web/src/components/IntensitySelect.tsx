import type { Component } from 'solid-js';
import { For } from 'solid-js';
import type { IntensityLevel } from '@doodat/cards';
import { intensity, setIntensity } from './drafts';

const OPTIONS: { level: IntensityLevel; label: string; desc: string }[] = [
  { level: 'low', label: 'Low', desc: '≤ 5 min — minimal effort, accessible to anyone' },
  { level: 'medium', label: 'Medium', desc: '10–20 min — focused, intentional' },
  { level: 'high', label: 'High', desc: '20–30+ min — genuinely demanding' },
];

const IntensitySelect: Component<{ mode: 'onboarding' | 'weekly' }> = (props) => {
  return (
    <article data-testid="intensity-card" class="neu-raised w-full max-w-md p-6">
      <h2 class="text-xl font-bold text-dodaat-textPrimary">
        {props.mode === 'onboarding' ? 'Choose your intensity' : 'Weekly intensity'}
      </h2>
      <p class="mt-1 text-sm text-dodaat-textMuted">How hard should this week's practices push?</p>

      <div class="mt-6 space-y-3">
        <For each={OPTIONS}>
          {(opt) => (
            <button
              data-testid={`intensity-${opt.level}`}
              class={`w-full text-left p-4 rounded-button transition ${intensity() === opt.level ? 'neu-inset ring-2 ring-dodaat-gold' : 'neu-button'}`}
              onClick={() => setIntensity(opt.level)}
            >
              <div class="font-semibold text-dodaat-textPrimary">{opt.label}</div>
              <div class="text-xs text-dodaat-textMuted mt-1">{opt.desc}</div>
            </button>
          )}
        </For>
      </div>
    </article>
  );
};

export default IntensitySelect;
