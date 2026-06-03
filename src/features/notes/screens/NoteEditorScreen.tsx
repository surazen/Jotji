import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Toolbar, useEditorBridge, useEditorContent } from '@10play/tentap-editor';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '@core/components/Screen';
import { StackHeader } from '@core/components/StackHeader';
import { AppText } from '@core/components/Text';
import { BottomSheet } from '@core/components/BottomSheet';
import { Icon } from '@core/components/Icon';
import { toast } from '@core/components/Toast';
import * as attachmentsRepo from '@core/db/repositories/attachmentsRepo';
import * as notesRepo from '@core/db/repositories/notesRepo';
import * as tagsRepo from '@core/db/repositories/tagsRepo';
import type { Attachment, Tag } from '@core/db/types';
import { htmlToPlainText } from '@core/security/htmlSanitizer';
import { isAllowedImageMime } from '@core/utils/files';
import { useTheme } from '@core/theme/useTheme';
import { TagInput } from '@features/tags/components/TagInput';
import type { RootStackParamList } from '@navigation/types';

import { AttachmentBar } from '../components/AttachmentBar';
import { AttachmentStrip } from '../components/AttachmentStrip';
import { RichTextEditor } from '../components/RichTextEditor';
import { pickFromCamera, pickFromGallery } from '../utils/pickImage';

type Nav = NativeStackNavigationProp<RootStackParamList, 'NoteEditor'>;

export function NoteEditorScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'NoteEditor'>>();
  const paramNoteId = route.params?.noteId;

  const [ready, setReady] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [initialTitle, setInitialTitle] = useState('');
  const [initialHtml, setInitialHtml] = useState('');
  const [initialTags, setInitialTags] = useState<Tag[]>([]);
  const [initialAttachments, setInitialAttachments] = useState<Attachment[]>([]);
  const [createdHere, setCreatedHere] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let id = paramNoteId ?? null;
      if (!id) {
        const created = await notesRepo.createNote({ notebookId: route.params?.notebookId ?? null });
        id = created.id;
        if (!cancelled) setCreatedHere(true);
      }
      const [note, tags, attachments] = await Promise.all([
        notesRepo.getNote(id),
        tagsRepo.getTagsForNote(id),
        attachmentsRepo.listAttachments(id),
      ]);
      if (cancelled) return;
      setNoteId(id);
      setInitialTitle(note?.title ?? '');
      setInitialHtml(note?.bodyHtml ?? '');
      setInitialTags(tags);
      setInitialAttachments(attachments);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // Resolve the working note once per noteId param; notebookId is read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramNoteId]);

  if (!ready || !noteId) {
    return (
      <Screen>
        <StackHeader subtitle="Draft" />
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  return (
    <EditorBody
      noteId={noteId}
      createdHere={createdHere}
      initialTitle={initialTitle}
      initialHtml={initialHtml}
      initialTags={initialTags}
      initialAttachments={initialAttachments}
    />
  );
}

type EditorBodyProps = {
  noteId: string;
  createdHere: boolean;
  initialTitle: string;
  initialHtml: string;
  initialTags: Tag[];
  initialAttachments: Attachment[];
};

function EditorBody({
  noteId,
  createdHere,
  initialTitle,
  initialHtml,
  initialTags,
  initialAttachments,
}: EditorBodyProps) {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [tagSheetOpen, setTagSheetOpen] = useState(false);

  const editor = useEditorBridge({
    initialContent: initialHtml || '<p></p>',
    avoidIosKeyboard: true,
    autofocus: !initialTitle && !initialHtml,
  });
  const liveHtml = useEditorContent(editor, { type: 'html' });

  // Keep the latest values in refs so the unmount save sees current data.
  const htmlRef = useRef(initialHtml);
  const titleRef = useRef(initialTitle);
  const tagsRef = useRef(initialTags);
  const attachmentsRef = useRef(initialAttachments);
  useEffect(() => {
    if (liveHtml !== undefined) htmlRef.current = liveHtml;
  }, [liveHtml]);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);
  useEffect(() => {
    tagsRef.current = tags;
  }, [tags]);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const persist = useCallback(async () => {
    await notesRepo.updateNote(noteId, { title: titleRef.current, bodyHtml: htmlRef.current });
  }, [noteId]);

  // Save on leaving; remove the note if it was created here and left empty.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      const isEmpty =
        titleRef.current.trim() === '' &&
        htmlToPlainText(htmlRef.current).trim() === '' &&
        tagsRef.current.length === 0 &&
        attachmentsRef.current.length === 0;
      if (createdHere && isEmpty) {
        void notesRepo.deleteNote(noteId);
      } else {
        void persist();
      }
    });
    return unsub;
  }, [navigation, noteId, createdHere, persist]);

  const onSave = async () => {
    await persist();
    toast.success('Note saved');
    navigation.goBack();
  };

  const addImage = async (source: 'camera' | 'gallery') => {
    try {
      const picked = source === 'camera' ? await pickFromCamera() : await pickFromGallery();
      if (!picked) return;
      if (!isAllowedImageMime(picked.mime)) {
        toast.error('Unsupported image type');
        return;
      }
      const created = await attachmentsRepo.addImageAttachment({
        noteId,
        sourceUri: picked.uri,
        mime: picked.mime,
        width: picked.width,
        height: picked.height,
      });
      setAttachments((prev) => [...prev, created]);
    } catch {
      toast.error('Could not attach image');
    }
  };

  const removeAttachment = async (id: string) => {
    await attachmentsRepo.deleteAttachment(id);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const addTag = async (name: string) => {
    const tag = await tagsRepo.getOrCreateTag(name);
    if (tags.some((t) => t.id === tag.id)) return;
    const next = [...tags, tag];
    setTags(next);
    await notesRepo.setNoteTags(noteId, next.map((t) => t.id));
  };

  const removeTag = async (tagId: string) => {
    const next = tags.filter((t) => t.id !== tagId);
    setTags(next);
    await notesRepo.setNoteTags(noteId, next.map((t) => t.id));
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <StackHeader
        subtitle="Draft"
        right={
          <Pressable onPress={onSave} hitSlop={8} style={styles.saveBtn}>
            <AppText variant="labelLg" color="primary">
              Save
            </AppText>
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          selectionColor={theme.colors.primary}
          style={[theme.text.headlineSm, styles.title, { color: theme.colors.onSurface }]}
          multiline
        />

        <AttachmentStrip attachments={attachments} onRemove={removeAttachment} />

        <View style={styles.editor}>
          <RichTextEditor editor={editor} />
        </View>

        <View style={[styles.bottomBar, { backgroundColor: theme.colors.surfaceContainerLow }]}>
          <AttachmentBar
            onCamera={() => addImage('camera')}
            onGallery={() => addImage('gallery')}
            onTag={() => setTagSheetOpen(true)}
          />
          {tags.length > 0 ? (
            <View style={styles.tagSummary}>
              <Icon name="hash" size={13} color="onSurfaceVariant" />
              <AppText variant="labelMd" color="onSurfaceVariant">
                {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
              </AppText>
            </View>
          ) : null}
        </View>

        <Toolbar editor={editor} />
      </KeyboardAvoidingView>

      <BottomSheet visible={tagSheetOpen} onClose={() => setTagSheetOpen(false)} title="Tags">
        <TagInput tags={tags} onAdd={addTag} onRemove={removeTag} />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  title: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  editor: { flex: 1, paddingHorizontal: 12 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagSummary: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
