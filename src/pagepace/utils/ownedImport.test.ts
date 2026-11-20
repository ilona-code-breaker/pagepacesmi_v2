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
describe('owned import status', () => {
  it('uses the Status column, else the sheet name', () => {
    expect(rowsToOwned([{ Title: 'A', Status: 'Read' }])[0].status).toBe('read');
    expect(rowsToOwned([{ Title: 'B' }], 'TBR')[0].status).toBe('tbr');
    expect(rowsToOwned([{ Title: 'C' }], 'Sheet1')[0].status).toBeUndefined();
  });
});

import { statusOf as importStatus } from './ownedImport';
import { describe as d2, it as i2, expect as e2 } from 'vitest';
d2('still reading import status', () => {
  i2('maps "Still reading" to reading, not unread', () => {
    e2(importStatus('Still reading')).toBe('reading');
    e2(importStatus('currently-reading')).toBe('reading');
    e2(importStatus('Unread')).toBeUndefined();
    e2(importStatus('Read')).toBe('read');
  });
});
