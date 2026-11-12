import { describe, it, expect } from 'vitest';
import { applyGenres, isUnassigned } from './genreFill';
const b = (id: string, genre: any) => ({ id, title: id, author: 'a', genre } as any);
describe('genre fill', () => {
  it('fills only unassigned books', () => {
    const out = applyGenres([b('1', 'Unassigned'), b('2', 'Horror')], { '1': 'Fantasy', '2': 'Romance' });
    expect(out[0].genre).toBe('Fantasy');
    expect(out[1].genre).toBe('Horror');
  });
  it('ignores invalid or Unassigned picks', () => {
    const out = applyGenres([b('1', 'Unassigned'), b('2', '')], { '1': 'Poetry', '2': 'Unassigned' });
    expect(out.every(isUnassigned)).toBe(true);
  });
});
