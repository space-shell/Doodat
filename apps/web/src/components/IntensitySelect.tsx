import type { Component } from 'solid-js';
import { For } from 'solid-js';
import type { IntensityLevel } from '@doodat/cards';
import { intensity, setIntensity } from './drafts';

const OPTIONS: { level: IntensityLevel; label: string; desc: string }[] = [
  { level: 'low', label: 'Light', desc: '3 cards — a quick daily pass' },
  { level: 'medium', label: 'Medium', desc: '6 cards — a balanced practice' },
  { level: 'high', label: 'High', desc: '9 cards — a full daily ritual' },
];

const COUNT: Record<IntensityLevel, number> = { low: 3, medium: 6, high: 9 };

const IntensitySelect: Component<{ mode: 'onboarding' | 'weekly' }> = (props) => {
  return (
    <article data-testid="intensity-card" class="neu-raised w-full max-w-md p-6">
      <h2 class="text-xl font-bold text-dodaat-textPrimary">
        {props.mode === 'onboarding' ? 'Choose your daily load' : 'Weekly load'}
      </h2>
      <p class="mt-1 text-sm text-dodaat-textMuted">
        How many cards to draw each day. Any mix of difficulties may show up.
      </p>

      <div class="mt-6 space-y-3">
        <For each={OPTIONS}>
          {(opt) => (
            <button
              data-testid={`intensity-${opt.level}`}
              class={`w-full text-left p-4 rounded-button transition ${intensity() === opt.level ? 'neu-inset ring-2 ring-dodaat-gold' : 'neu-button'}`}
              onClick={() => setIntensity(opt.level)}
            >
              <div class="flex items-center justify-between">
                <span class="font-semibold text-dodaat-textPrimary">{opt.label}</span>
                <span class="text-xs font-bold uppercase tracking-wide text-dodaat-gold">{COUNT[opt.level]} cards</span>
              </div>
              <div class="text-xs text-dodaat-textMuted mt-1">{opt.desc}</div>
            </button>
          )}
        </For>
      </div>
    </article>
  );
};

export default IntensitySelect;
