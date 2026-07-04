import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@core/components/Icon';
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
  const items: { icon: IconName; label: string; onPress: () => void }[] = [
    { icon: 'camera', label: 'Camera', onPress: onCamera },
    { icon: 'image', label: 'Gallery', onPress: onGallery },
    { icon: 'maximize', label: 'Scan', onPress: onScan },
    { icon: 'paperclip', label: 'File', onPress: onAttachFile },
    { icon: 'hash', label: 'Tag', onPress: onTag },
  ];
  return (
    <View style={styles.row}>
      {items.map((it) => (
        <AttachmentButton key={it.label} {...it} />
      ))}
    </View>
  );
}

function AttachmentButton({ icon, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, { backgroundColor: theme.colors.secondaryContainer }]}
      android_ripple={{ color: theme.colors.secondary, borderless: true }}
    >
      <Icon name={icon} color="onSecondaryContainer" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 4 },
  btn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
