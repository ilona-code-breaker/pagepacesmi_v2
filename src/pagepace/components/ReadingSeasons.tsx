import React, { useState } from 'react';
import type { BookEntry } from '../types/book';
import { monthlySeasons } from '../utils/archetypeProgress';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ReadingSeasons: React.FC<{ books: BookEntry[] }> = ({ books }) => {
  const years = [...new Set(books.map((b) => Number((b.finishDate || '').slice(0, 4))).filter(Boolean))].sort((a, b) => b - a);
  const [year, setYear] = useState(years[0] ?? new Date().getFullYear());
  const seasons = monthlySeasons(books, year);
  return (
    <section className="p-4 sm:p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold">Your reading seasons</h3>
        {years.length > 1 && (
          <select aria-label="Season year" value={year} onChange={(e) => setYear(Number(e.target.value))} className="text-xs bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-stone-200">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>
      <p className="text-[11px] text-stone-500">Every pace is a mood. Here's which reader you were each month.</p>
      {seasons.length === 0 ? <p className="text-sm text-stone-400">Finish a book to start your first season.</p> : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {seasons.map((s) => (
            <div key={s.month} className="p-2 rounded-xl bg-stone-950/60 border text-center" style={{ borderColor: s.archetype.accentHex + '55' }} title={`${s.archetype.name} · ${s.ppd} pages/day · ${s.count} books`}>
              <div className="text-[10px] font-mono uppercase text-stone-500">{MONTHS[s.month - 1]}</div>
              <div className="text-2xl" aria-hidden>{s.archetype.badgeEmoji}</div>
              <div className="text-[10px] font-semibold leading-tight" style={{ color: s.archetype.accentHex }}>{s.archetype.name}</div>
              <div className="text-[10px] text-stone-500">{s.count} {s.count === 1 ? 'book' : 'books'}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
