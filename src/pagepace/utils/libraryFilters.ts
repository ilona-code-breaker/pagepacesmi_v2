import { ArchetypeId, BookEntry } from '../types/book';

export const DEFAULT_SHELVES = ['Want to read', 'Re-read', 'Book club', 'Favourites'] as const;

export type SortKey = 'date' | 'ppd' | 'rating' | 'author' | 'title' | 'genre';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date', label: 'Date finished (newest)' },
  { value: 'rating', label: 'Rating (highest)' },
  { value: 'ppd', label: 'Pace (highest PPD)' },
  { value: 'author', label: 'Author (A–Z)' },
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'genre', label: 'Genre (A–Z)' },
];

export interface LibraryFilterState {
  search: string;
  archetype: ArchetypeId | 'all';
  genre: string | 'all';
  shelf: string | 'all';
  sortBy: SortKey;
}

export const DEFAULT_FILTERS: LibraryFilterState = {
  search: '',
  archetype: 'all',
  genre: 'all',
  shelf: 'all',
  sortBy: 'date',
};

/** Surname-ish sort key: "Frank Herbert" -> "herbert frank" */
const authorKey = (author?: string) => {
  const first = (author || '').split(',')[0].trim().toLowerCase();
  const parts = first.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return first;
  return `${parts[parts.length - 1]} ${parts.slice(0, -1).join(' ')}`;
};

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

export function matchesSearch(book: BookEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    book.title,
    book.author,
    book.genre,
    ...(book.genres || []),
    ...(book.shelves || []),
    book.notes,
    ...(book.quotes || []),
  ];
  return haystack.some((v) => typeof v === 'string' && v.toLowerCase().includes(q));
}

export function filterAndSortBooks(books: BookEntry[], f: LibraryFilterState): BookEntry[] {
  const genreLc = f.genre.toLowerCase();
  const shelfLc = f.shelf.toLowerCase();
  return books
    .filter((b) => {
      if (!matchesSearch(b, f.search)) return false;
      if (f.archetype !== 'all' && b.archetypeId !== f.archetype) return false;
      if (
        f.genre !== 'all' &&
        !(b.genre?.toLowerCase() === genreLc || b.genres?.some((g) => g.toLowerCase() === genreLc))
      )
        return false;
      if (f.shelf !== 'all' && !b.shelves?.some((s) => s.toLowerCase() === shelfLc)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (f.sortBy) {
        case 'ppd':
          return b.ppd - a.ppd;
        case 'rating':
          return b.rating - a.rating;
        case 'author':
          return collator.compare(authorKey(a.author), authorKey(b.author)) || collator.compare(a.title, b.title);
        case 'title':
          return collator.compare(a.title, b.title);
        case 'genre':
          return collator.compare(a.genre || 'zzz', b.genre || 'zzz') || collator.compare(a.title, b.title);
        default:
          return (
            new Date(b.finishDate).getTime() - new Date(a.finishDate).getTime() || b.createdAt - a.createdAt
          );
      }
    });
}

/** Genre -> count, most common first */
export function countGenres(books: BookEntry[]): [string, number][] {
  const counts: Record<string, number> = {};
  books.forEach((b) => {
    const primary = b.genre?.trim();
    if (primary) counts[primary] = (counts[primary] || 0) + 1;
    b.genres?.forEach((g) => {
      if (g !== primary) counts[g] = (counts[g] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

/** All shelves in use plus the default ones, with counts */
export function countShelves(books: BookEntry[]): [string, number][] {
  const counts = new Map<string, number>();
  DEFAULT_SHELVES.forEach((s) => counts.set(s, 0));
  books.forEach((b) => b.shelves?.forEach((s) => counts.set(s, (counts.get(s) || 0) + 1)));
  return Array.from(counts.entries());
}
