import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Library, Loader2, Plus, ScanBarcode, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BookEntry } from '../types/book';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { searchBooksUnified, type ApiBookMetadata } from '../services/bookApiService';
import { BOOKCASE_SIZE, addOwned, isOwnedRead, toBookcases, type OwnedBook } from '../utils/ownedBooks';

interface Props {
  owned: OwnedBook[];
  onChange: (list: OwnedBook[]) => void;
  completed: BookEntry[];
}

const today = () => new Date().toLocaleDateString('en-CA');
const genreColor = (g = '') => {
  let h = 0;
  for (const c of g) h = (h * 31 + c.charCodeAt(0)) % 12;
  return `var(--genre-${g ? h : 11})`;
};
const fromMeta = (m: ApiBookMetadata) => ({ title: m.title, author: m.author, totalPages: m.totalPages || 0, genre: m.genre, coverUrl: m.coverUrl, isbn: m.isbn });

export const BookCorner: React.FC<Props> = ({ owned, onChange, completed }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiBookMetadata[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [scanning, setScanning] = useState(false);
  const [keepScanning, setKeepScanning] = useState(false);
  const [caseIdx, setCaseIdx] = useState(0);
  const [picked, setPicked] = useState<OwnedBook | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [listFilter, setListFilter] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  const readSet = useMemo(() => new Set(owned.filter((o) => isOwnedRead(o, completed)).map((o) => o.id)), [owned, completed]);
  const sorted = useMemo(() => [...owned].sort((a, b) => (a.genre || 'zzz').localeCompare(b.genre || 'zzz') || a.author.localeCompare(b.author)), [owned]);
  const cases = toBookcases(sorted);
  const idx = Math.min(caseIdx, cases.length - 1);
  const full = owned.length === 0 ? 0 : Math.floor(owned.length / BOOKCASE_SIZE);

  const add = (items: Omit<OwnedBook, 'id' | 'addedAt'>[]) => {
    const r = addOwned(owned, items, today());
    onChange(r.list);
    const wasFull = Math.floor(owned.length / BOOKCASE_SIZE);
    const nowFull = Math.floor(r.list.length / BOOKCASE_SIZE);
    setNote(r.added === 0 ? 'Already on your shelves.' : nowFull > wasFull ? `🎉 Bookcase ${nowFull} is full! A new one is ready.` : `Added ${r.added} book${r.added > 1 ? 's' : ''}.`);
    return r.added;
  };

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setBusy(true);
    setNote('');
    try {
      const res = await searchBooksUnified(q);
      setResults(res.slice(0, 5));
      if (!res.length) setNote('No books found.');
      return res;
    } catch {
      setNote('Search failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const onScan = async (isbn: string) => {
    const res = await runSearch(isbn);
    if (res?.[0]) {
      add([{ ...fromMeta(res[0]), isbn }]);
      setResults([]);
    }
    if (keepScanning) setTimeout(() => setScanning(true), 600);
  };

  const unreadCount = owned.length - readSet.size;

  return (
    <div className="dark space-y-5 text-foreground">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-2"><Library className="w-7 h-7 text-primary" /> My Book Corner</h1>
          <p className="text-sm text-muted-foreground">Your physical bookshelf, one spine per book.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['Books', owned.length], ['Read', readSet.size], ['Unread', unreadCount]].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-border bg-card/40 px-3 py-2">
              <div className="font-mono text-lg font-bold">{v}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card/30 p-4 space-y-3">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); runSearch(query); }}>
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title, author or ISBN" aria-label="Find a book you own"
              className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm" />
          </div>
          <Button type="submit" disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}</Button>
          <Button type="button" variant="outline" onClick={() => setScanning(true)} aria-label="Scan barcode"><ScanBarcode className="w-4 h-4" /><span className="hidden sm:inline">Scan</span></Button>
        </form>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={keepScanning} onChange={(e) => setKeepScanning(e.target.checked)} /> Scan my shelf (keep camera on after each book)</label>
          {completed.length > 0 && (
            <button type="button" className="underline" onClick={() => add(completed.map((c) => ({ title: c.title, author: c.author, totalPages: c.totalPages, genre: c.genre, coverUrl: c.coverUrl, isbn: c.isbn })))}>
              Add all my finished books
            </button>
          )}
        </div>
        {note && <p className="text-sm text-primary" role="status">{note}</p>}
        {results.length > 0 && (
          <ul className="divide-y divide-border">
            {results.map((r, i) => (
              <li key={i} className="flex items-center gap-3 py-2">
                {r.coverUrl ? <img src={r.coverUrl} alt="" className="w-8 h-12 object-cover rounded" /> : <div className="w-8 h-12 rounded bg-muted" />}
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold truncate">{r.title}</p><p className="text-xs text-muted-foreground truncate">{r.author}{r.totalPages ? ` · ${r.totalPages} p.` : ''}</p></div>
                <Button size="sm" onClick={() => { add([fromMeta(r)]); setResults([]); setQuery(''); }}><Plus className="w-4 h-4" /> Add</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Bookcase {idx + 1} of {cases.length} · {cases[idx].length}/{BOOKCASE_SIZE}{full > 0 && ` · ${full} full`}
          </p>
          {cases.length > 1 && (
            <div className="flex gap-1">
              <Button size="icon" variant="outline" aria-label="Previous bookcase" disabled={idx === 0} onClick={() => setCaseIdx(idx - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <Button size="icon" variant="outline" aria-label="Next bookcase" disabled={idx === cases.length - 1} onClick={() => setCaseIdx(idx + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
        </div>
        <div className="bookcase rounded-2xl p-3 sm:p-4">
          {Array.from({ length: 4 }).map((_, row) => {
            const shelf = cases[idx].slice(row * 25, row * 25 + 25);
            return (
              <div key={row} className="bookcase-shelf flex items-end gap-[2px] h-28 sm:h-36 px-1">
                {shelf.map((b) => {
                  const h = 62 + Math.min(1, (b.totalPages || 300) / 800) * 36;
                  return (
                    <button key={b.id} type="button" title={`${b.title} — ${b.author}`} aria-label={`${b.title} by ${b.author}`}
                      onClick={() => setPicked(b)}
                      className="flex-1 max-w-[18px] min-w-0 rounded-t-sm transition-transform hover:-translate-y-1 focus-visible:-translate-y-1"
                      style={{ height: `${h}%`, background: genreColor(b.genre), opacity: readSet.has(b.id) ? 1 : 0.45, boxShadow: 'inset -2px 0 0 color-mix(in oklab, black 25%, transparent)' }} />
                  );
                })}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Bright spines are books you've read; faded ones are waiting. Colours show genre.</p>
      </section>

      <section className="rounded-2xl border border-border bg-card/30 p-4 space-y-3" aria-label="Books I own">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-xl font-bold">Books I own ({owned.length})</h2>
          {selected.size > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setSelected(new Set()); setConfirmDel(false); }}>Clear</Button>
              <Button size="sm" variant="destructive" onClick={() => {
                if (!confirmDel) return setConfirmDel(true);
                onChange(owned.filter((o) => !selected.has(o.id)));
                setNote(`Removed ${selected.size} book${selected.size > 1 ? 's' : ''}.`);
                setSelected(new Set()); setConfirmDel(false);
              }}>
                <Trash2 className="w-4 h-4" /> {confirmDel ? `Confirm delete ${selected.size}` : `Delete ${selected.size}`}
              </Button>
            </div>
          )}
        </div>
        {owned.length === 0 ? <p className="text-sm text-muted-foreground">No books yet. Add some above.</p> : (() => {
          const f = listFilter.toLowerCase();
          const shown = sorted.filter((b) => !f || b.title.toLowerCase().includes(f) || b.author.toLowerCase().includes(f));
          const allOn = shown.length > 0 && shown.every((b) => selected.has(b.id));
          return (<>
            <div className="flex flex-wrap items-center gap-3">
              <input value={listFilter} onChange={(e) => setListFilter(e.target.value)} placeholder="Filter my books" aria-label="Filter my books"
                className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <input type="checkbox" checked={allOn} onChange={() => { const n = new Set(selected); shown.forEach((b) => allOn ? n.delete(b.id) : n.add(b.id)); setSelected(n); setConfirmDel(false); }} /> Select all
              </label>
            </div>
            <ul className="divide-y divide-border max-h-[28rem] overflow-y-auto">
              {shown.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-2">
                  <input type="checkbox" aria-label={`Select ${b.title}`} checked={selected.has(b.id)} onChange={() => { const n = new Set(selected); n.has(b.id) ? n.delete(b.id) : n.add(b.id); setSelected(n); setConfirmDel(false); }} />
                  <span className="w-1.5 h-8 rounded-sm shrink-0" style={{ background: genreColor(b.genre) }} />
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setPicked(b)}>
                    <p className="text-sm font-semibold truncate">{b.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.author}{b.genre ? ` · ${b.genre}` : ''}</p>
                  </button>
                  <span className={`text-xs shrink-0 ${readSet.has(b.id) ? 'text-primary' : 'text-muted-foreground'}`}>{readSet.has(b.id) ? 'Read' : 'Unread'}</span>
                </li>
              ))}
            </ul>
          </>);
        })()}
      </section>

      {picked && (
        <div role="dialog" aria-label={picked.title} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={() => setPicked(null)}>
          <div className="dark w-full max-w-sm rounded-2xl border border-border bg-card p-5 space-y-3 text-foreground" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-3">
              {picked.coverUrl && <img src={picked.coverUrl} alt="" className="w-16 h-24 object-cover rounded" />}
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-lg font-bold">{picked.title}</h2>
                <p className="text-sm text-muted-foreground">{picked.author}</p>
                <p className="text-xs text-muted-foreground mt-1">{[picked.genre, picked.totalPages ? `${picked.totalPages} pages` : ''].filter(Boolean).join(' · ')}</p>
                <p className="text-xs mt-1 text-primary">{readSet.has(picked.id) ? 'Read ✓' : 'Not read yet'}</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setPicked(null)}><X className="w-4 h-4" /></button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => { onChange(owned.filter((o) => o.id !== picked.id)); setPicked(null); }}>
              <Trash2 className="w-4 h-4" /> Remove from my shelves
            </Button>
          </div>
        </div>
      )}

      <BarcodeScannerModal isOpen={scanning} onClose={() => setScanning(false)} onDetected={onScan} />
    </div>
  );
};
