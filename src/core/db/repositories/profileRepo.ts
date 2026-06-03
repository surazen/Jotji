/** Local profile (single row, id = 1). No account/auth. */
import { run, first } from '../database';
import type { Profile } from '../types';

type ProfileRow = { name: string; avatar_uri: string | null };

export async function getProfile(): Promise<Profile> {
  const row = await first<ProfileRow>(`SELECT name, avatar_uri FROM profile WHERE id = 1`);
  return { name: row?.name ?? '', avatarUri: row?.avatar_uri ?? null };
}

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  if (patch.name !== undefined && patch.avatarUri !== undefined) {
    await run(`UPDATE profile SET name = ?, avatar_uri = ? WHERE id = 1`, [
      patch.name,
      patch.avatarUri,
    ]);
  } else if (patch.name !== undefined) {
    await run(`UPDATE profile SET name = ? WHERE id = 1`, [patch.name]);
  } else if (patch.avatarUri !== undefined) {
    await run(`UPDATE profile SET avatar_uri = ? WHERE id = 1`, [patch.avatarUri]);
  }
}
