/**
 * App lock backed by device biometrics / passcode (expo-local-authentication).
 *
 * Because Jotji has no account login, this is the primary gate protecting notes
 * on a shared/unlocked device. It is opt-in via Settings and enforced by the
 * AppGate / AppLockOverlay on cold start and when returning from background.
 */
import * as LocalAuthentication from 'expo-local-authentication';

/** True when the device can perform some form of local authentication. */
export async function canUseAppLock(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    // No biometric sensor, but a device passcode can still gate via fallback.
    return LocalAuthentication.getEnrolledLevelAsync().then(
      (lvl) => lvl !== LocalAuthentication.SecurityLevel.NONE,
    );
  }
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (enrolled) return true;
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  return level !== LocalAuthentication.SecurityLevel.NONE;
}

/**
 * Prompt the user to authenticate. Falls back to the device passcode when no
 * biometric is enrolled. Returns true only on a successful authentication.
 */
export async function authenticate(
  reason = 'Unlock Jotji',
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      // Allow device PIN/pattern/password when biometrics are unavailable.
      disableDeviceFallback: false,
      fallbackLabel: 'Use device passcode',
    });
    return result.success;
  } catch {
    return false;
  }
}
