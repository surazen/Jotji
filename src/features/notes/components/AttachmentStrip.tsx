import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@core/components/Icon';
import { useTheme } from '@core/theme/useTheme';
import type { Attachment } from '@core/db/types';

type Props = {
  attachments: Attachment[];
  onRemove: (id: string) => void;
};

/** Horizontal thumbnail strip of a note's image attachments. */
export function AttachmentStrip({ attachments, onRemove }: Props) {
  const theme = useTheme();
  if (attachments.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {attachments.map((a) => (
        <View key={a.id} style={[styles.thumbWrap, { borderRadius: theme.radius.md }]}>
          <Image source={{ uri: a.localUri }} style={styles.thumb} resizeMode="cover" />
          <Pressable
            onPress={() => onRemove(a.id)}
            hitSlop={8}
            style={[styles.remove, { backgroundColor: theme.colors.scrim + 'aa' }]}
          >
            <Icon name="x" size={14} color="onPrimary" />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingHorizontal: 4, paddingVertical: 8 },
  thumbWrap: { overflow: 'hidden', width: 88, height: 88 },
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
