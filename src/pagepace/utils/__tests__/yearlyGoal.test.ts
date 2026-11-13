import { describe, it, expect } from 'vitest';
import { yearProgress, expectedByNow } from '../yearlyGoal';
describe('yearly goal', () => {
  it('counts only books finished in that year', () => {
    const books = [{ finishDate: '2026-02-01', totalPages: 300 }, { finishDate: '2025-12-31', totalPages: 100 }, { finishDate: '2026-11-01', totalPages: 200 }] as never;
    expect(yearProgress(books, 2026)).toEqual({ books: 2, pages: 500 });
  });
  it('expects half the goal mid-year', () => {
    expect(expectedByNow(36, new Date(2026, 6, 2))).toBe(18);
  });
});
