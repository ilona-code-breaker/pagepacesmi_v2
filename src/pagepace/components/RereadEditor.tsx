import { Minus, Plus, Repeat } from 'lucide-react';
import type { BookEntry } from '../types/book';

/** Times-read stepper; each extra read gets its own date. Extra reads never change goals or streaks. */
export function RereadEditor({ book, onChange }: { book: BookEntry; onChange: (dates: string[]) => void }) {
  const dates = book.rereadDates ?? [];
  const total = dates.length + 1;
  const setDate = (i: number, v: string) => onChange(dates.map((d, j) => (j === i ? v : d)));
  return (
    <div className="px-6 sm:px-8 py-4 border-b border-stone-800">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-stone-200"><Repeat className="w-4 h-4 text-amber-400" /> Times read</span>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="One fewer read" disabled={total <= 1} onClick={() => onChange(dates.slice(0, -1))}
            className="p-1.5 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800 disabled:opacity-30"><Minus className="w-4 h-4" /></button>
          <span className="w-8 text-center font-mono text-lg text-amber-300">{total}</span>
          <button type="button" aria-label="One more read" onClick={() => onChange([...dates, book.finishDate])}
            className="p-1.5 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800"><Plus className="w-4 h-4" /></button>
        </div>
      </div>
      {dates.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center justify-between text-stone-400"><span>Read 1</span><span>{book.finishDate}</span></li>
          {dates.map((d, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-stone-400">
              <span>Read {i + 2}</span>
              <input type="date" value={d} onChange={(e) => setDate(i, e.target.value)} aria-label={`Date of read ${i + 2}`}
                className="rounded-lg border border-stone-700 bg-stone-950 px-2 py-1 text-stone-200" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
