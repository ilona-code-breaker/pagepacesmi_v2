import { describe, it, expect } from 'vitest';
import { rowsToOwned } from './ownedImport';

describe('rowsToOwned', () => {
  it('reads common headers and skips rows without a title', () => {
    const r = rowsToOwned([
      { Title: 'Dune', Author: 'Frank Herbert', 'Number of Pages': '412', Binding: 'Kindle Edition', ISBN: '="0441013597"' },
      { Title: '', Author: 'Nobody' },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ title: 'Dune', author: 'Frank Herbert', totalPages: 412, format: 'E-Reader', isbn: '0441013597' });
  });
  it('defaults format to Physical', () => {
    expect(rowsToOwned([{ title: 'X' }])[0].format).toBe('Physical');
  });
});
