import { describe, expect, it } from 'vitest';
import { recommendationWindows, selectRecommendations, type Recommendation } from '../recommendations';

describe('recommendation history', () => {
  const books = [
    { title: 'Older', finishDate: '2025-11-11' },
    { title: 'Year boundary', finishDate: '2025-11-12' },
    { title: 'Earlier this year', finishDate: '2026-08-11' },
    { title: 'Recent boundary', finishDate: '2026-08-12' },
    { title: 'Today', finishDate: '2026-11-12' },
    { title: 'Future', finishDate: '2026-11-13' },
  ];
  const windows = recommendationWindows(books, new Date(2026, 10, 12));
  it('uses books finished in the past 12 months for the yearly pick', () => {
    expect(windows.year.map((b) => b.title)).toEqual(['Year boundary', 'Earlier this year', 'Recent boundary', 'Today']);
  });
  it('uses books finished in the past three months for the recent pick', () => {
    expect(windows.recent.map((b) => b.title)).toEqual(['Recent boundary', 'Today']);
  });
  it('returns exactly one distinct recommendation per group', () => {
    const candidates: Recommendation[] = [
      { title: 'First', author: 'A', reason: '', basedOn: 'year' },
      { title: 'Second', author: 'B', reason: '', basedOn: 'year' },
      { title: 'First', author: 'A', reason: '', basedOn: 'recent' },
      { title: 'Third', author: 'C', reason: '', basedOn: 'recent' },
    ];
    expect(selectRecommendations(candidates, []).map((r) => r.title)).toEqual(['First', 'Third']);
  });
  it('excludes already-read and in-progress books even outside the history windows', () => {
    const candidates: Recommendation[] = [
      { title: 'The Hobbit: Illustrated', author: 'Tolkien', reason: '', basedOn: 'year' },
      { title: 'Dune', author: 'Herbert', reason: '', basedOn: 'recent' },
    ];
    expect(selectRecommendations(candidates, [{ title: 'Hobbit' }, { title: 'Dune' }])).toEqual([]);
  });
});