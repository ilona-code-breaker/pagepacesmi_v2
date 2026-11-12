import type { BookEntry } from '../types/book';

export const OWNED_KEY = 'pagepace_owned_books_v1';
export const BOOKCASE_SIZE = 100;

export const OWNED_FORMATS = ['Physical', 'E-Reader', 'Audiobook', 'Hybrid'] as const;
export type OwnedFormat = (typeof OWNED_FORMATS)[number];

export interface OwnedBook {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  genre?: string;
  coverUrl?: string;
  isbn?: string;
  format?: OwnedFormat;
  addedAt: string; // YYYY-MM-DD
}

export function ownedKey(title: string, author = ''): string {
  const t = title.toLowerCase().replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]/g, '');
  return `${t}|${author.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

function sameBook(a: { title: string; author: string; isbn?: string }, b: { title: string; author: string; isbn?: string }) {
  if (a.isbn && b.isbn && a.isbn === b.isbn) return true;
  return ownedKey(a.title, a.author) === ownedKey(b.title, b.author);
}

/** Adds books, skipping ones already owned. Returns the new list and how many were added. */
export function addOwned(list: OwnedBook[], incoming: Omit<OwnedBook, 'id' | 'addedAt'>[], today: string): { list: OwnedBook[]; added: number } {
  const next = [...list];
  let added = 0;
  for (const b of incoming) {
    if (!b.title.trim() || next.some((o) => sameBook(o, b))) continue;
    next.push({ ...b, id: `own-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, addedAt: today });
    added++;
  }
  return { list: next, added };
}

/** An owned book counts as read when a completed book has the same title (and author, when both are known). */
export function isOwnedRead(owned: OwnedBook, completed: Pick<BookEntry, 'title' | 'author' | 'isbn'>[]): boolean {
  const t = ownedKey(owned.title).split('|')[0];
  return completed.some((c) => {
    if (owned.isbn && c.isbn && owned.isbn === c.isbn) return true;
    if (ownedKey(c.title).split('|')[0] !== t) return false;
    return !owned.author || !c.author || ownedKey('', owned.author) === ownedKey('', c.author);
  });
}

/** Splits books into bookcases of BOOKCASE_SIZE; always at least one (possibly empty) bookcase. */
export function toBookcases<T>(books: T[], size = BOOKCASE_SIZE): T[][] {
  const cases: T[][] = [];
  for (let i = 0; i < books.length; i += size) cases.push(books.slice(i, i + size));
  return cases.length ? cases : [[]];
}

/** The owned copy matching a completed book, if any. */
export function findOwned(list: OwnedBook[], book: Pick<BookEntry, 'title' | 'author' | 'isbn'>): OwnedBook | undefined {
  return list.find((o) => isOwnedRead(o, [book]));
}

/** Adds the book to owned books, or removes its owned copy if it is already there. */
export function toggleOwned(list: OwnedBook[], book: Omit<OwnedBook, 'id' | 'addedAt'>, today: string): OwnedBook[] {
  const hit = findOwned(list, book);
  return hit ? list.filter((o) => o.id !== hit.id) : addOwned(list, [book], today).list;
}
