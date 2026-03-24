import React from 'react';
import { useAppInit } from './src/hooks/useAppInit';
import { DeckScreen } from './src/screens/DeckScreen';

export default function App() {
  useAppInit();
  return <DeckScreen />;
}
