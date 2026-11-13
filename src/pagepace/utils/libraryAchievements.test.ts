import { describe, it, expect } from 'vitest';
import { earnedAchievements, nextSizeMilestone } from './libraryAchievements';
describe('library achievements', () => {
  it('100 owned books earns Full Bookcase, next is Home Library', () => {
    const s = { owned: 100, read: 0, formats: {} };
    expect(earnedAchievements(s)).toContain('size-100');
    expect(nextSizeMilestone(s)?.name).toBe('Home Library');
  });
  it('read 50% needs at least 10 owned', () => {
    expect(earnedAchievements({ owned: 4, read: 2, formats: {} })).not.toContain('read-50');
    expect(earnedAchievements({ owned: 10, read: 5, formats: {} })).toContain('read-50');
  });
  it('9 books earns no size badge', () => {
    expect(earnedAchievements({ owned: 9, read: 0, formats: {} }).some((i) => i.startsWith('size'))).toBe(false);
  });
});
