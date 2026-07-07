import type { Component } from 'solid-js';
import { createMemo, Switch, Match, Show } from 'solid-js';
import { state } from './store';
import { isContentCard } from './types';
import ContentCardView from './components/ContentCardView';
import Onboarding from './components/Onboarding';
import IntensitySelect from './components/IntensitySelect';
import AccountabilityCard from './components/AccountabilityCard';
import CompletionSummary from './components/CompletionSummary';

const isWizardType = (type: string) => type === 'welcome' || type.startsWith('wizard_');

const App: Component = () => {
  const current = () => state.deck[state.currentIndex];

  // Per-type narrowings. Match.when takes the value; when truthy the children
  // accessor yields the narrowed, non-null card (Solid's idiomatic narrowing).
  const contentCard = createMemo(() => {
    const c = current();
    return c && isContentCard(c) ? c : undefined;
  });
  const onboardingCard = createMemo(() => {
    const c = current();
    return c && !isContentCard(c) && isWizardType(c.type) ? c : undefined;
  });
  const isIntensity = createMemo(() => current()?.type === 'intensity_select');
  const isAccountability = createMemo(() => current()?.type === 'accountability');
  const isCompletion = createMemo(() => current()?.type === 'completion');

  return (
    <main class="min-h-screen flex items-center justify-center p-6">
      <Show when={current()} fallback={<p class="text-dodaat-textMuted">Loading…</p>}>
        <Switch>
          <Match when={contentCard()}>{(card) => <ContentCardView card={card()} />}</Match>
          <Match when={onboardingCard()}>{(card) => <Onboarding card={card()} />}</Match>
          <Match when={isIntensity()}>
            <IntensitySelect mode="weekly" />
          </Match>
          <Match when={isAccountability()}>
            <AccountabilityCard />
          </Match>
          <Match when={isCompletion()}>
            <CompletionSummary />
          </Match>
        </Switch>
      </Show>
    </main>
  );
};

export default App;
