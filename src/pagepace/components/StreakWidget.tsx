import React, { useMemo } from 'react';
import { CalendarCheck, Flame, Trophy } from 'lucide-react';
import { BookEntry, MonthlyGoal } from '../types/book';
import { activeReadingDays, computeStreaks } from '../utils/readingStats';
import { useReadingLists } from '../hooks/useReadingLists';
import { weeklyGoalInfo } from '../utils/weeklyGoal';

export const StreakWidget: React.FC<{ books: BookEntry[]; goals?: Record<string, MonthlyGoal>; onOpenYear?: () => void }> = ({ books, goals, onOpenYear }) => {
  const { reads } = useReadingLists();
  const s = useMemo(() => computeStreaks(books, undefined, activeReadingDays(reads)), [books, reads]);
  const w = useMemo(() => (goals ? weeklyGoalInfo(books, goals) : null), [books, goals]);
  const t = w?.thisWeek;
  return (
    <button
      type="button"
      onClick={onOpenYear}
      className="h-full w-full text-left p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-stone-900/60 to-stone-900/60 border border-orange-500/30 flex flex-col justify-center gap-3 hover:border-orange-500/60 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl shrink-0 ${s.current > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-stone-800 text-stone-500'}`}>
          <Flame className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-serif font-bold text-stone-100">
            {s.current} day{s.current === 1 ? '' : 's'} <span className="text-xs font-sans font-normal text-stone-400">streak</span>
          </div>
          <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Best {s.longest}d · {s.totalReadingDays} reading days{onOpenYear ? ' · tap for more' : ''}
          </div>
        </div>
      </div>
      {t && w && (
        <div className="space-y-1.5" aria-label="Weekly goal">
          <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-stone-300 min-w-0">
              <CalendarCheck className={`w-3.5 h-3.5 shrink-0 ${t.met ? 'text-emerald-400' : 'text-orange-400'}`} />
              <span className="truncate">
                This week:{' '}
                {t.target.type !== 'pages' && <span><strong>{t.books}</strong>/{t.target.books} book{t.target.books === 1 ? '' : 's'}</span>}
                {t.target.type === 'both' && <span className="text-stone-500">{' · '}</span>}
                {t.target.type !== 'books' && <span><strong>{t.pages}</strong>/{t.target.pages} pages</span>}
              </span>
            </span>
            {t.met && <span className="shrink-0 text-emerald-400">Done ✓</span>}
          </div>
          <div className="h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
            <div className={`h-full rounded-full transition-all duration-500 ${t.met ? 'bg-emerald-400' : 'bg-gradient-to-r from-orange-500 to-amber-400'}`} style={{ width: `${t.pct}%` }} />
          </div>
          <div className="text-[11px] text-stone-400">
            🗓️ {w.current}-week goal streak · best {w.longest} · from this month's goal
          </div>
        </div>
      )}
    </button>
  );
};
