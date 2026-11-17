import { describe, it, expect } from 'vitest';
import { collectBackup, restoreBackup, isFullBackup } from './fullBackup';

class Mem implements Storage {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

describe('full backup', () => {
  it('includes every pagepace key and nothing else, and restores them', () => {
    const a = new Mem();
    a.setItem('pagepace_books', JSON.stringify([{ title: 'Heartstopper' }]));
    a.setItem('pagepace_owned_books_v1', JSON.stringify([{ title: 'This Winter' }]));
    a.setItem('sb-token', 'secret');
    const b = collectBackup(a);
    expect(isFullBackup(JSON.parse(JSON.stringify(b)))).toBe(true);
    expect(Object.keys(b.data).sort()).toEqual(['pagepace_books', 'pagepace_owned_books_v1']);
    const c = new Mem();
    expect(restoreBackup(b, c)).toBe(2);
    expect(JSON.parse(c.getItem('pagepace_books')!)[0].title).toBe('Heartstopper');
    expect(c.getItem('sb-token')).toBeNull();
  });
});
