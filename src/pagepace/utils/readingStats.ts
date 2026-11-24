import { ArchetypeId, BookEntry } from '../types/book';
import { hasLoggedProgress, type ProgressUnit } from './currentReading';

const DAY = 24 * 60 * 60 * 1000;

export const toDayIndex = (iso: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return null;
  return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY);
};

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Every calendar day on which at least one book was being read (start..finish inclusive). */
export function readingDays(books: BookEntry[]): Set<number> {
  const days = new Set<number>();
  for (const b of books) {
    const s = toDayIndex(b.startDate);
    const f = toDayIndex(b.finishDate);
    if (s === null && f === null) continue;
    const start = s ?? f!;
    const end = f ?? s!;
    const [lo, hi] = start <= end ? [start, end] : [end, start];
    // Guard against absurd ranges from bad imports
    for (let d = lo; d <= hi && d - lo < 3650; d++) days.add(d);
  }
  return days;
}

export interface StreakInfo {
  /** Consecutive reading days ending today (or yesterday, so a streak isn't lost before you log today). */
  current: number;
  longest: number;
  totalReadingDays: number;
}

/** Days covered by books still being read (start..today) once any progress (pages, %, or minutes) is logged. */
export function activeReadingDays(
  reads: { startDate: string; currentPage: number; progressUnit?: ProgressUnit; currentMinutes?: number; percentRead?: number }[],
  today: string = todayIso(),
): Set<number> {
  const days = new Set<number>();
  const t = toDayIndex(today);
  if (t === null) return days;
  for (const r of reads) {
    const s = toDayIndex(r.startDate);
    if (s === null || !hasLoggedProgress(r) || s > t) continue;
    for (let d = Math.max(s, t - 3650); d <= t; d++) days.add(d);
  }
  return days;
}

export function computeStreaks(books: BookEntry[], today: string = todayIso(), extraDays?: Set<number>): StreakInfo {
  const days = readingDays(books);
  extraDays?.forEach((d) => days.add(d));
  const sorted = Array.from(days).sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  const t = toDayIndex(today)!;
  let cursor = days.has(t) ? t : days.has(t - 1) ? t - 1 : null;
  let current = 0;
  while (cursor !== null && days.has(cursor)) {
    current++;
    cursor--;
  }
  return { current, longest, totalReadingDays: days.size };
}

export interface YearInReview {
  year: number;
  books: BookEntry[];
  bookCount: number;
  pageCount: number;
  averageRating: number;
  averagePpd: number;
  topGenre: { name: string; count: number } | null;
  topAuthor: { name: string; count: number } | null;
  topArchetype: { id: ArchetypeId; count: number } | null;
  highestRated: BookEntry | null;
  fastest: BookEntry | null;
  longest: BookEntry | null;
  booksPerMonth: number[]; // 12 entries Jan..Dec, or one per year for all time
  /** Years matching booksPerMonth when the review covers all time. */
  periodYears?: number[];
  longestStreakInYear: number;
}

const topOf = <K extends string>(items: K[]): { name: K; count: number } | null => {
  const counts = new Map<K, number>();
  items.forEach((i) => counts.set(i, (counts.get(i) || 0) + 1));
  let best: { name: K; count: number } | null = null;
  counts.forEach((count, name) => {
    if (!best || count > best.count) best = { name, count };
  });
  return best;
};

export function yearsWithBooks(books: BookEntry[]): number[] {
  const ys = new Set<number>();
  books.forEach((b) => {
    const y = parseInt((b.finishDate || '').slice(0, 4), 10);
    if (!Number.isNaN(y)) ys.add(y);
  });
  return Array.from(ys).sort((a, b) => b - a);
}

/** Year value meaning "all time" in the Progress year picker. */
export const ALL_TIME = 0;

export function buildYearInReview(all: BookEntry[], year: number): YearInReview {
  const isAll = year === ALL_TIME;
  const books = isAll ? all.filter((b) => /^\d{4}/.test(b.finishDate || '')) : all.filter((b) => (b.finishDate || '').startsWith(String(year)));
  const bookCount = books.length;
  const pageCount = books.reduce((s, b) => s + (b.totalPages || 0), 0);
  const rated = books.filter((b) => b.rating > 0);
  const averageRating = rated.length ? rated.reduce((s, b) => s + b.rating, 0) / rated.length : 0;
  const averagePpd = bookCount ? books.reduce((s, b) => s + b.ppd, 0) / bookCount : 0;
  const periodYears = isAll ? yearsWithBooks(books).sort((a, b) => a - b) : undefined;
  const booksPerMonth = periodYears ? periodYears.map(() => 0) : Array(12).fill(0);
  books.forEach((b) => {
    if (periodYears) {
      booksPerMonth[periodYears.indexOf(parseInt(b.finishDate.slice(0, 4), 10))]++;
      return;
    }
    const m = parseInt(b.finishDate.slice(5, 7), 10);
    if (m >= 1 && m <= 12) booksPerMonth[m - 1]++;
  });
  const by = (fn: (a: BookEntry, b: BookEntry) => number) => (bookCount ? [...books].sort(fn)[0] : null);
  const arch = topOf(books.map((b) => b.archetypeId));
  const yearEnd = isAll ? todayIso() : `${year}-12-31`;
  return {
    year,
    books,
    bookCount,
    pageCount,
    averageRating,
    averagePpd,
    topGenre: topOf(books.map((b) => b.genre).filter((g): g is string => !!g && g !== 'Unassigned')),
    topAuthor: topOf(books.map((b) => b.author).filter((a): a is string => !!a && a !== 'Unknown Author')),
    topArchetype: arch ? { id: arch.name, count: arch.count } : null,
    highestRated: by((a, b) => b.rating - a.rating),
    fastest: by((a, b) => b.ppd - a.ppd),
    longest: by((a, b) => b.totalPages - a.totalPages),
    booksPerMonth,
    ...(periodYears ? { periodYears } : {}),
    longestStreakInYear: computeStreaks(books, yearEnd).longest,
  };
}
