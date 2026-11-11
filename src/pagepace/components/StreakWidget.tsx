import React, { useMemo } from 'react';
import { Flame, Trophy } from 'lucide-react';
import { BookEntry } from '../types/book';
import { computeStreaks } from '../utils/readingStats';

export const StreakWidget: React.FC<{ books: BookEntry[]; onOpenYear?: () => void }> = ({ books, onOpenYear }) => {
  const s = useMemo(() => computeStreaks(books), [books]);
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-stone-900/60 to-stone-900/60 border border-orange-500/30 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${s.current > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-stone-800 text-stone-500'}`}>
          <Flame className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-serif font-bold text-stone-100">
            {s.current} day{s.current === 1 ? '' : 's'}
          </div>
          <div className="text-[11px] text-stone-400">
            {s.current > 0 ? 'Current reading streak — keep it going!' : 'No active streak. Log a book you read today to start one.'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-stone-400">
        <span className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-400" />
          Best: <strong className="text-stone-200 font-mono">{s.longest}d</strong>
        </span>
        <span>
          Reading days: <strong className="text-stone-200 font-mono">{s.totalReadingDays}</strong>
        </span>
        {onOpenYear && (
          <button type="button" onClick={onOpenYear} className="text-amber-400 hover:text-amber-300 font-semibold">
            Year in review →
          </button>
        )}
      </div>
    </div>
  );
};
