import type { NormalizedCsvRow } from './csvParser';
import type { QueuedBook } from './readingQueue';
import type { CurrentRead } from './currentReading';
import { normalizeTitle } from './recommendations';

/** Goodreads "to-read" rows become Want to read items, skipping titles already queued, reading or finished. */
export function csvToReadToQueue(rows: NormalizedCsvRow[], queue: QueuedBook[], taken: string[], makeId: (i: number) => string): QueuedBook[] {
  const seen = new Set([...queue.map((q) => q.title), ...taken].map(normalizeTitle));
  const added: QueuedBook[] = [];
  rows.filter((r) => r.shelf === 'to-read').forEach((r, i) => {
    const k = normalizeTitle(r.title);
    if (!k || seen.has(k)) return;
    seen.add(k);
    added.push({
      id: makeId(i),
      title: r.title,
      author: r.author,
      genre: r.genre || undefined,
      ...(r.totalPages ? { totalPages: r.totalPages } : {}),
      ...(r.isbn ? { isbn: r.isbn } : {}),
      ...(r.publisher ? { publisher: r.publisher } : {}),
      ...(r.publishedYear ? { publishedYear: r.publishedYear } : {}),
    });
  });
  return [...queue, ...added];
}

/** Goodreads "currently-reading" rows become In progress reads at page 0, skipping titles already being read. */
export function csvReadingToCurrent(rows: NormalizedCsvRow[], existing: CurrentRead[], today: string, makeId: (i: number) => string): CurrentRead[] {
  const seen = new Set(existing.map((r) => normalizeTitle(r.title)));
  const added: CurrentRead[] = [];
  rows.filter((r) => r.shelf === 'currently-reading').forEach((r, i) => {
    const k = normalizeTitle(r.title);
    if (!k || seen.has(k)) return;
    seen.add(k);
    added.push({
      id: makeId(i), title: r.title, author: r.author, totalPages: r.totalPages || 300, currentPage: 0,
      startDate: r.dateAdded && r.dateAdded <= today ? r.dateAdded : today,
      genre: r.genre || undefined, isbn: r.isbn, publisher: r.publisher, publishedYear: r.publishedYear,
    });
  });
  return added;
}

/** Earlier imports may have put Goodreads to-read / currently-reading books into finished books; drop those CSV-imported copies so the CSV shelf wins. Books entered by hand are kept. */
export function dropMisfiledCsvBooks<T extends { id: string; title: string }>(books: T[], rows: NormalizedCsvRow[]): T[] {
  const notRead = new Set(rows.filter((r) => r.shelf === 'to-read' || r.shelf === 'currently-reading').map((r) => normalizeTitle(r.title)));
  return books.filter((b) => !(b.id.startsWith('csv-') && notRead.has(normalizeTitle(b.title))));
}
