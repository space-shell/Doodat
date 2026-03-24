import { useEffect } from 'react';
import { loadOrCreateKeypair } from '../services/nostr/identity';
import { requestPermissions, scheduleDailyRitual } from '../services/notifications';
import { subscribeToVoiceNotes } from '../services/nostr/events';
import { notifyGoldCardArrival } from '../services/notifications';
import { useDoodaatStore } from '../store';
import type { GoldCard } from '../types';

/**
 * Initialises the application on first mount:
 * 1. Load or generate Nostr keypair
 * 2. Load persisted user profile and daily state
 * 3. Build the deck
 * 4. Set up notification schedule
 * 5. Subscribe to incoming Nostr voice notes
 */
export function useAppInit() {
  const { setKeypair, initializeApp, profile, setGoldCard } = useDoodaatStore();

  useEffect(() => {
    let voiceNoteSub: { close: () => void } | null = null;

    async function init() {
      // 1. Identity
      const keypair = await loadOrCreateKeypair();
      setKeypair(keypair);

      // 2. Core state
      await initializeApp(keypair);

      // 3. Notifications
      const granted = await requestPermissions();
      if (granted) {
        const time = useDoodaatStore.getState().profile?.notificationTime ?? 'morning';
        await scheduleDailyRitual(time);
      }

      // 4. Voice note subscription
      voiceNoteSub = subscribeToVoiceNotes(keypair.publicKey, (event) => {
        // Create a gold card from the incoming voice note event
        const audioUrl = event.tags.find((t) => t[0] === 'url')?.[1];
        if (!audioUrl) return;

        const goldCard: GoldCard = {
          id: 'gold-' + event.id,
          type: 'gold',
          voiceNoteId: event.id,
          audioUrl,
          nostrEventId: event.id,
          senderPubkey: event.pubkey,
          receivedAt: event.created_at * 1000,
          heard: false,
          responded: false,
        };

        setGoldCard(goldCard);
        notifyGoldCardArrival();
      });
    }

    init().catch(console.error);

    return () => {
      voiceNoteSub?.close();
    };
  }, []);
}
