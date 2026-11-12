import React, { useMemo } from 'react';
import { Flame, Trophy } from 'lucide-react';
import { BookEntry } from '../types/book';
import { computeStreaks } from '../utils/readingStats';

export const StreakWidget: React.FC<{ books: BookEntry[]; onOpenYear?: () => void }> = ({ books, onOpenYear }) => {
  const s = useMemo(() => computeStreaks(books), [books]);
  return (
    <button
      type="button"
      onClick={onOpenYear}
      className="h-full w-full text-left p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-stone-900/60 to-stone-900/60 border border-orange-500/30 flex items-center gap-3 hover:border-orange-500/60 transition-colors"
    >
      <div className={`p-2.5 rounded-xl shrink-0 ${s.current > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-stone-800 text-stone-500'}`}>
        <Flame className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-serif font-bold text-stone-100">
          {s.current} day{s.current === 1 ? '' : 's'} <span className="text-xs font-sans font-normal text-stone-400">streak</span>
        </div>
        <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" /> Best {s.longest}d · {s.totalReadingDays} reading days{onOpenYear ? " · tap for more" : ""}
        </div>
      </div>
    </button>
  );
};
