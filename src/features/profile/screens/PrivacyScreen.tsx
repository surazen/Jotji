import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@core/components/Screen';
import { StackHeader } from '@core/components/StackHeader';
import { AppText } from '@core/components/Text';
import { toast } from '@core/components/Toast';
import { useResponsive } from '@core/utils/useResponsive';

/**
 * Offline, in-app copy of the privacy policy (Profile → Privacy policy). Kept in
 * sync with docs/privacy-policy.md and docs/privacy.html (the hosted page at
 * jotji.com/privacy that the Play listing links to). Rendered natively — no
 * WebView, no network — so it can be read fully offline, in keeping with the
 * app's on-device promise.
 */
const CONTACT_EMAIL = 'sura@southofmemphis.com';

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'h'; text: string };

const POLICY: Block[] = [
  { kind: 'p', text: 'Jotji (“the app”, “we”, “us”) is a local-first note-taking app for Android. This policy explains what data the app handles and how your privacy is protected. In short: Jotji has no account, no cloud, and no analytics — your notes stay on your device.' },
  { kind: 'p', text: 'Jotji is also open source. Anyone can inspect the full source code to verify exactly how the app handles your data — it is published at github.com/surazen/Jotji under the GPL-3.0 license.' },

  { kind: 'h', text: 'The short version' },
  { kind: 'bullet', text: 'We do not collect, transmit, or store any of your personal data on our servers. We have no servers.' },
  { kind: 'bullet', text: 'There is no account or sign-up. We never ask for your name, email, or any identifier.' },
  { kind: 'bullet', text: 'Your notes, notebooks, tags, attachments, and scanned documents are stored only on your device, in an encrypted on-device database.' },
  { kind: 'bullet', text: 'We use no analytics, no advertising, and no third-party tracking of any kind.' },

  { kind: 'h', text: 'What data Jotji stores, and where' },
  { kind: 'p', text: 'Everything you create in Jotji — note text, notebooks, tags, images and files you attach, and documents you scan — is saved in an encrypted database on your device. This data never leaves your device except when you choose to send it, is not uploaded to us or any third party by the app, and is not included in Android’s automatic cloud backup (the app sets allowBackup to false), precisely so your notes are not copied off the device.' },
  { kind: 'p', text: 'Because there is no cloud copy, if you uninstall the app or reset/lose your device, notes that you have not backed up yourself cannot be recovered by us or anyone else.' },

  { kind: 'h', text: 'Permissions the app requests' },
  { kind: 'bullet', text: 'Camera — used only when you take a photo to add to a note or scan a document. Images stay on your device. Jotji does not access your camera in the background.' },
  { kind: 'bullet', text: 'Biometric / device credentials — used only for the optional App Lock, so you can require your fingerprint or device PIN to open the app. Authentication is handled by Android; Jotji never sees or stores your biometric data or PIN.' },
  { kind: 'p', text: 'Jotji does not request access to your location, contacts, microphone, call logs, SMS, or the list of other apps installed on your device.' },

  { kind: 'h', text: 'Features you control (and when data leaves your device)' },
  { kind: 'p', text: 'Some optional features can send data off your device — but only when you initiate them, and only to the destination you choose. Jotji itself never receives this data.' },
  { kind: 'bullet', text: 'Sharing a note or scan — the system share sheet lets you send the selected note or document to another app you have installed. Only the item you pick is shared. Once it leaves Jotji, that content is handled under the receiving app’s own terms and privacy policy — including any AI assistant that reads, stores, or processes it — and Jotji has no control over, and is not responsible for, what happens to it there.' },
  { kind: 'bullet', text: 'Importing from Evernote — if you import an export that contains images linked from the web, Jotji can optionally download those images for offline use, only after you agree, directly between your device and the image’s host.' },
  { kind: 'bullet', text: 'External links — links such as the “Support Jotji” page or a Play Store link open in your browser or the Play Store app, which have their own privacy policies.' },
  { kind: 'bullet', text: 'Backup — when you create a backup (Settings → Backup), the file is written only to the location you choose. Jotji does not upload it anywhere.' },

  { kind: 'h', text: 'The document scanner' },
  { kind: 'p', text: 'Jotji’s document scanner uses Google’s ML Kit, which runs entirely on your device. The first time you scan, the app downloads the scanning engine once from Google Play Services — a one-time download that needs an internet connection. This transfers only the scanning software to your device; none of your notes, images, or scans are uploaded, and after that first download the scanner works fully offline.' },

  { kind: 'h', text: 'Data sharing and selling' },
  { kind: 'p', text: 'We do not sell your data, and we do not share it with third parties. We cannot — the app never sends your data to us in the first place.' },

  { kind: 'h', text: 'Children’s privacy' },
  { kind: 'p', text: 'Jotji is not directed to children under 13, and we do not knowingly collect any personal information from anyone. Since the app collects no personal information at all, this poses no additional risk.' },

  { kind: 'h', text: 'Disclaimer and your responsibility for backups' },
  { kind: 'p', text: 'Jotji is provided “as is”, without warranties of any kind, whether express or implied, including but not limited to merchantability, fitness for a particular purpose, and non-infringement. To the fullest extent permitted by law, the developer is not liable for any loss of data or for any direct, indirect, incidental, or consequential damages arising from your use of the app. Jotji is also not responsible for how any third-party app or service you choose to share content with — including AI assistants — stores, processes, or uses that content; once you send it, that is governed by the other provider’s own terms and privacy policy.' },
  { kind: 'p', text: 'Because Jotji stores everything only on your device with no cloud copy, keeping your data safe is your responsibility. Use the built-in Backup feature (Settings → Backup) to save your own copy, and keep that backup — and any passphrase you set for it — somewhere safe. A forgotten passphrase cannot be recovered, and neither the developer nor anyone else can restore notes that were not backed up.' },

  { kind: 'h', text: 'Changes to this policy' },
  { kind: 'p', text: 'If this policy changes, we will update the “Last updated” date below and post the revised policy at the same URL. Continued use of the app after a change means you accept the updated policy.' },
];

export function PrivacyScreen() {
  const { contentMaxWidth } = useResponsive();

  const emailUs = async () => {
    const url = `mailto:${CONTACT_EMAIL}`;
    try {
      if (!(await Linking.canOpenURL(url))) {
        toast.error('No email app found');
        return;
      }
      await Linking.openURL(url);
    } catch {
      toast.error('Could not open your email app');
    }
  };

  return (
    <Screen>
      <StackHeader title="Privacy policy" />
      <ScrollView contentContainerStyle={[styles.content, { maxWidth: contentMaxWidth }]}>
        <AppText variant="labelMd" color="onSurfaceVariant" style={styles.updated}>
          Last updated: 15 September 2026
        </AppText>

        {POLICY.map((b, i) => {
          if (b.kind === 'h') {
            return (
              <AppText key={i} variant="titleSm" color="onSurface" style={styles.heading}>
                {b.text}
              </AppText>
            );
          }
          if (b.kind === 'bullet') {
            return (
              <View key={i} style={styles.bulletRow}>
                <AppText variant="bodyMd" color="onSurfaceVariant">
                  •
                </AppText>
                <AppText variant="bodyMd" color="onSurfaceVariant" style={styles.bulletText}>
                  {b.text}
                </AppText>
              </View>
            );
          }
          return (
            <AppText key={i} variant="bodyMd" color="onSurfaceVariant" style={styles.para}>
              {b.text}
            </AppText>
          );
        })}

        <AppText variant="titleSm" color="onSurface" style={styles.heading}>
          Contact
        </AppText>
        <AppText variant="bodyMd" color="onSurfaceVariant" style={styles.para}>
          Questions about this policy or your privacy? Get in touch:
        </AppText>
        <Pressable onPress={emailUs} hitSlop={6} accessibilityRole="link">
          <AppText variant="labelLg" color="primary">
            {CONTACT_EMAIL}
          </AppText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  updated: { marginBottom: 8 },
  heading: { marginTop: 22, marginBottom: 8 },
  para: { lineHeight: 21, marginBottom: 6 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bulletText: { flex: 1, lineHeight: 21 },
});
