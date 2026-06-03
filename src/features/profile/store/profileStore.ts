import { create } from 'zustand';

import * as profileRepo from '@core/db/repositories/profileRepo';
import type { Profile } from '@core/db/types';

type ProfileState = {
  profile: Profile;
  load: () => Promise<void>;
  setName: (name: string) => Promise<void>;
  setAvatar: (uri: string | null) => Promise<void>;
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: { name: '', avatarUri: null },
  load: async () => {
    const profile = await profileRepo.getProfile();
    set({ profile });
  },
  setName: async (name) => {
    await profileRepo.updateProfile({ name });
    set((s) => ({ profile: { ...s.profile, name } }));
  },
  setAvatar: async (uri) => {
    await profileRepo.updateProfile({ avatarUri: uri });
    set((s) => ({ profile: { ...s.profile, avatarUri: uri } }));
  },
}));
