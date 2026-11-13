import { OWNED_FORMATS, type OwnedBook, type OwnedFormat } from './ownedBooks';

type Row = Record<string, unknown>;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
const pick = (row: Row, names: string[]) => {
  for (const k of Object.keys(row)) if (names.includes(norm(k))) { const v = String(row[k] ?? '').trim(); if (v) return v; }
  return '';
};

/** Turn spreadsheet rows (any column order; headers like Title, Author, Pages, Genre, ISBN, Format) into owned books. */
export type OwnedImportRow = Omit<OwnedBook, 'id' | 'addedAt'> & { status?: 'read' | 'tbr' };

/** Status from a Status/Shelf column, falling back to the sheet name (e.g. sheets called "Read" and "TBR"). */
export function statusOf(raw: string): 'read' | 'tbr' | undefined {
  const l = raw.toLowerCase();
  if (/tbr|to.?read|want|unread|neskaity/.test(l)) return 'tbr';
  if (/^(read|done|finished|completed|perskaity|skaityta)/.test(l.trim())) return 'read';
  return undefined;
}

export function rowsToOwned(rows: Row[], sheetName = ''): OwnedImportRow[] {
  const out: OwnedImportRow[] = [];
  for (const row of rows) {
    const title = pick(row, ['title', 'booktitle', 'name', 'pavadinimas']);
    if (!title) continue;
    const fmtRaw = pick(row, ['format', 'type', 'binding']).toLowerCase();
    const format: OwnedFormat =
      OWNED_FORMATS.find((f) => norm(f) === norm(fmtRaw)) ??
      (/audio/.test(fmtRaw) ? 'Audiobook' : /kindle|ebook|e-?reader|digital/.test(fmtRaw) ? 'E-Reader' : 'Physical');
    const isbn = pick(row, ['isbn', 'isbn13', 'isbn10']).replace(/[^0-9Xx]/g, '');
    out.push({
      title,
      author: pick(row, ['author', 'authors', 'writer', 'autorius']),
      totalPages: parseInt(pick(row, ['pages', 'numberofpages', 'pagecount', 'totalpages']), 10) || 0,
      genre: pick(row, ['genre', 'category', 'zanras']) || undefined,
      isbn: isbn || undefined,
      format,
      status: statusOf(pick(row, ['status', 'readstatus', 'shelf', 'exclusiveshelf', 'read', 'statusas'])) ?? statusOf(sheetName),
    });
  }
  return out;
}

export async function parseOwnedFile(file: File) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  // Every sheet is imported, not just the first one
  return wb.SheetNames.flatMap((name) => rowsToOwned(XLSX.utils.sheet_to_json<Row>(wb.Sheets[name], { defval: '' }), name));
}
