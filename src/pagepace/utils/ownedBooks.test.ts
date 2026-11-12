import { describe, it, expect } from 'vitest';
import { toggleOwned, addOwned, isOwnedRead, toBookcases } from './ownedBooks';

const b = (title: string, author = 'X') => ({ title, author, totalPages: 100 });

describe('owned books', () => {
  it('one bookcase holds 100 books; the 101st starts a second', () => {
    expect(toBookcases(Array.from({ length: 100 }))).toHaveLength(1);
    const cases = toBookcases(Array.from({ length: 110 }));
    expect(cases).toHaveLength(2);
    expect(cases[1]).toHaveLength(10);
  });
  it('an empty library still shows one empty bookcase', () => {
    expect(toBookcases([])).toEqual([[]]);
  });
  it('does not add the same book twice', () => {
    const first = addOwned([], [b('The Hobbit', 'Tolkien')], '2026-11-12');
    const again = addOwned(first.list, [b('Hobbit', 'Tolkien')], '2026-11-12');
    expect(again.added).toBe(0);
    expect(again.list).toHaveLength(1);
  });
  it('marks an owned book read when it is in completed books', () => {
    const [own] = addOwned([], [b('Dune', 'Frank Herbert')], '2026-11-12').list;
    expect(isOwnedRead(own, [{ title: 'Dune', author: 'Frank Herbert' }])).toBe(true);
    expect(isOwnedRead(own, [{ title: 'Emma', author: 'Austen' }])).toBe(false);
  });
  it('toggling own on a Library book adds it, toggling again removes it', () => {
    const once = toggleOwned([], { ...b('Emma', 'Austen'), format: 'E-Reader' }, '2026-11-12');
    expect(once).toHaveLength(1);
    expect(once[0].format).toBe('E-Reader');
    expect(toggleOwned(once, b('Emma', 'Austen'), '2026-11-12')).toHaveLength(0);
  });
});
