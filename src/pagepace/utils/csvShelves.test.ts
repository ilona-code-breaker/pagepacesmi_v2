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

import { dropMisfiledCsvBooks } from './csvShelves';
describe('dropMisfiledCsvBooks', () => {
  it('removes imported finished copies of to-read books but keeps hand-entered ones', () => {
    const rows = [{ title: 'Emma', shelf: 'to-read' }] as never;
    const out = dropMisfiledCsvBooks([{ id: 'csv-1', title: 'Emma' }, { id: 'b-1', title: 'Emma' }, { id: 'csv-2', title: 'Dune' }], rows);
    expect(out.map((b) => b.id)).toEqual(['b-1', 'csv-2']);
  });
});
