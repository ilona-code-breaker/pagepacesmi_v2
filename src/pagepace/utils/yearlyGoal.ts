import type { BookEntry } from '../types/book';

export const YEARLY_GOALS_KEY = 'pagepace_yearly_goals_v1';
export interface YearlyGoal { books: number; pages: number }
export const DEFAULT_YEARLY_GOAL: YearlyGoal = { books: 36, pages: 12000 };

/** Books and pages finished in the given calendar year (by finish date). */
export function yearProgress(books: BookEntry[], year: number) {
  const done = books.filter((b) => b.finishDate?.startsWith(String(year)));
  return { books: done.length, pages: done.reduce((s, b) => s + (Number(b.totalPages) || 0), 0) };
}

/** How many books you'd expect by today to stay on pace for the yearly goal. */
export function expectedByNow(goalBooks: number, now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
  return Math.round(goalBooks * ((now.getTime() - start) / (end - start)));
}
