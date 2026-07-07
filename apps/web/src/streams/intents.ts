import { Subject } from 'rxjs';
import type { Intent } from '../types';

/**
 * The single intent stream. UI emits intents here via `emit()`; the state
 * machine scans them through the reducer. Components never touch this Subject
 * directly — they import `emit`.
 */
export const intent$ = new Subject<Intent>();

/** Emit an intent into the stream (the only way UI mutates state). */
export function emit(intent: Intent): void {
  intent$.next(intent);
}
