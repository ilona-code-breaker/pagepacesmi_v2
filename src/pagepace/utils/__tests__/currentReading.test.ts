import { describe, it, expect } from 'vitest';
import { computeProgress, defaultUnitForFormat, formatDuration } from '../currentReading';

const base = { id: '1', title: 'T', author: 'A', totalPages: 300, startDate: '2026-11-01' };

describe('current reading progress', () => {
  it('estimates finish from pace so far', () => {
    // 10 days (Nov 1..10 inclusive), 100 pages => 10 ppd, 200 left => 20 days
    const p = computeProgress({ ...base, currentPage: 100 }, '2026-11-10');
    expect(p.unit).toBe('pages');
    expect(p.percent).toBe(33);
    expect(p.pace).toBe(10);
    expect(p.daysLeft).toBe(20);
    expect(p.estimatedFinish).toBe('2026-11-30');
  });
  it('has no estimate before any pages are read', () => {
    expect(computeProgress({ ...base, currentPage: 0 }, '2026-11-10').estimatedFinish).toBeNull();
  });
  it('computes percentage progress, daily % pace, and equivalent ppd', () => {
    // 5 days (Nov 1..5), 50% of 400 pages => 10%/day, 40 equiv ppd, 5 days left
    const p = computeProgress({ ...base, totalPages: 400, currentPage: 0, progressUnit: 'percent', percentRead: 50 }, '2026-11-05');
    expect(p.unit).toBe('percent');
    expect(p.percent).toBe(50);
    expect(p.unitPace).toBe(10);
    expect(p.pace).toBe(40);
    expect(p.daysLeft).toBe(5);
    expect(p.estimatedFinish).toBe('2026-11-10');
  });
  it('computes audiobook hours/minutes progress and listening pace', () => {
    // 10 days (Nov 1..10), 300m / 600m => 50%, 30m/day, 10 days left, 15 equiv ppd (of 300p)
    const p = computeProgress({ ...base, currentPage: 0, progressUnit: 'audiobook', totalMinutes: 600, currentMinutes: 300 }, '2026-11-10');
    expect(p.unit).toBe('audiobook');
    expect(p.percent).toBe(50);
    expect(p.unitPace).toBe(30);
    expect(p.pace).toBe(15);
    expect(p.daysLeft).toBe(10);
    expect(p.estimatedFinish).toBe('2026-11-20');
  });
  it('defaults progress unit by format and formats durations', () => {
    expect(defaultUnitForFormat('Physical')).toBe('pages');
    expect(defaultUnitForFormat('E-Reader')).toBe('percent');
    expect(defaultUnitForFormat('Audiobook')).toBe('audiobook');
    expect(formatDuration(255)).toBe('4h 15m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(45)).toBe('45m');
  });
});
