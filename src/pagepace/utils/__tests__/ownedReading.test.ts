import { expect, it } from 'vitest';
import { moveOwnedToReadingList, syncTrackedOwnedBook } from '../ownedReading';
import { findOwned, isOwnedRead } from '../ownedBooks';

const owned = { id: 'owned-1', title: 'Dune', author: 'Frank Herbert', totalPages: 400, format: 'E-Reader' as const, isbn: '9780441172719', addedAt: '2026-11-01' };
it('puts an owned book on Want to read only once', () => {
  const first = moveOwnedToReadingList(owned, 'want', [], [], '2026-11-15', 'q1');
  const again = moveOwnedToReadingList(owned, 'want', [], first.queue, '2026-11-15', 'q2');
  expect(again.queue).toEqual([{ id: 'q1', title: 'Dune', author: 'Frank Herbert', genre: undefined, ownedBookId: 'owned-1' }]);
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

it('matches a Lithuanian owned title through its English alternative', () => {
  const translated = { ...owned, title: 'Kopa', alternativeTitle: 'Dune', isbn: '9786090000000' };
  expect(findOwned([translated], { title: 'Dune', author: 'Frank Herbert' })?.id).toBe('owned-1');
  expect(isOwnedRead(translated, [{ title: 'Another book', author: 'Frank Herbert' }])).toBe(false);
});
it('links an explicitly chosen edition despite different title, author spelling and ISBN', () => {
  const translated = { ...owned, title: 'Kopa', author: 'Frankas Herbertas', isbn: '9786090000000' };
  const english = { ...owned, id: 'track-1', ownedBookId: translated.id, alternativeTitle: 'Kopa' };
  const synced = syncTrackedOwnedBook([translated], english, 'reading', '2026-11-15');
  expect(synced).toHaveLength(1);
  expect(synced[0]).toMatchObject({ title: 'Kopa', author: 'Frankas Herbertas', alternativeTitle: 'Dune', isbn: '9786090000000' });
  expect(isOwnedRead(synced[0], [english])).toBe(true);
  const started = moveOwnedToReadingList(english, 'reading', [], [], '2026-11-15', 'r1');
  expect(started.reads[0].ownedBookId).toBe('owned-1');
});
it('preserves a translated link after queuing, starting and finishing', () => {
  const translated = { ...owned, title: 'Kopa', alternativeTitle: 'Dune' };
  const queued = moveOwnedToReadingList(translated, 'want', [], [], '2026-11-15', 'q1');
  expect(queued.queue[0].alternativeTitle).toBe('Dune');
  const started = moveOwnedToReadingList(translated, 'reading', [], queued.queue, '2026-11-15', 'r1');
  expect(started.queue).toEqual([]);
  expect(isOwnedRead(translated, started.reads)).toBe(true);
});
it('does not match different series volumes through alternative titles', () => {
  expect(isOwnedRead({ title: 'Širdies ritmu 1', alternativeTitle: 'Heartstopper 1', author: 'Alice Oseman' }, [{ title: 'Heartstopper 2', author: 'Alice Oseman' }])).toBe(false);
});