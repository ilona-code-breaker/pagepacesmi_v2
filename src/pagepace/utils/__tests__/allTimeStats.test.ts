import { describe, expect, it } from 'vitest';
import { ALL_TIME, buildYearInReview } from '../readingStats';

const bk = (finishDate: string, totalPages: number) => ({ id: finishDate, title: 'B', author: 'A', totalPages, startDate: finishDate, finishDate, elapsedDays: 1, ppd: totalPages, archetypeId: 'steady-cruiser', rating: 0, review: '', createdAt: 0 }) as never;

describe('all time review', () => {
  it('sums pages across every year and groups books per year', () => {
    const r = buildYearInReview([bk('2024-05-01', 300), bk('2026-01-02', 200), bk('2026-03-02', 100)], ALL_TIME);
    expect(r.pageCount).toBe(600);
    expect(r.bookCount).toBe(3);
    expect(r.periodYears).toEqual([2024, 2026]);
    expect(r.booksPerMonth).toEqual([1, 2]);
  });
});
