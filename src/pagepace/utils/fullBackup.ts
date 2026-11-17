import * as XLSX from 'xlsx';

export const LAST_BACKUP_KEY = 'pp_last_backup_at';
export const BACKUP_FORMAT = 'pagepace-full-backup';

export interface FullBackup { format: typeof BACKUP_FORMAT; version: 1; exportedAt: string; data: Record<string, unknown> }

/** Collect every pagepace_* key from browser storage. */
export function collectBackup(store: Storage = localStorage, now = new Date()): FullBackup {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (!k || !k.startsWith('pagepace_')) continue;
    const raw = store.getItem(k);
    try { data[k] = JSON.parse(raw ?? 'null'); } catch { data[k] = raw; }
  }
  return { format: BACKUP_FORMAT, version: 1, exportedAt: now.toISOString(), data };
}

export function isFullBackup(x: unknown): x is FullBackup {
  return !!x && typeof x === 'object' && (x as FullBackup).format === BACKUP_FORMAT && typeof (x as FullBackup).data === 'object';
}

/** Write a backup back into storage (only pagepace_* keys). Returns keys restored. */
export function restoreBackup(b: FullBackup, store: Storage = localStorage): number {
  let n = 0;
  for (const [k, v] of Object.entries(b.data)) {
    if (!k.startsWith('pagepace_')) continue;
    store.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    n++;
  }
  return n;
}

function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function downloadFullBackup() {
  const b = collectBackup();
  download(new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' }), `pagepace-backup-${stamp()}.json`);
  localStorage.setItem(LAST_BACKUP_KEY, b.exportedAt);
}

const arr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []);
const flat = (rows: Record<string, unknown>[]) => rows.map((r) => {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) o[k] = v == null ? '' : typeof v === 'object' ? (Array.isArray(v) && v.every((x) => typeof x !== 'object') ? v.join(', ') : JSON.stringify(v)) : v;
  return o;
});

/** Human-readable spreadsheet: one sheet per list. */
export function downloadSpreadsheet() {
  const { data } = collectBackup();
  const find = (re: RegExp) => Object.keys(data).filter((k) => re.test(k)).flatMap((k) => arr(data[k]));
  const sheets: [string, Record<string, unknown>[]][] = [
    ['Archive (finished)', find(/^pagepace_books/)],
    ['Currently reading', find(/^pagepace_current_reads/)],
    ['Want to read', find(/^pagepace_want_to_read/)],
    ['Dropped', find(/^pagepace_dropped/)],
    ['My Library (owned)', find(/^pagepace_owned_books/)],
  ];
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of sheets) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flat(rows).length ? flat(rows) : [{ note: 'No books' }]), name);
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  download(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `pagepace-books-${stamp()}.xlsx`);
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
}
