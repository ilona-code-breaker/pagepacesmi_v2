import type { CurrentRead } from './currentReading';
import { addOwned, isOwnedRead, type OwnedBook } from './ownedBooks';
import type { QueuedBook } from './readingQueue';

export function syncTrackedOwnedBook(owned: OwnedBook[], book: Omit<OwnedBook, 'id' | 'addedAt'>, status: 'want' | 'reading' | 'finished', today: string): OwnedBook[] {
  const next = owned.some((o) => isOwnedRead(o, [book])) ? owned : addOwned(owned, [book], today).list;
  return next.map((o) => isOwnedRead(o, [book]) ? {
    ...o, alternativeTitle: o.title !== book.title ? book.title : book.alternativeTitle ?? o.alternativeTitle,
    totalPages: o.title !== book.title ? o.totalPages || book.totalPages : book.totalPages,
    genre: book.genre ?? o.genre, coverUrl: book.coverUrl ?? o.coverUrl,
    isbn: o.title !== book.title ? o.isbn || book.isbn : book.isbn ?? o.isbn, format: book.format ?? o.format,
    markedRead: status === 'finished' ? true : undefined,
  } : o);
}

/** Move an owned copy between the shared active lists without changing completion history. */
export function moveOwnedToReadingList(book: OwnedBook, status: 'reading' | 'want', reads: CurrentRead[], queue: QueuedBook[], today: string, id: string) {
  const matches = (item: CurrentRead | QueuedBook) => isOwnedRead(book, [item]);
  if (status === 'want') {
    return {
      reads: reads.filter((r) => !matches(r)),
      queue: queue.some(matches) ? queue : [...queue, { id, title: book.title, author: book.author, genre: book.genre, ...(book.alternativeTitle ? { alternativeTitle: book.alternativeTitle } : {}), ...(book.ownedBookId || book.id ? { ownedBookId: book.ownedBookId || book.id } : {}) }],
    };
  }
  const existing = reads.find(matches);
  const current: CurrentRead = existing ?? {
    id, title: book.title, author: book.author, totalPages: book.totalPages,
    genre: book.genre, format: book.format ?? 'Physical', coverUrl: book.coverUrl,
    isbn: book.isbn, currentPage: 0, startDate: today,
    alternativeTitle: book.alternativeTitle, ownedBookId: book.ownedBookId ?? book.id,
  };
  return { reads: existing ? reads : [current, ...reads], queue: queue.filter((q) => !matches(q)) };
}