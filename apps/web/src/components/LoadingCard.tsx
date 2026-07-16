import type { Component } from 'solid-js';
import { createSignal, onCleanup, Show } from 'solid-js';

// Curated intro lines for the min-3s boot loading card. Rotated to give the
// Nostr fetch a deliberate, ritual cadence rather than exposing raw latency.
const LINES = [
  'one day at a time',
  'begin where you are',
  'a small practice, repeated',
  'body, mind, and spirit',
  'the deck reshuffles tomorrow',
];

const ROTATE_MS = 1800;
const FADE_MS = 300;

/**
 * Full-screen boot card. `loading` cycles the intro lines with a fade while the
 * Nostr fetch completes (the effect layer enforces a minimum display time).
 * `error` shows a network-failure message with a refresh action — the app hard
 * blocks here rather than falling back to local state.
 */
const LoadingCard: Component<{ mode: 'loading' | 'error' }> = (props) => {
  const [idx, setIdx] = createSignal(Math.floor(Math.random() * LINES.length));
  const [opacity, setOpacity] = createSignal(1);

  if (props.mode === 'loading') {
    const timer = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setIdx((n) => (n + 1) % LINES.length);
        setOpacity(1);
      }, FADE_MS);
    }, ROTATE_MS);
    onCleanup(() => clearInterval(timer));
  }

  return (
    <main class="min-h-dvh flex flex-col items-center justify-center p-12 text-center">
      <Show
        when={props.mode === 'loading'}
        fallback={
          <div class="flex flex-col items-center gap-6">
            <p class="text-sm text-dodaat-textSecondary">Couldn't reach the network.</p>
            <button
              class="neu-button py-3 px-6 text-sm font-semibold text-dodaat-textPrimary"
              onClick={() => window.location.reload()}
              data-testid="boot-retry-btn"
            >
              Try again
            </button>
          </div>
        }
      >
        <h1
          class="text-2xl font-extrabold tracking-wide text-dodaat-textPrimary transition-opacity"
          style={{ opacity: opacity().toString(), 'transition-duration': `${FADE_MS}ms` }}
          data-testid="boot-loading-line"
        >
          {LINES[idx()]}
        </h1>
        <p class="mt-4 text-xs text-dodaat-textMuted">preparing your day…</p>
      </Show>
    </main>
  );
};

export default LoadingCard;
