/**
 * Notes list state. Holds the currently-displayed list + the pinned row, and
 * reloads from the repository after mutations. Note creation/editing happens in
 * the editor via the repository directly; the list refreshes on focus.
 */
import { create } from 'zustand';

import * as notesRepo from '@core/db/repositories/notesRepo';
import type { ListOptions } from '@core/db/repositories/notesRepo';
import type { NoteWithRelations, SortKey } from '@core/db/types';

type NotesState = {
  notes: NoteWithRelations[];
  pinned: NoteWithRelations[];
  loading: boolean;
  options: ListOptions;

  load: (options?: ListOptions) => Promise<void>;
  reload: () => Promise<void>;
  setSort: (sort: SortKey) => Promise<void>;
  togglePin: (id: string, pinned: boolean) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
};

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  pinned: [],
  loading: false,
  options: { sort: 'updated', pinnedFirst: true },

  load: async (options) => {
    const nextOptions = options ?? get().options;
    set({ loading: true, options: nextOptions });
    const [notes, pinned] = await Promise.all([
      notesRepo.listNotes(nextOptions),
      notesRepo.listPinnedNotes(),
    ]);
    set({ notes, pinned, loading: false });
  },

  reload: async () => {
    await get().load(get().options);
  },

  setSort: async (sort) => {
    await get().load({ ...get().options, sort });
  },

  togglePin: async (id, pinned) => {
    await notesRepo.setPinned(id, pinned);
    await get().reload();
  },

  deleteNote: async (id) => {
    await notesRepo.deleteNote(id);
    await get().reload();
  },
}));
