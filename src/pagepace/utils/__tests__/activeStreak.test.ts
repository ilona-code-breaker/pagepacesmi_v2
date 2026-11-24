import { describe, it, expect } from 'vitest';
import { activeReadingDays, computeStreaks } from '../readingStats';

describe('active reads count toward streak', () => {
  it('a book started 14 days ago with pages logged gives a 15-day streak', () => {
    const extra = activeReadingDays([{ startDate: '2026-11-09', currentPage: 40 }], '2026-11-23');
    expect(computeStreaks([], '2026-11-23', extra).current).toBe(15);
  });
  it('a book with no pages logged does not count', () => {
    expect(activeReadingDays([{ startDate: '2026-11-09', currentPage: 0 }], '2026-11-23').size).toBe(0);
  });
  it('percentage and audiobook reads count toward streak when progress > 0', () => {
    expect(activeReadingDays([{ startDate: '2026-11-20', currentPage: 0, progressUnit: 'percent', percentRead: 15 }], '2026-11-23').size).toBe(4);
    expect(activeReadingDays([{ startDate: '2026-11-20', currentPage: 0, progressUnit: 'audiobook', currentMinutes: 30 }], '2026-11-23').size).toBe(4);
    expect(activeReadingDays([{ startDate: '2026-11-20', currentPage: 0, progressUnit: 'audiobook', currentMinutes: 0 }], '2026-11-23').size).toBe(0);
  });
});
