import { describe, it, expect } from 'vitest';
import { isOwnedRead, type OwnedBook } from './ownedBooks';
const o = (p: Partial<OwnedBook>): OwnedBook => ({ id: '1', title: '', author: '', totalPages: 0, addedAt: '', ...p });
describe('isOwnedRead', () => {
  it('ignores series, subtitles and author name order', () => {
    expect(isOwnedRead(o({ title: 'Dune (Dune #1)', author: 'Herbert, Frank' }), [{ title: 'Dune: Deluxe Edition', author: 'Frank Herbert' }])).toBe(true);
  });
  it('matches ISBN-10 to ISBN-13', () => {
    expect(isOwnedRead(o({ title: 'X', isbn: '0441013597' }), [{ title: 'Y', author: '', isbn: '9780441013593' }])).toBe(true);
  });
  it('different author is unread', () => {
    expect(isOwnedRead(o({ title: 'Emma', author: 'Jane Austen' }), [{ title: 'Emma', author: 'Someone Else' }])).toBe(false);
  });
});
