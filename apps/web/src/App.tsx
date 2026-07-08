import type { Component } from 'solid-js';
import { createMemo, Switch, Match, Show } from 'solid-js';
import { state } from './store';
import { isContentCard } from './types';
import ContentCardView from './components/ContentCardView';
import CardNav from './components/CardNav';
import BottomBar from './components/BottomBar';
import Onboarding from './components/Onboarding';
import IntensitySelect from './components/IntensitySelect';
import AccountabilityCard from './components/AccountabilityCard';
import CompletionSummary from './components/CompletionSummary';

const isWizardType = (type: string) => type === 'welcome' || type.startsWith('wizard_');

const App: Component = () => {
  const current = () => state.deck[state.currentIndex];

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
    <main class="min-h-screen flex flex-col items-center p-6">
      <Show when={current()} fallback={<p class="text-dodaat-textMuted">Loading…</p>}>
        <div class="w-full max-w-md flex-1 flex flex-col">
          {/* Top — card navigation grid (content cards only) */}
          <Show when={contentCard()}>
            <div class="pt-2 pb-4">
              <CardNav />
            </div>
          </Show>

          {/* Middle — card content, vertically centered */}
          <div class="flex-1 flex items-center justify-center py-4">
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
          </div>

          {/* Bottom — action / navigation bar */}
          <div class="pb-2 pt-4">
            <BottomBar />
          </div>
        </div>
      </Show>
    </main>
  );
};

export default App;
