import React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@core/components/Button';
import { Icon } from '@core/components/Icon';
import { Screen } from '@core/components/Screen';
import { StackHeader } from '@core/components/StackHeader';
import { AppText } from '@core/components/Text';
import { toast } from '@core/components/Toast';
import { useResponsive } from '@core/utils/useResponsive';
import { useTheme } from '@core/theme/useTheme';

/**
 * Donation link. Jotji is donation-supported: contributions are handled on an
 * external Ko-fi page (a browser link-out), never via in-app purchase — donations
 * unlock nothing and stay outside Google Play Billing, which the policy allows.
 */
const DONATION_URL = 'https://ko-fi.com/jotji';

export function SupportScreen() {
  const theme = useTheme();
  const { contentMaxWidth } = useResponsive();

  const openDonation = async () => {
    try {
      const supported = await Linking.canOpenURL(DONATION_URL);
      if (!supported) {
        toast.error('No browser available');
        return;
      }
      await Linking.openURL(DONATION_URL);
    } catch {
      toast.error('Could not open the donation page');
    }
  };

  return (
    <Screen>
      <StackHeader title="Support Jotji" />
      <ScrollView contentContainerStyle={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View style={[styles.hero, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon name="heart" size={36} color="onPrimaryContainer" />
        </View>

        <AppText variant="headlineSm" color="onSurface" style={styles.title}>
          Keep Jotji free & private
        </AppText>
        <AppText variant="bodyLg" color="onSurfaceVariant" style={styles.body}>
          Jotji has no ads, no accounts, and no data collection — everything stays on your device.
          It is built and maintained on donations. If it helps you think and write, a small
          contribution keeps it growing.
        </AppText>

        <Button label="Make a donation" onPress={openDonation} style={styles.cta} />

        <AppText variant="bodySm" color="onSurfaceVariant" style={styles.note}>
          Donations open in your browser. They are entirely optional — all features are free.
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },
  hero: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  title: { textAlign: 'center', marginTop: 20 },
  body: { textAlign: 'center', marginTop: 12 },
  cta: { marginTop: 28, alignSelf: 'stretch' },
  note: { textAlign: 'center', marginTop: 16 },
});
