import * as SecureStore from 'expo-secure-store';
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
import type { NostrKeypair } from '../../types';

// hex utilities (inline to avoid @noble/hashes module resolution issues)
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

const PRIVATE_KEY_STORE_KEY = 'dodaat_nostr_private_key';

/**
 * Generate a new Nostr keypair and persist it securely.
 */
export async function generateAndStoreKeypair(): Promise<NostrKeypair> {
  const secretKey = generateSecretKey(); // Uint8Array
  const privateKeyHex = bytesToHex(secretKey);
  const publicKeyHex = getPublicKey(secretKey);

  await SecureStore.setItemAsync(PRIVATE_KEY_STORE_KEY, privateKeyHex);

  return { privateKey: privateKeyHex, publicKey: publicKeyHex };
}

/**
 * Load the persisted keypair, or generate one if none exists.
 */
export async function loadOrCreateKeypair(): Promise<NostrKeypair> {
  const stored = await SecureStore.getItemAsync(PRIVATE_KEY_STORE_KEY);

  if (stored) {
    const secretKey = hexToBytes(stored);
    const publicKeyHex = getPublicKey(secretKey);
    return { privateKey: stored, publicKey: publicKeyHex };
  }

  return generateAndStoreKeypair();
}

/**
 * Export the private key as nsec bech32 for the user to back up.
 */
export async function exportNsec(): Promise<string | null> {
  const stored = await SecureStore.getItemAsync(PRIVATE_KEY_STORE_KEY);
  if (!stored) return null;
  const secretKey = hexToBytes(stored);
  return nip19.nsecEncode(secretKey);
}

/**
 * Export the public key as npub bech32.
 */
export async function exportNpub(pubkeyHex: string): Promise<string> {
  return nip19.npubEncode(pubkeyHex);
}

/**
 * Delete the stored keypair (danger: irreversible).
 */
export async function deleteKeypair(): Promise<void> {
  await SecureStore.deleteItemAsync(PRIVATE_KEY_STORE_KEY);
}
