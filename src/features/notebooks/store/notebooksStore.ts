import { create } from 'zustand';

import * as notebooksRepo from '@core/db/repositories/notebooksRepo';
import type { NotebookWithCount } from '@core/db/repositories/notebooksRepo';
import type { Notebook } from '@core/db/types';

type NotebooksState = {
  notebooks: NotebookWithCount[];
  loading: boolean;
  load: () => Promise<void>;
  create: (name: string, color: string) => Promise<Notebook>;
  rename: (id: string, name: string) => Promise<void>;
  setColor: (id: string, color: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useNotebooksStore = create<NotebooksState>((set, get) => ({
  notebooks: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const notebooks = await notebooksRepo.listNotebooks();
    set({ notebooks, loading: false });
  },
  create: async (name, color) => {
    const created = await notebooksRepo.createNotebook(name, color);
    await get().load();
    return created;
  },
  rename: async (id, name) => {
    await notebooksRepo.renameNotebook(id, name);
    await get().load();
  },
  setColor: async (id, color) => {
    await notebooksRepo.setNotebookColor(id, color);
    await get().load();
  },
  remove: async (id) => {
    await notebooksRepo.deleteNotebook(id);
    await get().load();
  },
}));
