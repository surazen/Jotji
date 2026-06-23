import React, { useCallback } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { RichText, type EditorBridge } from '@10play/tentap-editor';

import { useTheme } from '@core/theme/useTheme';

type Props = {
  editor: EditorBridge;
};

/**
 * Rich-text body (TenTap / TipTap in a sandboxed WebView). The WebView loads
 * only the bundled local editor — no remote content — and saved HTML is
 * sanitized before persistence (see notesRepo + htmlSanitizer). The keyboard
 * Toolbar is rendered by the editor screen so it can sit above the keyboard.
 *
 * The WebView is the app's stored-HTML / XSS boundary, so it is locked down:
 * no file access, no auto-opened windows, and navigations are intercepted —
 * the editor's own document load is allowed, but any navigation a note's
 * content could trigger (tapped links, javascript:/file:/intent: URLs) is
 * blocked; external http(s) links open in the system browser instead.
 */
export function RichTextEditor({ editor }: Props) {
  const theme = useTheme();

  const onShouldStartLoadWithRequest = useCallback(
    (req: { url: string; navigationType: string }) => {
      // The editor loads its bundle via inline HTML (navigationType !== 'click').
      // Only user-initiated link taps are a navigation risk.
      if (req.navigationType !== 'click') return true;
      if (/^https?:\/\//i.test(req.url)) {
        void Linking.openURL(req.url).catch(() => {});
      }
      return false; // never navigate the editor away from its own document
    },
    [],
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.surface }]}>
      <RichText
        editor={editor}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically={false}
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
