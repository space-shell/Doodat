import { createSignal } from 'solid-js';
import type { IntensityLevel } from '@doodat/cards';

export const [physicalAreas, setPhysicalAreas] = createSignal<string[]>([]);
export const [fasting, setFasting] = createSignal(false);
export const [mentalAreas, setMentalAreas] = createSignal<string[]>([]);
export const [writing, setWriting] = createSignal(true);
export const [proximity, setProximity] = createSignal(50);
export const [traditions, setTraditions] = createSignal<string[]>([]);
export const [intensity, setIntensity] = createSignal<IntensityLevel>('medium');

export const [settingsOpen, setSettingsOpen] = createSignal(false);

export function resetDrafts(): void {
  setPhysicalAreas([]);
  setFasting(false);
  setMentalAreas([]);
  setWriting(true);
  setProximity(50);
  setTraditions([]);
  setIntensity('medium');
}
