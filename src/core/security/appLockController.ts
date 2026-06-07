/**
 * Coordinates app-lock behavior across intentional system interactions.
 *
 * The app re-locks when it returns to the foreground (see AppLockGate). But many
 * normal actions briefly background the app — the image picker, the share sheet,
 * the document picker, the OS auth prompt itself. Re-locking on return from those
 * would force the user to re-authenticate mid-flow. Callers wrap such actions in
 * `runProtected()` (or begin/end) so the gate skips re-locking while one is active
 * and for a short grace window afterwards.
 */

let activeCount = 0;
let lastEndedAt = 0;

/** Grace window after a protected interaction ends, in ms. */
const GRACE_MS = 1500;

/** Mark the start of a protected interaction; returns a release function. */
export function beginProtectedInteraction(): () => void {
  activeCount += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeCount = Math.max(0, activeCount - 1);
    lastEndedAt = Date.now();
  };
}

/** Run an async action as a protected interaction (auto-releases). */
export async function runProtected<T>(action: () => Promise<T>): Promise<T> {
  const release = beginProtectedInteraction();
  try {
    return await action();
  } finally {
    release();
  }
}

/** True if the app lock should NOT re-engage right now (interaction in flight). */
export function isAppLockSuppressed(): boolean {
  return activeCount > 0 || Date.now() - lastEndedAt < GRACE_MS;
}
