import { describe, expect, it } from '@jest/globals';

import { htmlToPlainText, sanitizeHtml } from '../htmlSanitizer';

describe('sanitizeHtml', () => {
  it('removes <script> blocks entirely', () => {
    const out = sanitizeHtml('<p>hi</p><script>alert(1)</script>');
    expect(out).toBe('<p>hi</p>');
    expect(out).not.toContain('alert');
  });

  it('strips event-handler attributes and unsafe img sources', () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)" />');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('alert');
  });

  it('drops javascript: hrefs but keeps the anchor', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).toContain('<a>');
    expect(out).not.toContain('javascript:');
  });

  it('keeps safe formatting tags and http links', () => {
    const out = sanitizeHtml('<p><strong>bold</strong> <a href="https://a.com">link</a></p>');
    expect(out).toContain('<strong>');
    expect(out).toContain('href="https://a.com"');
  });

  it('unwraps disallowed tags but preserves their text', () => {
    const out = sanitizeHtml('<p>hello <marquee>world</marquee></p>');
    expect(out).toContain('hello');
    expect(out).toContain('world');
    expect(out).not.toContain('marquee');
  });

  it('allows inline image data URIs but blocks other data payloads', () => {
    expect(sanitizeHtml('<img src="data:image/png;base64,AAAA" />')).toContain('data:image/png');
    expect(sanitizeHtml('<img src="data:text/html;base64,AAAA" />')).not.toContain('data:text/html');
  });
});

describe('htmlToPlainText', () => {
  it('strips tags and collapses whitespace', () => {
    expect(htmlToPlainText('<h1>Title</h1><p>Body  text</p>')).toBe('Title Body text');
  });

  it('decodes basic entities', () => {
    expect(htmlToPlainText('<p>a &amp; b &lt;c&gt;</p>')).toBe('a & b <c>');
  });

  it('ignores script content', () => {
    expect(htmlToPlainText('<p>x</p><script>secret()</script>')).toBe('x');
  });
});
