import { create } from 'zustand';

import * as tagsRepo from '@core/db/repositories/tagsRepo';
import type { TagWithCount } from '@core/db/repositories/tagsRepo';

type TagsState = {
  tags: TagWithCount[];
  loading: boolean;
  load: () => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const tags = await tagsRepo.listTags();
    set({ tags, loading: false });
  },
  remove: async (id) => {
    await tagsRepo.deleteTag(id);
    await get().load();
  },
}));
