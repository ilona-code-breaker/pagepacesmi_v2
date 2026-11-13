// Mirrors every pagepace_* browser-storage key to the signed-in account.
import { supabase } from '@/integrations/supabase/client';
import { mergeValue } from './merge';

const PREFIX = 'pagepace_';
const OWNER = 'pagepace-sync-owner'; // user id this device's data belongs to (no prefix: never synced)
const DIRTY = 'pagepace-sync-dirty';
const SKIP = new Set<string>();
let userId: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let patched = false;

const localKeys = () => Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
const parse = (s: string | null) => { if (s === null) return undefined; try { return JSON.parse(s); } catch { return s; } };

async function push() {
  if (!userId) return;
  const rows = localKeys().filter((k) => !SKIP.has(k)).map((key) => ({ user_id: userId!, key, value: parse(localStorage.getItem(key)) ?? null, updated_at: new Date().toISOString() }));
  if (!rows.length) return;
  const { error } = await supabase.from('user_data').upsert(rows);
  if (!error) localStorage.removeItem(DIRTY);
}

function schedule() {
  localStorage.setItem(DIRTY, '1');
  clearTimeout(timer);
  timer = setTimeout(() => { void push(); }, 1200);
}

function patchStorage() {
  if (patched) return;
  patched = true;
  const set = localStorage.setItem.bind(localStorage);
  const remove = localStorage.removeItem.bind(localStorage);
  localStorage.setItem = (k: string, v: string) => { set(k, v); if (userId && k.startsWith(PREFIX)) schedule(); };
  localStorage.removeItem = (k: string) => { remove(k); if (userId && k.startsWith(PREFIX)) { void supabase.from('user_data').delete().eq('key', k); } };
  window.addEventListener('online', () => { if (localStorage.getItem(DIRTY)) void push(); });
}

/** Returns true when local data changed and the app should reload to show it. */
export async function startSync(uid: string): Promise<boolean> {
  userId = uid;
  patchStorage();
  const { data, error } = await supabase.from('user_data').select('key,value');
  if (error) return false;
  const remote = new Map<string, unknown>(data.map((r: { key: string; value: unknown }) => [r.key, r.value as unknown]));
  const firstTime = localStorage.getItem(OWNER) !== uid;
  if (!firstTime && localStorage.getItem(DIRTY)) { await push(); return false; }
  let changed = false;
  const keys = new Set<string>([...localKeys(), ...remote.keys()]);
  for (const key of keys) {
    const local = parse(localStorage.getItem(key));
    const next = firstTime ? mergeValue(local, remote.get(key)) : (remote.has(key) ? remote.get(key) : local);
    const str = JSON.stringify(next);
    if (localStorage.getItem(key) !== str) { Storage.prototype.setItem.call(localStorage, key, str); changed = true; }
  }
  localStorage.setItem(OWNER, uid);
  if (firstTime) await push();
  return changed;
}

export function stopSync() {
  userId = null;
  clearTimeout(timer);
  for (const k of localKeys()) Storage.prototype.removeItem.call(localStorage, k);
  localStorage.removeItem(OWNER);
  localStorage.removeItem(DIRTY);
}
