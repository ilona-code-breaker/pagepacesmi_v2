import { describe, expect, it } from 'vitest';
import { saveToQueue, removeFromQueue } from '../readingQueue';
import type { Recommendation } from '../recommendations';

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
});