import { describe, it, expect } from 'vitest';
import { nextTierPace, monthlySeasons } from './archetypeProgress';
describe('archetype pacing & seasons', () => {
  it('suggests the next faster tier pace', () => {
    // 300 pages, day 1 of read, 0 read so far (pace 0) -> next tier is Bedtime Taster or faster with valid days
    const n = nextTierPace(300, 200, '2026-11-01', '2026-11-10', 10);
    expect(n?.archetype.id).toBe('book-sommelier'); // 15 ppd => 20 days total, 11 left => 19 pages/day
    expect(n?.pagesPerDay).toBe(19);
  });
  it('groups finished books into monthly seasons', () => {
    const s = monthlySeasons([{ finishDate: '2026-02-10', totalPages: 300, elapsedDays: 3 } as never], 2026);
    expect(s).toHaveLength(1);
    expect(s[0]?.month).toBe(2);
    expect(s[0]?.ppd).toBe(100);
  });
});
