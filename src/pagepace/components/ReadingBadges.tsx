import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { BIRTHDAY_KEY, READING_BADGES, READING_BADGES_KEY, READING_GROUPS, earnedReadingBadges, loadReadingEarned, type ReadingBadge, type ReadingContext } from '../utils/readingAchievements';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const pad = (n: number) => String(n).padStart(2, '0');
const daysInMonth = (m: number) => DAYS_IN_MONTH[m - 1] ?? 31;

/** Celebrates newly earned reading badges; the first run only records what is already earned. */
export function ReadingBadgeWatcher({ ctx }: { ctx: ReadingContext }) {
  const earned = useMemo(() => earnedReadingBadges(ctx), [ctx]);
  const [fresh, setFresh] = useState<ReadingBadge[]>([]);
  useEffect(() => {
    const prev = loadReadingEarned();
    const added = earned.filter((id) => !(prev ?? []).includes(id));
    if (!added.length) return;
    localStorage.setItem(READING_BADGES_KEY, JSON.stringify([...(prev ?? []), ...added]));
    if (prev && ctx.books.length) {
      setFresh(READING_BADGES.filter((a) => added.includes(a.id)));
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  }, [earned]);
  if (!fresh.length) return null;
  return (
    <div role="dialog" className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4" onClick={() => setFresh([])}>
      <div className="dark rounded-2xl border border-border bg-card p-6 text-center space-y-3 max-w-sm text-foreground max-h-[80vh] overflow-y-auto">
        <p className="text-xs uppercase tracking-wider text-primary">New reading badge{fresh.length > 1 ? 's' : ''}!</p>
        {fresh.map((a) => <div key={a.id}><div className="text-4xl">{a.emoji}</div><div className="font-serif text-xl font-bold">{a.name}</div><div className="text-sm text-muted-foreground">{a.goal}</div></div>)}
        <Button onClick={() => setFresh([])}>Yay!</Button>
      </div>
    </div>
  );
}

export function ReadingBadgesGuide({ ctx, onBirthday }: { ctx: ReadingContext; onBirthday: (v: string | undefined) => void }) {
  const earned = useMemo(() => new Set(earnedReadingBadges(ctx)), [ctx]);
  const [bd, setBd] = useState(() => {
    const [mm, dd] = (ctx.birthday ?? '').split('-');
    return { m: Number(mm) || 0, d: Number(dd) || 0 };
  });
  // The stored birthday can arrive after mount (App reads it in an effect); adopt it while nothing is picked yet.
  useEffect(() => {
    const [mm, dd] = (ctx.birthday ?? '').split('-');
    const m = Number(mm) || 0, d = Number(dd) || 0;
    setBd((cur) => (cur.m || cur.d ? cur : { m, d }));
  }, [ctx.birthday]);
  const saveBirthday = (m: number, d: number) => {
    setBd({ m, d });
    const v = m && d ? `${pad(m)}-${pad(Math.min(d, daysInMonth(m)))}` : undefined;
    if (v) localStorage.setItem(BIRTHDAY_KEY, v); else localStorage.removeItem(BIRTHDAY_KEY);
    onBirthday(v);
  };
  return (
    <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-serif font-bold text-stone-100">Reading badges</span>
        <span className="font-mono text-amber-400">{earned.size} / {READING_BADGES.length} earned</span>
      </div>
      <p className="text-xs text-stone-400">Earned from the books you finish in your Archive. Dated re-reads count as finished books. Set a book's format when you track or edit it.</p>
      {READING_GROUPS.map(([kind, title, desc]) => (
        <details key={kind} className="group rounded-xl border border-stone-800 bg-stone-950/30 p-3 space-y-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
            <div><div className="text-xs font-mono uppercase tracking-wider text-stone-300">{title}</div><p className="text-xs text-stone-400">{desc}</p></div>
            <span className="flex shrink-0 items-center gap-2 text-xs font-mono text-amber-400">{READING_BADGES.filter((a) => a.kind === kind && earned.has(a.id)).length}/{READING_BADGES.filter((a) => a.kind === kind).length}<span className="transition-transform group-open:rotate-180">▾</span></span>
          </summary>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {READING_BADGES.filter((a) => a.kind === kind).map((a) => { const got = earned.has(a.id); return (
              <div key={a.id} className={`p-2.5 rounded-xl border border-stone-800 bg-stone-950/60 ${got ? '' : 'opacity-50 grayscale'}`}>
                <div className="text-sm font-bold text-stone-200">{got ? a.emoji : '🔒'} {a.name}</div>
                <div className="text-[11px] text-stone-400">{a.goal}</div>
              </div>); })}
          </div>
          {kind === 'season' && (() => {
            const month = bd.m;
            const day = bd.d;
            const max = month ? daysInMonth(month) : 31;
            return (
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-300">
                <span>🎂 Your birthday (for Birthday Book):</span>
                <select aria-label="Birthday month" className="rounded-md border border-stone-700 bg-stone-950 px-2 py-1 text-stone-200"
                  value={month || ''} onChange={(e) => saveBirthday(Number(e.target.value), day)}>
                  <option value="">Month</option>
                  {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
                </select>
                <select aria-label="Birthday day" className="rounded-md border border-stone-700 bg-stone-950 px-2 py-1 text-stone-200"
                  value={day || ''} onChange={(e) => saveBirthday(month, Number(e.target.value))}>
                  <option value="">Day</option>
                  {Array.from({ length: max }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <span className="text-stone-500">Day and month only — no year needed.</span>
              </div>
            );
          })()}
        </details>
      ))}
    </div>
  );
}
