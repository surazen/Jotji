import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@core/theme/useTheme';

import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';
import { AppText } from './Text';

export type SelectOption<T extends string> = { value: T; label: string };

type SelectSheetProps<T extends string> = {
  visible: boolean;
  title?: string;
  options: SelectOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/** Single-choice bottom-sheet picker with a check on the active option. */
export function SelectSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: SelectSheetProps<T>) {
  const theme = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.list}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => {
              onClose();
              onSelect(opt.value);
            }}
            android_ripple={{ color: theme.colors.surfaceContainerHigh }}
            style={[styles.row, { borderRadius: theme.radius.md }]}
          >
            <AppText variant="bodyLg" color={selected === opt.value ? 'primary' : 'onSurface'}>
              {opt.label}
            </AppText>
            {selected === opt.value ? <Icon name="check" color="primary" /> : null}
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12 },
});
