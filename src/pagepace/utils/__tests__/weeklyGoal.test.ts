import { describe, it, expect } from 'vitest';
import { weekOf, weekTarget, weekProgress, weeklyGoalInfo, weeksMetByMonth, hadFullReadingWeek } from '../weeklyGoal';
import type { BookEntry, MonthlyGoal } from '../../types/book';

const bk = (finishDate: string, totalPages = 300, startDate = finishDate) => ({ id: finishDate + totalPages, title: 'B', author: 'A', totalPages, startDate, finishDate }) as BookEntry;
const goal = (key: string, targetBooks: number, targetPages: number, targetType: MonthlyGoal['targetType'] = 'both'): Record<string, MonthlyGoal> => ({ [key]: { monthKey: key, targetType, targetBooks, targetPages } });

describe('weekly goal', () => {
  it('weeks start on Monday', () => {
    expect(weekOf('2026-11-09')).toBe(weekOf('2026-11-15')); // Mon..Sun
    expect(weekOf('2026-11-16')).toBe(weekOf('2026-11-15')! + 1);
  });
  it('scales the monthly goal to 7 days (30-day November: 6 books, 3000 pages → 1 book, 700 pages)', () => {
    expect(weekTarget(goal('2026-11', 6, 3000), weekOf('2026-11-12')!)).toEqual({ type: 'both', books: 1, pages: 700 });
  });
  it('a week needs at least 1 book even with a small monthly goal', () => {
    expect(weekTarget(goal('2026-11', 1, 100), weekOf('2026-11-12')!).books).toBe(1);
  });
  it('a books-only goal is met by books alone', () => {
    const g = goal('2026-11', 6, 3000, 'books');
    expect(weekProgress([bk('2026-11-10', 100)], g, weekOf('2026-11-10')!).met).toBe(true);
    expect(weekProgress([bk('2026-11-10', 100)], goal('2026-11', 6, 3000), weekOf('2026-11-10')!).met).toBe(false);
  });
  it('counts consecutive weeks; the week in progress does not break the streak', () => {
    const g = goal('2026-11', 6, 300, 'books');
    const books = [bk('2026-11-03'), bk('2026-11-12')]; // weeks of Nov 2 and Nov 9
    expect(weeklyGoalInfo(books, g, '2026-11-17').current).toBe(2); // week of Nov 16 not hit yet
    expect(weeklyGoalInfo(books, g, '2026-11-24').current).toBe(0); // missed week of Nov 16
    expect(weeklyGoalInfo(books, g, '2026-11-24').longest).toBe(2);
  });
  it('counts weekly goals hit per month', () => {
    const g = goal('2026-11', 6, 300, 'books');
    const books = ['2026-11-03', '2026-11-10', '2026-11-17', '2026-11-24'].map((d) => bk(d));
    expect(weeksMetByMonth(books, g, '2026-11-30').get('2026-11')).toBe(4);
  });
  it('detects reading on all 7 days of a Monday–Sunday week', () => {
    expect(hadFullReadingWeek([bk('2026-11-15', 300, '2026-11-09')], '2026-11-20')).toBe(true);
    expect(hadFullReadingWeek([bk('2026-11-16', 300, '2026-11-10')], '2026-11-20')).toBe(false);
  });
});
