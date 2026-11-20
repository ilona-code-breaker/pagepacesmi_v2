import { DuplicateCleaner } from './library/DuplicateCleaner';
import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { BookEntry, MonthlyGoal } from '../types/book';
import { GenrePieChart } from './GenrePieChart';
import { EditBookModal } from './EditBookModal';
import { playCelebrationChime, playSoftClick } from '../utils/sound';
import {
  DEFAULT_FILTERS,
  LibraryFilterState,
  countGenres,
  countShelves,
  filterAndSortBooks,
} from '../utils/libraryFilters';
import { useUndoDeletion } from '../hooks/useUndoDeletion';
import { BookCard } from './library/BookCard';
import { LibraryFilters } from './library/LibraryFilters';
import { LibraryToolbar } from './library/LibraryToolbar';
import { SelectionBar } from './library/SelectionBar';
import { UndoToast } from './library/UndoToast';
import { ClearLibraryModal } from './library/ClearLibraryModal';
import { EmptyLibrary } from './library/EmptyLibrary';
import { ReadingQueue } from './ReadingQueue';
import { filterReadingQueue, type QueuedBook } from '../utils/readingQueue';
import { useReadingLists } from '../hooks/useReadingLists';
import { CurrentlyReading } from './CurrentlyReading';
import { DroppedBooks } from './DroppedBooks';
import { GenreFillPanel } from './library/GenreFillPanel';
import { Button } from '@/components/ui/button';

interface BookListProps {
  queue: QueuedBook[];
  onStartQueuedBook: (book: QueuedBook) => void;
  onRemoveQueuedBook: (id: string | string[]) => void;
  onFinishReading: (book: BookEntry) => void;
  books: BookEntry[];
  goals?: Record<string, MonthlyGoal>;
  onSelectBook: (book: BookEntry) => void;
  onDeleteBook: (id: string) => void;
  onDeleteBooks?: (ids: string[]) => void;
  onClearLibrary?: () => void;
  onRestoreBooks?: (booksToRestore: BookEntry[]) => void;
  soundEnabled?: boolean;
  onAddBookClick: () => void;
  onDataImported?: (data: { books: BookEntry[]; goals: Record<string, MonthlyGoal> }) => void;
  onOpenShareCard?: () => void;
  onEditBook?: (updatedBook: BookEntry) => void;
  onApplyGenres?: (picks: Record<string, string>) => void;
  isOwned?: (book: BookEntry) => boolean;
  onToggleOwned?: (book: BookEntry) => void;
}

export const BookList: React.FC<BookListProps> = ({
  isOwned,
  onToggleOwned,
  queue,
  onStartQueuedBook,
  onRemoveQueuedBook,
  onFinishReading,
  books,
  goals = {},
  onSelectBook,
  onDeleteBook,
  onDeleteBooks,
  onClearLibrary,
  onRestoreBooks,
  soundEnabled = true,
  onAddBookClick,
  onDataImported,
  onOpenShareCard,
  onEditBook,
  onApplyGenres,
}) => {
  const [filters, setFilters] = useState<LibraryFilterState>(DEFAULT_FILTERS);
  const [status, setStatus] = useState<'all' | 'want' | 'reading' | 'done' | 'dropped'>('done');
  const { reads, dropped, removeDropped, error } = useReadingLists();
  const [showGenreChart, setShowGenreChart] = useState(false);
  const [editingBook, setEditingBook] = useState<BookEntry | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const undo = useUndoDeletion();

  const patchFilters = (patch: Partial<LibraryFilterState>) => {
    if (patch.shelf === 'Want to read') setStatus('want');
    else if (patch.shelf) setStatus('all');
    setSelectedIds(new Set());
    setFilters((f) => ({ ...f, ...patch }));
  };
  const libraryGenres = useMemo(() => {
    const counts = new Map(countGenres(books));
    [...queue, ...reads, ...dropped].forEach((book) => { if (book.genre) counts.set(book.genre, (counts.get(book.genre) || 0) + 1); });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [books, queue, reads, dropped]);
  const shelves = useMemo(() => countShelves(books).map(([shelf, count]): [string, number] => [shelf, count + (shelf === 'Want to read' ? queue.length : 0)]), [books, queue]);
  const filtered = useMemo(() => status === 'all' || status === 'done' ? filterAndSortBooks(books, filters) : [], [books, filters, status]);
  const filteredQueue = useMemo(() => status === 'all' || status === 'want' ? filterReadingQueue(queue, filters) : [], [queue, filters, status]);
  const visibleReads = filterReadingQueue(reads, filters).map((r) => r.id);
  const visibleDroppedIds = new Set(filterReadingQueue(dropped, filters).map((r) => r.id));
  const visibleDropped = dropped.filter((r) => visibleDroppedIds.has(r.id));
  const click = () => soundEnabled && playSoftClick();

  // Drop selections for books that no longer exist
  useEffect(() => {
    if (selectedIds.size === 0) return;
    const existing = new Set(books.map((b) => b.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => existing.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [books]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    click();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAllToggle = () => {
    click();
    setSelectedIds(
      selectedIds.size === filtered.length && filtered.length > 0 ? new Set() : new Set(filtered.map((b) => b.id))
    );
  };

  const deleteSingle = (book: BookEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    click();
    undo.start([book], `Deleted "${book.title}"`);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(book.id);
      return next;
    });
    onDeleteBook(book.id);
  };

  const deleteSelected = () => {
    const toDelete = books.filter((b) => selectedIds.has(b.id));
    if (toDelete.length === 0) return;
    click();
    undo.start(toDelete, `Deleted ${toDelete.length} ${toDelete.length === 1 ? 'book' : 'books'}`);
    const ids = toDelete.map((b) => b.id);
    onDeleteBooks ? onDeleteBooks(ids) : ids.forEach(onDeleteBook);
    setSelectedIds(new Set());
  };

  const confirmClear = () => {
    if (books.length === 0) return;
    click();
    undo.start([...books], `Cleared entire archive (${books.length} ${books.length === 1 ? 'book' : 'books'})`);
    if (onClearLibrary) onClearLibrary();
    else if (onDeleteBooks) onDeleteBooks(books.map((b) => b.id));
    else books.forEach((b) => onDeleteBook(b.id));
    setSelectedIds(new Set());
    setIsClearConfirmOpen(false);
  };

  const handleUndo = () => {
    if (!undo.activeUndo) return;
    onRestoreBooks?.(undo.activeUndo.books);
    if (soundEnabled) playCelebrationChime();
    const n = undo.activeUndo.books.length;
    setFlash(`Restored ${n} ${n === 1 ? 'book' : 'books'} to archive!`);
    setTimeout(() => setFlash(null), 3500);
    undo.dismiss();
  };

  return (
    <div className="space-y-6">
      <LibraryToolbar
        books={books}
        goals={goals}
        showGenreChart={showGenreChart}
        onToggleGenreChart={() => setShowGenreChart((p) => !p)}
        onDataImported={onDataImported}
        onClearLibraryClick={() => setIsClearConfirmOpen(true)}
      />

      {onApplyGenres && <GenreFillPanel books={books} onApply={onApplyGenres} />}
      <DuplicateCleaner />

      <div role="group" aria-label="Reading status" className="dark flex flex-wrap gap-2">
        {([['all', 'All', books.length + queue.length + reads.length + dropped.length], ['want', 'Want to read', queue.length], ['reading', 'In progress', reads.length], ['done', 'Done', books.length], ['dropped', 'Dropped', dropped.length]] as const).map(([value, label, count]) =>
          <Button key={value} variant={status === value ? 'secondary' : 'ghost'} size="sm" aria-pressed={status === value} onClick={() => { setStatus(value); setFilters({ ...DEFAULT_FILTERS, search: filters.search, sortBy: filters.sortBy }); setSelectedIds(new Set()); }}>{label} ({count})</Button>
        )}
      </div>
      {(status === 'all' || status === 'done') && filters.shelf !== 'Want to read' && (
        <GenrePieChart books={books} selectedGenre={filters.genre} onSelectGenre={(g) => patchFilters({ genre: g })} collapsed={!showGenreChart} onToggleCollapsed={() => setShowGenreChart((p) => !p)} />
      )}

      <LibraryFilters
        filters={filters}
        onChange={patchFilters}
        libraryGenres={libraryGenres}
        shelves={shelves}
        visibleCount={filtered.length}
        selectedCount={selectedIds.size}
        onSelectAllToggle={handleSelectAllToggle}
      />

      {selectedIds.size > 0 && (
        <SelectionBar count={selectedIds.size} onCancel={() => setSelectedIds(new Set())} onDelete={deleteSelected} />
      )}

      {flash && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{flash}</span>
        </div>
      )}

      {(filteredQueue.length > 0 || filters.shelf === 'Want to read') && (
        <ReadingQueue queue={filteredQueue} onStart={onStartQueuedBook} onRemove={onRemoveQueuedBook} fullShelf />
      )}
      {status === 'want' && filteredQueue.length === 0 && filters.shelf !== 'Want to read' && <ReadingQueue queue={[]} onStart={onStartQueuedBook} onRemove={onRemoveQueuedBook} fullShelf />}
      {(status === 'reading' || (status === 'all' && visibleReads.length > 0)) && <CurrentlyReading onFinish={onFinishReading} visibleIds={visibleReads} libraryView />}
      {(status === 'dropped' || (status === 'all' && visibleDropped.length > 0)) && <DroppedBooks books={visibleDropped} onRemove={removeDropped} />}
      {error && <p role="alert" className="dark text-sm text-destructive">{error}</p>}

      {filtered.length === 0 && filteredQueue.length === 0 && (status === 'all' || status === 'done') && visibleReads.length === 0 && visibleDropped.length === 0 && filters.shelf !== 'Want to read' ? (
        <EmptyLibrary filters={filters} onResetFilters={() => setFilters(DEFAULT_FILTERS)} onAddBookClick={onAddBookClick} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              search={filters.search}
              isSelected={selectedIds.has(book.id)}
              onOpen={() => onSelectBook(book)}
              onToggleSelect={(e) => toggleSelect(book.id, e)}
              onEdit={() => setEditingBook(book)}
              onDelete={(e) => deleteSingle(book, e)}
              onGenreChange={(g) => onEditBook?.({ ...book, genre: g, genres: [g] as any })}
              onShelfClick={(s) => patchFilters({ shelf: s })}
              owned={isOwned?.(book)}
              onToggleOwned={onToggleOwned ? () => onToggleOwned(book) : undefined}
            />
          ))}
        </div>
      )}

      {undo.activeUndo && (
        <UndoToast
          label={undo.activeUndo.label}
          progress={undo.progress}
          onUndo={handleUndo}
          onDismiss={undo.dismiss}
          onHoverChange={undo.setHovered}
        />
      )}

      {isClearConfirmOpen && (
        <ClearLibraryModal count={books.length} onCancel={() => setIsClearConfirmOpen(false)} onConfirm={confirmClear} />
      )}

      {editingBook && (
        <EditBookModal
          book={editingBook}
          isOpen
          onClose={() => setEditingBook(null)}
          onSave={(updated) => {
            onEditBook?.(updated);
            setEditingBook(null);
          }}
        />
      )}
    </div>
  );
};
