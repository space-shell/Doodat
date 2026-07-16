import type { Component } from 'solid-js';
import { createMemo, createSignal, Show } from 'solid-js';
import { Transition } from 'solid-transition-group';
import { state } from './store';
import { isContentCard } from './types';
import ContentCardView from './components/ContentCardView';
import CardNav from './components/CardNav';
import BottomBar from './components/BottomBar';
import Onboarding from './components/Onboarding';
import IntensitySelect from './components/IntensitySelect';
import CompletionSummary from './components/CompletionSummary';
import SettingsView from './components/SettingsView';
import LoadingCard from './components/LoadingCard';
import { settingsOpen } from './components/drafts';
import { neuOnEnter, neuOnExit } from './neuTransition';

const App: Component = () => {
  const current = () => state.deck[state.currentIndex];

  const viewKey = createMemo(() => {
    if (settingsOpen()) return 'settings';
    const c = current();
    if (!c) return 'loading';
    if (isContentCard(c)) return `content:${c.id}`;
    return c.type;
  });

  const [settledKey, setSettledKey] = createSignal(viewKey());
  const [isExiting, setExiting] = createSignal(false);

  const showCardNav = createMemo(() => {
    const k = settledKey();
    return k.startsWith('content:') || k === 'settings';
  });

  const showBottomBar = createMemo(() => {
    const k = settledKey();
    return k !== 'loading' && !k.startsWith('content:') && k !== 'settings';
  });

  const settledCardType = createMemo(() => {
    const k = settledKey();
    if (k.startsWith('content:') || k === 'settings' || k === 'loading') return undefined;
    return k;
  });

  const bootMode = createMemo(() =>
    state.bootPhase === 'loading' ? 'loading' : state.bootPhase === 'error' ? 'error' : null,
  );

  return (
    <Show
      when={bootMode() === null}
      fallback={<LoadingCard mode={bootMode() as 'loading' | 'error'} />}
    >
      <main class="min-h-dvh flex flex-col items-center p-6">
      <Show when={current()} fallback={<p class="text-dodaat-textMuted">Loading…</p>}>
        <div class="w-full max-w-md flex-1 flex flex-col">
          <Show when={showCardNav()}>
            <div class="pt-2 pb-4 neu-fade-in">
              <CardNav />
            </div>
          </Show>

          <div class="flex-1 flex flex-col justify-center py-4">
            <Transition
              onEnter={neuOnEnter}
              onExit={(el, done) => { setExiting(true); neuOnExit(el, done); }}
              onAfterExit={() => { setExiting(false); setSettledKey(viewKey()); }}
              mode="outin"
              appear
            >
              <Show when={viewKey()} keyed>
                {(key) => {
                  if (key === 'settings') return <SettingsView />;
                  if (key === 'loading') return <p class="text-dodaat-textMuted">Loading…</p>;

                  const c = current();
                  if (!c) return null;

                  if (isContentCard(c)) return <ContentCardView card={c} />;

                  if (c.type === 'welcome' || c.type.startsWith('wizard_'))
                    return <Onboarding card={c} />;
                  if (c.type === 'intensity_select') return <IntensitySelect mode="daily" />;
                  if (c.type === 'completion') return <CompletionSummary />;
                  return null;
                }}
              </Show>
            </Transition>
          </div>

          <Show when={showBottomBar()}>
            <div
              class="pb-2 pt-4 neu-fade-in transition-opacity duration-200 ease-out"
              style={{ opacity: isExiting() ? '0' : '1' }}
            >
              <BottomBar cardType={settledCardType()} />
            </div>
          </Show>
        </div>
      </Show>
    </main>
    </Show>
  );
};

export default App;
