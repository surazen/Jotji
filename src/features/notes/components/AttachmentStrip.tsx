import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@core/components/Icon';
import { ImageViewer } from '@core/components/ImageViewer';
import { useTheme } from '@core/theme/useTheme';
import type { Attachment } from '@core/db/types';

type Props = {
  attachments: Attachment[];
  /** When omitted, the strip is view-only (no remove button). */
  onRemove?: (id: string) => void;
};

/** Horizontal thumbnail strip of a note's image attachments; tap to view full-screen. */
export function AttachmentStrip({ attachments, onRemove }: Props) {
  const theme = useTheme();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (attachments.length === 0) return null;
  const uris = attachments.map((a) => a.localUri);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {attachments.map((a, i) => (
          <View key={a.id} style={[styles.thumbWrap, { borderRadius: theme.radius.md }]}>
            <Pressable onPress={() => setViewerIndex(i)} style={styles.fill}>
              <Image source={{ uri: a.localUri }} style={styles.thumb} resizeMode="cover" />
            </Pressable>
            {onRemove ? (
              <Pressable
                onPress={() => onRemove(a.id)}
                hitSlop={8}
                style={[styles.remove, { backgroundColor: theme.colors.scrim + 'aa' }]}
              >
                <Icon name="x" size={14} color="onPrimary" />
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <ImageViewer
        images={uris}
        initialIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingHorizontal: 4, paddingVertical: 8 },
  thumbWrap: { overflow: 'hidden', width: 88, height: 88 },
  fill: { width: '100%', height: '100%' },
  thumb: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
