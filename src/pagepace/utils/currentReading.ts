import { calculateElapsedDays } from './calculator';

export interface CurrentRead {
  id: string;
  title: string;
  alternativeTitle?: string;
  ownedBookId?: string;
  author: string;
  totalPages: number;
  currentPage: number;
  startDate: string; // YYYY-MM-DD
  genre?: string;
  format?: 'Physical' | 'E-Reader' | 'Audiobook' | 'Hybrid';
  coverUrl?: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: number;
}

export interface ReadingProgress {
  percent: number;
  pagesLeft: number;
  /** Pages per day so far (start..today inclusive) */
  pace: number;
  daysLeft: number | null;
  /** YYYY-MM-DD, null when no pages read yet */
  estimatedFinish: string | null;
}

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
};

export function computeProgress(r: CurrentRead, today: string): ReadingProgress {
  const total = Math.max(1, r.totalPages || 1);
  const read = Math.min(total, Math.max(0, r.currentPage || 0));
  const days = calculateElapsedDays(r.startDate, today);
  const pace = read / days;
  const pagesLeft = total - read;
  const percent = Math.round((read / total) * 100);
  if (pace <= 0) return { percent, pagesLeft, pace: 0, daysLeft: null, estimatedFinish: null };
  const daysLeft = Math.ceil(pagesLeft / pace);
  return { percent, pagesLeft, pace: Math.round(pace * 10) / 10, daysLeft, estimatedFinish: addDays(today, daysLeft) };
}
