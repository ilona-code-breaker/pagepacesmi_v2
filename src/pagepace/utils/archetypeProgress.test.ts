import { describe, it, expect } from 'vitest';
import { collectedArchetypes, currentReaderType, isNewUnlock, projectedArchetype, unlockHint } from './archetypeProgress';
import { ARCHETYPES } from '../constants/archetypes';
const b = (id: string, archetypeId: any, finishDate: string, totalPages = 300, elapsedDays = 10) => ({ id, archetypeId, finishDate, totalPages, elapsedDays } as any);
describe('archetype progress', () => {
  it('counts collected types', () => {
    const m = collectedArchetypes([b('1', 'steady-cruiser', '2026-01-01'), b('2', 'steady-cruiser', '2026-02-01')]);
    expect(m.get('steady-cruiser')).toBe(2);
    expect(m.size).toBe(1);
  });
  it('detects a new unlock only once', () => {
    const prev = [b('1', 'speed-reader', '2026-01-01')];
    expect(isNewUnlock(prev, b('2', 'speed-reader', '2026-02-01'))).toBe(false);
    expect(isNewUnlock(prev, b('3', 'bedtime-taster', '2026-02-01'))).toBe(true);
  });
  it('uses only last 90 days for reader type', () => {
    const t = currentReaderType([b('1', '', '2026-11-01', 300, 30), b('2', '', '2025-01-01', 1000, 1)], '2026-11-12');
    expect(t?.ppd).toBe(10);
    expect(t?.archetype.id).toBe('bedtime-taster');
  });
  it('projects from pace', () => {
    expect(projectedArchetype(50)?.id).toBe('steady-cruiser');
    expect(projectedArchetype(0)).toBeNull();
  });
  it('hint for comet uses 125 pages/day', () => {
    expect(unlockHint(ARCHETYPES['narrative-comet'])).toContain('2 days or less');
  });
});
