// Per-card reviewer notes — a small Solid store backed by localStorage.
// Kept separate from the ritual state machine (streams/reducer): notes are
// tangential CRUD with no time-based/event-flow semantics, so routing them
// through intent → reducer → state$ would pollute that pipeline.
import { createStore, reconcile } from 'solid-js/store';
import { createEffect } from 'solid-js';

const KEY = 'dodaat_card_notes';

const read = (): Record<string, string> => {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Record<string, string>) : {};
};

const write = (notes: Record<string, string>) =>
  localStorage.setItem(KEY, JSON.stringify(notes));

/** Pure helper: return a new notes record with `id → text` set (or cleared). */
export function withNote(
  record: Record<string, string>,
  id: string,
  text: string,
): Record<string, string> {
  const next = { ...record };
  if (text.trim().length === 0) delete next[id];
  else next[id] = text;
  return next;
}

const seed = read();
const [notes, setNotes] = createStore<Record<string, string>>(seed);

// Persist on any change.
createEffect(() => write({ ...notes }));

/**
 * Replace the store wholesale. reconcile() gives replacement semantics so
 * keys absent from the new object are removed reactively — a plain
 * setNotes(obj) would *merge*, leaving "deleted" keys visible to the UI.
 */
function replace(next: Record<string, string>): void {
  setNotes(reconcile(next));
}

/** The current note for a card, or '' if none. */
export function getNote(id: string): string {
  return notes[id] ?? '';
}

/** Set (or clear, when blank) the note for a card. */
export function setNote(id: string, text: string): void {
  replace(withNote({ ...notes }, id, text));
}

/** Remove the note for a card. */
export function clearNote(id: string): void {
  replace(withNote({ ...notes }, id, ''));
}

/** Remove every note. */
export function clearAllNotes(): void {
  replace({});
}

/** Number of cards with a note. */
export function noteCount(): number {
  return Object.keys(notes).length;
}

export { notes };
