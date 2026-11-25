import React, { useState, useRef } from 'react';
import { Sparkles, RefreshCw, BookmarkPlus, Check, BookOpen, Search, Loader2, Globe, ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookEntry } from '../types/book';
import { normalizeTitle, selectRecommendations, type Recommendation } from '../utils/recommendations';
import type { QueuedBook } from '../utils/readingQueue';
import { searchBooksUnified, isIsbnQuery, type ApiBookMetadata } from '../services/bookApiService';
import { searchKnowledgeBase, findExactOrBestMatch } from '../data/bookKnowledgeBase';
import { pickBestMetadataMatch, mergeBookMetadata } from '../utils/bookEnrich';
import { BarcodeScannerModal } from './BarcodeScannerModal';

const SECTION = { year: 'Based on your past 12 months', recent: 'Based on your past 3 months' };

function buildPayload(books: BookEntry[]) {
  let current: any[] = [];
  try { current = JSON.parse(localStorage.getItem('pagepace_current_reads') || '[]'); } catch {}
  const sorted = [...books].sort((a, b) => (b.finishDate || '').localeCompare(a.finishDate || ''));
  return {
    current: current.map((r) => ({ title: r.title, author: r.author, genre: r.genre })),
    history: sorted.map((b) => ({ title: b.title, author: b.author, genre: b.genre, rating: b.rating, finishDate: b.finishDate })),
  };
}

export const Recommendations: React.FC<{
  books: BookEntry[];
  queue: QueuedBook[];
  onSave: (book: Recommendation) => void;
  onStartReading?: (book: QueuedBook) => void;
}> = ({ books, queue, onSave, onStartReading }) => {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiBookMetadata[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enrichRecommendation = async (rec: Recommendation): Promise<Recommendation> => {
    const local = findExactOrBestMatch(rec.title);
    const apiResults = await searchBooksUnified(`${rec.title} ${rec.author}`).catch(() => []);
    const best = pickBestMetadataMatch(apiResults, rec.title, rec.author);
    if (best) return mergeBookMetadata(rec, best);
    if (local) {
      return mergeBookMetadata(rec, {
        title: local.title,
        author: local.author,
        totalPages: local.totalPages,
        genre: local.genre,
        source: 'combined',
      });
    }
    return rec;
  };

  const run = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/recommend-books', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload(books)) });
      const data = await res.json();
      if (!data.recommendations?.length) setError(data.error || 'No picks available yet. Add books finished in the past year.');
      const p = buildPayload(books);
      const fresh = selectRecommendations(data.recommendations || [], [...p.history, ...p.current]);
      if (data.recommendations?.length && !fresh.length) setError('All picks were books you already have. Tap Refresh to try again.');
      setRecs(fresh);
      if (fresh.length) {
        const enriched = await Promise.all(fresh.map(enrichRecommendation));
        setRecs(enriched);
      }
    } catch { setError('Could not get recommendations right now.'); }
    setLoading(false);
  };

  const handleSearch = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 2) {
      setResults([]); setShowDropdown(false); setSearching(false);
      return;
    }
    const local: ApiBookMetadata[] = searchKnowledgeBase(val).map((k) => ({
      title: k.title, author: k.author, totalPages: k.totalPages, genre: k.genre, source: 'combined',
    }));
    setResults(local);
    setShowDropdown(local.length > 0);
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const api = await searchBooksUnified(val);
        const merged = [...api];
        for (const loc of local) {
          if (!merged.some((m) => m.title.toLowerCase() === loc.title.toLowerCase())) merged.push(loc);
        }
        setResults(merged);
        setShowDropdown(merged.length > 0);
        if (isIsbnQuery(val) && api[0]) setShowDropdown(true);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const isSaved = (title: string) => queue.some((book) => normalizeTitle(book.title) === normalizeTitle(title));

  const toQueued = (b: { title: string; author: string; genre?: string; reason?: string; totalPages?: number; coverUrl?: string; isbn?: string; publisher?: string; publishedYear?: number }): QueuedBook => ({
    id: `rec-${Date.now()}`,
    title: b.title,
    author: b.author,
    genre: b.genre,
    reason: b.reason,
    totalPages: b.totalPages,
    coverUrl: b.coverUrl,
    isbn: b.isbn,
    publisher: b.publisher,
    publishedYear: b.publishedYear,
  });

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="font-serif text-lg text-slate-100 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" />What to read next</h3>
        </div>
        <button onClick={run} disabled={loading} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />{recs.length ? 'New picks' : 'Get picks'}
        </button>
      </div>

      {/* Smart Search to add any book to Want to read or Start reading with full metadata */}
      <div className="relative mb-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 220)}
            placeholder="Smart search by title, author, or ISBN…"
            aria-label="Search books to add to Want to read"
            className="w-full pl-8 pr-16 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searching && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
            <button type="button" onClick={() => setScannerOpen(true)} title="Scan barcode" aria-label="Scan barcode in What to read next" className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10">
              <ScanBarcode className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <BarcodeScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={(isbn) => handleSearch(isbn)} />
        {showDropdown && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl bg-stone-900 border border-stone-700 shadow-2xl overflow-hidden divide-y divide-stone-800 max-h-72 overflow-y-auto">
            <div className="px-3 py-1.5 bg-stone-950 text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 sticky top-0 z-10 border-b border-stone-800">
              <Globe className="w-3 h-3" />Google Books &amp; Open Library
            </div>
            {results.map((bk, idx) => {
              const saved = isSaved(bk.title);
              return (
                <div key={`${bk.title}-${bk.author}-${idx}`} onMouseDown={(e) => e.preventDefault()} className="p-2.5 flex items-center justify-between gap-2.5 hover:bg-stone-800/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {bk.coverUrl ? (
                      <img src={bk.coverUrl} alt={bk.title} className="w-8 h-11 object-cover rounded border border-stone-700 shrink-0" />
                    ) : (
                      <div className="w-8 h-11 rounded bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400 shrink-0"><BookOpen className="w-3.5 h-3.5" /></div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-100 truncate">{bk.title}</p>
                      <p className="text-[11px] text-stone-400 truncate">by {bk.author}</p>
                      <p className="text-[10px] font-mono text-stone-500">{bk.totalPages} pages · {bk.genre}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="dark h-7 px-2 text-[11px]"
                      disabled={saved}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSave({ title: bk.title, author: bk.author, genre: bk.genre, reason: '', basedOn: 'recent', totalPages: bk.totalPages, coverUrl: bk.coverUrl, isbn: bk.isbn, publisher: bk.publisher, publishedYear: bk.publishedYear });
                        setQuery(''); setResults([]); setShowDropdown(false);
                      }}
                    >
                      {saved ? <><Check className="w-3 h-3" />Saved</> : <><BookmarkPlus className="w-3 h-3" />Want</>}
                    </Button>
                    {onStartReading && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="dark h-7 px-2 text-[11px]"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onStartReading(toQueued(bk));
                          setQuery(''); setResults([]); setShowDropdown(false);
                        }}
                      >
                        <BookOpen className="w-3 h-3" />Read
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-slate-400">{error}</p>}
      {(['year', 'recent'] as const).map((g) => {
        const list = recs.filter((r) => r.basedOn === g);
        return (
          <div key={g} className="mt-4">
            <h4 className="text-[11px] uppercase tracking-wide text-amber-400 mb-2">{SECTION[g]}</h4>
            {!list.length && <p className="text-xs text-slate-400">{loading ? 'Finding a pick…' : g === 'recent' ? 'No recent pick yet.' : 'No yearly pick yet.'}</p>}
            <ul className="space-y-2">
              {list.map((r, i) => {
                const saved = isSaved(r.title);
                return (
                  <li key={i} className="rounded-xl bg-slate-800/60 p-3 flex items-start gap-3">
                    {r.coverUrl ? (
                      <img src={r.coverUrl} alt={r.title} className="w-12 h-[4.5rem] object-cover rounded-md border border-slate-700 shrink-0 shadow-sm" />
                    ) : (
                      <div className="w-12 h-[4.5rem] rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-100">{r.title} <span className="font-normal text-slate-400">by {r.author}</span></p>
                      {(r.genre || r.totalPages) && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {r.totalPages ? `${r.totalPages} pages` : ''}{r.totalPages && r.genre ? ' · ' : ''}{r.genre || ''}
                        </p>
                      )}
                      <p className="text-xs text-slate-300 mt-1">{r.reason}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Button variant="secondary" size="sm" className="dark" disabled={saved} onClick={() => onSave(r)}>
                          {saved ? <><Check />Saved</> : <><BookmarkPlus />Want to read</>}
                        </Button>
                        {onStartReading && (
                          <Button variant="outline" size="sm" className="dark" onClick={() => onStartReading(toQueued(r))}>
                            <BookOpen />Start reading
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
};
