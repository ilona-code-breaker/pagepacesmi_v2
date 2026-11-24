import { calculateElapsedDays } from './calculator';

export type ProgressUnit = 'pages' | 'percent' | 'audiobook';

export interface CurrentRead {
  id: string;
  title: string;
  alternativeTitle?: string;
  ownedBookId?: string;
  author: string;
  totalPages: number;
  currentPage: number;
  progressUnit?: ProgressUnit;
  totalMinutes?: number;
  currentMinutes?: number;
  percentRead?: number;
  startDate: string; // YYYY-MM-DD
  genre?: string;
  format?: 'Physical' | 'E-Reader' | 'Audiobook' | 'Hybrid';
  coverUrl?: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: number;
}

export interface ReadingProgress {
  unit: ProgressUnit;
  percent: number;
  pagesLeft: number;
  /** Equivalent pages per day so far (start..today inclusive) */
  pace: number;
  /** Unit-specific daily pace: pages/day, percent/day, or minutes/day */
  unitPace: number;
  /** Remaining amount in the active unit (pages, percent, or minutes) */
  remaining: number;
  daysLeft: number | null;
  /** YYYY-MM-DD, null when no progress logged yet */
  estimatedFinish: string | null;
}

export function defaultUnitForFormat(format?: CurrentRead['format']): ProgressUnit {
  if (format === 'Audiobook') return 'audiobook';
  if (format === 'E-Reader') return 'percent';
  return 'pages';
}

export function formatDuration(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function hasLoggedProgress(r: Pick<CurrentRead, 'progressUnit' | 'currentPage' | 'currentMinutes' | 'percentRead'>): boolean {
  if (r.progressUnit === 'audiobook') return (r.currentMinutes ?? 0) > 0;
  if (r.progressUnit === 'percent') return (r.percentRead ?? 0) > 0;
  return (r.currentPage ?? 0) > 0;
}

export function formatStoppedProgress(r: CurrentRead): string {
  if (r.progressUnit === 'audiobook') {
    return `Stopped at ${formatDuration(r.currentMinutes ?? 0)} / ${formatDuration(r.totalMinutes ?? 0)}`;
  }
  if (r.progressUnit === 'percent') {
    return `Stopped at ${Math.min(100, Math.max(0, Math.round(r.percentRead ?? 0)))}%`;
  }
  return `Stopped at page ${r.currentPage} / ${r.totalPages}`;
}

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
};

export function computeProgress(r: CurrentRead, today: string): ReadingProgress {
  const unit: ProgressUnit = r.progressUnit ?? 'pages';
  const totalPages = Math.max(1, r.totalPages || 1);
  const days = calculateElapsedDays(r.startDate, today);

  if (unit === 'audiobook') {
    const totalMin = Math.max(1, r.totalMinutes || 1);
    const curMin = Math.min(totalMin, Math.max(0, r.currentMinutes ?? 0));
    const remaining = totalMin - curMin;
    const fraction = curMin / totalMin;
    const percent = Math.round(fraction * 100);
    const equivRead = fraction * totalPages;
    const pagesLeft = Math.max(0, Math.round(totalPages - equivRead));
    const minPerDay = curMin / days;
    if (minPerDay <= 0) return { unit, percent, pagesLeft, pace: 0, unitPace: 0, remaining, daysLeft: null, estimatedFinish: null };
    const daysLeft = Math.ceil(remaining / minPerDay);
    return {
      unit,
      percent,
      pagesLeft,
      pace: Math.round((equivRead / days) * 10) / 10,
      unitPace: Math.round(minPerDay),
      remaining,
      daysLeft,
      estimatedFinish: addDays(today, daysLeft),
    };
  }

  if (unit === 'percent') {
    const pct = Math.min(100, Math.max(0, r.percentRead ?? 0));
    const percent = Math.round(pct);
    const remaining = Math.max(0, 100 - pct);
    const equivRead = (pct / 100) * totalPages;
    const pagesLeft = Math.max(0, Math.round(totalPages - equivRead));
    const pctPerDay = pct / days;
    if (pctPerDay <= 0) return { unit, percent, pagesLeft, pace: 0, unitPace: 0, remaining, daysLeft: null, estimatedFinish: null };
    const daysLeft = Math.ceil(remaining / pctPerDay);
    return {
      unit,
      percent,
      pagesLeft,
      pace: Math.round((equivRead / days) * 10) / 10,
      unitPace: Math.round(pctPerDay * 10) / 10,
      remaining,
      daysLeft,
      estimatedFinish: addDays(today, daysLeft),
    };
  }

  const read = Math.min(totalPages, Math.max(0, r.currentPage || 0));
  const pace = read / days;
  const pagesLeft = totalPages - read;
  const percent = Math.round((read / totalPages) * 100);
  if (pace <= 0) return { unit, percent, pagesLeft, pace: 0, unitPace: 0, remaining: pagesLeft, daysLeft: null, estimatedFinish: null };
  const daysLeft = Math.ceil(pagesLeft / pace);
  const roundedPace = Math.round(pace * 10) / 10;
  return { unit, percent, pagesLeft, pace: roundedPace, unitPace: roundedPace, remaining: pagesLeft, daysLeft, estimatedFinish: addDays(today, daysLeft) };
}
