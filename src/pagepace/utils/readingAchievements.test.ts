import { describe, it, expect } from 'vitest';
import { earnedReadingBadges, type ReadingContext } from './readingAchievements';
import type { BookEntry } from '../types/book';

const bk = (i: number, o: Partial<BookEntry> = {}): BookEntry => ({ id: String(i), title: `Book ${i}`, author: 'A', totalPages: 300, startDate: '2026-03-01', finishDate: '2026-03-05', elapsedDays: 5, ppd: 60, archetypeId: 'steady-cruiser', rating: 4, review: '', createdAt: 0, ...o });
const ctx = (books: BookEntry[], o: Partial<ReadingContext> = {}): ReadingContext => ({ books, originals: books, goals: {}, yearlyGoals: {}, tbrStarted: [], droppedCount: 0, owned: [], today: '2026-11-13', ...o });

describe('reading badges', () => {
  it('counts e-reader books for Kindle Devotee at 25', () => {
    const e = Array.from({ length: 25 }, (_, i) => bk(i, { format: 'E-Reader' }));
    expect(earnedReadingBadges(ctx(e.slice(0, 24)))).not.toContain('ereader-25');
    expect(earnedReadingBadges(ctx(e))).toContain('ereader-25');
  });
  it('books without a format count as physical', () => {
    expect(earnedReadingBadges(ctx([bk(1)]))).toContain('physical-1');
  });
  it('Trifecta needs physical, e-reader and audiobook', () => {
    const b = [bk(1), bk(2, { format: 'E-Reader' })];
    expect(earnedReadingBadges(ctx(b))).not.toContain('mixed-trifecta');
    expect(earnedReadingBadges(ctx([...b, bk(3, { format: 'Audiobook' })]))).toContain('mixed-trifecta');
  });
  it('Format Hopper needs 3 consecutive different formats', () => {
    const b = [bk(1, { finishDate: '2026-01-01' }), bk(2, { finishDate: '2026-01-02', format: 'E-Reader' }), bk(3, { finishDate: '2026-01-03', format: 'Audiobook' })];
    expect(earnedReadingBadges(ctx(b))).toContain('mixed-hopper');
  });
  it('Heavy Lifter needs a 700+ page physical book', () => {
    expect(earnedReadingBadges(ctx([bk(1, { totalPages: 699 })]))).not.toContain('physical-big');
    expect(earnedReadingBadges(ctx([bk(1, { totalPages: 700 })]))).toContain('physical-big');
  });
  it('Birthday Book matches day and month', () => {
    expect(earnedReadingBadges(ctx([bk(1, { finishDate: '2025-03-05' })], { birthday: '03-05' }))).toContain('season-birthday');
  });
  it('TBR Tamer needs 10 finished books started from Want to read', () => {
    const b = Array.from({ length: 10 }, (_, i) => bk(i));
    expect(earnedReadingBadges(ctx(b, { tbrStarted: b.map((x) => x.title.toLowerCase().replace(/[^a-z0-9]/g, '')) }))).toContain('tbr-tamer');
  });
});

describe('weekly badges', () => {
  const g = { '2026-03': { monthKey: '2026-03', targetType: 'books' as const, targetBooks: 4, targetPages: 0 } };
  it('Weekly Rhythm needs 4 weekly goals hit in one month', () => {
    const b = ['2026-03-03', '2026-03-10', '2026-03-17', '2026-03-24'].map((d, i) => bk(i, { startDate: d, finishDate: d }));
    expect(earnedReadingBadges(ctx(b.slice(0, 3), { goals: g }))).not.toContain('habit-week4');
    expect(earnedReadingBadges(ctx(b, { goals: g }))).toContain('habit-week4');
  });
  it('Seven for Seven needs reading every day Monday to Sunday', () => {
    expect(earnedReadingBadges(ctx([bk(1, { startDate: '2026-03-02', finishDate: '2026-03-08' })]))).toContain('habit-week7');
    expect(earnedReadingBadges(ctx([bk(1, { startDate: '2026-03-03', finishDate: '2026-03-09' })]))).not.toContain('habit-week7');
  });
});

import { READING_BADGES as RB } from './readingAchievements';
describe('new milestones', () => {
  const mk = (n: number, format: any, totalPages = 300) => Array.from({ length: n }, (_, i) => ({ id: String(i), title: `B${i}`, author: 'A', totalPages, startDate: '2026-01-01', finishDate: '2026-01-02', elapsedDays: 2, ppd: 1, archetypeId: 'steady-cruiser', rating: 0, review: '', createdAt: 0, format })) as any;
  const ctx = (books: any) => ({ books, originals: books, goals: {}, yearlyGoals: {}, tbrStarted: [], droppedCount: 0, owned: [] }) as any;
  const get = (id: string) => RB.find((b) => b.id === id)!;
  it('E-reader 100 needs 100 books', () => { expect(get('ereader-100').earned(ctx(mk(99, 'E-Reader')))).toBe(false); expect(get('ereader-100').earned(ctx(mk(100, 'E-Reader')))).toBe(true); });
  it('audiobook 75 at 75', () => { expect(get('audio-75').earned(ctx(mk(75, 'Audiobook')))).toBe(true); });
  it('tree badge at 10,000 physical pages', () => { expect(get('quirky-tree').earned(ctx(mk(33, 'Physical')))).toBe(false); expect(get('quirky-tree').earned(ctx(mk(34, 'Physical')))).toBe(true); });
});
