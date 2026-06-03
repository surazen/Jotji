/** Key/value app settings (theme, fonts, app lock). Static SQL + bound params. */
import { all, run } from '../database';

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await all<{ key: string; value: string }>(`SELECT key, value FROM app_settings`);
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await run(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}
