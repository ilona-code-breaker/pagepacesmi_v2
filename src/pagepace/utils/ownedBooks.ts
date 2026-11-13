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
  /** true/false = set by the user or an imported list; undefined = derived from finished books. */
  markedRead?: boolean;
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

const NUM_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
/** Series volume from "#3", "Volume Three", "Vol. 3", "Book 3" or a trailing "3". */
const volumeOf = (t: string): number | undefined => {
  const l = t.toLowerCase();
  const m = l.match(/#\s*(\d+(?:\.\d+)?)/) ?? l.match(/\b(?:volume|vol\.?|book|part|tomas|dalis)\s*(\d+|[a-z]+)/) ?? l.match(/\s(\d+)\s*$/);
  if (!m) return undefined;
  const v = NUM_WORDS[m[1]] ?? parseFloat(m[1]);
  return Number.isFinite(v) ? v : undefined;
};
const coreTitle = (t: string) => baseTitle(t.replace(/\s\d+\s*$/, ''));
const lev = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 3) return 99;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
};
/** Equal, or within a small typo distance for longer strings. */
const near = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= 5 && lev(a, b) <= Math.max(1, Math.floor(Math.min(a.length, b.length) / 6)));

/** An owned book counts as read when a completed book has the same ISBN, or a near-identical title (subtitles, series tags and small typos ignored), the same volume number when both have one, and a near-identical author. */
export function isOwnedRead(owned: OwnedBook, completed: Pick<BookEntry, 'title' | 'author' | 'isbn'>[]): boolean {
  const t = coreTitle(owned.title);
  const ov = volumeOf(owned.title);
  const oi = isbnKey(owned.isbn);
  return completed.some((c) => {
    if (oi && oi === isbnKey(c.isbn)) return true;
    if (!t || !near(coreTitle(c.title), t)) return false;
    const cv = volumeOf(c.title);
    if (ov !== undefined && cv !== undefined && ov !== cv) return false;
    return !owned.author || !c.author || near(authorTokens(owned.author).replace(/ /g, ''), authorTokens(c.author).replace(/ /g, ''));
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
