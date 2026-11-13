import { describe, it, expect } from 'vitest';
import { mergeValue, newItems, dedupeList } from './merge';
const b = (id: string, title: string, finishDate = '2026-01-01') => ({ id, title, author: 'X', finishDate });
describe('merge', () => {
  it('same book on two devices with different ids is not doubled', () => {
    expect(mergeValue([b('1', 'Dune')], [b('2', 'Dune')])).toEqual([b('2', 'Dune')]);
  });
  it('only device-only books count as new', () => {
    expect(newItems([b('1', 'Dune'), b('3', 'Emma')], [b('2', 'The Dune')])).toEqual([b('3', 'Emma')]);
  });
  it('declining keeps only account books', () => {
    expect(mergeValue([b('3', 'Emma')], [b('2', 'Dune')], false)).toEqual([b('2', 'Dune')]);
  });
  it('re-reads with different finish dates are kept', () => {
    expect(dedupeList([b('1', 'Dune', '2025-01-01'), b('2', 'Dune', '2026-01-01')])).toHaveLength(2);
  });
  it('removes duplicate copies', () => {
    expect(dedupeList([b('1', 'Dune'), b('2', 'dune')])).toEqual([b('1', 'Dune')]);
  });
  it('account settings win', () => { expect(mergeValue({ x: 1 }, { x: 2 })).toEqual({ x: 2 }); });
});
