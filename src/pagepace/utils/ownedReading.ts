import type { CurrentRead } from './currentReading';
import { isOwnedRead, type OwnedBook } from './ownedBooks';
import type { QueuedBook } from './readingQueue';

/** Move an owned copy between the shared active lists without changing completion history. */
export function moveOwnedToReadingList(book: OwnedBook, status: 'reading' | 'want', reads: CurrentRead[], queue: QueuedBook[], today: string, id: string) {
  const matches = (item: CurrentRead | QueuedBook) => isOwnedRead(book, [item]);
  if (status === 'want') {
    return {
      reads: reads.filter((r) => !matches(r)),
      queue: queue.some(matches) ? queue : [...queue, { id, title: book.title, author: book.author, genre: book.genre }],
    };
  }
  const existing = reads.find(matches);
  const current: CurrentRead = existing ?? {
    id, title: book.title, author: book.author, totalPages: book.totalPages,
    genre: book.genre, format: book.format ?? 'Physical', coverUrl: book.coverUrl,
    isbn: book.isbn, currentPage: 0, startDate: today,
  };
  return { reads: existing ? reads : [current, ...reads], queue: queue.filter((q) => !matches(q)) };
}