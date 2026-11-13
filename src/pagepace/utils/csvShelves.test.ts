import { describe, it, expect } from 'vitest';
import { csvToReadToQueue, csvReadingToCurrent } from './csvShelves';
const row = (title: string, shelf: any) => ({ title, author: 'A', shelf, totalPages: 200, genre: '' } as any);
describe('csv shelves', () => {
  it('to-read rows go to Want to read, skipping finished titles', () => {
    const q = csvToReadToQueue([row('Dune', 'to-read'), row('Emma', 'to-read'), row('X', 'read')], [], ['Emma'], (i) => `q${i}`);
    expect(q.map((b) => b.title)).toEqual(['Dune']);
  });
  it('currently-reading rows go to In progress at page 0', () => {
    const r = csvReadingToCurrent([row('Dune', 'currently-reading'), row('Emma', 'to-read')], [], '2026-11-13', (i) => `c${i}`);
    expect(r.map((b) => [b.title, b.currentPage])).toEqual([['Dune', 0]]);
  });
});
