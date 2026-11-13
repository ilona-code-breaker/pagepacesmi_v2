import { describe, it, expect } from 'vitest';
import { syncCornerLibrary, type OwnedBook } from './ownedBooks';
const o = (title: string, extra: Partial<OwnedBook> = {}): OwnedBook => ({ id: title, title, author: 'A', totalPages: 100, addedAt: '2026-01-01', ...extra });
const lib = (title: string) => ({ id: 'l' + title, title, author: 'A', totalPages: 100 } as any);
describe('syncCornerLibrary', () => {
  it('adds owned Read books missing from Library', () => {
    const r = syncCornerLibrary([o('X', { markedRead: true }), o('Y')], [], (b) => lib(b.title));
    expect(r.newBooks.map((b) => b.title)).toEqual(['X']);
  });
  it('marks owned Unread books Read when Library finished them', () => {
    const r = syncCornerLibrary([o('X', { markedRead: false })], [lib('X')], (b) => lib(b.title));
    expect(r.markedRead).toBe(1);
    expect(r.nextOwned[0].markedRead).toBeUndefined();
  });
  it('copies owned format to Library books without one', () => {
    const r = syncCornerLibrary([o('X', { format: 'Audiobook' })], [lib('X')], (b) => lib(b.title));
    expect(r.nextLibrary[0].format).toBe('Audiobook');
  });
});
