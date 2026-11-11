import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { BookEntry } from '../types/book';

interface Rec { title: string; author: string; genre?: string; reason: string; basedOn?: string }

const SECTION = { current: 'Because you are reading now', history: 'Based on all your books', monthly: 'Based on your monthly reading' };

function buildPayload(books: BookEntry[]) {
  let current: any[] = [];
  try { current = JSON.parse(localStorage.getItem('pagepace_current_reads') || '[]'); } catch {}
  const sorted = [...books].sort((a, b) => (b.finishDate || '').localeCompare(a.finishDate || ''));
  const byMonth = new Map<string, BookEntry[]>();
  sorted.forEach((b) => {
    const k = (b.finishDate || '').slice(0, 7);
    if (k) byMonth.set(k, [...(byMonth.get(k) || []), b]);
  });
  const months = Array.from(byMonth.entries()).slice(0, 12).map(([month, bs]) => {
    const c: Record<string, number> = {};
    bs.forEach((b) => b.genre && (c[b.genre] = (c[b.genre] || 0) + 1));
    return { month, count: bs.length, topGenre: Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] };
  });
  return {
    current: current.map((r) => ({ title: r.title, author: r.author, genre: r.genre })),
    history: sorted.map((b) => ({ title: b.title, author: b.author, genre: b.genre, rating: b.rating })),
    months,
  };
}

export const Recommendations: React.FC<{ books: BookEntry[] }> = ({ books }) => {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/recommend-books', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload(books)) });
      const data = await res.json();
      if (!data.recommendations?.length) setError(data.error || 'Log a book or add a current read first, then try again.');
      setRecs(data.recommendations || []);
    } catch { setError('Could not get recommendations right now.'); }
    setLoading(false);
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="font-serif text-lg text-slate-100 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" />What to read next</h3>
          <p className="text-xs text-slate-400">Picks based on your current read, past books and monthly habits.</p>
        </div>
        <button onClick={run} disabled={loading} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />{recs.length ? 'Refresh' : 'Get picks'}
        </button>
      </div>
      {error && <p className="text-sm text-slate-400">{error}</p>}
      {(['current', 'history', 'monthly'] as const).map((g) => {
        const list = recs.filter((r) => r.basedOn === g);
        if (!list.length) return null;
        return (
          <div key={g} className="mt-4">
            <h4 className="text-[11px] uppercase tracking-wide text-amber-400 mb-2">{SECTION[g]}</h4>
            <ul className="space-y-2">
              {list.map((r, i) => (
                <li key={i} className="rounded-xl bg-slate-800/60 p-3">
                  <p className="text-sm font-semibold text-slate-100">{r.title} <span className="font-normal text-slate-400">by {r.author}</span></p>
                  {r.genre && <p className="text-[11px] text-slate-500">{r.genre}</p>}
                  <p className="text-xs text-slate-300 mt-1">{r.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
};
