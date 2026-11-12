import { normalizeTitle, type Recommendation } from './recommendations';

export interface QueuedBook {
  id: string;
  title: string;
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