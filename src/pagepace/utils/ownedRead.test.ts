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
describe('isOwnedRead typos and volumes', () => {
  const done = [
    { title: 'Heartstopper: Volume Two (Heartstopper, #2)', author: 'Alice Oseman' },
    { title: 'This Winter (Solitaire, #0.5)', author: 'Alice Oseman' },
  ];
  it('matches a misspelled title and author with the same volume', () => {
    expect(isOwnedRead(o({ title: 'Hearstopper 2', author: 'Alice Oselman' }), done)).toBe(true);
    expect(isOwnedRead(o({ title: 'This Winter', author: 'Alice Oselman' }), done)).toBe(true);
  });
  it('a different volume stays unread', () => {
    expect(isOwnedRead(o({ title: 'Heartstopper 3', author: 'Alice Oseman' }), done)).toBe(false);
  });
});
import { findOwnedDuplicates, removeOwnedDuplicates } from './ownedBooks';
describe('owned duplicates', () => {
  it('finds typo duplicates but keeps different volumes', () => {
    const list = [o({ id: 'a', title: 'Heartstopper 2', author: 'Alice Oseman' }), o({ id: 'b', title: 'Hearstopper 2', author: 'Alice Oselman', isbn: '9781444951400' }), o({ id: 'c', title: 'Heartstopper 3', author: 'Alice Oseman' })];
    expect(findOwnedDuplicates(list)).toHaveLength(1);
    const out = removeOwnedDuplicates(list);
    expect(out.map((b) => b.id)).toEqual(['b', 'c']);
  });
});
