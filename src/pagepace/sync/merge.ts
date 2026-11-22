// Merge rules for moving device data into an account.
// Books are matched by title + author (+ finish date for completed reads, so re-reads stay),
// because the same book has a different id on each device.
const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]/g, '');

export function identity(item: unknown): string {
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    if (typeof o.title === 'string') return `book:${norm(o.title)}|${norm(o.author)}|${o.finishDate ?? ''}`;
    if ('id' in o) return 'id:' + String(o.id);
  }
  return 'json:' + JSON.stringify(item);
}

/** Demo books shipped to new visitors; never moved into an account. */
export const isSample = (i: unknown) => !!i && typeof i === 'object' && String((i as { id?: unknown }).id ?? '').startsWith('sample-');

/** Items in `local` that the account does not have yet. */
export function newItems(local: unknown, remote: unknown): unknown[] {
  if (!Array.isArray(local)) return [];
  const own = (local as unknown[]).filter((i) => !isSample(i));
  if (!Array.isArray(remote)) return own;
  const seen = new Set(remote.map(identity));
  return dedupeList(own).filter((i) => !seen.has(identity(i)));
}

/** Keeps the first copy of each book. */
export function dedupeList<T>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((i) => { const k = identity(i); if (seen.has(k)) return false; seen.add(k); return true; });
}

/** Lists: account copy plus (optionally) device-only books. Anything else: account wins. */
export function mergeValue(local: unknown, remote: unknown, addNew = true): unknown {
  if (remote === undefined) return local;
  if (local === undefined) return remote;
  if (Array.isArray(local) && Array.isArray(remote)) return addNew ? [...dedupeList(remote), ...newItems(local, remote)] : dedupeList(remote);
  return remote;
}
