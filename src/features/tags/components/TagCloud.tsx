import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@core/components/Text';
import type { TagWithCount } from '@features/tags/types';

import { TagPill } from './TagPill';

type TagCloudProps = {
  tags: TagWithCount[];
  selectedId?: string | null;
  onSelect: (tag: TagWithCount) => void;
};

/** Wrapped cloud of tag pills (frequency-ordered by the repository). */
export function TagCloud({ tags, selectedId, onSelect }: TagCloudProps) {
  if (tags.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <AppText variant="labelLg" color="onSurfaceVariant" style={styles.label}>
        Tags
      </AppText>
      <View style={styles.cloud}>
        {tags.map((tag) => (
          <TagPill
            key={tag.id}
            label={tag.name}
            selected={selectedId === tag.id}
            onPress={() => onSelect(tag)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  label: {},
  cloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
