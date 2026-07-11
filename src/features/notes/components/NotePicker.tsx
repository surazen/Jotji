import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { BottomSheet } from '@core/components/BottomSheet';
import { AppText } from '@core/components/Text';
import * as notesRepo from '@core/db/repositories/notesRepo';
import type { NoteWithRelations } from '@core/db/types';
import { useTheme } from '@core/theme/useTheme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (noteId: string) => void;
};

/** Bottom sheet to pick an existing note (e.g. to attach a scanned file to it). */
export function NotePicker({ visible, onClose, onSelect }: Props) {
  const theme = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const [notes, setNotes] = useState<NoteWithRelations[]>([]);

  useEffect(() => {
    if (visible) void notesRepo.listNotes().then(setNotes);
  }, [visible]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add to which note?">
      {notes.length === 0 ? (
        <AppText variant="bodyMd" color="onSurfaceVariant" style={styles.empty}>
          You don&apos;t have any notes yet.
        </AppText>
      ) : (
        <ScrollView
          style={{ maxHeight: Math.round(screenHeight * 0.5) }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator
        >
          {notes.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => {
                onClose();
                onSelect(n.id);
              }}
              android_ripple={{ color: theme.colors.surfaceContainerHigh }}
              style={[styles.row, { borderRadius: theme.radius.md }]}
            >
              <AppText variant="bodyLg" numberOfLines={1}>
                {n.title.trim() || 'Untitled note'}
              </AppText>
              {n.bodyPlain.trim() ? (
                <AppText variant="labelMd" color="onSurfaceVariant" numberOfLines={1}>
                  {n.bodyPlain.trim()}
                </AppText>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 2 },
  row: { paddingVertical: 12, paddingHorizontal: 8, gap: 2 },
  empty: { paddingVertical: 16, textAlign: 'center' },
});
