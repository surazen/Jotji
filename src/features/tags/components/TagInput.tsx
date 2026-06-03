import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@core/components/Text';
import { useTheme } from '@core/theme/useTheme';
import * as tagsRepo from '@core/db/repositories/tagsRepo';
import type { Tag } from '@features/tags/types';

import { TagPill, TagPillRow } from './TagPill';

type TagInputProps = {
  tags: Tag[];
  onAdd: (name: string) => void;
  onRemove: (tagId: string) => void;
};

/** Inline hashtag input with normalize-on-submit and a suggestion dropdown. */
export function TagInput({ tags, onAdd, onRemove }: TagInputProps) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<tagsRepo.TagWithCount[]>([]);

  useEffect(() => {
    let active = true;
    const normalized = value.trim();
    if (!normalized) {
      setSuggestions([]);
      return;
    }
    tagsRepo.searchTags(normalized).then((rows) => {
      if (!active) return;
      const existing = new Set(tags.map((t) => t.name));
      setSuggestions(rows.filter((r) => !existing.has(r.name)).slice(0, 5));
    });
    return () => {
      active = false;
    };
  }, [value, tags]);

  const submit = (name: string) => {
    const normalized = tagsRepo.normalizeTagName(name);
    if (normalized) onAdd(normalized);
    setValue('');
    setSuggestions([]);
  };

  return (
    <View style={styles.wrap}>
      {tags.length > 0 ? (
        <TagPillRow>
          {tags.map((t) => (
            <TagPill key={t.id} label={t.name} onRemove={() => onRemove(t.id)} />
          ))}
        </TagPillRow>
      ) : null}

      <View
        style={[
          styles.inputRow,
          { backgroundColor: theme.colors.surfaceContainerLow, borderRadius: theme.radius.md },
        ]}
      >
        <AppText variant="bodyLg" color="onSurfaceVariant">
          #
        </AppText>
        <TextInput
          value={value}
          onChangeText={setValue}
          onSubmitEditing={() => submit(value)}
          placeholder="Add a tag"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          selectionColor={theme.colors.primary}
          autoCapitalize="none"
          returnKeyType="done"
          style={[theme.text.bodyLg, styles.input, { color: theme.colors.onSurface }]}
        />
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((s) => (
            <Pressable key={s.id} onPress={() => submit(s.name)} style={styles.suggestion}>
              <AppText variant="bodyMd" color="onSurfaceVariant">
                #{s.name}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 12 },
  suggestions: { gap: 2 },
  suggestion: { paddingVertical: 8, paddingHorizontal: 8 },
});
