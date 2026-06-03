/**
 * Secure key management.
 *
 * The SQLCipher database key is a 256-bit random value generated once on first
 * launch and stored in expo-secure-store (Android Keystore-backed). It never
 * appears in source, .env, or AsyncStorage. If it is ever lost the encrypted
 * database is unrecoverable by design.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DB_KEY_NAME = 'jotji.db.encryption-key.v1';

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

/**
 * Return the database encryption key, generating and persisting it on first use.
 */
export async function getOrCreateDbKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DB_KEY_NAME, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  if (existing) return existing;

  const random = await Crypto.getRandomBytesAsync(32);
  const key = toHex(random);
  await SecureStore.setItemAsync(DB_KEY_NAME, key, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  return key;
}
