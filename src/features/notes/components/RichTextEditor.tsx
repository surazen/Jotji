import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RichText, type EditorBridge } from '@10play/tentap-editor';

type Props = {
  editor: EditorBridge;
};

/**
 * Rich-text body (TenTap / TipTap in a sandboxed WebView). The WebView loads
 * only the bundled local editor — no remote content — and saved HTML is
 * sanitized before persistence (see notesRepo + htmlSanitizer). The keyboard
 * Toolbar is rendered by the editor screen so it can sit above the keyboard.
 */
export function RichTextEditor({ editor }: Props) {
  return (
    <View style={styles.flex}>
      <RichText editor={editor} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
