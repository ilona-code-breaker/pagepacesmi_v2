import type { BookEntry } from '../types/book';
import { MACRO_GENRES } from './genreMapper';

export const ASSIGNABLE_GENRES = MACRO_GENRES.filter((g) => g !== 'Unassigned');

export function isUnassigned(b: Pick<BookEntry, 'genre'>): boolean {
  return !b.genre || b.genre === 'Unassigned' || !(MACRO_GENRES as readonly string[]).includes(b.genre);
}

export function isAssignableGenre(g: unknown): g is string {
  return typeof g === 'string' && (ASSIGNABLE_GENRES as readonly string[]).includes(g);
}

/** Applies suggested genres only to books that are still unassigned. */
export function applyGenres(books: BookEntry[], picks: Record<string, string>): BookEntry[] {
  return books.map((b) => {
    const g = picks[b.id];
    if (!isUnassigned(b) || !isAssignableGenre(g)) return b;
    return { ...b, genre: g, genres: [g] as any };
  });
}

/** Asks the server for genres in batches; returns id -> genre. */
export async function fetchGenres(books: BookEntry[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const todo = books.filter(isUnassigned);
  for (let i = 0; i < todo.length; i += 40) {
    const batch = todo.slice(i, i + 40).map((b) => ({ id: b.id, title: b.title, author: b.author }));
    const res = await fetch('/api/classify-genres', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ books: batch }) });
    if (!res.ok) throw new Error('Genre lookup failed');
    const data = await res.json();
    for (const { id, genre } of data.genres ?? []) if (isAssignableGenre(genre)) out[id] = genre;
  }
  return out;
}
