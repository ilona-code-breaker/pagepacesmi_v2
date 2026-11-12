import { describe, expect, it } from 'vitest';
import { saveToQueue, removeFromQueue, filterReadingQueue } from '../readingQueue';
import { DEFAULT_FILTERS, filterAndSortBooks } from '../libraryFilters';
import type { Recommendation } from '../recommendations';
import type { BookEntry } from '../../types/book';

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
});