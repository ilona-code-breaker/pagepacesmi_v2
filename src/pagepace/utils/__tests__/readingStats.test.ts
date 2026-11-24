import { describe, expect, it } from 'vitest';
import { buildYearInReview, computeStreaks, MAX_BOOK_SPAN_DAYS } from '../readingStats';
import { filterAndSortBooks, DEFAULT_FILTERS } from '../libraryFilters';
import { extractIsbnFromBarcode } from '../../components/BarcodeScannerModal';
import { BookEntry } from '../../types/book';

const book = (p: Partial<BookEntry>): BookEntry => ({
  id: Math.random().toString(36),
  title: 'T',
  author: 'A',
  totalPages: 100,
  startDate: '2026-01-01',
  finishDate: '2026-01-01',
  elapsedDays: 1,
  ppd: 100,
  archetypeId: 'steady-cruiser',
  rating: 4,
  review: '',
  createdAt: 0,
  ...p,
});

describe('reading streaks', () => {
  it('counts consecutive reading days ending today', () => {
    const s = computeStreaks([book({ startDate: '2026-11-08', finishDate: '2026-11-11' })], '2026-11-11');
    expect(s.current).toBe(4);
    expect(s.longest).toBe(4);
  });
  it('keeps the streak alive if the last reading day was yesterday', () => {
    expect(computeStreaks([book({ startDate: '2026-11-09', finishDate: '2026-11-10' })], '2026-11-11').current).toBe(2);
  });
  it('resets the current streak after a missed day but keeps the longest', () => {
    const s = computeStreaks(
      [book({ startDate: '2026-10-01', finishDate: '2026-10-05' }), book({ startDate: '2026-11-08', finishDate: '2026-11-08' })],
      '2026-11-11'
    );
    expect(s.current).toBe(0);
    expect(s.longest).toBe(5);
  });
  it('merges overlapping books into one streak', () => {
    const s = computeStreaks(
      [book({ startDate: '2026-11-01', finishDate: '2026-11-04' }), book({ startDate: '2026-11-03', finishDate: '2026-11-06' })],
      '2026-11-06'
    );
    expect(s.current).toBe(6);
  });
  it('caps a single multi-year finished book span to MAX_BOOK_SPAN_DAYS', () => {
    const s = computeStreaks([book({ startDate: '2021-05-01', finishDate: '2026-11-23' })], '2026-11-23');
    expect(s.current).toBe(MAX_BOOK_SPAN_DAYS);
    expect(s.longest).toBe(MAX_BOOK_SPAN_DAYS);
  });
});

describe('year in review', () => {
  it('only counts books finished in the chosen year', () => {
    const r = buildYearInReview(
      [book({ finishDate: '2026-03-02', totalPages: 300 }), book({ finishDate: '2025-12-30', totalPages: 500 })],
      2026
    );
    expect(r.bookCount).toBe(1);
    expect(r.pageCount).toBe(300);
    expect(r.booksPerMonth[2]).toBe(1);
  });
});

describe('library search, sort and shelves', () => {
  const books = [
    book({ title: 'Dune', author: 'Frank Herbert', shelves: ['Re-read'], quotes: ['Fear is the mind-killer'] }),
    book({ title: 'Emma', author: 'Jane Austen', shelves: ['Book club'] }),
  ];
  it('sorts by author surname', () => {
    expect(filterAndSortBooks(books, { ...DEFAULT_FILTERS, sortBy: 'author' }).map((b) => b.title)).toEqual(['Emma', 'Dune']);
  });
  it('filters by shelf', () => {
    expect(filterAndSortBooks(books, { ...DEFAULT_FILTERS, shelf: 'Book club' }).map((b) => b.title)).toEqual(['Emma']);
  });
  it('search also finds text inside saved quotes', () => {
    expect(filterAndSortBooks(books, { ...DEFAULT_FILTERS, search: 'mind-killer' }).map((b) => b.title)).toEqual(['Dune']);
  });
});

describe('barcode to ISBN', () => {
  it('accepts book barcodes (978/979) and rejects other products', () => {
    expect(extractIsbnFromBarcode('9780441172719')).toBe('9780441172719');
    expect(extractIsbnFromBarcode('5901234123457')).toBeNull();
  });
});
