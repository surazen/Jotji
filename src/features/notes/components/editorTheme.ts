/**
 * Maps the Jotji theme onto the TenTap editor (WebView content + toolbar) so the
 * writing area follows light/dark mode instead of TenTap's hardcoded colors.
 */
import type { EditorBridge } from '@10play/tentap-editor';

import type { Theme } from '@core/theme/types';

/** CSS injected into the editor WebView document. */
export function buildEditorCss(theme: Theme): string {
  const c = theme.colors;
  const fontSize = theme.text.bodyLg.fontSize ?? 16;
  return `
    * { background-color: ${c.surface}; color: ${c.onSurface}; }
    body { caret-color: ${c.primary}; font-size: ${fontSize}px; line-height: 1.5; padding: 6px 10px; }
    p { margin: 0 0 0.6em; }
    a { color: ${c.primary}; }
    ::selection { background: ${c.primaryContainer}; color: ${c.onPrimaryContainer}; }
    blockquote { border-left: 3px solid ${c.outlineVariant}; padding-left: 1rem; color: ${c.onSurfaceVariant}; margin-left: 0; }
    code, pre { background-color: ${c.surfaceContainerHigh}; color: ${c.onSurface}; border-radius: 6px; }
    pre { padding: 8px 10px; }
    .highlight-background { background-color: ${c.primaryContainer}; }
    .ProseMirror p.is-editor-empty:first-child::before { color: ${c.onSurfaceVariant}; opacity: 0.8; }
  `;
}

/** Partial EditorTheme controlling the WebView + toolbar surfaces. */
export function buildEditorTheme(theme: Theme) {
  const c = theme.colors;
  return {
    webview: { backgroundColor: c.surface },
    webviewContainer: { backgroundColor: c.surface },
    toolbar: {
      // The default toolbarBody is `flex: 1`, which makes the toolbar grow to
      // fill the column (a tall white block). Pin it to a fixed height instead.
      toolbarBody: {
        flex: 0,
        height: 48,
        backgroundColor: c.surfaceContainerLow,
        borderTopWidth: 0,
        borderBottomWidth: 0,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
      },
      // Buttons/wrappers default to white and stretch vertically; clear them so
      // the dark toolbarBody shows through in dark mode.
      toolbarButton: { backgroundColor: 'transparent' },
      iconWrapper: { backgroundColor: 'transparent' },
      iconWrapperActive: { backgroundColor: c.primaryContainer },
      icon: { tintColor: c.onSurfaceVariant },
      iconActive: { tintColor: c.primary },
      iconDisabled: { tintColor: c.onSurfaceVariant },
    },
  };
}

/** Re-inject editor CSS (e.g. on a live light/dark switch). Safe before ready. */
export function injectEditorCss(editor: EditorBridge, css: string): void {
  (editor as unknown as { injectCSS?: (css: string, tag?: string) => void }).injectCSS?.(
    css,
    'jotji-editor-theme',
  );
}
