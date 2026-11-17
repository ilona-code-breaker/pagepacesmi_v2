import type { OwnedBook } from './ownedBooks';

export const OWNED_EXPORT_HEADERS = ['Title', 'Original Title', 'Author', 'Format', 'Pages', 'Genre', 'ISBN', 'Date Added', 'Status'];

export function ownedRows(owned: OwnedBook[], statusOf: Map<string, string>): (string | number)[][] {
  return owned.map((b) => [b.title, b.alternativeTitle ?? '', b.author ?? '', b.format ?? '', b.totalPages || '', b.genre ?? '', b.isbn ?? '', b.addedAt ?? '', statusOf.get(b.id) ?? '']);
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportOwnedCsv(owned: OwnedBook[], statusOf: Map<string, string>) {
  const esc = (v: string | number) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [OWNED_EXPORT_HEADERS, ...ownedRows(owned, statusOf)].map((r) => r.map(esc).join(',')).join('\n');
  save(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }), `my-library-${stamp()}.csv`);
}

export async function exportOwnedXlsx(owned: OwnedBook[], statusOf: Map<string, string>) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([OWNED_EXPORT_HEADERS, ...ownedRows(owned, statusOf)]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'My Library');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  save(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `my-library-${stamp()}.xlsx`);
}
