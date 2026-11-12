import { expect, it } from 'vitest';
import { dropReadingBook } from '../readingStatus';
import { DEFAULT_SHELVES } from '../libraryFilters';
const book = { id: 'a', title: 'Dune', author: 'Frank Herbert', totalPages: 400, currentPage: 80, startDate: '2026-11-01', genre: 'Sci-Fi' };
it('moves an in-progress book to Dropped preserving its progress and details', () => {
  const next = dropReadingBook([book], [], 'a', '2026-11-12');
  expect(next.reads).toEqual([]);
  expect(next.dropped).toEqual([{ ...book, droppedDate: '2026-11-12' }]);
});
it('does not create a completed book or finish date when dropped', () => {
  expect(dropReadingBook([book], [], 'a', '2026-11-12').dropped[0]).not.toHaveProperty('finishDate');
});
it('does not offer Book club as a default shelf', () => {
  expect(DEFAULT_SHELVES).not.toContain('Book club');
});