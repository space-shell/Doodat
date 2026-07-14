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
import SettingsView from './components/SettingsView';
import { settingsOpen } from './components/drafts';

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
    <main class="min-h-dvh flex flex-col items-center p-6">
      <Show when={current()} fallback={<p class="text-dodaat-textMuted">Loading…</p>}>
        <div class="w-full max-w-md flex-1 flex flex-col">
          {/* Top — card navigation (content cards only; stays visible when settings open) */}
          <Show when={contentCard()}>
            <div class="pt-2 pb-4">
              <CardNav />
            </div>
          </Show>

          {/* Middle — card content or settings */}
          <div class="flex-1 flex flex-col py-4">
            <Show when={settingsOpen()} fallback={
              <Switch>
                <Match when={contentCard()}>
                  {(card) => <ContentCardView card={card()} />}
                </Match>
                <Match when={onboardingCard()}>
                  {(card) => (
                    <div class="flex-1 flex items-center justify-center w-full">
                      <Onboarding card={card()} />
                    </div>
                  )}
                </Match>
                <Match when={isIntensity()}>
                  <div class="flex-1 flex items-center justify-center w-full">
                    <IntensitySelect mode="daily" />
                  </div>
                </Match>
                <Match when={isAccountability()}>
                  <div class="flex-1 flex items-center justify-center w-full">
                    <AccountabilityCard />
                  </div>
                </Match>
                <Match when={isCompletion()}>
                  <div class="flex-1 flex items-center justify-center w-full">
                    <CompletionSummary />
                  </div>
                </Match>
              </Switch>
            }>
              <SettingsView />
            </Show>
          </div>

          {/* Bottom — action bar (hidden for content cards and settings) */}
          <Show when={!settingsOpen() && !contentCard()}>
            <div class="pb-2 pt-4">
              <BottomBar />
            </div>
          </Show>
        </div>
      </Show>
    </main>
  );
};

export default App;
