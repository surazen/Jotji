/**
 * Build a safe FTS5 MATCH expression from raw user search input.
 *
 * FTS5's MATCH mini-language has its own operators (AND, OR, NOT, NEAR, `*`,
 * `^`, `:`, `-`, quotes, parentheses). Passing raw user text straight into
 * MATCH can throw syntax errors or be abused, so we extract only
 * letter/number tokens, quote each as a literal phrase (escaping embedded
 * quotes), and append `*` for prefix/type-ahead matching. Tokens are ANDed.
 *
 * Returns `null` when the input has no searchable tokens, so callers can decide
 * to show the full list instead of running an empty MATCH.
 */
export function buildFtsMatchQuery(input: string): string | null {
  const tokens = input.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu);
  if (!tokens || tokens.length === 0) return null;
  return tokens.map((t) => `"${t.replace(/"/g, '""')}"*`).join(' ');
}
