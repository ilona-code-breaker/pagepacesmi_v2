import { describe, it, expect } from 'vitest';
import { activeReadingDays, computeStreaks, MAX_BOOK_SPAN_DAYS } from '../readingStats';

describe('active reads count toward streak', () => {
  it('a book started 14 days ago and updated today gives a 15-day streak', () => {
    const extra = activeReadingDays([{ startDate: '2026-11-09', lastProgressDate: '2026-11-23', currentPage: 40 }], '2026-11-23');
    expect(computeStreaks([], '2026-11-23', extra).current).toBe(15);
  });
  it('keeps the streak alive when progress was updated yesterday', () => {
    const extra = activeReadingDays([{ startDate: '2026-11-18', lastProgressDate: '2026-11-22', currentPage: 60 }], '2026-11-23');
    expect(computeStreaks([], '2026-11-23', extra).current).toBe(5);
  });
  it('stops counting an active book not updated within the last 2 days', () => {
    const extra = activeReadingDays([{ startDate: '2026-11-01', lastProgressDate: '2026-11-20', currentPage: 60 }], '2026-11-23');
    expect(extra.size).toBe(0);
    expect(computeStreaks([], '2026-11-23', extra).current).toBe(0);
  });
  it('ignores old untouched legacy books without lastProgressDate', () => {
    const extra = activeReadingDays([{ startDate: '2021-05-01', currentPage: 40 }], '2026-11-23');
    expect(extra.size).toBe(0);
    expect(computeStreaks([], '2026-11-23', extra).current).toBe(0);
  });
  it('caps a multi-year active book updated today to MAX_BOOK_SPAN_DAYS', () => {
    const extra = activeReadingDays([{ startDate: '2021-05-01', lastProgressDate: '2026-11-23', currentPage: 120 }], '2026-11-23');
    expect(computeStreaks([], '2026-11-23', extra).current).toBe(MAX_BOOK_SPAN_DAYS);
  });
  it('a book with no pages logged does not count', () => {
    expect(activeReadingDays([{ startDate: '2026-11-23', lastProgressDate: '2026-11-23', currentPage: 0 }], '2026-11-23').size).toBe(0);
  });
  it('percentage and audiobook reads count toward streak when progress > 0', () => {
    expect(activeReadingDays([{ startDate: '2026-11-20', lastProgressDate: '2026-11-23', currentPage: 0, progressUnit: 'percent', percentRead: 15 }], '2026-11-23').size).toBe(4);
    expect(activeReadingDays([{ startDate: '2026-11-20', lastProgressDate: '2026-11-23', currentPage: 0, progressUnit: 'audiobook', currentMinutes: 30 }], '2026-11-23').size).toBe(4);
    expect(activeReadingDays([{ startDate: '2026-11-20', lastProgressDate: '2026-11-23', currentPage: 0, progressUnit: 'audiobook', currentMinutes: 0 }], '2026-11-23').size).toBe(0);
  });
});
