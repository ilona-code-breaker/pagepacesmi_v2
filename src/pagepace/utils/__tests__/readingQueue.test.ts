import { describe, expect, it } from 'vitest';
import { saveToQueue, removeFromQueue, filterReadingQueue } from '../readingQueue';
import { pickBestMetadataMatch, mergeBookMetadata } from '../bookEnrich';
import { moveOwnedToReadingList } from '../ownedReading';
import { DEFAULT_FILTERS, filterAndSortBooks } from '../libraryFilters';
import type { Recommendation } from '../recommendations';
import type { BookEntry } from '../../types/book';
import type { ApiBookMetadata } from '../../services/bookApiService';

const rec: Recommendation = { title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', reason: 'A new adventure', basedOn: 'year' };

describe('Want to read queue', () => {
  it('saves a recommendation in one action, preserving its book details', () => {
    expect(saveToQueue([], rec, 'saved-1')).toEqual([{ id: 'saved-1', title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', reason: 'A new adventure' }]);
  });
  it('does not save the same recommendation twice', () => {
    const queue = saveToQueue([], rec, 'saved-1');
    expect(saveToQueue(queue, { ...rec, title: 'Hobbit: Illustrated' }, 'saved-2')).toEqual(queue);
  });
  it('removes only the book moved into Currently Reading', () => {
    const queue = [...saveToQueue([], rec, 'saved-1'), { id: 'saved-2', title: 'Dune', author: 'Frank Herbert' }];
    expect(removeFromQueue(queue, 'saved-1')).toEqual([{ id: 'saved-2', title: 'Dune', author: 'Frank Herbert' }]);
  });
  it('shows the same saved recommendation in the Library Want to read shelf', () => {
    const queue = saveToQueue([], rec, 'saved-1');
    expect(filterReadingQueue(queue, { ...DEFAULT_FILTERS, shelf: 'Want to read' })).toEqual(queue);
    expect(filterReadingQueue(queue, { ...DEFAULT_FILTERS, shelf: 'Book club' })).toEqual([]);
  });
  it('searches the shelf by author and filters by genre', () => {
    const queue = saveToQueue([], rec, 'saved-1');
    expect(filterReadingQueue(queue, { ...DEFAULT_FILTERS, search: 'tolkien', genre: 'Fantasy' })).toHaveLength(1);
    expect(filterReadingQueue(queue, { ...DEFAULT_FILTERS, search: 'herbert' })).toEqual([]);
  });
  it('does not add saved recommendations to the finished-book collection', () => {
    const finished: BookEntry[] = [];
    const queue = saveToQueue([], rec, 'saved-1');
    expect(queue).toHaveLength(1);
    expect(filterAndSortBooks(finished, DEFAULT_FILTERS)).toEqual([]);
  });

  it('preserves full API metadata (pages, cover, isbn, publisher) when saving to Want to read', () => {
    const enrichedRec: Recommendation = {
      ...rec,
      totalPages: 310,
      coverUrl: 'https://covers.example.com/hobbit.jpg',
      isbn: '9780547928227',
      publisher: 'Houghton Mifflin',
      publishedYear: 1937,
    };
    const queue = saveToQueue([], enrichedRec, 'saved-meta');
    expect(queue[0]).toEqual({
      id: 'saved-meta',
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      genre: 'Fantasy',
      reason: 'A new adventure',
      totalPages: 310,
      coverUrl: 'https://covers.example.com/hobbit.jpg',
      isbn: '9780547928227',
      publisher: 'Houghton Mifflin',
      publishedYear: 1937,
    });
  });

  it('preserves pages, cover, isbn, and format when moving a book into Want to read via moveOwnedToReadingList', () => {
    const result = moveOwnedToReadingList(
      {
        id: 'own-1',
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        totalPages: 496,
        genre: 'Sci-Fi',
        coverUrl: 'https://covers.example.com/phm.jpg',
        isbn: '9780593135204',
        format: 'E-Reader',
        addedAt: '2026-11-25',
      },
      'want',
      [],
      [],
      '2026-11-25',
      'q-1',
    );
    expect(result.queue[0]).toMatchObject({
      id: 'q-1',
      title: 'Project Hail Mary',
      totalPages: 496,
      coverUrl: 'https://covers.example.com/phm.jpg',
      isbn: '9780593135204',
      format: 'E-Reader',
    });
  });

  it('picks the best API metadata match and merges missing fields without overwriting existing ones', () => {
    const candidates: ApiBookMetadata[] = [
      { title: 'Dune Companion', author: 'Someone Else', totalPages: 200, genre: 'Sci-Fi', source: 'open_library' },
      {
        title: 'Dune',
        author: 'Frank Herbert',
        totalPages: 688,
        genre: 'Sci-Fi',
        coverUrl: 'https://covers.example.com/dune.jpg',
        isbn: '9780441172719',
        source: 'google_books',
      },
    ];
    const best = pickBestMetadataMatch(candidates, 'Dune', 'Frank Herbert');
    expect(best?.totalPages).toBe(688);
    const merged = mergeBookMetadata({ title: 'Dune', author: 'Frank Herbert', genre: 'Classic' }, best);
    expect(merged).toMatchObject({
      title: 'Dune',
      author: 'Frank Herbert',
      genre: 'Classic',
      totalPages: 688,
      coverUrl: 'https://covers.example.com/dune.jpg',
      isbn: '9780441172719',
    });
  });
});