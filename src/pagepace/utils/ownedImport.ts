import { OWNED_FORMATS, type OwnedBook, type OwnedFormat } from './ownedBooks';

type Row = Record<string, unknown>;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
const pick = (row: Row, names: string[]) => {
  for (const k of Object.keys(row)) if (names.includes(norm(k))) { const v = String(row[k] ?? '').trim(); if (v) return v; }
  return '';
};

/** Turn spreadsheet rows (any column order; headers like Title, Author, Pages, Genre, ISBN, Format) into owned books. */
export function rowsToOwned(rows: Row[]): Omit<OwnedBook, 'id' | 'addedAt'>[] {
  const out: Omit<OwnedBook, 'id' | 'addedAt'>[] = [];
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
    });
  }
  return out;
}

export async function parseOwnedFile(file: File) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return rowsToOwned(XLSX.utils.sheet_to_json<Row>(sheet, { defval: '' }));
}
