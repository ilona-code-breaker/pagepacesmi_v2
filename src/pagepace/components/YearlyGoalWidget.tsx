import React, { useEffect, useState } from 'react';
import { CalendarHeart, Trophy, Pencil, Check } from 'lucide-react';
import type { BookEntry } from '../types/book';
import { DEFAULT_YEARLY_GOAL, YEARLY_GOALS_KEY, expectedByNow, yearProgress, type YearlyGoal } from '../utils/yearlyGoal';

function load(): Record<string, YearlyGoal> {
  try { return JSON.parse(localStorage.getItem(YEARLY_GOALS_KEY) || '{}'); } catch { return {}; }
}

export const YearlyGoalWidget: React.FC<{ books: BookEntry[] }> = ({ books }) => {
  const year = new Date().getFullYear();
  const [goals, setGoals] = useState<Record<string, YearlyGoal>>(load);
  const [editing, setEditing] = useState(false);
  const goal = goals[year] ?? DEFAULT_YEARLY_GOAL;
  const [draft, setDraft] = useState(goal);
  useEffect(() => { localStorage.setItem(YEARLY_GOALS_KEY, JSON.stringify(goals)); }, [goals]);

  const p = yearProgress(books, year);
  const pct = goal.books ? Math.min(100, Math.round((p.books / goal.books) * 100)) : 0;
  const pagePct = goal.pages ? Math.min(100, Math.round((p.pages / goal.pages) * 100)) : 0;
  const met = p.books >= goal.books;
  const diff = p.books - expectedByNow(goal.books);

  const save = () => { setGoals((g) => ({ ...g, [year]: { books: Math.max(1, draft.books || 1), pages: Math.max(0, draft.pages || 0) } })); setEditing(false); };

  return (
    <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col justify-center gap-3 h-full">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 shrink-0">
          {met ? <Trophy className="w-5 h-5 text-emerald-400" /> : <CalendarHeart className="w-5 h-5 text-amber-400" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold">{year} Reading Goal</span>
            {!editing && <button onClick={() => { setDraft(goal); setEditing(true); }} className="text-xs text-amber-400 flex items-center gap-1"><Pencil className="w-3 h-3" />Edit</button>}
          </div>
          {editing ? (
            <div className="mt-2 flex flex-wrap items-end gap-2 text-xs font-mono">
              <label className="flex flex-col text-stone-400">Books<input type="number" min={1} value={draft.books} onChange={(e) => setDraft({ ...draft, books: +e.target.value })} className="w-20 rounded bg-stone-950 border border-stone-700 px-2 py-1 text-stone-100" /></label>
              <label className="flex flex-col text-stone-400">Pages<input type="number" min={0} value={draft.pages} onChange={(e) => setDraft({ ...draft, pages: +e.target.value })} className="w-24 rounded bg-stone-950 border border-stone-700 px-2 py-1 text-stone-100" /></label>
              <button onClick={save} className="rounded bg-amber-500 px-2 py-1 text-stone-950 flex items-center gap-1"><Check className="w-3 h-3" />Save</button>
              <button onClick={() => setEditing(false)} className="px-2 py-1 text-stone-400">Cancel</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-300 mt-1 font-mono">
              <span><strong>{p.books}</strong> / {goal.books} books <span className="text-amber-400 font-semibold">({pct}%)</span></span>
              <span><strong>{p.pages.toLocaleString()}</strong> / {goal.pages.toLocaleString()} pages <span className="text-emerald-400 font-semibold">({pagePct}%)</span></span>
            </div>
          )}
        </div>
      </div>
      <div className="h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-stone-400">
        {met ? 'Goal reached — amazing year! 🏆' : diff >= 0 ? `${diff} book${diff === 1 ? '' : 's'} ahead of schedule` : `${-diff} book${diff === -1 ? '' : 's'} behind schedule`}
      </p>
    </div>
  );
};
