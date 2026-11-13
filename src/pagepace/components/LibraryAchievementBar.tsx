import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { ACHIEVEMENTS_KEY, LIBRARY_ACHIEVEMENTS, currentSizeMilestone, earnedAchievements, loadEarned, nextSizeMilestone, type LibraryAchievement, type LibraryStats } from '../utils/libraryAchievements';

export function LibraryAchievementBar({ stats, onOpenCodex }: { stats: LibraryStats; onOpenCodex?: () => void }) {
  const earned = useMemo(() => earnedAchievements(stats), [stats]);
  const [fresh, setFresh] = useState<LibraryAchievement[]>([]);
  useEffect(() => {
    const prev = loadEarned();
    const added = earned.filter((id) => !(prev ?? []).includes(id));
    if (!added.length) return;
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...(prev ?? []), ...added]));
    if (prev) { // first visit just records what's already earned
      setFresh(LIBRARY_ACHIEVEMENTS.filter((a) => added.includes(a.id)));
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  }, [earned]);
  const cur = currentSizeMilestone(stats), next = nextSizeMilestone(stats);
  const left = next ? next.progress(stats)[1] - stats.owned : 0;
  return (
    <>
      <button type="button" onClick={onOpenCodex} className="w-full text-left rounded-2xl border border-border bg-card/40 px-4 py-3 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold">{cur ? `${cur.emoji} ${cur.name}` : '📚 Start your collection'}</span>
          <span className="text-xs text-muted-foreground">{earned.length} / {LIBRARY_ACHIEVEMENTS.length} badges · see all →</span>
        </div>
        {next && <>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(stats.owned / next.progress(stats)[1]) * 100}%` }} /></div>
          <p className="text-xs text-muted-foreground">{left} more book{left === 1 ? '' : 's'} to {next.emoji} {next.name}</p>
        </>}
      </button>
      {fresh.length > 0 && (
        <div role="dialog" className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4" onClick={() => setFresh([])}>
          <div className="dark rounded-2xl border border-border bg-card p-6 text-center space-y-3 max-w-sm text-foreground">
            <p className="text-xs uppercase tracking-wider text-primary">New library badge{fresh.length > 1 ? 's' : ''}!</p>
            {fresh.map((a) => <div key={a.id}><div className="text-4xl">{a.emoji}</div><div className="font-serif text-xl font-bold">{a.name}</div><div className="text-sm text-muted-foreground">{a.goal}</div></div>)}
            <Button onClick={() => setFresh([])}>Yay!</Button>
          </div>
        </div>
      )}
    </>
  );
}

export function LibraryAchievementsGuide() {
  const [earned, setEarned] = useState<string[]>([]);
  useEffect(() => setEarned(loadEarned() ?? []), []);
  const groups: [LibraryAchievement['kind'], string, string][] = [
    ['size', 'Library size', 'Earned by how many books you own in My Library.'],
    ['read', 'Read-through', 'Earned by reading the books you own. A book counts as read when it is finished in your Archive or you marked it Read in My Library.'],
    ['format', 'Formats', 'Earned by the format you set on owned books (Physical, E-Reader, Audiobook, Hybrid).'],
  ];
  return (
    <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-serif font-bold text-stone-100">Library badges</span>
        <span className="font-mono text-amber-400">{earned.length} / {LIBRARY_ACHIEVEMENTS.length} earned</span>
      </div>
      {groups.map(([kind, title, desc]) => (
        <div key={kind} className="space-y-2">
          <div><div className="text-xs font-mono uppercase tracking-wider text-stone-300">{title}</div><p className="text-xs text-stone-400">{desc}</p></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {LIBRARY_ACHIEVEMENTS.filter((a) => a.kind === kind).map((a) => { const got = earned.includes(a.id); return (
              <div key={a.id} className={`p-2.5 rounded-xl border border-stone-800 bg-stone-950/60 ${got ? '' : 'opacity-50 grayscale'}`}>
                <div className="text-sm font-bold text-stone-200">{got ? a.emoji : '🔒'} {a.name}</div>
                <div className="text-[11px] text-stone-400">{a.goal}</div>
              </div>); })}
          </div>
        </div>
      ))}
    </div>
  );
}
