import type { Component } from 'solid-js';
import { Switch, Match } from 'solid-js';
import { state } from '../store';
import { emit } from '../streams/intents';
import { isContentCard } from '../types';
import { physicalAreas, fasting, mentalAreas, writing, proximity, traditions, intensity } from './drafts';
import type { PhysicalPreferences } from '@doodat/cards';

const BTN = 'neu-button w-full py-3 text-sm font-semibold text-dodaat-goldDark';

const BottomBar: Component = () => {
  const card = () => state.deck[state.currentIndex];
  const isContent = () => {
    const c = card();
    return !!c && isContentCard(c);
  };

  const commitPhysical = () => {
    emit({ type: 'SET_PREFERENCES', preferences: { physical: { focusAreas: physicalAreas() as PhysicalPreferences['focusAreas'], fastingInterest: fasting(), dietaryPreferences: [] } } });
    emit({ type: 'ADVANCE' });
  };
  const commitMental = () => {
    emit({ type: 'SET_PREFERENCES', preferences: { mental: { challenges: mentalAreas() as never, readingPreferences: [], writingComfort: writing() } } });
    emit({ type: 'ADVANCE' });
  };
  const commitSpiritual = () => {
    emit({ type: 'SET_PREFERENCES', preferences: { spiritual: { traditionProximity: proximity(), traditions: traditions() } } });
    emit({ type: 'ADVANCE' });
  };

  return (
    <Switch>
      <Match when={isContent()}>
        <div class="flex gap-3">
          <button
            data-testid="back-btn"
            class="neu-button flex-1 py-3 text-sm font-semibold text-dodaat-textSecondary disabled:opacity-40"
            disabled={state.currentIndex === 0}
            onClick={() => emit({ type: 'NAVIGATE', index: state.currentIndex - 1 })}
          >
            ← Back
          </button>
          <button
            data-testid="forward-btn"
            class="neu-button flex-1 py-3 text-sm font-semibold text-dodaat-textSecondary disabled:opacity-40"
            disabled={state.currentIndex >= state.deck.length - 1}
            onClick={() => emit({ type: 'NAVIGATE', index: state.currentIndex + 1 })}
          >
            Forward →
          </button>
        </div>
      </Match>

      <Match when={card()?.type === 'welcome'}>
        <button data-testid="begin" class={BTN} onClick={() => emit({ type: 'ADVANCE' })}>
          Begin
        </button>
      </Match>

      <Match when={card()?.type === 'wizard_physical'}>
        <button data-testid="confirm" class={BTN} onClick={commitPhysical}>
          Confirm
        </button>
      </Match>

      <Match when={card()?.type === 'wizard_mental'}>
        <button data-testid="confirm" class={BTN} onClick={commitMental}>
          Confirm
        </button>
      </Match>

      <Match when={card()?.type === 'wizard_spiritual'}>
        <button data-testid="confirm" class={BTN} onClick={commitSpiritual}>
          Confirm
        </button>
      </Match>

      <Match when={card()?.type === 'wizard_intensity'}>
        <button data-testid="confirm-intensity" class={BTN} onClick={() => emit({ type: 'SET_INTENSITY', intensity: intensity() })}>
          Begin practice
        </button>
      </Match>

      <Match when={card()?.type === 'intensity_select'}>
        <button data-testid="confirm-intensity" class={BTN} onClick={() => emit({ type: 'SET_INTENSITY', intensity: intensity() })}>
          Confirm for this week
        </button>
      </Match>

      <Match when={card()?.type === 'accountability'}>
        <button data-testid="dismiss-accountability" class={BTN} onClick={() => emit({ type: 'DISMISS_ACCOUNTABILITY' })}>
          Continue
        </button>
      </Match>

      <Match when={card()?.type === 'completion'}>
        <button data-testid="back-to-cards-btn" class={BTN} onClick={() => emit({ type: 'NAVIGATE', index: 0 })}>
          ← Back to cards
        </button>
      </Match>
    </Switch>
  );
};

export default BottomBar;
