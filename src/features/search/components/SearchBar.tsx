import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@core/components/Icon';
import { useTheme } from '@core/theme/useTheme';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

/** WhatsApp-style search field: magnifier, live input, clear button. */
export function SearchBar({ value, onChangeText, placeholder = 'Search your archive', autoFocus }: SearchBarProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: theme.colors.surfaceContainerLow, borderRadius: theme.radius.md },
      ]}
    >
      <Icon name="search" size={18} color="onSurfaceVariant" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        selectionColor={theme.colors.primary}
        autoFocus={autoFocus}
        autoCapitalize="none"
        returnKeyType="search"
        style={[theme.text.bodyLg, styles.input, { color: theme.colors.onSurface }]}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Icon name="x" size={18} color="onSurfaceVariant" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 12 },
});
