import type { Component } from 'solid-js';
import { emit } from '../streams/intents';
import { setSettingsOpen, resetDrafts } from './drafts';

const SettingsView: Component = () => {
  const resetToWizard = () => {
    resetDrafts();
    setSettingsOpen(false);
    emit({ type: 'RESET_DAY_TO_WIZARD' });
  };

  return (
    <article class="neu-raised w-full max-w-md p-6 flex flex-col gap-6" data-testid="settings-view">
      <h2 class="text-lg font-bold text-dodaat-textPrimary">Settings</h2>
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
