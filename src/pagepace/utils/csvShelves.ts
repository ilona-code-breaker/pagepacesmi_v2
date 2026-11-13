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
    added.push({ id: makeId(i), title: r.title, author: r.author, genre: r.genre || undefined });
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
