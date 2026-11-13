import { describe, it, expect } from 'vitest';
import { mergeValue } from './merge';
describe('mergeValue', () => {
  it('combines device and account books without duplicates', () => {
    expect(mergeValue([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }])).toEqual([{ id: 'b' }, { id: 'c' }, { id: 'a' }]);
  });
  it('keeps device data when the account has none', () => {
    expect(mergeValue([{ id: 'a' }], undefined)).toEqual([{ id: 'a' }]);
  });
  it('account settings win over device settings', () => {
    expect(mergeValue({ x: 1 }, { x: 2 })).toEqual({ x: 2 });
  });
});
