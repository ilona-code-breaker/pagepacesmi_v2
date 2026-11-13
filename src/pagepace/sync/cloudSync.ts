// Mirrors every pagepace_* browser-storage key to the signed-in account.
import { supabase } from '@/integrations/supabase/client';
import { mergeValue, newItems, dedupeList } from './merge';

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

let pendingRemote: Map<string, unknown> | null = null;

function writeLocal(key: string, value: unknown): boolean {
  const str = JSON.stringify(value);
  if (localStorage.getItem(key) === str) return false;
  Storage.prototype.setItem.call(localStorage, key, str);
  return true;
}

export type SyncStart = { reload: boolean; askAbout?: number };

/** First sign-in on a device: if this device has books the account lacks, ask before adding them. */
export async function startSync(uid: string): Promise<SyncStart> {
  userId = uid;
  patchStorage();
  const { data, error } = await supabase.from('user_data').select('key,value');
  if (error) return { reload: false };
  const remote = new Map<string, unknown>(data.map((r: { key: string; value: unknown }) => [r.key, r.value]));
  const firstTime = localStorage.getItem(OWNER) !== uid;
  if (!firstTime) {
    if (localStorage.getItem(DIRTY)) { await push(); return { reload: false }; }
    let changed = false;
    for (const [k, v] of remote) changed = writeLocal(k, v) || changed;
    return { reload: changed };
  }
  if (remote.size === 0) { localStorage.setItem(OWNER, uid); await push(); return { reload: false }; }
  const count = localKeys().reduce((n, k) => n + newItems(parse(localStorage.getItem(k)), remote.get(k)).length, 0);
  pendingRemote = remote;
  if (count > 0) return { reload: false, askAbout: count };
  return { reload: await finishFirstSync(false) };
}

/** Applies the user's answer: add this device's new books to the account, or use the account's only. */
export async function finishFirstSync(addNew: boolean): Promise<boolean> {
  const remote = pendingRemote;
  if (!remote || !userId) return false;
  pendingRemote = null;
  let changed = false;
  for (const key of new Set<string>([...localKeys(), ...remote.keys()])) {
    changed = writeLocal(key, mergeValue(parse(localStorage.getItem(key)), remote.get(key), addNew)) || changed;
  }
  localStorage.setItem(OWNER, userId);
  await push();
  return changed;
}

/** Number of duplicate copies across all saved lists. */
export function countDuplicates(): number {
  return localKeys().reduce((n, k) => { const v = parse(localStorage.getItem(k)); return Array.isArray(v) ? n + v.length - dedupeList(v).length : n; }, 0);
}

export function removeDuplicates(): void {
  for (const k of localKeys()) {
    const v = parse(localStorage.getItem(k));
    if (Array.isArray(v)) localStorage.setItem(k, JSON.stringify(dedupeList(v)));
  }
}

export function stopSync() {
  userId = null;
  clearTimeout(timer);
  for (const k of localKeys()) Storage.prototype.removeItem.call(localStorage, k);
  localStorage.removeItem(OWNER);
  localStorage.removeItem(DIRTY);
}
