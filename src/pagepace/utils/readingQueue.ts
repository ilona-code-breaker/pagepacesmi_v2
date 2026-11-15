import { normalizeTitle, type Recommendation } from './recommendations';
import type { LibraryFilterState } from './libraryFilters';

export interface QueuedBook {
  id: string;
  title: string;
  alternativeTitle?: string;
  ownedBookId?: string;
  author: string;
  genre?: string;
  reason?: string;
}

export const QUEUE_KEY = 'pagepace_want_to_read_v1';

export function saveToQueue(queue: QueuedBook[], book: Recommendation, id: string): QueuedBook[] {
  if (queue.some((item) => normalizeTitle(item.title) === normalizeTitle(book.title))) return queue;
  return [...queue, { id, title: book.title, author: book.author, genre: book.genre, reason: book.reason }];
}

export function removeFromQueue(queue: QueuedBook[], id: string) {
  return queue.filter((book) => book.id !== id);
}

export function filterReadingQueue(queue: QueuedBook[], filters: LibraryFilterState): QueuedBook[] {
  if (!['all', 'Want to read'].includes(filters.shelf) || filters.archetype !== 'all') return [];
  const query = filters.search.trim().toLowerCase();
  const filtered = queue.filter((book) =>
    (!query || [book.title, book.author, book.genre, book.reason].some((value) => value?.toLowerCase().includes(query))) &&
    (filters.genre === 'all' || book.genre?.toLowerCase() === filters.genre.toLowerCase())
  );
  const key = filters.sortBy === 'author' ? 'author' : filters.sortBy === 'genre' ? 'genre' : filters.sortBy === 'title' ? 'title' : undefined;
  return key ? [...filtered].sort((a, b) => (a[key] || '').localeCompare(b[key] || '', undefined, { sensitivity: 'base' })) : filtered;
}