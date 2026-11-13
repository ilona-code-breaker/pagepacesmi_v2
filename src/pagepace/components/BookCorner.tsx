import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Library, Loader2, Plus, ScanBarcode, Search, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BookEntry } from '../types/book';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { searchBooksUnified, type ApiBookMetadata } from '../services/bookApiService';
import { useReadingLists } from '../hooks/useReadingLists';
import type { QueuedBook } from '../utils/readingQueue';
import { parseOwnedFile } from '../utils/ownedImport';
import { calculateElapsedDays, calculatePPD, getArchetypeByPPD } from '../utils/calculator';
import { syncCornerLibrary, OWNED_FORMATS, BOOKCASE_SIZE, addOwned, isOwnedRead, findOwnedDuplicates, removeOwnedDuplicates, toBookcases, type OwnedBook } from '../utils/ownedBooks';

interface Props {
  owned: OwnedBook[];
  onChange: (list: OwnedBook[]) => void;
  completed: BookEntry[];
  queue?: QueuedBook[];
  onQueue?: (books: { title: string; author: string; genre?: string }[]) => void;
  onLibrarySync?: (library: BookEntry[]) => void;
}

const NUM_WORDS: Record<string, string> = { one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10' };
const spineTitle = (t: string) => {
  const vol = t.match(/(?:volume|vol\.?|book|#)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
  let base = t.replace(/\s*\(.*?\)\s*/g, ' ').split(/[:–—]/)[0].trim();
  if (vol && !/\d\s*$/.test(base)) base += ' ' + (NUM_WORDS[vol[1].toLowerCase()] ?? vol[1]);
  return base.length > 22 ? base.slice(0, 21) + '…' : base;
};
const today = () => new Date().toLocaleDateString('en-CA');
const genreColor = (g = '') => {
  let h = 0;
  for (const c of g) h = (h * 31 + c.charCodeAt(0)) % 12;
  return `var(--genre-${g ? h : 11})`;
};
const fromMeta = (m: ApiBookMetadata) => ({ format: 'Physical' as const, title: m.title, author: m.author, totalPages: m.totalPages || 0, genre: m.genre, coverUrl: m.coverUrl, isbn: m.isbn });

export const BookCorner: React.FC<Props> = ({ owned, onChange, completed, queue = [], onQueue, onLibrarySync }) => {
  const [confirmSync, setConfirmSync] = useState(false);
  const [PER_SHELF, setPerShelf] = useState(20);
  useEffect(() => {
    const fit = () => setPerShelf(window.innerWidth < 640 ? 12 : window.innerWidth < 1024 ? 16 : 22);
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit);
  }, []);
  const runSync = () => {
    const r = syncCornerLibrary(owned, completed, (o) => {
      const pages = o.totalPages || 0; const d = o.addedAt || today();
      const ppd = calculatePPD(pages, calculateElapsedDays(d, d));
      return { id: `corner-${o.id}`, title: o.title, author: o.author, totalPages: pages, startDate: d, finishDate: d, elapsedDays: 1, ppd, archetypeId: getArchetypeByPPD(ppd).id, rating: 0, review: '', genre: o.genre, coverUrl: o.coverUrl, isbn: o.isbn, format: o.format ?? 'Physical', createdAt: Date.now() } as BookEntry;
    });
    if (r.newBooks.length || r.formats) onLibrarySync?.(r.nextLibrary);
    if (r.markedRead) onChange(r.nextOwned);
    setConfirmSync(false);
    setNote(r.newBooks.length || r.formats || r.markedRead ? `Synced: ${r.newBooks.length} read book${r.newBooks.length === 1 ? '' : 's'} added to Library, ${r.markedRead} marked Read here, ${r.formats} format${r.formats === 1 ? '' : 's'} updated in Library.` : 'Book Corner and Library are already in sync.');
  };
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
  // Groups the user accepted as "not duplicates" (stored per device, synced with the account)
  const [accepted, setAccepted] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('pagepace_owned_not_duplicates_v1') || '[]'); } catch { return []; } });
  const groupKey = (g: OwnedBook[]) => g.map((b) => b.id).sort().join('+');
  const acceptGroup = (g: OwnedBook[]) => {
    const next = [...accepted, groupKey(g)];
    setAccepted(next);
    localStorage.setItem('pagepace_owned_not_duplicates_v1', JSON.stringify(next));
  };
  const dupGroups = useMemo(() => findOwnedDuplicates(owned).filter((g) => !accepted.includes(groupKey(g))), [owned, accepted]);
  const [showDups, setShowDups] = useState(false);
  const [confirmDups, setConfirmDups] = useState(false);
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');

  // Fill missing details (cover, genre, pages, ISBN) from matching Library books
  useEffect(() => {
    let changed = false;
    const next = owned.map((o) => {
      const lib = completed.find((c) => isOwnedRead(o, [c]));
      if (!lib) return o;
      const patch: Partial<OwnedBook> = {};
      if (!o.coverUrl && lib.coverUrl) patch.coverUrl = lib.coverUrl;
      if ((!o.genre || o.genre === 'Unassigned') && lib.genre && lib.genre !== 'Unassigned') patch.genre = lib.genre;
      if (!o.totalPages && lib.totalPages) patch.totalPages = lib.totalPages;
      if (!o.isbn && lib.isbn) patch.isbn = lib.isbn;
      if (!o.author && lib.author) patch.author = lib.author;
      if (!Object.keys(patch).length) return o;
      changed = true;
      return { ...o, ...patch };
    });
    if (changed) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owned, completed]);
  const [confirmDel, setConfirmDel] = useState(false);

  const { reads, dropped } = useReadingLists();
  /** Status mirrors the Library: Done > In progress > Dropped > Want to read > Unread. */
  const statusOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of owned) {
      m.set(o.id, o.markedRead === true || (o.markedRead !== false && isOwnedRead(o, completed)) ? 'Read' : isOwnedRead(o, reads) ? 'Reading' : isOwnedRead(o, dropped) ? 'Dropped' : isOwnedRead(o, queue) ? 'Want to read' : 'Unread');
    }
    return m;
  }, [owned, completed, reads, dropped, queue]);
  const readSet = useMemo(() => new Set(owned.filter((o) => statusOf.get(o.id) === 'Read').map((o) => o.id)), [owned, statusOf]);
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

  const importFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const rows = await parseOwnedFile(file);
      if (!rows.length) { setNote('No books found. Make sure the file has a "Title" column.'); return; }
      const items = rows.map(({ status, ...b }) => ({ ...b, ...(status === 'read' ? { markedRead: true } : {}) }));
      // Books already owned pick up a "Read" status from the file too
      const readRows = items.filter((i) => i.markedRead);
      const base = owned.map((o) => (!o.markedRead && readRows.some((r) => isOwnedRead(o, [r])) ? { ...o, markedRead: true } : o));
      const r = addOwned(base, items, today());
      onChange(r.list);
      const tbr = rows.filter((x) => x.status === 'tbr');
      if (tbr.length && onQueue) onQueue(tbr);
      const reads = r.list.filter((o) => o.markedRead).length;
      setNote(`Imported ${rows.length} rows: added ${r.added} new book${r.added === 1 ? '' : 's'}${readRows.length ? `, ${readRows.length} marked read` : ''}${tbr.length ? `, ${tbr.length} sent to Want to read` : ''}. ${reads ? '' : ''}`.trim());
    } catch {
      setNote("Couldn't read that file. Use .xlsx, .xls or .csv.");
    } finally {
      setBusy(false);
    }
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
          <Button type="button" variant="outline" asChild aria-label="Import from Excel or CSV">
            <label className="cursor-pointer"><Upload className="w-4 h-4" /><span className="hidden sm:inline">Import</span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { importFile(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={keepScanning} onChange={(e) => setKeepScanning(e.target.checked)} /> Scan my shelf (keep camera on after each book)</label>
          <span>Import: Excel or CSV with a Title column (Author, Pages, Genre, ISBN, Format optional)</span>
          {onLibrarySync && (
            <button type="button" className="underline text-primary" onClick={() => (confirmSync ? runSync() : setConfirmSync(true))}>
              {confirmSync ? 'Tap again to sync with Library' : 'Sync with Library'}
            </button>
          )}
          {completed.length > 0 && (
            <button type="button" className="underline" onClick={() => add(completed.map((c) => ({ title: c.title, author: c.author, totalPages: c.totalPages, genre: c.genre, coverUrl: c.coverUrl, isbn: c.isbn, format: c.format })))}>
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
          {Array.from({ length: Math.max(1, Math.ceil(cases[idx].length / PER_SHELF)) }).map((_, row) => {
            const shelf = cases[idx].slice(row * PER_SHELF, row * PER_SHELF + PER_SHELF);
            return (
              <div key={row} className="bookcase-shelf flex items-end gap-[3px] h-36 sm:h-44 px-1">
                {shelf.map((b) => {
                  const pages = Math.max(80, Math.min(1200, b.totalPages || 300));
                  const tall = 80 + ([...b.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 16);
                  return (
                    <button key={b.id} type="button" title={`${b.title} — ${b.author} · ${b.totalPages || '?'} pages`} aria-label={`${b.title} by ${b.author}`}
                      onClick={() => setPicked(b)}
                      className="overflow-hidden rounded-t-sm transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 flex items-center justify-center"
                      style={{ flex: `${pages} 1 0`, minWidth: 14, maxWidth: `${Math.round(22 + pages / 30)}px`, height: `${tall}%`, background: genreColor(b.genre), opacity: readSet.has(b.id) ? 1 : 0.45, boxShadow: 'inset -2px 0 0 color-mix(in oklab, black 25%, transparent)' }}>
                      <span className="text-[10px] sm:text-[11px] font-semibold leading-none whitespace-nowrap overflow-hidden text-ellipsis max-h-[92%] text-background" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{spineTitle(b.title)}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Bright spines are books you've read; faded ones are waiting. Colours show genre; thicker spines are longer books. Tap a spine for details.</p>
      </section>

      {dupGroups.length > 0 && (
        <section className="rounded-2xl border border-primary/40 bg-primary/10 p-4 space-y-3" aria-label="Duplicates">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm"><strong>{dupGroups.reduce((n, g) => n + g.length - 1, 0)} duplicate{dupGroups.length > 1 ? 's' : ''}</strong> found in {dupGroups.length} book{dupGroups.length > 1 ? 's' : ''}.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowDups((v) => !v)}>{showDups ? 'Hide' : 'Review'}</Button>
              <Button size="sm" variant="destructive" onClick={() => {
                if (!confirmDups) return setConfirmDups(true);
                const ok = new Set(dupGroups.flatMap((g) => g.map((b) => b.id)));
                const next = removeOwnedDuplicates(owned.filter((b) => ok.has(b.id))).concat(owned.filter((b) => !ok.has(b.id)));
                setNote(`Removed ${owned.length - next.length} duplicate${owned.length - next.length > 1 ? 's' : ''}.`);
                onChange(next); setConfirmDups(false); setShowDups(false);
              }}><Trash2 className="w-4 h-4" /> {confirmDups ? 'Confirm remove' : 'Remove duplicates'}</Button>
            </div>
          </div>
          {showDups && (
            <ul className="space-y-2 text-xs max-h-64 overflow-y-auto">
              {dupGroups.map((g) => (
                <li key={g[0].id} className="rounded-lg border border-border bg-background/50 p-2">
                  <div className="flex justify-end"><button type="button" className="text-primary underline" onClick={() => acceptGroup(g)}>Not a duplicate — keep all</button></div>
                  {g.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2 py-0.5">
                      <span className="truncate">{b.title} <span className="text-muted-foreground">· {b.author}</span></span>
                      <button type="button" className="shrink-0 text-destructive underline" onClick={() => onChange(owned.filter((o) => o.id !== b.id))}>Delete this</button>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">"Remove duplicates" keeps the most complete copy of each book.</p>
        </section>
      )}

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
          const shown = sorted.filter((b) => readFilter === 'all' || (readFilter === 'read') === readSet.has(b.id)).filter((b) => !f || b.title.toLowerCase().includes(f) || b.author.toLowerCase().includes(f));
          const allOn = shown.length > 0 && shown.every((b) => selected.has(b.id));
          return (<>
            <div className="flex flex-wrap items-center gap-3">
              <input value={listFilter} onChange={(e) => setListFilter(e.target.value)} placeholder="Filter my books" aria-label="Filter my books"
                className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              <div className="flex rounded-xl border border-border overflow-hidden text-xs" role="group" aria-label="Show read or unread">
                {(['all', 'read', 'unread'] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setReadFilter(k)} aria-pressed={readFilter === k}
                    className={`px-3 py-2 capitalize ${readFilter === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                    {k} ({k === 'all' ? owned.length : k === 'read' ? readSet.size : owned.length - readSet.size})
                  </button>
                ))}
              </div>
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
                    <p className="text-xs text-muted-foreground truncate">{b.author}{b.genre ? ` · ${b.genre}` : ''} · {b.format || 'Physical'}</p>
                  </button>
                  <span className={`text-xs shrink-0 ${readSet.has(b.id) ? 'text-primary' : 'text-muted-foreground'}`}>{statusOf.get(b.id)}</span>
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
                <p className="text-xs mt-1 text-primary">{readSet.has(picked.id) ? 'Read ✓' : statusOf.get(picked.id) === 'Unread' ? 'Not read yet' : statusOf.get(picked.id)}</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setPicked(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Read status">
              {([['Read', true], ['Unread', false]] as const).map(([label, val]) => {
                const on = readSet.has(picked.id) === val;
                return (
                  <button key={label} type="button" aria-pressed={on} onClick={() => {
                    const next = { ...picked, markedRead: val };
                    onChange(owned.map((o) => (o.id === picked.id ? next : o)));
                    setPicked(next);
                  }} className={`rounded-xl border px-3 py-2 text-sm ${on ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>{label}</button>
                );
              })}
            </div>
            <label className="block text-sm">
              <span className="text-muted-foreground text-xs">Format</span>
              <select aria-label="Format" value={picked.format || 'Physical'} onChange={(e) => {
                const next = { ...picked, format: e.target.value as OwnedBook['format'] };
                onChange(owned.map((o) => (o.id === picked.id ? next : o)));
                setPicked(next);
              }} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                {OWNED_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
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
