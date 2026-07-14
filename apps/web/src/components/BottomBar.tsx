import type { Component } from 'solid-js';
import { Switch, Match } from 'solid-js';
import { emit } from '../streams/intents';
import { physicalAreas, fasting, mentalAreas, writing, proximity, traditions, intensity } from './drafts';
import type { PhysicalPreferences } from '@doodat/cards';

const BTN = 'neu-button w-full py-3 text-sm font-semibold text-dodaat-goldDark';

const BottomBar: Component<{ cardType?: string }> = (props) => {
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
      <Match when={props.cardType === 'welcome'}>
        <button data-testid="begin" class={BTN} onClick={() => emit({ type: 'ADVANCE' })}>
          Begin
        </button>
      </Match>

      <Match when={props.cardType === 'wizard_physical'}>
        <button data-testid="confirm" class={BTN} onClick={commitPhysical}>
          Confirm
        </button>
      </Match>

      <Match when={props.cardType === 'wizard_mental'}>
        <button data-testid="confirm" class={BTN} onClick={commitMental}>
          Confirm
        </button>
      </Match>

      <Match when={props.cardType === 'wizard_spiritual'}>
        <button data-testid="confirm" class={BTN} onClick={commitSpiritual}>
          Confirm
        </button>
      </Match>

      <Match when={props.cardType === 'wizard_intensity'}>
        <button data-testid="confirm-intensity" class={BTN} onClick={() => emit({ type: 'SET_INTENSITY', intensity: intensity() })}>
          Begin practice
        </button>
      </Match>

      <Match when={props.cardType === 'intensity_select'}>
        <button data-testid="confirm-intensity" class={BTN} onClick={() => emit({ type: 'SET_INTENSITY', intensity: intensity() })}>
          Confirm for today
        </button>
      </Match>

      <Match when={props.cardType === 'accountability'}>
        <button data-testid="dismiss-accountability" class={BTN} onClick={() => emit({ type: 'DISMISS_ACCOUNTABILITY' })}>
          Continue
        </button>
      </Match>

      <Match when={props.cardType === 'completion'}>
        <button data-testid="back-to-cards-btn" class={BTN} onClick={() => emit({ type: 'NAVIGATE', index: 0 })}>
          ← Back to cards
        </button>
      </Match>
    </Switch>
  );
};

export default BottomBar;
