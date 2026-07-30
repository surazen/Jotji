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

  it('drops javascript: hrefs obfuscated with embedded control characters', () => {
    // A tab/newline inside the scheme is ignored by browsers when resolving the
    // URL, so the sanitizer must strip control chars before the protocol check.
    for (const href of ['java\tscript:alert(1)', 'java\nscript:alert(1)', ' javascript:alert(1)']) {
      const out = sanitizeHtml(`<a href="${href}">x</a>`);
      expect(out).toBe('<a>x</a>');
      expect(out.toLowerCase()).not.toContain('script:');
    }
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

  it('drops remote <img> src (tracking-beacon defense) but keeps local + data:image', () => {
    // A remote src would make the editor WebView fetch it on render, leaking the
    // device IP/time to a third party — so it must not survive sanitization.
    const remote = sanitizeHtml('<img src="https://tracker.example/pixel.png" alt="x" />');
    expect(remote).not.toContain('tracker.example');
    expect(remote).not.toContain('https://');
    // On-device and inline-data image sources remain allowed.
    expect(sanitizeHtml('<img src="file:///data/user/0/app/img.png" />')).toContain('file:');
    expect(sanitizeHtml('<img src="content://media/1" />')).toContain('content:');
    expect(sanitizeHtml('<img src="data:image/png;base64,AAAA" />')).toContain('data:image/png');
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
