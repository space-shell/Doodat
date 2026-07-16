import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { emit } from '../streams/intents';
import { setSettingsOpen, resetDrafts } from './drafts';
import { FLAGS } from '../config/flags';
import {
  loadKeyPair,
  generateKeyPair,
  saveKeyPair,
  derivePublicKey,
  isValidSecretKey,
} from '../nostr/keys';

const truncate = (hex: string, head = 12, tail = 8) =>
  hex.length > head + tail ? `${hex.slice(0, head)}…${hex.slice(-tail)}` : hex;

const SettingsView: Component = () => {
  const resetToWizard = () => {
    resetDrafts();
    setSettingsOpen(false);
    emit({ type: 'RESET_DAY_TO_WIZARD' });
  };

  const key = FLAGS.NOSTR_IDENTITY ? loadKeyPair() : null;
  const [showPriv, setShowPriv] = createSignal(false);
  const [importSk, setImportSk] = createSignal('');
  const [importError, setImportError] = createSignal('');
  const [copied, setCopied] = createSignal('');

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const regenerate = () => {
    if (!window.confirm('Generate a new identity? Your deck seed changes and your current day is reset.')) return;
    saveKeyPair(generateKeyPair());
    window.location.reload();
  };

  const importKey = () => {
    const sk = importSk().trim().toLowerCase();
    if (!isValidSecretKey(sk)) {
      setImportError('Not a valid 64-character hex private key.');
      return;
    }
    saveKeyPair({ sk, pk: derivePublicKey(sk) });
    window.location.reload();
  };

  return (
    <article class="neu-raised w-full max-w-md p-6 flex flex-col gap-6" data-testid="settings-view">
      <h2 class="text-lg font-bold text-dodaat-textPrimary">Settings</h2>

      <Show when={key}>
        <section class="flex flex-col gap-3" data-testid="nostr-keys">
          <h3 class="text-sm font-semibold text-dodaat-textSecondary">Nostr identity</h3>

          <div class="flex items-center justify-between gap-3">
            <code class="text-xs text-dodaat-textMuted break-all">{truncate(key!.pk)}</code>
            <button
              class="neu-button px-3 py-2 text-xs font-semibold text-dodaat-textSecondary whitespace-nowrap"
              onClick={() => copy('pub', key!.pk)}
            >
              {copied() === 'pub' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div class="flex flex-col gap-2">
            <button
              class="neu-button px-3 py-2 text-xs font-semibold text-dodaat-textSecondary text-left"
              onClick={() => setShowPriv((v) => !v)}
            >
              {showPriv() ? 'Hide' : 'Show'} private key
            </button>
            <Show when={showPriv()}>
              <div class="flex items-center justify-between gap-3">
                <code class="text-xs text-dodaat-goldDark break-all">{key!.sk}</code>
                <button
                  class="neu-button px-3 py-2 text-xs font-semibold text-dodaat-textSecondary whitespace-nowrap"
                  onClick={() => copy('priv', key!.sk)}
                >
                  {copied() === 'priv' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p class="text-xs text-dodaat-textMuted">
                Anyone with this key controls your identity. Don't share it.
              </p>
            </Show>
          </div>

          <button
            class="neu-button px-3 py-2 text-xs font-semibold text-dodaat-textSecondary text-left"
            onClick={regenerate}
            data-testid="regen-key-btn"
          >
            Regenerate identity
          </button>

          <div class="flex flex-col gap-2">
            <label class="text-xs text-dodaat-textMuted">Import private key</label>
            <input
              class="neu-inset px-3 py-2 text-xs text-dodaat-textPrimary font-mono"
              placeholder="64-char hex"
              value={importSk()}
              onInput={(e) => { setImportSk(e.currentTarget.value); setImportError(''); }}
            />
            <Show when={importError()}>
              <p class="text-xs text-dodaat-goldDark">{importError()}</p>
            </Show>
            <button
              class="neu-button px-3 py-2 text-xs font-semibold text-dodaat-textSecondary"
              onClick={importKey}
              data-testid="import-key-btn"
            >
              Import key
            </button>
          </div>
        </section>
      </Show>

      <button
        class="neu-button py-4 px-6 text-sm font-semibold text-dodaat-textSecondary"
        onClick={resetToWizard}
        data-testid="reset-day-btn"
      >
        Reset day to setup wizard
      </button>
    </article>
  );
};

export default SettingsView;
