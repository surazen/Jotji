import { describe, expect, it } from '@jest/globals';

import { buildFtsMatchQuery } from '../fts';

describe('buildFtsMatchQuery', () => {
  it('quotes tokens and appends prefix wildcards', () => {
    expect(buildFtsMatchQuery('hello world')).toBe('"hello"* "world"*');
  });

  it('returns null for empty or whitespace input', () => {
    expect(buildFtsMatchQuery('')).toBeNull();
    expect(buildFtsMatchQuery('   ')).toBeNull();
  });

  it('neutralizes FTS operators and punctuation (no injection)', () => {
    // Operators/quotes/parens must not survive as MATCH syntax.
    const out = buildFtsMatchQuery('a OR b" NEAR(c) -d*');
    expect(out).toBe('"a"* "or"* "b"* "near"* "c"* "d"*');
    expect(out).not.toContain('NEAR(');
    expect(out).not.toMatch(/[()]/);
  });

  it('returns null when only operators/punctuation are present', () => {
    expect(buildFtsMatchQuery('"" () - :')).toBeNull();
  });

  it('keeps unicode letters and numbers as tokens', () => {
    expect(buildFtsMatchQuery('café 2024')).toBe('"café"* "2024"*');
  });
});
