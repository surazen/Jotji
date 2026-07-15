import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@core/theme/useTheme';

import { Icon } from './Icon';
import { Portal } from './Overlay';
import { PressableScale } from './PressableScale';
import { AppText } from './Text';

type PdfViewerProps = {
  /** file:// URI of the PDF in the app sandbox. */
  uri: string | null;
  title?: string;
  visible: boolean;
  onClose: () => void;
};

/**
 * Full-screen, in-app PDF viewer over a scrim (no RN Modal, no external app).
 * The document never leaves Jotji — important for the sensitive scans this
 * library holds (IDs, statements, …). Uses react-native-pdf (native renderer).
 */
export function PdfViewer({ uri, title, visible, onClose }: PdfViewerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (visible) {
      setPage(1);
      setPageCount(0);
      setFailed(false);
    }
  }, [visible, uri]);

  useEffect(() => {
    if (!visible) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => back.remove();
  }, [visible, onClose]);

  if (!visible || !uri) return null;

  return (
    <Portal>
      <View style={[styles.backdrop, { backgroundColor: theme.colors.scrim }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <PressableScale onPress={onClose} hitSlop={12} accessibilityLabel="Close preview">
            <Icon name="x" size={24} color="onPrimary" />
          </PressableScale>
          {title ? (
            <AppText variant="titleSm" color="onPrimary" numberOfLines={1} style={styles.title}>
              {title}
            </AppText>
          ) : (
            <View style={styles.title} />
          )}
          {pageCount > 0 ? (
            <AppText variant="labelMd" color="onPrimary">
              {page} / {pageCount}
            </AppText>
          ) : (
            <View style={styles.counterSpacer} />
          )}
        </View>

        {failed ? (
          <View style={styles.center}>
            <Icon name="alert-triangle" size={32} color="onPrimary" />
            <AppText variant="bodyLg" color="onPrimary" style={styles.errorText}>
              This PDF couldn’t be displayed.
            </AppText>
          </View>
        ) : (
          <Pdf
            source={{ uri }}
            trustAllCerts={false}
            style={styles.pdf}
            onLoadComplete={(numberOfPages) => setPageCount(numberOfPages)}
            onPageChanged={(current) => setPage(current)}
            onError={() => setFailed(true)}
            renderActivityIndicator={() => <ActivityIndicator color={theme.colors.onPrimary} />}
          />
        )}
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { flex: 1 },
  counterSpacer: { width: 1 },
  pdf: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { textAlign: 'center' },
});
