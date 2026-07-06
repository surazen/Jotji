import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Icon } from '@core/components/Icon';
import { useTheme } from '@core/theme/useTheme';

type Props = {
  onCamera: () => void;
  onGallery: () => void;
  onScan: () => void;
  onAttachFile: () => void;
  onTag: () => void;
};

/** Horizontal action row in the editor: Camera, Gallery, Scan, File, Tag. */
export function AttachmentBar({ onCamera, onGallery, onScan, onAttachFile, onTag }: Props) {
  const theme = useTheme();
  // Icons render as onSecondaryContainer to sit on the secondaryContainer chip.
  // Scan uses MaterialIcons' document-scanner (Feather has no scanner glyph); it
  // matches the Scan tab in the bottom bar.
  const items: { key: string; icon: ReactNode; onPress: () => void }[] = [
    { key: 'Camera', icon: <Icon name="camera" color="onSecondaryContainer" size={20} />, onPress: onCamera },
    { key: 'Gallery', icon: <Icon name="image" color="onSecondaryContainer" size={20} />, onPress: onGallery },
    {
      key: 'Scan',
      icon: <MaterialIcons name="document-scanner" size={20} color={theme.colors.onSecondaryContainer} />,
      onPress: onScan,
    },
    { key: 'File', icon: <Icon name="paperclip" color="onSecondaryContainer" size={20} />, onPress: onAttachFile },
    { key: 'Tag', icon: <Icon name="hash" color="onSecondaryContainer" size={20} />, onPress: onTag },
  ];
  return (
    <View style={styles.row}>
      {items.map((it) => (
        <AttachmentButton key={it.key} onPress={it.onPress}>
          {it.icon}
        </AttachmentButton>
      ))}
    </View>
  );
}

function AttachmentButton({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, { backgroundColor: theme.colors.secondaryContainer }]}
      android_ripple={{ color: theme.colors.secondary, borderless: true }}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 4 },
  btn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
