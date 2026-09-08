import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@core/components/Icon';
import { Screen } from '@core/components/Screen';
import { StackHeader } from '@core/components/StackHeader';
import { AppText } from '@core/components/Text';
import { toast } from '@core/components/Toast';
import { useResponsive } from '@core/utils/useResponsive';
import { useTheme } from '@core/theme/useTheme';

/** One answer paragraph. `bullet` renders it as a list item; `link` adds a tappable line below. */
type Para = { text: string; bullet?: boolean; link?: { label: string; url: string } };
type Faq = { q: string; a: Para[] };

async function openUrl(url: string): Promise<void> {
  try {
    if (!(await Linking.canOpenURL(url))) {
      toast.error('Could not open the link');
      return;
    }
    await Linking.openURL(url);
  } catch {
    toast.error('Could not open the link');
  }
}

const FAQS: Faq[] = [
  {
    q: 'What’s the difference between notebooks and tags?',
    a: [
      {
        text: 'A note lives in one notebook — think of notebooks as folders for filing your notes. To file a note, open its menu (long-press it, or tap the ⋮) and choose Move to notebook.',
      },
      {
        text: 'Tags are labels. A note can have several, and the same tag can appear across different notebooks — handy for themes that cut across your filing, like a project or a place. Add tags with the Tag button while editing a note.',
      },
    ],
  },
  {
    q: 'How do I add photos, files, or tags to a note?',
    a: [
      { text: 'While editing a note, use the row of buttons above the keyboard:' },
      { text: 'Camera — take a photo', bullet: true },
      { text: 'Gallery — pick photos you already have', bullet: true },
      { text: 'Scan — scan a document to a PDF', bullet: true },
      { text: 'File — attach a PDF or document', bullet: true },
      { text: 'Tag — add labels to the note', bullet: true },
      { text: 'Photos and PDFs appear under the note — tap one to open it full-screen.' },
    ],
  },
  {
    q: 'How do I find and pin notes?',
    a: [
      {
        text: 'Tap the magnifier at the top of Home (or Notebooks) to search across all your notes — it looks in both titles and the note text.',
      },
      {
        text: 'Inside a large notebook, a search bar appears so you can search just that notebook.',
      },
      {
        text: 'To keep an important note at the top, open its menu (long-press or ⋮) and choose Pin.',
      },
    ],
  },
  {
    q: 'Where do my scanned documents go?',
    a: [
      { text: 'It depends on where you started the scan:' },
      {
        text: 'From the Scan tab, a scan is kept in the Scanned files library — the folder icon at the top of Home. Open it any time to preview, share, rename, save, add to a note, or delete.',
        bullet: true,
      },
      {
        text: 'From inside a note (the scan button while editing), the scan is attached to that note. Open the note and tap the PDF to view it.',
        bullet: true,
      },
      {
        text: 'Scans made inside a note stay with their note — they are not also listed in the Scanned files library.',
      },
    ],
  },
  {
    q: 'How do I scan more than one page into a single PDF?',
    a: [
      {
        text: 'After you capture and crop the first page, look for the blue “add page” button (a page with a + on it) near the bottom-right of the review screen. Tap it to scan the next page.',
      },
      {
        text: 'A row of thumbnails shows the pages you have so far. When you are done, tap Next (or Save) and all the pages come back as one PDF. You can add up to 10 pages.',
      },
      {
        text: 'Tip: tapping Next right after the first page ends the scan at a single page — use the blue + button first to keep adding pages.',
      },
    ],
  },
  {
    q: 'How do I bring my notes over from Evernote?',
    a: [
      {
        text: 'On a Windows or Mac computer, open Evernote, right-click a notebook (or select notes) and Export as an ENEX (.enex) file. Send that file to your phone.',
      },
      {
        text: 'In Jotji, go to Settings → Notes & data → Import notes and pick the file. A notebook export becomes a new notebook named after the file; a single note lets you choose which notebook it joins.',
      },
      {
        text: 'Your original note dates are kept, and imported notes carry an “en import” tag. Images stored in the note come across too; images that were only linked from the web are downloaded if you allow it.',
      },
    ],
  },
  {
    q: 'Can I use AI to summarize a note?',
    a: [
      {
        text: 'Jotji has no built-in AI, which keeps your notes private and offline. Instead, you can hand a single note to an AI app you already have — like Claude, Gemini, or ChatGPT.',
      },
      {
        text: 'Open a note’s menu (long-press it, or tap the ⋮) and choose Summarize with AI. Jotji passes just that one note’s text to the app you pick from the share sheet — nothing is sent automatically, and only the note you chose ever leaves your device.',
      },
      {
        text: 'The summary appears in the other app. To keep it, copy it back into your note. Your notebooks stay private — only the notes you deliberately share this way are ever sent anywhere.',
      },
      {
        text: 'You can do the same with a scanned document: open a scan (from the Scanned files library or a PDF inside a note) and tap the ⚡ button, or use Ask AI about this scan in the scan’s menu. This is handy for reading, summarizing, or pulling details out of a scan. It works if the AI app you pick accepts PDF files — some only take photos.',
      },
      {
        text: 'Don’t see an AI app in the share sheet? You’ll need one installed first — for example Claude, ChatGPT, or Gemini. Jotji deliberately doesn’t check what’s on your phone.',
        link: { label: 'Get Claude on the Play Store', url: 'https://play.google.com/store/apps/details?id=com.anthropic.claude' },
      },
    ],
  },
  {
    q: 'How do I lock the app?',
    a: [
      {
        text: 'Go to Settings → Privacy & security → App lock and turn it on. You’ll need a screen lock (PIN, pattern, or fingerprint) set up on your phone first.',
      },
      {
        text: 'After that, Jotji asks for your fingerprint or PIN each time you open it.',
      },
    ],
  },
  {
    q: 'Is my data private?',
    a: [
      {
        text: 'Yes. Jotji is built to keep everything on your device. There is no account and no cloud — your notes never leave your phone unless you share them yourself.',
      },
      {
        text: 'Notes are stored in an encrypted on-device database, and there is no analytics or tracking of any kind.',
      },
    ],
  },
  {
    q: 'Where are my notes stored, and are they backed up?',
    a: [
      {
        text: 'Your notes stay in an encrypted database on this device only. There is no account and no cloud, so nothing is uploaded anywhere.',
      },
      {
        text: 'For that same privacy reason, Jotji’s data is not included in your phone’s automatic backup. So that a lost, reset, or reinstalled device doesn’t take your notes with it, make your own backup: Settings → Backup → Back up notes.',
      },
      {
        text: 'That saves one file — all your notes, notebooks, tags, attachments and scans — to Drive or your files. Reinstall Jotji (or set up a new phone), tap Restore from backup, and everything comes back. You can optionally protect the file with a passphrase; if you do, keep it somewhere safe, because it can’t be recovered.',
      },
    ],
  },
];

/** Static Help / FAQ screen — a plain, offline accordion of common questions. */
export function FaqScreen() {
  const { contentMaxWidth } = useResponsive();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Screen>
      <StackHeader title="Help & FAQ" />
      <ScrollView contentContainerStyle={[styles.content, { maxWidth: contentMaxWidth }]}>
        {FAQS.map((faq, i) => (
          <FaqItem key={faq.q} faq={faq} expanded={open === i} onToggle={() => setOpen(open === i ? null : i)} />
        ))}
      </ScrollView>
    </Screen>
  );
}

function FaqItem({ faq, expanded, onToggle }: { faq: Faq; expanded: boolean; onToggle: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: 14 }]}>
      <Pressable
        onPress={onToggle}
        android_ripple={{ color: theme.colors.surfaceContainerHigh }}
        style={styles.qRow}
        accessibilityRole="button"
      >
        <AppText variant="titleSm" color="onSurface" style={styles.qText}>
          {faq.q}
        </AppText>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="onSurfaceVariant" />
      </Pressable>
      {expanded ? (
        <View style={styles.answer}>
          {faq.a.map((p, i) => {
            const link = p.link;
            return (
              <React.Fragment key={i}>
                {p.bullet ? (
                  <View style={styles.bulletRow}>
                    <AppText variant="bodyMd" color="onSurfaceVariant">
                      •
                    </AppText>
                    <AppText variant="bodyMd" color="onSurfaceVariant" style={styles.bulletText}>
                      {p.text}
                    </AppText>
                  </View>
                ) : (
                  <AppText variant="bodyMd" color="onSurfaceVariant">
                    {p.text}
                  </AppText>
                )}
                {link ? (
                  <Pressable onPress={() => openUrl(link.url)} hitSlop={6} accessibilityRole="link">
                    <AppText variant="labelLg" color="primary">
                      {link.label}
                    </AppText>
                  </Pressable>
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  card: { marginBottom: 10, overflow: 'hidden' },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  qText: { flex: 1 },
  answer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 2, gap: 10 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletText: { flex: 1 },
});
