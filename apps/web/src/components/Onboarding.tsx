import type { Component } from 'solid-js';
import { createSignal, For, Show, Switch, Match } from 'solid-js';
import type { SystemCard } from '../types';
import type { PhysicalPreferences } from '@doodat/cards';
import { emit } from '../streams/intents';
import IntensitySelect from './IntensitySelect';

const PHYSICAL_AREAS = ['upper_body', 'lower_body', 'full_body', 'flexibility', 'cardio'] as const;
const MENTAL_AREAS = ['focus', 'anxiety', 'creativity', 'discipline'] as const;
const TRADITIONS = ['Christianity', 'Stoicism', 'Buddhism', 'Islam', 'Hinduism', 'Taoism', 'Judaism', 'Sikhism'];

const titleCase = (s: string) => s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const Onboarding: Component<{ card: SystemCard }> = (props) => {
  // Per-step draft selections (local UI ephemera — committed via SET_PREFERENCES on confirm).
  const [physicalAreas, setPhysicalAreas] = createSignal<string[]>([]);
  const [fasting, setFasting] = createSignal(false);
  const [mentalAreas, setMentalAreas] = createSignal<string[]>([]);
  const [writing, setWriting] = createSignal(true);
  const [proximity, setProximity] = createSignal(50);
  const [traditions, setTraditions] = createSignal<string[]>([]);

  const toggle = (get: () => string[], set: (v: string[]) => void, value: string) =>
    set(get().includes(value) ? get().filter((v) => v !== value) : [...get(), value]);

  // The wizard_intensity step renders the intensity selector directly.
  return (
    <Show when={props.card.type !== 'wizard_intensity'} fallback={<IntensitySelect mode="onboarding" />}>
      <article data-testid="onboarding-card" class="neu-raised w-full max-w-md p-6">
        <Switch>
          <Match when={props.card.type === 'welcome'}>
            <div class="text-center">
              <h1 class="text-3xl font-extrabold tracking-wide text-dodaat-textPrimary">dodaat</h1>
              <p class="mt-2 text-sm tracking-wide text-dodaat-textMuted">do one day at a time</p>
              <p class="mt-6 text-sm leading-relaxed text-dodaat-textSecondary">
                Nine cards a day — three for the body, three for the mind, three
                for the spirit. Complete or skip each. The deck reshuffles tomorrow.
              </p>
              <button
                data-testid="begin"
                class="neu-button w-full mt-8 py-3 text-sm font-semibold text-dodaat-goldDark"
                onClick={() => emit({ type: 'ADVANCE' })}
              >
                Begin →
              </button>
            </div>
          </Match>

          <Match when={props.card.type === 'wizard_physical'}>
            <h2 class="text-lg font-bold text-dodaat-textPrimary">Physical focus</h2>
            <p class="mt-1 text-xs text-dodaat-textMuted">Where do you want to grow? Select any.</p>
            <div class="mt-4 space-y-2">
              <For each={PHYSICAL_AREAS}>
                {(area) => (
                  <button
                    class={`w-full text-left p-3 rounded-button text-sm capitalize ${physicalAreas().includes(area) ? 'neu-inset text-dodaat-goldDark' : 'neu-button text-dodaat-textSecondary'}`}
                    onClick={() => toggle(physicalAreas, setPhysicalAreas, area)}
                  >
                    {titleCase(area)}
                  </button>
                )}
              </For>
            </div>
            <label class="flex items-center justify-between mt-4 text-sm text-dodaat-textSecondary">
              <span>Interested in fasting?</span>
              <input type="checkbox" checked={fasting()} onChange={(e) => setFasting(e.currentTarget.checked)} />
            </label>
            <button
              data-testid="confirm"
              class="neu-button w-full mt-6 py-3 text-sm font-semibold text-dodaat-goldDark"
              onClick={() => {
                emit({
                  type: 'SET_PREFERENCES',
                  preferences: {
                    physical: {
                      focusAreas: physicalAreas() as PhysicalPreferences['focusAreas'],
                      fastingInterest: fasting(),
                      dietaryPreferences: [],
                    },
                  },
                });
                emit({ type: 'ADVANCE' });
              }}
            >
              Confirm →
            </button>
          </Match>

          <Match when={props.card.type === 'wizard_mental'}>
            <h2 class="text-lg font-bold text-dodaat-textPrimary">Mental focus</h2>
            <p class="mt-1 text-xs text-dodaat-textMuted">What do you want to work on?</p>
            <div class="mt-4 space-y-2">
              <For each={MENTAL_AREAS}>
                {(area) => (
                  <button
                    class={`w-full text-left p-3 rounded-button text-sm capitalize ${mentalAreas().includes(area) ? 'neu-inset text-dodaat-goldDark' : 'neu-button text-dodaat-textSecondary'}`}
                    onClick={() => toggle(mentalAreas, setMentalAreas, area)}
                  >
                    {titleCase(area)}
                  </button>
                )}
              </For>
            </div>
            <label class="flex items-center justify-between mt-4 text-sm text-dodaat-textSecondary">
              <span>Comfortable with writing?</span>
              <input type="checkbox" checked={writing()} onChange={(e) => setWriting(e.currentTarget.checked)} />
            </label>
            <button
              data-testid="confirm"
              class="neu-button w-full mt-6 py-3 text-sm font-semibold text-dodaat-goldDark"
              onClick={() => {
                emit({
                  type: 'SET_PREFERENCES',
                  preferences: {
                    mental: {
                      challenges: mentalAreas() as never,
                      readingPreferences: [],
                      writingComfort: writing(),
                    },
                  },
                });
                emit({ type: 'ADVANCE' });
              }}
            >
              Confirm →
            </button>
          </Match>

          <Match when={props.card.type === 'wizard_spiritual'}>
            <h2 class="text-lg font-bold text-dodaat-textPrimary">Spiritual focus</h2>
            <p class="mt-1 text-xs text-dodaat-textMuted">
              How tradition-rooted vs. secular? Which traditions resonate?
            </p>

            <div class="mt-4">
              <input
                type="range"
                min="0"
                max="100"
                value={proximity()}
                onInput={(e) => setProximity(Number(e.currentTarget.value))}
                class="w-full accent-dodaat-gold"
              />
              <div class="flex justify-between text-xs text-dodaat-textMuted mt-1">
                <span>Secular</span>
                <span>{proximity()}%</span>
                <span>Tradition</span>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <For each={TRADITIONS}>
                {(t) => (
                  <button
                    class={`p-2 rounded-button text-xs ${traditions().includes(t) ? 'neu-inset text-dodaat-goldDark' : 'neu-button text-dodaat-textSecondary'}`}
                    onClick={() => toggle(traditions, setTraditions, t)}
                  >
                    {t}
                  </button>
                )}
              </For>
            </div>

            <button
              data-testid="confirm"
              class="neu-button w-full mt-6 py-3 text-sm font-semibold text-dodaat-goldDark"
              onClick={() => {
                emit({
                  type: 'SET_PREFERENCES',
                  preferences: {
                    spiritual: { traditionProximity: proximity(), traditions: traditions() },
                  },
                });
                emit({ type: 'ADVANCE' });
              }}
            >
              Confirm →
            </button>
          </Match>
        </Switch>
      </article>
    </Show>
  );
};

export default Onboarding;
