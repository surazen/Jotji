import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@core/theme/useTheme';

import { BottomSheet } from './BottomSheet';
import { Icon, type IconName } from './Icon';
import { AppText } from './Text';

export type ContextAction = {
  icon: IconName;
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

type ContextMenuProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: ContextAction[];
};

/**
 * Long-press action menu (Pin / Move / Share / Delete). Presented as an
 * action list in a bottom sheet over a dimmed scrim (the Android-friendly
 * fallback for the iOS blur popover described in the spec).
 */
export function ContextMenu({ visible, onClose, title, actions }: ContextMenuProps) {
  const theme = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.list}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => {
              onClose();
              action.onPress();
            }}
            android_ripple={{ color: theme.colors.surfaceContainerHigh }}
            style={[styles.row, { borderRadius: theme.radius.md }]}
          >
            <Icon name={action.icon} color={action.destructive ? 'error' : 'onSurface'} />
            <AppText variant="bodyLg" color={action.destructive ? 'error' : 'onSurface'}>
              {action.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, paddingHorizontal: 12 },
});
