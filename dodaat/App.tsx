import React from 'react';
import { useAppInit } from './src/hooks/useAppInit';
import { DeckScreen } from './src/screens/DeckScreen';
import { useDoodaatStore } from './src/store';

// Expose the store on window in non-production builds for Playwright tests.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as any).__dodaatStore = useDoodaatStore;
}

export default function App() {
  useAppInit();
  return <DeckScreen />;
}
