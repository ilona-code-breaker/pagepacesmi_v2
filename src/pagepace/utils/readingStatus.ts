import type { CurrentRead } from './currentReading';

export interface DroppedRead extends CurrentRead { droppedDate: string }

export function dropReadingBook(reads: CurrentRead[], dropped: DroppedRead[], id: string, today: string) {
  const book = reads.find((r) => r.id === id);
  if (!book) return { reads, dropped };
  return { reads: reads.filter((r) => r.id !== id), dropped: [{ ...book, droppedDate: today }, ...dropped.filter((r) => r.id !== id)] };
}