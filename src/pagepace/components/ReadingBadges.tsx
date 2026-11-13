import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { BIRTHDAY_KEY, READING_BADGES, READING_BADGES_KEY, READING_GROUPS, earnedReadingBadges, loadReadingEarned, type ReadingBadge, type ReadingContext } from '../utils/readingAchievements';

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
  return (
    <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-serif font-bold text-stone-100">Reading badges</span>
        <span className="font-mono text-amber-400">{earned.size} / {READING_BADGES.length} earned</span>
      </div>
      <p className="text-xs text-stone-400">Earned from the books you finish in your Archive. Dated re-reads count as finished books. Set a book's format when you track or edit it.</p>
      {READING_GROUPS.map(([kind, title, desc]) => (
        <div key={kind} className="space-y-2">
          <div><div className="text-xs font-mono uppercase tracking-wider text-stone-300">{title}</div><p className="text-xs text-stone-400">{desc}</p></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {READING_BADGES.filter((a) => a.kind === kind).map((a) => { const got = earned.has(a.id); return (
              <div key={a.id} className={`p-2.5 rounded-xl border border-stone-800 bg-stone-950/60 ${got ? '' : 'opacity-50 grayscale'}`}>
                <div className="text-sm font-bold text-stone-200">{got ? a.emoji : '🔒'} {a.name}</div>
                <div className="text-[11px] text-stone-400">{a.goal}</div>
              </div>); })}
          </div>
          {kind === 'season' && (
            <label className="flex flex-wrap items-center gap-2 text-xs text-stone-300">
              🎂 Your birthday (for Birthday Book):
              <input type="date" aria-label="Birthday" className="rounded-md border border-stone-700 bg-stone-950 px-2 py-1 text-stone-200"
                value={ctx.birthday ? `2000-${ctx.birthday}` : ''}
                onChange={(e) => { const v = e.target.value ? e.target.value.slice(5) : undefined; if (v) localStorage.setItem(BIRTHDAY_KEY, v); else localStorage.removeItem(BIRTHDAY_KEY); onBirthday(v); }} />
              <span className="text-stone-500">Only the day and month are used.</span>
            </label>
          )}
        </div>
      ))}
    </div>
  );
}
