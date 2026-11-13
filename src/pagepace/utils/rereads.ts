import type { BookEntry } from '../types/book';

const SEP = '#reread-';

/** Each extra read becomes its own finished entry on its reread date, so goals, streaks and yearly counts include re-reads. */
export function withRereads(books: BookEntry[]): BookEntry[] {
  const out: BookEntry[] = [];
  for (const b of books) {
    out.push(b);
    (b.rereadDates ?? []).forEach((d, i) => {
      if (d) out.push({ ...b, id: `${b.id}${SEP}${i}`, startDate: d, finishDate: d, rereadDates: undefined });
    });
  }
  return out;
}

/** Map a re-read entry back to the original book. */
export function originalBook(books: BookEntry[], book: BookEntry): BookEntry {
  const id = book.id.split(SEP)[0];
  return books.find((b) => b.id === id) ?? book;
}
