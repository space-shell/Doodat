import type { Component } from 'solid-js';
import { Show, createMemo } from 'solid-js';
import { notes, setNote, clearNote } from '../../store/notes';

const CardNotes: Component<{ cardId: string }> = (props) => {
  // Read reactively from the store proxy.
  const value = createMemo(() => notes[props.cardId] ?? '');
  const hasNote = createMemo(() => value().trim().length > 0);

  return (
    <div data-testid={`card-notes-${props.cardId}`} class="mt-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-semibold tracking-widest uppercase text-dodaat-textMuted">
          Reviewer note
        </h3>
        <Show when={hasNote()}>
          <button
            data-testid={`card-notes-clear-${props.cardId}`}
            class="text-xs font-semibold text-dodaat-skip"
            onClick={() => clearNote(props.cardId)}
          >
            Clear
          </button>
        </Show>
      </div>
      <textarea
        data-testid={`card-notes-input-${props.cardId}`}
        class="neu-inset rounded-button w-full px-4 py-3 text-sm leading-relaxed text-dodaat-textPrimary placeholder-dodaat-textMuted outline-none resize-y min-h-[96px]"
        placeholder="Observations for later revision…"
        value={value()}
        onInput={(e) => setNote(props.cardId, e.currentTarget.value)}
      />
    </div>
  );
};

export default CardNotes;
