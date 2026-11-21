import type { ArchetypeDefinition, ArchetypeId, BookEntry } from '../types/book';
import { ARCHETYPES } from '../constants/archetypes';
import { getArchetypeByPPD } from './calculator';

export const ARCHETYPE_ORDER = Object.keys(ARCHETYPES) as ArchetypeId[];

/** Archetype ids earned by at least one completed book, with counts. */
export function collectedArchetypes(books: BookEntry[]): Map<ArchetypeId, number> {
  const m = new Map<ArchetypeId, number>();
  for (const b of books) if (b.archetypeId && ARCHETYPES[b.archetypeId]) m.set(b.archetypeId, (m.get(b.archetypeId) ?? 0) + 1);
  return m;
}

/** True when this book earns an archetype none of the earlier books had. */
export function isNewUnlock(previous: BookEntry[], book: BookEntry): boolean {
  return !!book.archetypeId && !previous.some((b) => b.archetypeId === book.archetypeId);
}

function daysAgo(today: string, n: number): string {
  const d = new Date(today + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Reader type from books finished in the last 90 days, falling back to all books. */
export function currentReaderType(books: BookEntry[], today: string): { archetype: ArchetypeDefinition; ppd: number; recent: boolean } | null {
  if (books.length === 0) return null;
  const since = daysAgo(today, 90);
  const recentBooks = books.filter((b) => b.finishDate && b.finishDate >= since && b.finishDate <= today);
  const pool = recentBooks.length > 0 ? recentBooks : books;
  const pages = pool.reduce((a, b) => a + (b.totalPages || 0), 0);
  const days = pool.reduce((a, b) => a + Math.max(1, b.elapsedDays || 1), 0);
  const ppd = Math.round((pages / days) * 10) / 10;
  return { archetype: getArchetypeByPPD(ppd), ppd, recent: recentBooks.length > 0 };
}

/** Archetype a current read would earn if the reader keeps the same pace. */
export function projectedArchetype(pace: number): ArchetypeDefinition | null {
  return pace > 0 ? getArchetypeByPPD(pace) : null;
}

/** Plain hint for unlocking a locked archetype, using a 300-page book as the example. */
export function unlockHint(a: ArchetypeDefinition): string {
  const pages = 300;
  if (a.maxPpd === Infinity) return `Finish a ${pages}-page book in ${Math.max(1, Math.floor(pages / a.minPpd))} days or less`;
  const maxDays = Math.floor(pages / a.minPpd);
  const minDays = Math.max(1, Math.ceil(pages / a.maxPpd));
  if (a.minPpd < 1) return `Take it slow: spend ${minDays}+ days on a ${pages}-page book`;
  return `Finish a ${pages}-page book in ${minDays}–${maxDays} days`;
}

/** Next faster tier for a current read and the pages/day needed from today to finish within it. */
export function nextTierPace(totalPages: number, pagesLeft: number, startDate: string, today: string, pace: number): { archetype: ArchetypeDefinition; pagesPerDay: number } | null {
  if (!(totalPages > 0) || pagesLeft <= 0) return null;
  const elapsed = Math.max(1, Math.round((Date.parse(today + 'T00:00:00Z') - Date.parse(startDate + 'T00:00:00Z')) / 86400000) + 1);
  const faster = Object.values(ARCHETYPES).filter((a) => a.minPpd > pace).sort((a, b) => a.minPpd - b.minPpd);
  for (const a of faster) {
    const remainingDays = Math.floor(totalPages / a.minPpd) - elapsed + 1;
    if (remainingDays >= 1) return { archetype: a, pagesPerDay: Math.ceil(pagesLeft / remainingDays) };
  }
  return null;
}

/** Reader type of each month of a year that has finished books (by finish date). */
export function monthlySeasons(books: BookEntry[], year: number): { month: number; archetype: ArchetypeDefinition; ppd: number; count: number }[] {
  const out: { month: number; archetype: ArchetypeDefinition; ppd: number; count: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    const pool = books.filter((b) => (b.finishDate || '').startsWith(key));
    if (!pool.length) continue;
    const pages = pool.reduce((a, b) => a + (b.totalPages || 0), 0);
    const days = pool.reduce((a, b) => a + Math.max(1, b.elapsedDays || 1), 0);
    const ppd = Math.round((pages / days) * 10) / 10;
    out.push({ month: m, archetype: getArchetypeByPPD(ppd), ppd, count: pool.length });
  }
  return out;
}

export function greeting(hour: number): string {
  return hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}
