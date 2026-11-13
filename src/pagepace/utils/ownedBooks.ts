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

const baseTitle = (t: string) =>
  t.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').split(/[:\u2013\u2014]| - /)[0]
    .replace(/^(the|a|an)\s+/, '').replace(/&/g, 'and').replace(/[^\p{L}\p{N}]/gu, '');
const authorTokens = (a: string) =>
  a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z]+/).filter((w) => w.length > 1).sort().join(' ');
/** ISBN-10 and ISBN-13 of the same edition compare equal. */
export const isbnKey = (i?: string) => {
  const d = (i ?? '').replace(/[^0-9Xx]/g, '').toUpperCase();
  return d.length === 13 && d.startsWith('978') ? d.slice(3, 12) : d.length === 10 ? d.slice(0, 9) : d;
};

/** An owned book counts as read when a completed book has the same ISBN, or the same title (subtitles and series ignored) and author (name order ignored). */
export function isOwnedRead(owned: OwnedBook, completed: Pick<BookEntry, 'title' | 'author' | 'isbn'>[]): boolean {
  const t = baseTitle(owned.title);
  const oi = isbnKey(owned.isbn);
  return completed.some((c) => {
    if (oi && oi === isbnKey(c.isbn)) return true;
    if (!t || baseTitle(c.title) !== t) return false;
    return !owned.author || !c.author || authorTokens(owned.author) === authorTokens(c.author);
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
