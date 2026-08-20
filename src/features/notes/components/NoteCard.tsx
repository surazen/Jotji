import React, { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Icon } from '@core/components/Icon';
import { PressableScale } from '@core/components/PressableScale';
import { AppText } from '@core/components/Text';
import { formatRelativeTime } from '@core/utils/dates';
import { useTheme } from '@core/theme/useTheme';
import { TagPill } from '@features/tags/components/TagPill';
import type { NoteWithRelations } from '@features/notes/types';

type NoteCardProps = {
  note: NoteWithRelations;
  onPress: () => void;
  onLongPress?: () => void;
  /** Opens the action menu from the visible "⋮" button (same as long-press). */
  onMore?: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
};

/**
 * Note "bubble" card: asymmetric corners, tonal surface (no borders), 98% press
 * scale. A visible "⋮" button opens the full action menu; swipe right reveals
 * Pin (amber) and swipe left reveals Delete (red) as quick shortcuts.
 */
export function NoteCard({
  note,
  onPress,
  onLongPress,
  onMore,
  onTogglePin,
  onDelete,
}: NoteCardProps) {
  const theme = useTheme();
  const ref = useRef<SwipeableMethods>(null);

  const preview = note.bodyPlain.trim() || 'No additional text';

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      leftThreshold={64}
      rightThreshold={64}
      renderLeftActions={() => (
        <View style={[styles.action, styles.left, { backgroundColor: theme.colors.pinContainer }]}>
          <Icon name="bookmark" color="onPinContainer" />
          <AppText variant="labelMd" color="onPinContainer">
            {note.isPinned ? 'Unpin' : 'Pin'}
          </AppText>
        </View>
      )}
      renderRightActions={() => (
        <Pressable
          onPress={() => {
            ref.current?.close();
            onDelete();
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete note"
          style={[styles.action, styles.right, { backgroundColor: theme.colors.errorContainer }]}
        >
          <Icon name="trash-2" color="onErrorContainer" />
          <AppText variant="labelMd" color="onErrorContainer">
            Delete
          </AppText>
        </Pressable>
      )}
      onSwipeableOpen={(direction) => {
        // Pin is reversible, so a swipe fires it immediately. Delete is
        // permanent (no undo), so the swipe only REVEALS the button — the row
        // stays open and the user must tap Delete to actually remove the note.
        if (direction === 'left') {
          ref.current?.close();
          onTogglePin();
        }
      }}
    >
      <PressableScale
        onPress={onPress}
        onLongPress={onLongPress}
        style={[
          styles.card,
          { backgroundColor: theme.colors.surfaceContainerLowest, ...theme.bubbleRadius },
        ]}
      >
        <View style={styles.headerRow}>
          <AppText variant="titleMd" color="onSurface" numberOfLines={1} style={styles.title}>
            {note.title || 'Untitled'}
          </AppText>
          {note.isPinned ? <Icon name="bookmark" size={16} color="pin" /> : null}
          {onMore ? (
            <Pressable
              onPress={onMore}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Note actions"
              style={styles.more}
            >
              <Icon name="more-vertical" size={18} color="onSurfaceVariant" />
            </Pressable>
          ) : null}
        </View>

        <AppText variant="bodyMd" color="onSurfaceVariant" numberOfLines={2} style={styles.preview}>
          {preview}
        </AppText>

        {note.tags.length > 0 ? (
          <View style={styles.tags}>
            {note.tags.slice(0, 4).map((t) => (
              <TagPill key={t.id} label={t.name} />
            ))}
          </View>
        ) : null}

        <View style={styles.footer}>
          {note.attachmentCount > 0 ? (
            <View style={styles.metaItem}>
              <Icon name="paperclip" size={13} color="onSurfaceVariant" />
              <AppText variant="labelMd" color="onSurfaceVariant">
                {note.attachmentCount}
              </AppText>
            </View>
          ) : null}
          <AppText variant="labelMd" color="onSurfaceVariant">
            {formatRelativeTime(note.updatedAt)}
          </AppText>
        </View>
      </PressableScale>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1 },
  more: { padding: 2, marginRight: -4 },
  preview: { marginTop: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  action: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    width: 96,
    marginBottom: 16,
    borderRadius: 20,
  },
  left: { marginRight: 8 },
  right: { marginLeft: 8 },
});
