// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateKeyPair,
  derivePublicKey,
  isValidSecretKey,
  loadKeyPair,
  saveKeyPair,
  clearKeyPair,
} from './keys';

// A fixed, well-formed 32-byte hex secret key (contains a–f letters so an
// uppercase variant is meaningfully different) for deterministic assertions.
const SK =
  '0a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f6789';
const PK_FIXTURE = derivePublicKey(SK); // stable across runs for a fixed sk

beforeEach(() => {
  localStorage.clear();
});

describe('isValidSecretKey', () => {
  it('accepts a 64-char lowercase hex string', () => {
    expect(isValidSecretKey(SK)).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(isValidSecretKey('abc')).toBe(false);
    expect(isValidSecretKey(SK + '00')).toBe(false);
  });

  it('rejects non-hex / uppercase', () => {
    expect(isValidSecretKey('z'.repeat(64))).toBe(false);
    expect(isValidSecretKey(SK.toUpperCase())).toBe(false);
  });
});

describe('generateKeyPair', () => {
  it('returns a 64-char hex sk and a 64-char hex pk', () => {
    const kp = generateKeyPair();
    expect(kp.sk).toMatch(/^[0-9a-f]{64}$/);
    expect(kp.pk).toMatch(/^[0-9a-f]{64}$/);
  });

  it('sk and pk are consistent: pk === derivePublicKey(sk)', () => {
    const kp = generateKeyPair();
    expect(kp.pk).toBe(derivePublicKey(kp.sk));
  });

  it('is non-deterministic (two calls differ)', () => {
    expect(generateKeyPair().sk).not.toBe(generateKeyPair().sk);
  });
});

describe('derivePublicKey', () => {
  it('is deterministic for a fixed secret key', () => {
    expect(derivePublicKey(SK)).toBe(PK_FIXTURE);
    expect(derivePublicKey(SK)).toBe(PK_FIXTURE);
  });
});

describe('storage round-trip', () => {
  it('returns null when nothing is stored', () => {
    expect(loadKeyPair()).toBeNull();
  });

  it('save then load returns the same pair', () => {
    const kp = generateKeyPair();
    saveKeyPair(kp);
    expect(loadKeyPair()).toEqual(kp);
  });

  it('clear removes the stored pair', () => {
    const kp = generateKeyPair();
    saveKeyPair(kp);
    clearKeyPair();
    expect(loadKeyPair()).toBeNull();
  });

  it('load returns null when the stored JSON is malformed', () => {
    localStorage.setItem('dodaat_nostr_key', '{not json');
    expect(loadKeyPair()).toBeNull();
  });

  it('load returns null when sk is malformed', () => {
    saveKeyPair({ sk: 'nothex' + '0'.repeat(57), pk: PK_FIXTURE });
    expect(loadKeyPair()).toBeNull();
  });

  it('load returns null when sk and pk do not correspond (tampered pk)', () => {
    const real = generateKeyPair();
    // swap in an unrelated valid-hex pk
    const foreignPk = derivePublicKey(
      '0a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f6aaa',
    );
    saveKeyPair({ sk: real.sk, pk: foreignPk });
    expect(loadKeyPair()).toBeNull();
  });
});
