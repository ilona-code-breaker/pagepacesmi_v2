import { expect, it } from 'vitest';
import { moveOwnedToReadingList, syncTrackedOwnedBook } from '../ownedReading';

const owned = { id: 'owned-1', title: 'Dune', author: 'Frank Herbert', totalPages: 400, format: 'E-Reader' as const, isbn: '9780441172719', addedAt: '2026-11-01' };
it('puts an owned book on Want to read only once', () => {
  const first = moveOwnedToReadingList(owned, 'want', [], [], '2026-11-15', 'q1');
  const again = moveOwnedToReadingList(owned, 'want', [], first.queue, '2026-11-15', 'q2');
  expect(again.queue).toEqual([{ id: 'q1', title: 'Dune', author: 'Frank Herbert', genre: undefined }]);
  expect(again.reads).toEqual([]);
});
it('starts an owned book with its details and removes it from Want to read', () => {
  const queued = [{ id: 'q1', title: 'Dune', author: 'Frank Herbert' }];
  const next = moveOwnedToReadingList(owned, 'reading', [], queued, '2026-11-15', 'r1');
  expect(next.queue).toEqual([]);
  expect(next.reads[0]).toMatchObject({ id: 'r1', title: 'Dune', totalPages: 400, format: 'E-Reader', isbn: owned.isbn, currentPage: 0, startDate: '2026-11-15' });
  expect(next.reads[0]).not.toHaveProperty('finishDate');
});
it('keeps existing reading progress and does not create duplicate current reads', () => {
  const current = { ...owned, id: 'r1', currentPage: 120, startDate: '2026-11-10' };
  const next = moveOwnedToReadingList(owned, 'reading', [current], [], '2026-11-15', 'r2');
  expect(next.reads).toEqual([current]);
});
it('updates an existing owned copy instead of adding another when tracking starts', () => {
  const next = syncTrackedOwnedBook([{ ...owned, markedRead: false }], { ...owned, totalPages: 420 }, 'reading', '2026-11-15');
  expect(next).toHaveLength(1);
  expect(next[0]).toMatchObject({ id: 'owned-1', totalPages: 420 });
  expect(next[0].markedRead).toBeUndefined();
});
it('adds a checked owned book with the chosen finished status', () => {
  const { id, addedAt, ...details } = owned;
  const next = syncTrackedOwnedBook([], details, 'finished', '2026-11-15');
  expect(next).toHaveLength(1);
  expect(next[0]).toMatchObject({ title: 'Dune', markedRead: true, addedAt: '2026-11-15' });
});
it('clears an old manual read override when Want to read is chosen', () => {
  const next = syncTrackedOwnedBook([{ ...owned, markedRead: true }], owned, 'want', '2026-11-15');
  expect(next[0].markedRead).toBeUndefined();
});