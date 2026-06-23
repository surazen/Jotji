/**
 * HTML sanitization for rich-text note bodies.
 *
 * The TenTap editor renders inside a WebView, so any HTML we persist and later
 * re-render is a potential stored-XSS vector. We sanitize on save against a
 * strict tag/attribute allowlist. This is a pure-string implementation (no DOM)
 * so it also runs in unit tests and on the JS thread cheaply.
 *
 * This is defense-in-depth: the WebView itself is also locked down (no remote
 * content, JS limited to the editor bundle). See RichTextEditor.
 */

/** Block-level + inline tags we keep. Anything else is unwrapped (text kept). */
const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'del',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'img',
  'code',
  'pre',
  'mark',
  'span',
  'div',
  'hr',
]);

/** Tags whose entire contents are dropped (not just the tag). */
const DROP_WITH_CONTENT = ['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template'];

/** Per-tag attribute allowlist. */
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href']),
  img: new Set(['src', 'alt']),
};

const SELF_CLOSING = new Set(['br', 'img', 'hr']);

function isSafeUrl(url: string): boolean {
  // Browsers ignore embedded whitespace/control characters when resolving a URL
  // scheme, so a value like `java&#9;script:alert(1)` (a literal tab inside
  // `javascript:`) would slip past a naive prefix check yet still execute. Strip
  // all control/whitespace chars before testing the protocol. (Entity-encoded
  // schemes are separately defused by escapeAttr re-escaping `&` on output.)
  const v = url.replace(/[\u0000-\u0020\u007f-\u00a0]/g, '').toLowerCase();
  if (v.startsWith('javascript:') || v.startsWith('vbscript:')) return false;
  // Allow only image data URIs; block all other data: payloads.
  if (v.startsWith('data:')) {
    return /^data:image\/(png|jpe?g|gif|webp|bmp);/i.test(v);
  }
  return true;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Parse `key="v" key2='v2' key3=v3` into pairs. */
function parseAttrs(raw: string): [string, string][] {
  const attrs: [string, string][] = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const name = m[1].toLowerCase();
    const value = m[3] ?? m[4] ?? m[5] ?? '';
    attrs.push([name, value]);
  }
  return attrs;
}

function buildAttrs(tag: string, raw: string): string {
  const allowed = ALLOWED_ATTRS[tag];
  if (!allowed) return '';
  const out: string[] = [];
  for (const [name, value] of parseAttrs(raw)) {
    if (name.startsWith('on')) continue; // event handlers
    if (!allowed.has(name)) continue;
    if ((name === 'href' || name === 'src') && !isSafeUrl(value)) continue;
    out.push(`${name}="${escapeAttr(value)}"`);
  }
  return out.length ? ' ' + out.join(' ') : '';
}

/**
 * Sanitize an HTML string to the allowlist. Disallowed tags are unwrapped
 * (their text content is preserved); script/style/iframe blocks are removed
 * entirely; unsafe URLs and event handlers are stripped.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  let html = input;

  // 1. Remove dangerous elements together with their content.
  for (const tag of DROP_WITH_CONTENT) {
    const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    html = html.replace(re, '');
    // Also strip any unclosed/standalone opener.
    html = html.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi'), '');
  }

  // 2. Strip HTML comments.
  html = html.replace(/<!--[\s\S]*?-->/g, '');

  // 3. Walk remaining tags, rebuilding only allowlisted ones.
  return html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?)(\/?)>/g, (_full, slash, name, attrs, selfClose) => {
    const tag = String(name).toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      return ''; // unwrap: drop the tag, keep surrounding text
    }
    if (slash === '/') {
      return SELF_CLOSING.has(tag) ? '' : `</${tag}>`;
    }
    const rebuilt = buildAttrs(tag, attrs);
    if (SELF_CLOSING.has(tag) || selfClose === '/') {
      return `<${tag}${rebuilt} />`;
    }
    return `<${tag}${rebuilt}>`;
  });
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

/**
 * Derive a plain-text representation of note HTML for previews and full-text
 * search indexing. Block tags become spaces so words don't run together.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  let text = html;
  for (const tag of DROP_WITH_CONTENT) {
    text = text.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), ' ');
  }
  text = text
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre|br)\s*>/gi, ' ')
    .replace(/<br\s*\/?>(?=)/gi, ' ')
    .replace(/<[^>]+>/g, '');
  text = text.replace(/&#?[a-z0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? '');
  return text.replace(/\s+/g, ' ').trim();
}
