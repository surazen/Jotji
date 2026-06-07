import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@core/components/Icon';
import { ImageViewer } from '@core/components/ImageViewer';
import { AppText } from '@core/components/Text';
import { useTheme } from '@core/theme/useTheme';
import { fileLabelFromMime, mediaKindFromMime } from '@core/utils/files';
import type { Attachment } from '@core/db/types';

import { openFile } from '../utils/openFile';

type Props = {
  attachments: Attachment[];
  /** When omitted, the strip is view-only (no remove button). */
  onRemove?: (id: string) => void;
};

/**
 * Horizontal strip of a note's attachments. Images show as thumbnails (tap for a
 * full-screen, swipeable viewer); PDF/XLS/DOC show as file tiles (tap to open in
 * a system viewer).
 */
export function AttachmentStrip({ attachments, onRemove }: Props) {
  const theme = useTheme();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (attachments.length === 0) return null;

  // Image URIs and a map from attachment id -> index within the image list,
  // so tapping an image opens the viewer at the right page.
  const imageUris: string[] = [];
  const imageIndexById = new Map<string, number>();
  for (const a of attachments) {
    if (mediaKindFromMime(a.mime) === 'image') {
      imageIndexById.set(a.id, imageUris.length);
      imageUris.push(a.localUri);
    }
  }

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {attachments.map((a) => {
          const isImage = mediaKindFromMime(a.mime) === 'image';
          return (
            <View key={a.id} style={[styles.tile, { borderRadius: theme.radius.md }]}>
              {isImage ? (
                <Pressable onPress={() => setViewerIndex(imageIndexById.get(a.id) ?? 0)} style={styles.fill}>
                  <Image source={{ uri: a.localUri }} style={styles.thumb} resizeMode="cover" />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => openFile(a.localUri, a.mime)}
                  style={[styles.fileTile, { backgroundColor: theme.colors.surfaceContainerHigh }]}
                >
                  <Icon name="file-text" size={22} color="onSurfaceVariant" />
                  <AppText variant="labelMd" color="onSurfaceVariant">
                    {fileLabelFromMime(a.mime)}
                  </AppText>
                </Pressable>
              )}
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
          );
        })}
      </ScrollView>

      <ImageViewer
        images={imageUris}
        initialIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingHorizontal: 4, paddingVertical: 8 },
  tile: { overflow: 'hidden', width: 88, height: 88 },
  fill: { width: '100%', height: '100%' },
  thumb: { width: '100%', height: '100%' },
  fileTile: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 6 },
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
