import { describe, it, expect } from 'vitest';
import { mergeValue, newItems, dedupeList, stripSamples } from './merge';
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
  it('strips sample books from arrays and leaves non-arrays intact', () => {
    expect(stripSamples([b('sample-0', '[SAMPLE] Red Rising'), b('1', 'Dune')])).toEqual([b('1', 'Dune')]);
    expect(stripSamples({ x: 1 })).toEqual({ x: 1 });
  });
  it('new account with only sample books locally merges to empty archive', () => {
    expect(mergeValue([b('sample-0', '[SAMPLE] Red Rising'), b('sample-1', '[SAMPLE] Project Hail Mary')], undefined, true)).toEqual([]);
    expect(mergeValue([b('sample-0', '[SAMPLE] Red Rising')], undefined, false)).toEqual([]);
  });
  it('strips leftover sample books from remote account data', () => {
    expect(mergeValue([b('sample-0', '[SAMPLE] Red Rising')], [b('sample-0', '[SAMPLE] Red Rising')], false)).toEqual([]);
    expect(mergeValue(undefined, [b('sample-0', '[SAMPLE] Red Rising'), b('2', 'Dune')])).toEqual([b('2', 'Dune')]);
  });
});
