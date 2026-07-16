import { generateSecretKey, getPublicKey } from 'nostr-tools';

/**
 * Nostr key management for the local identity. The secret key is the first
 * secret this app holds — it is stored in `localStorage` as JSON, which is
 * readable by any script on the origin (no CSP today). That is an accepted
 * trade-off for the MVP; harden behind a NIP-07 signer later.
 *
 * nostr-tools' key functions operate on `Uint8Array`, not hex; we store hex
 * (so it survives JSON serialization) and convert at the boundary. Hex
 * conversion is local rather than pulling Node's `Buffer`, which does not
 * exist in the browser build.
 */
export interface KeyPair {
  /** 64-char lowercase hex secret key. */
  sk: string;
  /** 64-char lowercase hex public key. */
  pk: string;
}

const STORAGE_KEY = 'dodaat_nostr_key';
const HEX = '0123456789abcdef';

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += HEX[bytes[i] >> 4] + HEX[bytes[i] & 0x0f];
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  if (!isValidSecretKey(hex)) {
    throw new Error('invalid 32-byte lowercase hex secret key');
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** True for a 64-char lowercase hex string (32-byte secp256k1 scalar). */
export function isValidSecretKey(sk: string): boolean {
  return /^[0-9a-f]{64}$/.test(sk);
}

/** Derive the public key (hex) from a hex secret key. */
export function derivePublicKey(sk: string): string {
  return getPublicKey(hexToBytes(sk));
}

/** Generate a fresh random key pair. */
export function generateKeyPair(): KeyPair {
  const sk = bytesToHex(generateSecretKey());
  return { sk, pk: derivePublicKey(sk) };
}

/**
 * Load the persisted key pair. Returns null when none is stored, when storage
 * is malformed, or when the stored sk does not derive to the stored pk
 * (guards against tampering / corruption).
 */
export function loadKeyPair(): KeyPair | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<KeyPair>;
    if (!parsed.sk || !parsed.pk) return null;
    if (!isValidSecretKey(parsed.sk)) return null;
    if (derivePublicKey(parsed.sk) !== parsed.pk) return null;
    return { sk: parsed.sk, pk: parsed.pk };
  } catch {
    return null;
  }
}

/** Persist a key pair. */
export function saveKeyPair(kp: KeyPair): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kp));
}

/** Remove the persisted key pair. */
export function clearKeyPair(): void {
  localStorage.removeItem(STORAGE_KEY);
}
