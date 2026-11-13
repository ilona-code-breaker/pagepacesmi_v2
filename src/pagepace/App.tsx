import { StorageBadge } from './components/StorageBadge';
import { withRereads, originalBook } from './utils/rereads';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BookEntry, MonthlyGoal } from './types/book';
import { INITIAL_SAMPLE_BOOKS, ARCHETYPES } from './constants/archetypes';
import { Navbar } from './components/Navbar';
import { BookForm } from './components/BookForm';
import { BookList } from './components/BookList';
import { ArchetypeCodex } from './components/ArchetypeCodex';
import { CompletionSummaryCard } from './components/CompletionSummaryCard';
import { MonthlyGoalTracker } from './components/MonthlyGoalTracker';
import { MonthlyGoalWidget } from './components/MonthlyGoalWidget';
import { YearlyGoalWidget } from './components/YearlyGoalWidget';
import { ShareableArchetypeCardModal } from './components/ShareableArchetypeCardModal';
import { DataPortabilityToolbar } from './components/DataPortabilityToolbar';
import { CsvImportModal } from './components/CsvImportModal';
import { todayIso } from './utils/readingStats';
import { csvReadingToCurrent, csvToReadToQueue, dropMisfiledCsvBooks } from './utils/csvShelves';
const loadCurrentReadsForImport = () => { try { const d = JSON.parse(localStorage.getItem('pagepace_current_reads') || '[]'); return Array.isArray(d) ? d : []; } catch { return []; } };
import { ReaderTypeCard } from './components/ReaderTypeCard';
import { isNewUnlock } from './utils/archetypeProgress';
import type { ArchetypeDefinition } from './types/book';
import { applyGenres, fetchGenres, isUnassigned } from './utils/genreFill';
import { StreakWidget } from './components/StreakWidget';
import { CurrentlyReading, addCurrentRead } from './components/CurrentlyReading';
import { Recommendations } from './components/Recommendations';
import { ReadingQueue } from './components/ReadingQueue';
import { QUEUE_KEY, saveToQueue, removeFromQueue, type QueuedBook } from './utils/readingQueue';
import { Button } from '@/components/ui/button';
import { BookCorner } from './components/BookCorner';
import { OWNED_KEY, addOwned, findOwned, toggleOwned, type OwnedBook } from './utils/ownedBooks';
import { YearInReview } from './components/YearInReview';
import { ReadingBadgeWatcher, ReadingBadgesGuide } from './components/ReadingBadges';
import { loadBirthday, loadTbrStarted, loadYearlyGoals, recordTbrStart, type ReadingContext } from './utils/readingAchievements';
import { useReadingLists } from './hooks/useReadingLists';
import { getCurrentMonthKey } from './utils/goalUtils';
import {
  Sparkles,
  Zap,
  Compass,
  Wine,
  Moon,
  Flame,
  Rocket,
  Armchair,
  ArrowRight,
  BookOpen,
  Award,
  Share2,
  FileSpreadsheet,
} from 'lucide-react';

const STORAGE_KEY = 'pagepace_books_v1';
const SOUND_KEY = 'pagepace_sound_v1';
const GOALS_STORAGE_KEY = 'pagepace_monthly_goals_v1';

const DEFAULT_INITIAL_GOALS: Record<string, MonthlyGoal> = {
  '2026-10': {
    monthKey: '2026-10',
    targetType: 'both',
    targetBooks: 3,
    targetPages: 1000,
    intention: 'Autumn reading momentum & sci-fi exploration',
  },
  '2026-09': {
    monthKey: '2026-09',
    targetType: 'both',
    targetBooks: 3,
    targetPages: 1000,
    intention: 'Savoring literary classics and deep character journeys',
  },
};

export default function App() {
  const [books, setBooks] = useState<BookEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_SAMPLE_BOOKS;
  });
  const statsBooks = useMemo(() => withRereads(books), [books]);

  const [goals, setGoals] = useState<Record<string, MonthlyGoal>>(() => {
    try {
      const saved = localStorage.getItem(GOALS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_INITIAL_GOALS;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [owned, setOwned] = useState<OwnedBook[]>([]);
  useEffect(() => {
    try { setOwned(JSON.parse(localStorage.getItem(OWNED_KEY) || '[]')); } catch { /* ignore */ }
  }, []);
  const { dropped: droppedReads } = useReadingLists();
  const [birthday, setBirthday] = useState<string | undefined>();
  const [badgeTick, setBadgeTick] = useState(0);
  useEffect(() => { setBirthday(loadBirthday()); }, []);
  const readingCtx = useMemo<ReadingContext>(() => ({
    books: statsBooks, originals: books, goals, yearlyGoals: typeof window === 'undefined' ? {} : loadYearlyGoals(),
    tbrStarted: typeof window === 'undefined' ? [] : loadTbrStarted(), droppedCount: droppedReads.length, owned, birthday,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [statsBooks, books, goals, droppedReads.length, owned, birthday, badgeTick]);
  const saveOwned = (list: OwnedBook[]) => {
    setOwned(list);
    localStorage.setItem(OWNED_KEY, JSON.stringify(list));
  };
  const [currentTab, setCurrentTab] = useState<'track' | 'library' | 'year' | 'codex' | 'corner'>('track');
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookEntry | null>(null);
  const [unlocked, setUnlocked] = useState<ArchetypeDefinition | null>(null);

  const [isShareCardOpen, setIsShareCardOpen] = useState<boolean>(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);

  // Save books to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch {
      // Ignore
    }
  }, [books]);

  // Save goals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch {
      // Ignore
    }
  }, [goals]);

  // Save sound setting
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_KEY, JSON.stringify(soundEnabled));
    } catch {
      // Ignore
    }
  }, [soundEnabled]);

  const handleUpdateGoal = (updatedGoal: MonthlyGoal) => {
    setGoals((prev) => ({
      ...prev,
      [updatedGoal.monthKey]: updatedGoal,
    }));
  };

  const [trackStatus, setTrackStatus] = useState<'finished' | 'reading'>('finished');
  const [queue, setQueue] = useState<QueuedBook[]>([]);
  const [queuedStart, setQueuedStart] = useState<QueuedBook | undefined>();
  const [queueError, setQueueError] = useState('');
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      if (Array.isArray(saved)) setQueue(saved.filter((book) => book?.id && typeof book.title === 'string' && typeof book.author === 'string'));
    } catch { setQueueError('Could not load your saved books.'); }
  }, []);
  const updateQueue = (next: QueuedBook[]) => {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
      setQueue(next);
      setQueueError('');
    } catch { setQueueError('Could not save your queue on this device.'); }
  };
  const removeQueuedBook = (id: string | string[]) => {
    const ids = new Set(Array.isArray(id) ? id : [id]);
    updateQueue(queue.filter((q) => !ids.has(q.id)));
    if (queuedStart && ids.has(queuedStart.id)) setQueuedStart(undefined);
  };
  const startQueuedBook = (book: QueuedBook) => {
    recordTbrStart(book.title);
    setBadgeTick((t) => t + 1);
    setCurrentTab('track');
    setTrackStatus('reading');
    setQueuedStart(book);
    setSelectedBook(null);
    requestAnimationFrame(() => document.getElementById('book-tracking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleBookCreated = (newBook: BookEntry) => {
    if (isNewUnlock(books, newBook) && ARCHETYPES[newBook.archetypeId]) {
      setUnlocked(ARCHETYPES[newBook.archetypeId]);
      import('canvas-confetti').then((m) => m.default({ particleCount: 140, spread: 80, origin: { y: 0.3 } })).catch(() => {});
    }
    setBooks((prev) => [newBook, ...prev]);
    setSelectedBook(newBook);
    // Scroll to completion card smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBook?.id === id) {
      setSelectedBook(null);
    }
  };

  const handleDeleteBooks = (ids: string[]) => {
    const idSet = new Set(ids);
    setBooks((prev) => prev.filter((b) => !idSet.has(b.id)));
    if (selectedBook && idSet.has(selectedBook.id)) {
      setSelectedBook(null);
    }
  };

  const handleClearLibrary = () => {
    setBooks([]);
    setSelectedBook(null);
  };

  const handleRestoreBooks = (booksToRestore: BookEntry[]) => {
    setBooks((prev) => {
      const existingIds = new Set(prev.map((b) => b.id));
      const newItems = booksToRestore.filter((b) => !existingIds.has(b.id));
      return [...newItems, ...prev];
    });
  };

  const handleEditBook = (updatedBook: BookEntry) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === updatedBook.id ? updatedBook : b))
    );
    if (selectedBook?.id === updatedBook.id) {
      setSelectedBook(updatedBook);
    }
  };

  const handleApplyGenres = (picks: Record<string, string>) => {
    setBooks((prev) => applyGenres(prev, picks));
  };

  const handleDataImported = (imported: {
    books: BookEntry[];
    goals: Record<string, MonthlyGoal>;
  }) => {
    setBooks(imported.books);
    if (imported.books.some(isUnassigned)) {
      fetchGenres(imported.books).then(handleApplyGenres).catch(() => {});
    }
    if (imported.goals && Object.keys(imported.goals).length > 0) {
      setGoals(imported.goals);
    }
    setSelectedBook(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imported.books));
      if (imported.goals && Object.keys(imported.goals).length > 0) {
        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(imported.goals));
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-stone-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        libraryCount={books.length}
        onOpenShareCard={() => setIsShareCardOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Highlighted Completion Summary Card (When a book is active or just logged) */}
        {selectedBook && (
          <section aria-label="Book Completion Card" className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span className="font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-semibold">
                <Award className="w-4 h-4" />
                Active Completion Summary
              </span>
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="hover:text-stone-200 text-stone-500 transition-colors"
              >
                Dismiss Certificate
              </button>
            </div>
            <CompletionSummaryCard
              book={selectedBook}
              onClose={() => setSelectedBook(null)}
              onEdit={handleEditBook}
              onDelete={handleDeleteBook}
            />
          </section>
        )}

        {/* TAB 1: Track Book Form */}
        {currentTab === 'track' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-8 items-stretch">
              <button type="button" onClick={() => setCurrentTab('year')} className="min-w-0 lg:col-span-7 text-left p-4 rounded-2xl bg-stone-900/60 border border-stone-800 hover:border-amber-500/40 transition-colors">
                <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500">Books read in {new Date().getFullYear()}</div>
                <div className="text-3xl font-serif font-bold text-amber-400 mt-1">{statsBooks.filter((b) => (b.finishDate || '').startsWith(String(new Date().getFullYear()))).length}</div>
                <div className="text-[11px] text-stone-500 mt-1">See goals & progress →</div>
              </button>
              <div className="min-w-0 lg:col-span-5">
                <StreakWidget books={statsBooks} onOpenYear={() => setCurrentTab('year')} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Column */}
              <div id="book-tracking-form" className="lg:col-span-7 bg-stone-900/70 border border-stone-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
                    Track Books
                  </h1>
                  <p className="text-stone-400 text-xs sm:text-sm mt-1">
                    Enter a book, then tick whether you want to read it, are still reading it, or finished it.
                  </p>
                </div>

                {queuedStart && <div className="dark flex items-center justify-between gap-2 text-sm text-muted-foreground"><span className="min-w-0 break-words">Starting {queuedStart.title}</span><Button variant="ghost" size="sm" onClick={() => setQueuedStart(undefined)}>Cancel</Button></div>}
                <BookForm
                  key={`${trackStatus}-${queuedStart?.id || ''}`}
                  onWantToRead={(b) => updateQueue(saveToQueue(queue, { ...b, reason: '' } as any, crypto.randomUUID()))}
                  initialBook={queuedStart}
                  mode={trackStatus}
                  onBookCreated={handleBookCreated}
                  soundEnabled={soundEnabled}
                  onOwn={(b) => saveOwned(addOwned(owned, [b], new Date().toLocaleDateString('en-CA')).list)}
                  onReadingStarted={(r) => {
                    addCurrentRead(r);
                    if (queuedStart) {
                      updateQueue(removeFromQueue(queue, queuedStart.id));
                      setQueuedStart(undefined);
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>

              {/* Side Column: Sample Books & Tips */}
              <div className="lg:col-span-5 space-y-6">
                <ReaderTypeCard books={books} today={new Date().toLocaleDateString('en-CA')} onOpenCollection={() => setCurrentTab('codex')} />
                <CurrentlyReading onFinish={handleBookCreated} />
                <Recommendations books={books} queue={queue} onSave={(book) => updateQueue(saveToQueue(queue, book, crypto.randomUUID()))} />
                {queueError && <p role="alert" className="text-sm text-destructive">{queueError}</p>}
                <ReadingQueue queue={queue} onRemove={removeQueuedBook} onStart={startQueuedBook} />
                {/* Sample Library Quick Showcase */}
                <div className="p-6 rounded-2xl bg-stone-900/50 border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-mono uppercase tracking-wider text-stone-300 font-semibold flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-stone-400" />
                      Explore Archetype Samples
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('library')}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      All ({books.length}) <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {books.slice(0, 4).map((b) => {
                      const arch = ARCHETYPES[b.archetypeId] || ARCHETYPES['steady-cruiser'];
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBook(b)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                            selectedBook?.id === b.id
                              ? 'bg-stone-800 border-amber-500/50 shadow-md'
                              : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/60'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-serif font-bold text-stone-200 group-hover:text-amber-300 truncate">
                              {b.title}
                            </div>
                            <div className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                              <span style={{ color: arch.accentHex }}>{arch.shortName}</span>
                              <span>·</span>
                              <span>{b.ppd.toFixed(1)} PPD</span>
                              <span>·</span>
                              <span>★ {b.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <span className="text-xs text-amber-400 font-medium group-hover:translate-x-0.5 transition-transform">
                            →
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Library & Archive */}
        {currentTab === 'library' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
                  Your Reading Archive
                </h1>
                <p className="text-stone-400 text-xs sm:text-sm mt-1">
                  Search, sort and shelve your books. Add notes and favourite quotes from the Edit button.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-stone-700 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Import books from Goodreads CSV or custom spreadsheet"
                >
                  <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                  <span>Import CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareCardOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>Share Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('track')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm transition-colors"
                >
                  + Track New Book
                </button>
              </div>
            </div>

            <BookList
              isOwned={(b) => !!findOwned(owned, b)}
              onToggleOwned={(b) => saveOwned(toggleOwned(owned, { title: b.title, author: b.author, totalPages: b.totalPages, genre: b.genre, coverUrl: b.coverUrl, isbn: b.isbn, format: b.format }, new Date().toLocaleDateString('en-CA')))}
              onFinishReading={handleBookCreated}
              queue={queue}
              onStartQueuedBook={startQueuedBook}
              onRemoveQueuedBook={removeQueuedBook}
              books={books}
              goals={goals}
              onSelectBook={(book) => {
                setSelectedBook(originalBook(books, book));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDeleteBook={handleDeleteBook}
              onDeleteBooks={handleDeleteBooks}
              onClearLibrary={handleClearLibrary}
              onRestoreBooks={handleRestoreBooks}
              soundEnabled={soundEnabled}
              onAddBookClick={() => setCurrentTab('track')}
              onDataImported={handleDataImported}
              onOpenShareCard={() => setIsShareCardOpen(true)}
              onEditBook={handleEditBook}
              onApplyGenres={handleApplyGenres}
            />
          </div>
        )}

        {/* TAB: Year in Review & Streaks */}
        {currentTab === 'year' && (
          <YearInReview
            books={statsBooks}
            goals={goals}
            goalsOpen={goalsOpen}
            goalsSummary={
              <>
                <MonthlyGoalWidget books={statsBooks} goals={goals} onViewGoals={() => setGoalsOpen(true)} />
                <YearlyGoalWidget books={statsBooks} />
              </>
            }
            onGoalsOpenChange={setGoalsOpen}
            goalsEditor={
              <MonthlyGoalTracker
                books={statsBooks}
                goals={goals}
                onUpdateGoal={handleUpdateGoal}
                onSelectBook={(book) => {
                  setGoalsOpen(false);
                  setSelectedBook(originalBook(books, book));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigateToTrack={() => {
                  setGoalsOpen(false);
                  setCurrentTab('track');
                }}
                soundEnabled={soundEnabled}
              />
            }
            onSelectBook={(book) => {
              setSelectedBook(originalBook(books, book));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'corner' && <BookCorner onOpenCodex={() => setCurrentTab('codex')} owned={owned} onChange={saveOwned} completed={books} onLibrarySync={setBooks} queue={queue} onQueue={(list) => updateQueue(list.reduce((q, b, i) => saveToQueue(q, { title: b.title, author: b.author, genre: b.genre ?? '', reason: '' } as never, `corner-q-${Date.now()}-${i}`), queue))} />}

        {/* TAB 4: Archetype Codex & Field Guide */}
        <ReadingBadgeWatcher ctx={readingCtx} />
        {currentTab === 'codex' && (
          <div>
            <div className="space-y-3">
          {/* Quick Action Pill: Share Archetype Card */}
          <div className="flex items-center justify-between text-xs text-stone-400 px-1">
            <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
              Calculates Dynamic Pace & Archetype
            </span>
            <button
              type="button"
              onClick={() => setIsShareCardOpen(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors group"
            >
              <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Share My Archetype Card →</span>
            </button>
          </div>
            </div>
            <ArchetypeCodex books={books} />
            <div className="mt-6"><ReadingBadgesGuide ctx={readingCtx} onBirthday={setBirthday} /></div>
                {/* Quick Archetype Preview Explainer */}
                <div className="p-6 rounded-2xl bg-stone-900/50 border border-stone-800 space-y-4">
                  <h3 className="text-sm font-mono uppercase tracking-wider text-stone-300 font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    How Archetypes Are Assigned
                  </h3>
                  <div className="space-y-2.5 text-xs text-stone-400 leading-relaxed font-sans">
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                      <div className="font-mono text-stone-300 font-medium">Elapsed Days Formula:</div>
                      <code className="text-amber-400 font-mono block">Finish Date - Start Date + 1</code>
                      <span className="text-[11px] text-stone-500">Same-day read counts as 1 day minimum.</span>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                      <div className="font-mono text-stone-300 font-medium">Velocity Calculation:</div>
                      <code className="text-amber-400 font-mono block">PPD = Total Pages / Elapsed Days</code>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                      <div className="font-mono text-stone-300 font-medium">0.1 Precision Rating Scale:</div>
                      <span className="text-stone-300">Supports fine increments (e.g. 3.7, 4.3, 4.8, 5.0) for book connoisseurs.</span>
                    </div>
                  </div>
                </div>


          </div>
        )}
      </main>

      {/* Shareable Reading Archetype Card Modal */}
      <ShareableArchetypeCardModal
        books={books}
        isOpen={isShareCardOpen}
        onClose={() => setIsShareCardOpen(false)}
      />

      {/* Client-Side CSV Import Modal (Goodreads & Custom Spreadsheets) */}
      {unlocked && (
        <div role="dialog" aria-label="New reader type unlocked" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setUnlocked(null)}>
          <div className="max-w-sm w-full rounded-2xl bg-stone-900 border p-6 text-center space-y-3" style={{ borderColor: unlocked.accentHex }} onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] font-mono uppercase tracking-wider text-amber-400">New reader type unlocked</p>
            <div className="text-6xl" aria-hidden>{unlocked.badgeEmoji}</div>
            <h2 className="font-serif text-2xl font-bold" style={{ color: unlocked.accentHex }}>{unlocked.name}</h2>
            <p className="text-sm text-stone-300 italic">“{unlocked.tagline}”</p>
            <p className="text-xs text-stone-400">{new Set([...books.map((b) => b.archetypeId)]).size} / {Object.keys(ARCHETYPES).length} collected</p>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="ghost" onClick={() => setUnlocked(null)}>Nice!</Button>
              <Button onClick={() => { setUnlocked(null); setCurrentTab('codex'); }}>See collection</Button>
            </div>
          </div>
        </div>
      )}

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        existingBooks={books}
        onImportComplete={(importedBooks, shelfRows) => {
          const updatedBooks = dropMisfiledCsvBooks(importedBooks, shelfRows);
          handleDataImported({ books: updatedBooks, goals });
          const stamp = Date.now();
          const reading = loadCurrentReadsForImport();
          const newReads = csvReadingToCurrent(shelfRows, reading, todayIso(), (i) => `csv-cr-${stamp}-${i}`);
          newReads.forEach((r) => addCurrentRead(r));
          updateQueue(csvToReadToQueue(shelfRows, queue, [...reading, ...newReads].map((r) => r.title).concat(updatedBooks.map((b) => b.title)), (i) => `csv-q-${stamp}-${i}`));
        }}
      />

      {/* Footer */}
      <footer className="border-t border-stone-800/80 py-8 text-center text-xs text-stone-500 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-stone-400 font-mono">
            <StorageBadge />
          </div>

          <DataPortabilityToolbar
            books={books}
            goals={goals}
            onDataImported={handleDataImported}
          />
        </div>

        <p className="font-serif">
          PagePace • Gamified Book Tracking & Reading Velocity Archetypes
        </p>
        <p className="text-[11px] text-stone-600">
          Designed with love for Bedtime Tasters, Book Sommeliers, Cozy Lounge Readers, Steady Cruisers, Momentum Builders, Speed Readers, and Narrative Comets alike.
        </p>
      </footer>
    </div>
  );
}
