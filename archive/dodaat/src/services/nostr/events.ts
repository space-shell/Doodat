import { finalizeEvent, SimplePool, type Filter, type NostrEvent } from 'nostr-tools';
import type { SwipeDirection, IntensityLevel, Domain } from '../../types';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ─── Dodaat Custom Event Kinds ────────────────────────────────────────────────
// Using the 30000-39999 range for replaceable events,
// and 20000-29999 for ephemeral events.
// We use 31000+ for our custom kinds.

export const NOSTR_KINDS = {
  CARD_SWIPE: 31000,          // Daily card swipe event
  DAILY_SUMMARY: 31001,       // Daily aggregate of all card outcomes
  PRAISE_POINT: 31002,        // Praise point award
  PRESTIGE_BADGE: 31003,      // Annual prestige badge claim
  VOICE_NOTE: 1063,           // NIP-94 file metadata for voice note broadcast
  VOICE_NOTE_RESPONSE: 4,     // NIP-44 encrypted DM for voice note response
} as const;

// ─── Relay Configuration ──────────────────────────────────────────────────────

export const RELAYS = [
  'wss://relay.dodaat.app',      // Product-owned relay (primary)
  'wss://relay.damus.io',        // Public relay 1
  'wss://nos.lol',               // Public relay 2
];

let pool: SimplePool | null = null;

export function getPool(): SimplePool {
  if (!pool) {
    pool = new SimplePool();
  }
  return pool;
}

// ─── Event Builders ───────────────────────────────────────────────────────────

export interface CardSwipeEventData {
  cardId: string;
  domain: Domain;
  direction: SwipeDirection;
  intensity: IntensityLevel;
  timestamp: number;
}

export function buildCardSwipeEvent(
  data: CardSwipeEventData,
  privateKeyHex: string
) {
  const event = {
    kind: NOSTR_KINDS.CARD_SWIPE,
    created_at: Math.floor(data.timestamp / 1000),
    tags: [
      ['card_id', data.cardId],
      ['domain', data.domain],
      ['direction', data.direction],
      ['intensity', data.intensity],
    ],
    content: JSON.stringify(data),
  };
  return finalizeEvent(event, hexToBytes(privateKeyHex));
}

export interface DailySummaryEventData {
  date: string;
  outcomes: Array<{
    cardId: string;
    domain: Domain;
    direction: SwipeDirection;
    intensity: IntensityLevel;
    timestamp: number;
  }>;
  totalComplete: number;
  totalSkipped: number;
}

export function buildDailySummaryEvent(
  data: DailySummaryEventData,
  privateKeyHex: string
) {
  const event = {
    kind: NOSTR_KINDS.DAILY_SUMMARY,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['date', data.date]],
    content: JSON.stringify(data),
  };
  return finalizeEvent(event, hexToBytes(privateKeyHex));
}

export interface PraisePointEventData {
  recipientPubkey: string;
  voiceNoteEventId: string;
  points: number;
}

export function buildPraisePointEvent(
  data: PraisePointEventData,
  privateKeyHex: string
) {
  const event = {
    kind: NOSTR_KINDS.PRAISE_POINT,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['p', data.recipientPubkey],
      ['e', data.voiceNoteEventId],
    ],
    content: JSON.stringify({ points: data.points }),
  };
  return finalizeEvent(event, hexToBytes(privateKeyHex));
}

export interface VoiceNoteEventData {
  audioUrl: string;
  mimeType: 'audio/opus' | 'audio/aac';
  size: number;
  duration: number; // seconds
  hash: string; // sha256 of audio file
}

export function buildVoiceNoteEvent(
  data: VoiceNoteEventData,
  privateKeyHex: string
) {
  const event = {
    kind: NOSTR_KINDS.VOICE_NOTE,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['url', data.audioUrl],
      ['m', data.mimeType],
      ['size', String(data.size)],
      ['duration', String(data.duration)],
      ['x', data.hash],
      ['dodaat', 'accountability'],
    ],
    content: '',
  };
  return finalizeEvent(event, hexToBytes(privateKeyHex));
}

// ─── Publishing ───────────────────────────────────────────────────────────────

export async function publishEvent(
  event: ReturnType<typeof finalizeEvent>
): Promise<void> {
  const pool = getPool();
  await Promise.allSettled(
    RELAYS.map((relay) => pool.publish([relay], event))
  );
}

// ─── Subscribing ─────────────────────────────────────────────────────────────

export function subscribeToVoiceNotes(
  pubkey: string,
  onVoiceNote: (event: NostrEvent) => void
) {
  const pool = getPool();
  const filter = {
    kinds: [NOSTR_KINDS.VOICE_NOTE],
    since: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
    '#p': [pubkey],
  } as unknown as Filter;

  const sub = pool.subscribeMany(RELAYS, filter, {
    onevent(event) {
      onVoiceNote(event);
    },
  });
  return sub;
}

export function subscribeToPraisePoints(
  pubkey: string,
  onPraisePoint: (event: NostrEvent) => void
) {
  const pool = getPool();
  const filter = {
    kinds: [NOSTR_KINDS.PRAISE_POINT],
    '#p': [pubkey],
  } as unknown as Filter;

  const sub = pool.subscribeMany(RELAYS, filter, {
    onevent(event) {
      onPraisePoint(event);
    },
  });
  return sub;
}
