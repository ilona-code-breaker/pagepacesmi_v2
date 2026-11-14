import type { BookEntry, MonthlyGoal } from '../types/book';
import { readingDays, toDayIndex, todayIso } from './readingStats';

/**
 * Weekly goal = this month's goal scaled to 7 days. Weeks run Monday–Sunday and
 * belong to the month of their Thursday, so each week falls in exactly one month.
 * Only finished books count (by finish date), like the monthly and yearly goals.
 */
const DAY = 24 * 60 * 60 * 1000;
export const DEFAULT_MONTH_GOAL = { targetType: 'both' as const, targetBooks: 3, targetPages: 1000 };

export interface WeekTarget { books: number; pages: number; type: MonthlyGoal['targetType'] }
export interface WeekProgress {
  week: number; start: string; end: string; monthKey: string;
  books: number; pages: number; target: WeekTarget;
  booksPct: number; pagesPct: number; pct: number; met: boolean;
}

/** Monday-start week number (day 0 = Thu 1970-01-01, so a week's Thursday is week*7). */
export const weekOf = (iso: string): number | null => { const d = toDayIndex(iso); return d === null ? null : Math.floor((d + 3) / 7); };
const isoOfDay = (d: number) => new Date(d * DAY).toISOString().slice(0, 10);
export const weekMonth = (week: number) => isoOfDay(week * 7).slice(0, 7);
const daysIn = (key: string) => { const [y, m] = key.split('-').map(Number); return new Date(y, m, 0).getDate(); };

export function weekTarget(goals: Record<string, MonthlyGoal>, week: number): WeekTarget {
  const key = weekMonth(week);
  const g = goals[key] ?? DEFAULT_MONTH_GOAL;
  const scale = 7 / daysIn(key);
  return {
    type: g.targetType || 'both',
    books: Math.max(1, Math.round(Math.max(1, g.targetBooks || 3) * scale)),
    pages: Math.max(1, Math.round(Math.max(50, g.targetPages || 1000) * scale)),
  };
}

function weekTotals(books: BookEntry[]) {
  const m = new Map<number, { books: number; pages: number }>();
  for (const b of books) {
    const w = weekOf(b.finishDate);
    if (w === null) continue;
    const t = m.get(w) ?? { books: 0, pages: 0 };
    t.books++; t.pages += Number(b.totalPages) || 0;
    m.set(w, t);
  }
  return m;
}

const progressOf = (week: number, t: { books: number; pages: number } | undefined, target: WeekTarget): WeekProgress => {
  const books = t?.books ?? 0, pages = t?.pages ?? 0;
  const booksPct = Math.min(100, Math.round((books / target.books) * 100));
  const pagesPct = Math.min(100, Math.round((pages / target.pages) * 100));
  const okB = books >= target.books, okP = pages >= target.pages;
  const met = target.type === 'books' ? okB : target.type === 'pages' ? okP : okB && okP;
  const pct = target.type === 'books' ? booksPct : target.type === 'pages' ? pagesPct : Math.round((booksPct + pagesPct) / 2);
  return { week, start: isoOfDay(week * 7 - 3), end: isoOfDay(week * 7 + 3), monthKey: weekMonth(week), books, pages, target, booksPct, pagesPct, pct, met };
};

export function weekProgress(books: BookEntry[], goals: Record<string, MonthlyGoal>, week: number): WeekProgress {
  return progressOf(week, weekTotals(books).get(week), weekTarget(goals, week));
}

export interface WeeklyGoalInfo { thisWeek: WeekProgress; current: number; longest: number; metWeeks: WeekProgress[] }

/** Weekly goal streak: consecutive weeks hit. The week in progress never breaks the streak. */
export function weeklyGoalInfo(books: BookEntry[], goals: Record<string, MonthlyGoal>, today: string = todayIso()): WeeklyGoalInfo {
  const now = weekOf(today)!;
  const totals = weekTotals(books);
  const weeks = [...totals.keys()].filter((w) => w <= now);
  const first = weeks.length ? Math.min(...weeks) : now;
  const metWeeks: WeekProgress[] = [];
  const met = new Set<number>();
  let longest = 0, run = 0;
  for (let w = first; w <= now; w++) {
    const p = progressOf(w, totals.get(w), weekTarget(goals, w));
    if (p.met) { met.add(w); metWeeks.push(p); run++; longest = Math.max(longest, run); } else run = 0;
  }
  let current = 0;
  for (let w = met.has(now) ? now : now - 1; met.has(w); w--) current++;
  return { thisWeek: progressOf(now, totals.get(now), weekTarget(goals, now)), current, longest, metWeeks };
}

/** Number of weekly goals hit per month (week counted in its Thursday's month). */
export function weeksMetByMonth(books: BookEntry[], goals: Record<string, MonthlyGoal>, today?: string): Map<string, number> {
  const m = new Map<string, number>();
  weeklyGoalInfo(books, goals, today).metWeeks.forEach((p) => m.set(p.monthKey, (m.get(p.monthKey) ?? 0) + 1));
  return m;
}

/** True when some Monday–Sunday week (up to today) had reading on all 7 days. */
export function hadFullReadingWeek(books: BookEntry[], today: string = todayIso()): boolean {
  const days = readingDays(books);
  const t = toDayIndex(today)!;
  const perWeek = new Map<number, number>();
  days.forEach((d) => { if (d > t) return; const w = Math.floor((d + 3) / 7); perWeek.set(w, (perWeek.get(w) ?? 0) + 1); });
  return [...perWeek.values()].some((n) => n >= 7);
}
