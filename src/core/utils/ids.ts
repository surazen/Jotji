import * as Crypto from 'expo-crypto';

/** Cryptographically-random UUID v4 for primary keys. */
export function newId(): string {
  return Crypto.randomUUID();
}

/** Current time as epoch milliseconds. */
export function nowMs(): number {
  return Date.now();
}
