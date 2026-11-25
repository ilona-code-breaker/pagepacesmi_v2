import type { ApiBookMetadata } from '../services/bookApiService';
import { normalizeTitle } from './recommendations';
import { normalizeGenre } from './genreMapper';

/** Pick the closest metadata match for a title + author from unified search results. */
export function pickBestMetadataMatch(
  results: ApiBookMetadata[],
  title: string,
  author?: string,
): ApiBookMetadata | undefined {
  if (!results.length) return undefined;
  const targetTitle = normalizeTitle(title);
  const targetAuthor = (author || '').toLowerCase().trim();
  const authorLast = targetAuthor.split(/\s+/).filter(Boolean).pop() || '';

  const score = (item: ApiBookMetadata) => {
    let s = 0;
    const norm = normalizeTitle(item.title);
    if (norm === targetTitle) s += 10;
    else if (norm.includes(targetTitle) || targetTitle.includes(norm)) s += 5;
    if (authorLast && item.author.toLowerCase().includes(authorLast)) s += 4;
    if (item.coverUrl) s += 2;
    if (item.totalPages > 10 && item.totalPages !== 350) s += 2;
    if (item.genre && item.genre !== 'Unassigned') s += 1;
    return s;
  };

  return [...results].sort((a, b) => score(b) - score(a))[0];
}

export interface EnrichableBook {
  title: string;
  author: string;
  genre?: string;
  totalPages?: number;
  coverUrl?: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: number;
}

/** Merge API metadata onto a recommendation or queued book without losing existing fields. */
export function mergeBookMetadata<T extends EnrichableBook>(book: T, match?: ApiBookMetadata): T {
  if (!match) return book;
  const normalized = match.genre && match.genre !== 'Unassigned' ? normalizeGenre(match.genre) : undefined;
  const existingGenre = book.genre && book.genre !== 'Unassigned' ? book.genre : undefined;
  return {
    ...book,
    ...(book.totalPages || match.totalPages ? { totalPages: book.totalPages || match.totalPages } : {}),
    ...(book.coverUrl || match.coverUrl ? { coverUrl: book.coverUrl || match.coverUrl } : {}),
    ...(book.isbn || match.isbn ? { isbn: book.isbn || match.isbn } : {}),
    ...(book.publisher || match.publisher ? { publisher: book.publisher || match.publisher } : {}),
    ...(book.publishedYear || match.publishedYear ? { publishedYear: book.publishedYear || match.publishedYear } : {}),
    ...(existingGenre || normalized ? { genre: existingGenre || normalized } : {}),
  };
}