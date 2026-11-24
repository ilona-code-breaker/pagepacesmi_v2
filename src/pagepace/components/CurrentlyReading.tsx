import React, { useState } from 'react';
import { ChevronDown, BookOpen, Check, Plus, Trash2, CircleStop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RatingInput } from './RatingInput';
import { useReadingLists } from '../hooks/useReadingLists';
export { addCurrentRead } from '../hooks/useReadingLists';
import { BookEntry } from '../types/book';
import { CurrentRead, ProgressUnit, computeProgress, formatDuration } from '../utils/currentReading';
import { projectedArchetype, nextTierPace } from '../utils/archetypeProgress';
import { calculateElapsedDays, calculatePPD, getArchetypeByPPD } from '../utils/calculator';
import { todayIso } from '../utils/readingStats';


const fmt = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const CurrentlyReading: React.FC<{ onFinish: (book: BookEntry) => void; formOnly?: boolean; onAdded?: () => void; visibleIds?: string[]; libraryView?: boolean }> = ({
  onFinish,
  formOnly = false,
  onAdded,
  visibleIds,
  libraryView = false,
}) => {
  const { reads: allReads, setReads, drop, error } = useReadingLists();
  const reads = visibleIds ? allReads.filter((r) => visibleIds.includes(r.id)) : allReads;
  const [adding, setAdding] = useState(formOnly);
  const [open, setOpen] = useState(false);
  const expanded = libraryView || open || adding;
  const [form, setForm] = useState({
    title: '',
    author: '',
    unit: 'pages' as ProgressUnit,
    totalPages: '',
    currentPage: '',
    percentRead: '',
    totalHours: '',
    totalMins: '',
    currentHours: '',
    currentMins: '',
    startDate: todayIso(),
  });
  const today = todayIso();
  const [finishing, setFinishing] = useState<{ id: string; rating: number; review: string } | null>(null);


  const update = (id: string, patch: Partial<CurrentRead>) =>
    setReads((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const updateMinutes = (r: CurrentRead, nextMins: number) => {
    const totalMin = Math.max(1, r.totalMinutes || 1);
    const clamped = Math.min(totalMin, Math.max(0, Math.round(nextMins)));
    const syncedPage = Math.round((clamped / totalMin) * Math.max(1, r.totalPages || 1));
    update(r.id, { currentMinutes: clamped, currentPage: syncedPage, ...(clamped > 0 ? { lastProgressDate: today } : {}) });
  };

  const updatePercent = (r: CurrentRead, nextPct: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(nextPct)));
    const syncedPage = Math.round((clamped / 100) * Math.max(1, r.totalPages || 1));
    update(r.id, { percentRead: clamped, currentPage: syncedPage, ...(clamped > 0 ? { lastProgressDate: today } : {}) });
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (form.unit === 'audiobook') {
      const totalMin = Math.max(0, (parseInt(form.totalHours, 10) || 0) * 60 + (parseInt(form.totalMins, 10) || 0));
      if (totalMin <= 0) return;
      const curMin = Math.min(totalMin, Math.max(0, (parseInt(form.currentHours, 10) || 0) * 60 + (parseInt(form.currentMins, 10) || 0)));
      const totalPages = Math.max(1, Math.round(totalMin * 0.5));
      setReads((rs) => [{
        id: crypto.randomUUID(),
        title: form.title.trim(),
        author: form.author.trim() || 'Unknown Author',
        totalPages,
        currentPage: Math.round((curMin / totalMin) * totalPages),
        progressUnit: 'audiobook',
        totalMinutes: totalMin,
        currentMinutes: curMin,
        format: 'Audiobook',
        startDate: form.startDate || today,
        ...(curMin > 0 ? { lastProgressDate: today } : {}),
      }, ...rs]);
    } else if (form.unit === 'percent') {
      const totalPages = parseInt(form.totalPages, 10) || 300;
      const pct = Math.min(100, Math.max(0, parseInt(form.percentRead, 10) || 0));
      setReads((rs) => [{
        id: crypto.randomUUID(),
        title: form.title.trim(),
        author: form.author.trim() || 'Unknown Author',
        totalPages,
        currentPage: Math.round((pct / 100) * totalPages),
        progressUnit: 'percent',
        percentRead: pct,
        format: 'E-Reader',
        startDate: form.startDate || today,
        ...(pct > 0 ? { lastProgressDate: today } : {}),
      }, ...rs]);
    } else {
      const totalPages = parseInt(form.totalPages, 10);
      if (!totalPages) return;
      const curPage = Math.min(totalPages, parseInt(form.currentPage, 10) || 0);
      setReads((rs) => [{
        id: crypto.randomUUID(),
        title: form.title.trim(),
        author: form.author.trim() || 'Unknown Author',
        totalPages,
        currentPage: curPage,
        progressUnit: 'pages',
        startDate: form.startDate || today,
        ...(curPage > 0 ? { lastProgressDate: today } : {}),
      }, ...rs]);
    }
    setForm({ title: '', author: '', unit: 'pages', totalPages: '', currentPage: '', percentRead: '', totalHours: '', totalMins: '', currentHours: '', currentMins: '', startDate: today });
    setAdding(formOnly);
    onAdded?.();
  };

  const finish = (r: CurrentRead, rating = 0, review = '') => {
    const elapsedDays = calculateElapsedDays(r.startDate, today);
    const ppd = calculatePPD(r.totalPages, elapsedDays);
    onFinish({
      id: crypto.randomUUID(),
      title: r.title,
      alternativeTitle: r.alternativeTitle,
      ownedBookId: r.ownedBookId,
      author: r.author,
      genre: r.genre,
      format: r.format,
      coverUrl: r.coverUrl,
      isbn: r.isbn,
      publisher: r.publisher,
      publishedYear: r.publishedYear,
      totalPages: r.totalPages,
      startDate: r.startDate,
      finishDate: today,
      elapsedDays,
      ppd,
      archetypeId: getArchetypeByPPD(ppd).id,
      rating,
      review,
      createdAt: Date.now(),
    });
    setReads((rs) => rs.filter((x) => x.id !== r.id));
  };

  const input = 'w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:border-amber-500/60 outline-none';

  const formEl = (
    <form onSubmit={add} className="grid grid-cols-2 gap-2">
      <input className={`${input} col-span-2`} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      <input className={`${input} col-span-2`} placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
      <div className="col-span-2 grid grid-cols-3 gap-1 p-1 rounded-lg bg-stone-950 border border-stone-800">
        {([['pages', 'Pages'], ['percent', '% Percent'], ['audiobook', 'Hours & Mins']] as const).map(([u, label]) => (
          <button key={u} type="button" onClick={() => setForm({ ...form, unit: u })} className={`py-1 text-[11px] font-medium rounded-md transition-colors ${form.unit === u ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40' : 'text-stone-400 hover:text-stone-200 border border-transparent'}`}>{label}</button>
        ))}
      </div>
      {form.unit === 'audiobook' ? (
        <>
          <input className={input} type="number" min={0} placeholder="Total hrs" value={form.totalHours} onChange={(e) => setForm({ ...form, totalHours: e.target.value })} />
          <input className={input} type="number" min={0} max={59} placeholder="Total mins" value={form.totalMins} onChange={(e) => setForm({ ...form, totalMins: e.target.value })} />
          <input className={input} type="number" min={0} placeholder="Current hrs" value={form.currentHours} onChange={(e) => setForm({ ...form, currentHours: e.target.value })} />
          <input className={input} type="number" min={0} max={59} placeholder="Current mins" value={form.currentMins} onChange={(e) => setForm({ ...form, currentMins: e.target.value })} />
        </>
      ) : form.unit === 'percent' ? (
        <>
          <input className={input} type="number" min={0} max={100} placeholder="Current %" value={form.percentRead} onChange={(e) => setForm({ ...form, percentRead: e.target.value })} />
          <input className={input} type="number" min={1} placeholder="Total pages (opt.)" value={form.totalPages} onChange={(e) => setForm({ ...form, totalPages: e.target.value })} />
        </>
      ) : (
        <>
          <input className={input} type="number" min={1} placeholder="Total pages" value={form.totalPages} onChange={(e) => setForm({ ...form, totalPages: e.target.value })} required />
          <input className={input} type="number" min={0} placeholder="Current page" value={form.currentPage} onChange={(e) => setForm({ ...form, currentPage: e.target.value })} />
        </>
      )}
      <label className="col-span-2 text-[11px] text-stone-400">
        Started on
        <input className={`${input} mt-1`} type="date" max={today} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
      </label>
      <button type="submit" className="col-span-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-semibold">
        Start tracking
      </button>
    </form>
  );
  if (formOnly) return formEl;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={expanded} disabled={libraryView} className="min-w-0 text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5 text-left">
          <BookOpen className="w-4 h-4 shrink-0 text-amber-400" /> Currently Reading
          <span className="text-amber-400">{reads.length}</span>
          {!libraryView && <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
        </button>
        {!libraryView && <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" /> {adding ? 'Cancel' : 'Add book'}
        </button>}
      </div>

      {adding && formEl}
      {error && <p role="alert" className="dark text-sm text-destructive">{error}</p>}

      {expanded && reads.length === 0 && !adding && (
        <p className="text-xs text-stone-500">Add a book you're reading now to see your progress and when you'll likely finish.</p>
      )}

      {expanded && reads.map((r) => {
        const p = computeProgress(r, today);
        return (
          <div key={r.id} className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              {r.coverUrl && <img src={r.coverUrl} alt="" className="w-9 h-12 object-cover rounded border border-stone-800 shrink-0" />}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-serif font-bold text-stone-100 truncate">{r.title}</div>
                <div className="text-[11px] text-stone-400 truncate">{r.author} · started {fmt(r.startDate)}</div>
              </div>
              <button type="button" title="Remove" onClick={() => setReads((rs) => rs.filter((x) => x.id !== r.id))} className="p-1.5 rounded-lg text-stone-500 hover:text-rose-300 hover:bg-rose-500/10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all" style={{ width: `${p.percent}%` }} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-stone-400">
              {p.unit === 'audiobook' ? (() => {
                const totalMin = Math.max(1, r.totalMinutes || 1);
                const curMin = Math.min(totalMin, Math.max(0, r.currentMinutes ?? 0));
                const curH = Math.floor(curMin / 60);
                const curM = curMin % 60;
                return (
                  <>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        aria-label={`Current hours for ${r.title}`}
                        value={curH}
                        onChange={(e) => updateMinutes(r, (Math.max(0, parseInt(e.target.value, 10) || 0)) * 60 + curM)}
                        className="w-12 px-1.5 py-1 rounded-md bg-stone-900 border border-stone-800 text-stone-100"
                      />
                      <span>h</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        aria-label={`Current minutes for ${r.title}`}
                        value={curM}
                        onChange={(e) => updateMinutes(r, curH * 60 + Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                        className="w-12 px-1.5 py-1 rounded-md bg-stone-900 border border-stone-800 text-stone-100"
                      />
                      <span>m / {formatDuration(totalMin)} <span className="text-amber-400 font-semibold">({p.percent}%)</span></span>
                    </div>
                    <span className="flex items-center gap-1">
                      {([[15, '+15m'], [30, '+30m'], [60, '+1h']] as const).map(([mins, label]) => (
                        <button key={mins} type="button" aria-label={`Add ${label} to ${r.title}`} onClick={() => updateMinutes(r, curMin + mins)} className="px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30">{label}</button>
                      ))}
                    </span>
                    <span>Listening ~{formatDuration(p.unitPace)}/day</span>
                  </>
                );
              })() : p.unit === 'percent' ? (
                <>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      aria-label={`Current percent for ${r.title}`}
                      value={Math.min(100, Math.max(0, Math.round(r.percentRead ?? 0)))}
                      onChange={(e) => updatePercent(r, parseInt(e.target.value, 10) || 0)}
                      className="w-16 px-2 py-1 rounded-md bg-stone-900 border border-stone-800 text-stone-100"
                    />
                    <span className="text-amber-400 font-semibold">% completed</span>
                  </label>
                  <span className="flex items-center gap-1">
                    {[5, 10, 20].map((n) => (
                      <button key={n} type="button" aria-label={`Add ${n}% to ${r.title}`} onClick={() => updatePercent(r, (r.percentRead ?? 0) + n)} className="px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30">+{n}%</button>
                    ))}
                  </span>
                  <span>Reading ~{p.unitPace}%/day</span>
                </>
              ) : (
                <>
                  <label className="flex items-center gap-1.5">
                    Page
                    <input
                      type="number"
                      min={0}
                      max={r.totalPages}
                      value={r.currentPage}
                      onChange={(e) => {
                        const nextPage = Math.min(r.totalPages, Math.max(0, parseInt(e.target.value, 10) || 0));
                        update(r.id, { currentPage: nextPage, ...(nextPage > 0 ? { lastProgressDate: today } : {}) });
                      }}
                      className="w-16 px-2 py-1 rounded-md bg-stone-900 border border-stone-800 text-stone-100"
                    />
                    / {r.totalPages} <span className="text-amber-400 font-semibold">({p.percent}%)</span>
                  </label>
                  <span className="flex items-center gap-1">
                    {[10, 25, 50].map((n) => (
                      <button key={n} type="button" aria-label={`Add ${n} pages to ${r.title}`} onClick={() => update(r.id, { currentPage: Math.min(r.totalPages, r.currentPage + n), lastProgressDate: today })} className="px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30">+{n}</button>
                    ))}
                  </span>
                  <span>{p.pace} pages/day</span>
                </>
              )}
              {(() => { const a = projectedArchetype(p.pace); return a ? <span style={{ color: a.accentHex }}>At this pace: {a.badgeEmoji} {a.name}</span> : null; })()}
            </div>
            {(() => {
              const n = nextTierPace(r.totalPages, p.pagesLeft, r.startDate, today, p.pace);
              if (!n) return null;
              const targetLabel =
                p.unit === 'audiobook'
                  ? <>Listen <strong className="text-stone-200">~{formatDuration(Math.max(1, Math.ceil((n.pagesPerDay / Math.max(1, r.totalPages)) * (r.totalMinutes || 60))))}/day</strong></>
                  : p.unit === 'percent'
                  ? <>Read <strong className="text-stone-200">~{Math.max(1, Math.ceil((n.pagesPerDay / Math.max(1, r.totalPages)) * 100))}%/day</strong></>
                  : <>Read <strong className="text-stone-200">{n.pagesPerDay} pages/day</strong></>;
              return <p className="text-[11px] text-stone-400">{targetLabel} to finish as <span style={{ color: n.archetype.accentHex }}>{n.archetype.badgeEmoji} {n.archetype.name}</span></p>;
            })()}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-stone-300">
                {p.estimatedFinish
                  ? p.remaining === 0
                    ? p.unit === 'audiobook' ? 'All listened!' : p.unit === 'percent' ? '100% completed!' : 'All pages read!'
                    : <>Estimated finish: <strong className="text-emerald-400">{fmt(p.estimatedFinish)}</strong> ({p.daysLeft} {p.daysLeft === 1 ? 'day' : 'days'})</>
                  : 'Update your progress to get an estimate'}
              </span>
              <button type="button" onClick={() => setFinishing({ id: r.id, rating: 0, review: '' })} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <Check className="w-3.5 h-3.5" /> Finished today
              </button>
              <Button variant="secondary" size="sm" className="dark" aria-label={`Mark ${r.title} as Dropped`} onClick={() => drop(r.id)}><CircleStop />Dropped</Button>
            </div>
            {finishing?.id === r.id && (
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/30 space-y-2">
                <p className="text-sm font-serif font-bold text-emerald-300">🎉 You finished it! How was it?</p>
                <RatingInput value={finishing.rating} onChange={(v: number) => setFinishing({ ...finishing, rating: v })} />
                <textarea className={input} rows={2} placeholder="Final thoughts or a favourite quote (optional)" value={finishing.review} onChange={(e) => setFinishing({ ...finishing, review: e.target.value })} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="dark" onClick={() => setFinishing(null)}>Cancel</Button>
                  <button type="button" onClick={() => { finish(r, finishing.rating, finishing.review.trim()); setFinishing(null); }} className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-semibold">Save & celebrate</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
