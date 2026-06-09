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
import {
  CoreBridge,
  TenTapStartKit,
  Toolbar,
  useBridgeState,
  useEditorBridge,
  useEditorContent,
} from '@10play/tentap-editor';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '@core/components/Screen';
import { StackHeader } from '@core/components/StackHeader';
import { AppText } from '@core/components/Text';
import { BottomSheet } from '@core/components/BottomSheet';
import { Icon } from '@core/components/Icon';
import { toast } from '@core/components/Toast';
import * as attachmentsRepo from '@core/db/repositories/attachmentsRepo';
import * as notebooksRepo from '@core/db/repositories/notebooksRepo';
import * as notesRepo from '@core/db/repositories/notesRepo';
import * as tagsRepo from '@core/db/repositories/tagsRepo';
import type { Attachment, Tag } from '@core/db/types';
import { htmlToPlainText } from '@core/security/htmlSanitizer';
import { isAllowedImageMime } from '@core/utils/files';
import { useTheme } from '@core/theme/useTheme';
import { NotebookPicker } from '@features/notebooks/components/NotebookPicker';
import { TagInput } from '@features/tags/components/TagInput';
import type { RootStackParamList } from '@navigation/types';

import { AttachmentBar } from '../components/AttachmentBar';
import { AttachmentStrip } from '../components/AttachmentStrip';
import { buildEditorCss, buildEditorTheme, injectEditorCss } from '../components/editorTheme';
import { RichTextEditor } from '../components/RichTextEditor';
import { pickDocumentFile, pickFromCamera, pickFromGallery } from '../utils/pickImage';
import { shareNoteText } from '../utils/shareNote';

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
  const [initialNotebookId, setInitialNotebookId] = useState<string | null>(null);
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
      setInitialNotebookId(note?.notebookId ?? null);
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
      initialNotebookId={initialNotebookId}
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
  initialNotebookId: string | null;
};

function EditorBody({
  noteId,
  createdHere,
  initialTitle,
  initialHtml,
  initialTags,
  initialAttachments,
  initialNotebookId,
}: EditorBodyProps) {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [notebookId, setNotebookId] = useState<string | null>(initialNotebookId);
  const [notebookName, setNotebookName] = useState<string | null>(null);
  const [tagSheetOpen, setTagSheetOpen] = useState(false);
  const [notebookSheetOpen, setNotebookSheetOpen] = useState(false);

  // Resolve the current notebook's display name.
  useEffect(() => {
    let active = true;
    if (!notebookId) {
      setNotebookName(null);
      return;
    }
    notebooksRepo.getNotebook(notebookId).then((nb) => {
      if (active) setNotebookName(nb?.name ?? null);
    });
    return () => {
      active = false;
    };
  }, [notebookId]);

  const editor = useEditorBridge({
    initialContent: initialHtml || '<p></p>',
    avoidIosKeyboard: true,
    autofocus: !initialTitle && !initialHtml,
    bridgeExtensions: [...TenTapStartKit, CoreBridge.configureCSS(buildEditorCss(theme))],
    theme: buildEditorTheme(theme),
  });
  const liveHtml = useEditorContent(editor, { type: 'html' });
  // Drive the formatting toolbar from the WebView's focus state (reported over
  // the bridge). TenTap's default visibility relies on RN's keyboardDidShow
  // event, which doesn't fire reliably under Android edge-to-edge + new arch,
  // so the toolbar would stay hidden even while typing.
  const editorState = useBridgeState(editor);

  // Re-theme the WebView content when light/dark (or font size) changes.
  useEffect(() => {
    injectEditorCss(editor, buildEditorCss(theme));
  }, [editor, theme]);

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

  // Debounced autosave while editing, so edits survive an app kill or crash.
  useEffect(() => {
    const handle = setTimeout(() => {
      void persist();
    }, 700);
    return () => clearTimeout(handle);
  }, [title, liveHtml, persist]);

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

  const onShare = async () => {
    await persist();
    await shareNoteText(titleRef.current, htmlToPlainText(htmlRef.current));
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

  const addFile = async () => {
    try {
      const picked = await pickDocumentFile();
      if (!picked) return;
      const created = await attachmentsRepo.addAttachment({
        noteId,
        sourceUri: picked.uri,
        mime: picked.mime,
      });
      setAttachments((prev) => [...prev, created]);
    } catch {
      toast.error('Could not attach file');
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

  const onChangeNotebook = async (id: string | null) => {
    setNotebookId(id);
    await notesRepo.moveToNotebook(noteId, id);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <StackHeader
        subtitle="Draft"
        right={
          <View style={styles.headerActions}>
            <Pressable onPress={onShare} hitSlop={8} style={styles.headerIcon}>
              <Icon name="share-2" size={20} color="onSurfaceVariant" />
            </Pressable>
            <Pressable onPress={onSave} hitSlop={8} style={styles.saveBtn}>
              <AppText variant="labelLg" color="primary">
                Save
              </AppText>
            </Pressable>
          </View>
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

        <Pressable onPress={() => setNotebookSheetOpen(true)} style={styles.notebookRow}>
          <Icon name="book" size={14} color="primary" />
          <AppText variant="labelMd" color="primary">
            {notebookName ?? 'Add to notebook'}
          </AppText>
        </Pressable>

        <AttachmentStrip attachments={attachments} onRemove={removeAttachment} />

        <View style={styles.editor}>
          <RichTextEditor editor={editor} />
        </View>

        <View style={[styles.bottomBar, { backgroundColor: theme.colors.surfaceContainerLow }]}>
          <AttachmentBar
            onCamera={() => addImage('camera')}
            onGallery={() => addImage('gallery')}
            onAttachFile={addFile}
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

        <Toolbar editor={editor} hidden={!editorState.isFocused} />
      </KeyboardAvoidingView>

      <BottomSheet visible={tagSheetOpen} onClose={() => setTagSheetOpen(false)} title="Tags">
        <TagInput tags={tags} onAdd={addTag} onRemove={removeTag} />
      </BottomSheet>

      <NotebookPicker
        visible={notebookSheetOpen}
        selectedId={notebookId}
        onClose={() => setNotebookSheetOpen(false)}
        onSelect={onChangeNotebook}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIcon: { padding: 6 },
  saveBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  title: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  notebookRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingBottom: 6 },
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
