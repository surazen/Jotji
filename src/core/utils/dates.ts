/** Human-friendly relative timestamps for note cards and headers. */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function formatRelativeTime(epochMs: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - epochMs);
  if (diff < MIN) return 'just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / MIN);
    return `${m}m ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h}h ago`;
  }
  if (diff < 2 * DAY) return 'Yesterday';
  if (diff < 7 * DAY) {
    const d = Math.floor(diff / DAY);
    return `${d}d ago`;
  }
  const date = new Date(epochMs);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/** Greeting for the home header ("Morning," etc.) based on local hour. */
export function greeting(now: number = Date.now()): string {
  const h = new Date(now).getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}
