import { describe, it, expect } from 'vitest';
import { computeProgress } from '../currentReading';

const base = { id: '1', title: 'T', author: 'A', totalPages: 300, startDate: '2026-11-01' };

describe('current reading progress', () => {
  it('estimates finish from pace so far', () => {
    // 10 days (Nov 1..10 inclusive), 100 pages => 10 ppd, 200 left => 20 days
    const p = computeProgress({ ...base, currentPage: 100 }, '2026-11-10');
    expect(p.percent).toBe(33);
    expect(p.pace).toBe(10);
    expect(p.daysLeft).toBe(20);
    expect(p.estimatedFinish).toBe('2026-11-30');
  });
  it('has no estimate before any pages are read', () => {
    expect(computeProgress({ ...base, currentPage: 0 }, '2026-11-10').estimatedFinish).toBeNull();
  });
});
