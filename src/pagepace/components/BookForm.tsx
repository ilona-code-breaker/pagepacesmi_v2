import { findOwned, type OwnedBook, type OwnedFormat } from '../utils/ownedBooks';
import { AlternativeTitleField } from './book-details/AlternativeTitleField';
import React, { useState, useEffect, useRef } from 'react';
import { defaultUnitForFormat, type CurrentRead, type ProgressUnit } from '../utils/currentReading';
import type { QueuedBook } from '../utils/readingQueue';
import { todayIso } from '../utils/readingStats';
import confetti from 'canvas-confetti';
import { BookEntry } from '../types/book';
import {
  calculateElapsedDays,
  calculatePPD,
  getArchetypeByPPD,
  snapToPrecision01,
} from '../utils/calculator';
import { VelocityTelemetryBar } from './VelocityTelemetryBar';
import { generateArchetypeCelebration } from '../utils/celebrationGenerator';
import { RatingInput } from './RatingInput';
import { playCelebrationChime } from '../utils/sound';
import { MASTER_GENRES, normalizeGenre } from '../utils/genreMapper';
import {
  searchKnowledgeBase,
  findExactOrBestMatch,
  KnownBook,
} from '../data/bookKnowledgeBase';
import {
  searchBooksUnified,
  isIsbnQuery,
  extractCleanIsbn,
  ApiBookMetadata,
} from '../services/bookApiService';
import { pickBestMetadataMatch } from '../utils/bookEnrich';
import {
  BookOpen,
  Calendar,
  Sparkles,
  Zap,
  Compass,
  Wine,
  Moon,
  Flame,
  Rocket,
  Armchair,
  Info,
  CheckCircle2,
  Search,
  Check,
  Undo2,
  Loader2,
  Globe,
  ExternalLink,
  Layers,
  ScanBarcode,
} from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface BookFormProps {
  onBookCreated: (book: BookEntry) => void;
  soundEnabled?: boolean;
  /** 'reading' = log a book still in progress (no finish date / rating / review) */
  mode?: 'finished' | 'reading';
  onReadingStarted?: (r: CurrentRead) => void;
  initialBook?: QueuedBook;
  /** Called when "I own this book" is ticked on submit */
  /** Called when the book is saved as Want to read */
  onWantToRead?: (b: {
    title: string;
    author: string;
    genre?: string;
    totalPages?: number;
    coverUrl?: string;
    isbn?: string;
    format?: OwnedFormat;
    publisher?: string;
    publishedYear?: number;
    alternativeTitle?: string;
    ownedBookId?: string;
  }) => void;
  ownedBooks?: OwnedBook[];
  isOwned?: (b: { title: string; author: string; isbn?: string; alternativeTitle?: string; ownedBookId?: string }) => boolean;
  onOwn?: (b: { title: string; author: string; totalPages: number; genre?: string; coverUrl?: string; isbn?: string; format?: OwnedFormat; alternativeTitle?: string; ownedBookId?: string }, status: 'want' | 'reading' | 'finished') => void;
}

export const BookForm: React.FC<BookFormProps> = ({
  onBookCreated,
  soundEnabled = true,
  mode = 'finished',
  onReadingStarted,
  initialBook,
  onOwn,
  onWantToRead,
  isOwned,
  ownedBooks = [],
}) => {
  const [ownIt, setOwnIt] = useState(false);
  const [status, setStatus] = useState<'want' | 'reading' | 'finished'>(mode);
  const isReading = status === 'reading';
  const isWant = status === 'want';
  const isFinished = status === 'finished';
  const [currentPage, setCurrentPage] = useState<number | ''>(initialBook ? 0 : '');
  const [progressUnit, setProgressUnit] = useState<ProgressUnit>(
    initialBook?.format ? defaultUnitForFormat(initialBook.format) : 'pages'
  );
  const [percentRead, setPercentRead] = useState<number | ''>(0);
  const [totalHours, setTotalHours] = useState<number | ''>('');
  const [totalMins, setTotalMins] = useState<number | ''>('');
  const [currentHours, setCurrentHours] = useState<number | ''>('');
  const [currentMins, setCurrentMins] = useState<number | ''>('');
  const [durationError, setDurationError] = useState('');
  // Today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  // 5 days ago
  const defaultStart = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const initialMatch = initialBook ? findExactOrBestMatch(initialBook.title) : undefined;
  const [title, setTitle] = useState(initialBook?.title || '');
  const [author, setAuthor] = useState(initialBook?.author || '');
  const [alternativeTitle, setAlternativeTitle] = useState(initialBook?.alternativeTitle || '');
  const [linkedOwnedId, setLinkedOwnedId] = useState(initialBook?.ownedBookId || '');
  const [ownedSearch, setOwnedSearch] = useState('');
  const [totalPages, setTotalPages] = useState<number | ''>(
    initialBook ? initialBook.totalPages || initialMatch?.totalPages || '' : 384
  );
  const [startDate, setStartDate] = useState(initialBook ? todayIso() : defaultStart);
  const [finishDate, setFinishDate] = useState(todayStr);
  const [rating, setRating] = useState<number>(4.4);
  const [review, setReview] = useState('');
  const [genre, setGenre] = useState<string>(initialBook ? normalizeGenre(initialBook.genre || initialMatch?.genre || '') || 'Unassigned' : 'Fantasy');
  const [format, setFormat] = useState<'Physical' | 'E-Reader' | 'Audiobook' | 'Hybrid'>(initialBook?.format || 'Physical');
  const [coverUrl, setCoverUrl] = useState<string | undefined>(initialBook?.coverUrl);
  const [isbn, setIsbn] = useState<string | undefined>(initialBook?.isbn);
  const linkedOwned = ownedBooks.find((book) => book.id === linkedOwnedId);
  const ownedMatch = linkedOwned ?? findOwned(ownedBooks, { title, author, alternativeTitle, isbn });
  const bookLink = { alternativeTitle: alternativeTitle.trim() || (ownedMatch && ownedMatch.title !== title.trim() ? ownedMatch.title : undefined), ownedBookId: ownedMatch?.id };
  const [publisher, setPublisher] = useState<string | undefined>(initialBook?.publisher);
  const [publishedYear, setPublishedYear] = useState<number | undefined>(initialBook?.publishedYear);

  // Track if user explicitly entered an exact page count (must override auto-filled values)
  const [hasUserCustomizedPages, setHasUserCustomizedPages] = useState<boolean>(false);
  const userCustomizedPagesRef = useRef(false);
  const [combinedSuggestions, setCombinedSuggestions] = useState<ApiBookMetadata[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);
  const [autoFilledBadge, setAutoFilledBadge] = useState<{
    bookTitle: string;
    author: string;
    standardPages: number;
    genre: string;
    coverUrl?: string;
    source: string;
    isCustomPagesUsed: boolean;
  } | null>(
    initialBook && (initialBook.totalPages || initialBook.coverUrl)
      ? {
          bookTitle: initialBook.title,
          author: initialBook.author,
          standardPages: initialBook.totalPages || initialMatch?.totalPages || 0,
          genre: normalizeGenre(initialBook.genre || initialMatch?.genre || '') || 'Unassigned',
          coverUrl: initialBook.coverUrl,
          source: 'Saved Library Metadata',
          isCustomPagesUsed: false,
        }
      : null
  );

  // Graceful fallback: if opening an older queued book missing pages or cover, look it up via the same APIs
  useEffect(() => {
    if (!initialBook || (initialBook.totalPages && initialBook.coverUrl)) return;
    let cancelled = false;
    setIsSearchingApi(true);
    searchBooksUnified(`${initialBook.title} ${initialBook.author}`)
      .then((apiResults) => {
        if (cancelled) return;
        const match = pickBestMetadataMatch(apiResults, initialBook.title, initialBook.author);
        if (!match) return;
        if (!userCustomizedPagesRef.current && !initialBook.totalPages && match.totalPages) {
          setTotalPages(match.totalPages);
        }
        if (!initialBook.coverUrl && match.coverUrl) setCoverUrl(match.coverUrl);
        if (!initialBook.isbn && match.isbn) setIsbn(match.isbn);
        if (!initialBook.publisher && match.publisher) setPublisher(match.publisher);
        if (!initialBook.publishedYear && match.publishedYear) setPublishedYear(match.publishedYear);
        if ((!initialBook.genre || initialBook.genre === 'Unassigned') && match.genre && match.genre !== 'Unassigned') {
          setGenre(normalizeGenre(match.genre) || 'Unassigned');
        }
        const sourceName =
          match.source === 'google_books'
            ? 'Google Books API'
            : match.source === 'open_library'
            ? 'Open Library API'
            : 'PagePace Literary Knowledge Base';
        setAutoFilledBadge({
          bookTitle: initialBook.title,
          author: initialBook.author,
          standardPages: initialBook.totalPages || match.totalPages,
          genre: normalizeGenre(initialBook.genre || match.genre || '') || 'Unassigned',
          coverUrl: initialBook.coverUrl || match.coverUrl,
          source: sourceName,
          isCustomPagesUsed: userCustomizedPagesRef.current,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsSearchingApi(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBook?.id]);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Live telemetry calculation
  const safePages = typeof totalPages === 'number' && totalPages > 0 ? totalPages : 1;
  const elapsedDays = calculateElapsedDays(startDate, finishDate);
  const livePpd = calculatePPD(safePages, elapsedDays);
  const liveArchetype = getArchetypeByPPD(livePpd);

  // Auto-fill applicant helper
  const applyBookMetadata = (
    book: ApiBookMetadata,
    userProvidedPages: boolean
  ) => {
    setTitle(book.title);
    setAuthor(book.author);
    if (book.genre) {
      const resolvedGenre = normalizeGenre(book.genre);
      setGenre(resolvedGenre || 'Unassigned');
    } else {
      setGenre('Unassigned');
    }
    if (book.coverUrl) setCoverUrl(book.coverUrl);
    if (book.isbn) setIsbn(book.isbn);
    if (book.publisher) setPublisher(book.publisher);
    if (book.publishedYear) setPublishedYear(book.publishedYear);

    // If the user already provided an exact page count, retain user's input!
    // Otherwise, auto-fill standard edition page count.
    if (!userProvidedPages) {
      setTotalPages(book.totalPages);
    }

    const sourceName =
      book.source === 'google_books'
        ? 'Google Books API'
        : book.source === 'open_library'
        ? 'Open Library API'
        : 'PagePace Literary Knowledge Base';

    setAutoFilledBadge({
      bookTitle: book.title,
      author: book.author,
      standardPages: book.totalPages,
      genre: book.genre,
      coverUrl: book.coverUrl,
      source: sourceName,
      isCustomPagesUsed: userProvidedPages,
    });
    setShowSuggestions(false);
  };

  // Monitor title / ISBN changes for suggestions and instant exact auto-fill
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (newTitle.trim().length >= 2) {
      // 1. Instant local knowledge base match (0ms latency)
      const localResults = searchKnowledgeBase(newTitle).map((k): ApiBookMetadata => ({
        title: k.title,
        author: k.author,
        totalPages: k.totalPages,
        genre: k.genre,
        source: 'combined',
      }));

      // Check if user typed an exact match (e.g. "Fourth Wing")
      const exactMatch = findExactOrBestMatch(newTitle);
      if (exactMatch && exactMatch.title.toLowerCase() === newTitle.trim().toLowerCase()) {
        applyBookMetadata(
          {
            title: exactMatch.title,
            author: exactMatch.author,
            totalPages: exactMatch.totalPages,
            genre: exactMatch.genre,
            source: 'combined',
          },
          hasUserCustomizedPages
        );
      }

      setCombinedSuggestions(localResults);
      setShowSuggestions(localResults.length > 0);

      // 2. Debounced real Google Books API & Open Library API search
      setIsSearchingApi(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const apiResults = await searchBooksUnified(newTitle);
          if (apiResults.length > 0) {
            // Merge with local results, prioritizing rich API results with cover art
            const merged = [...apiResults];
            for (const loc of localResults) {
              if (!merged.some((m) => m.title.toLowerCase() === loc.title.toLowerCase())) {
                merged.push(loc);
              }
            }
            setCombinedSuggestions(merged);
            setShowSuggestions(true);

            // If user queried by ISBN and got an exact hit, auto-apply!
            if (isIsbnQuery(newTitle) && apiResults[0]) {
              applyBookMetadata(apiResults[0], hasUserCustomizedPages);
            }
          }
        } catch (err) {
          console.warn('API Search error:', err);
        } finally {
          setIsSearchingApi(false);
        }
      }, 400);
    } else {
      setCombinedSuggestions([]);
      setShowSuggestions(false);
      setIsSearchingApi(false);
    }
  };

  // When title input loses focus, check if we can auto-fill best match
  const handleTitleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      if (title.trim().length >= 3 && !author.trim()) {
        const match = findExactOrBestMatch(title);
        if (match) {
          applyBookMetadata(
            {
              title: match.title,
              author: match.author,
              totalPages: match.totalPages,
              genre: match.genre,
              source: 'combined',
            },
            hasUserCustomizedPages
          );
        }
      }
    }, 280);
  };

  const handlePageCountChange = (val: string) => {
    setHasUserCustomizedPages(true); // User explicitly provided page count!
    userCustomizedPagesRef.current = true;
    if (val === '') {
      setTotalPages('');
    } else {
      const num = Math.max(1, parseInt(val, 10) || 1);
      setTotalPages(num);
    }
    // Update badge state if active
    if (autoFilledBadge) {
      setAutoFilledBadge((prev) => (prev ? { ...prev, isCustomPagesUsed: true } : null));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const trackedBook = { title: title.trim(), author: author.trim() || 'Unknown Author', totalPages: safePages, genre, coverUrl, isbn, format, ...bookLink };
    if (ownIt || isOwned?.(trackedBook)) onOwn?.(trackedBook, status);

    if (isWant) {
      onWantToRead?.({
        title: title.trim(),
        author: author.trim() || 'Unknown Author',
        genre,
        totalPages: typeof totalPages === 'number' && totalPages > 0 ? totalPages : undefined,
        coverUrl,
        isbn,
        format,
        publisher,
        publishedYear,
        ...bookLink,
      });
      if (soundEnabled) playCelebrationChime();
      setAlternativeTitle(''); setLinkedOwnedId(''); setOwnIt(false); setTitle(''); setAuthor(''); setCoverUrl(undefined); setIsbn(undefined); setAutoFilledBadge(null);
      return;
    }

    if (isReading) {
      const totalMin = Math.max(0, (Number(totalHours) || 0) * 60 + (Number(totalMins) || 0));
      if (progressUnit === 'audiobook' && totalMin <= 0) {
        setDurationError('Enter the audiobook length (hours or minutes).');
        return;
      }
      const curMin = Math.min(totalMin, Math.max(0, (Number(currentHours) || 0) * 60 + (Number(currentMins) || 0)));
      const pct = Math.min(100, Math.max(0, Number(percentRead) || 0));
      const effectivePages =
        progressUnit === 'audiobook' && !hasUserCustomizedPages && !autoFilledBadge
          ? Math.max(1, Math.round(totalMin * 0.5))
          : safePages;
      const syncedPage =
        progressUnit === 'audiobook'
          ? Math.round((curMin / totalMin) * effectivePages)
          : progressUnit === 'percent'
          ? Math.round((pct / 100) * effectivePages)
          : Math.min(effectivePages, Math.max(0, Number(currentPage) || 0));
      onReadingStarted?.({
        id: 'read-' + Date.now(),
        title: title.trim(),
        ...bookLink,
        author: author.trim() || 'Unknown Author',
        totalPages: effectivePages,
        currentPage: syncedPage,
        progressUnit,
        ...(progressUnit === 'audiobook' ? { totalMinutes: totalMin, currentMinutes: curMin } : {}),
        ...(progressUnit === 'percent' ? { percentRead: pct } : {}),
        startDate,
        ...((progressUnit === 'audiobook' ? curMin > 0 : progressUnit === 'percent' ? pct > 0 : syncedPage > 0)
          ? { lastProgressDate: todayIso() }
          : {}),
        genre,
        format,
        coverUrl,
        isbn,
        publisher,
        publishedYear,
      });
      if (soundEnabled) playCelebrationChime();
      setTitle('');
      setAlternativeTitle(''); setLinkedOwnedId(''); setOwnIt(false);
      setAuthor('');
      setCurrentPage('');
      setPercentRead(0);
      setTotalHours(''); setTotalMins(''); setCurrentHours(''); setCurrentMins('');
      setDurationError('');
      setCoverUrl(undefined);
      setIsbn(undefined);
      setAutoFilledBadge(null);
      return;
    }

    const celebrationMessage = generateArchetypeCelebration({
      title: title.trim(),
      author: author.trim(),
      totalPages: safePages,
      elapsedDays,
      ppd: livePpd,
      archetypeId: liveArchetype.id,
      rating: snapToPrecision01(rating),
      review: review.trim(),
    });

    const newBook: BookEntry = {
      id: 'book-' + Date.now(),
      title: title.trim(),
      ...bookLink,
      author: author.trim(),
      totalPages: safePages,
      startDate,
      finishDate,
      elapsedDays,
      ppd: livePpd,
      archetypeId: liveArchetype.id,
      rating: snapToPrecision01(rating),
      review: review.trim(),
      genre,
      format,
      coverUrl,
      isbn,
      publisher,
      publishedYear,
      celebrationMessage,
      createdAt: Date.now(),
    };

    // Gamified visual celebration
    try {
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
        colors: [liveArchetype.accentHex, '#f59e0b', '#38bdf8', '#ffffff'],
      });
    } catch {
      // Ignore confetti error if any
    }

    if (soundEnabled) {
      playCelebrationChime();
    }

    onBookCreated(newBook);
  };

  const genresList = MASTER_GENRES;

  const getArchetypeIcon = () => {
    switch (liveArchetype.id) {
      case 'narrative-comet':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'speed-reader':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'momentum-builder':
        return <Rocket className="w-5 h-5 text-emerald-400" />;
      case 'steady-cruiser':
        return <Compass className="w-5 h-5 text-cyan-400" />;
      case 'cozy-lounge-reader':
        return <Armchair className="w-5 h-5 text-blue-400" />;
      case 'book-sommelier':
        return <Wine className="w-5 h-5 text-pink-400" />;
      case 'bedtime-taster':
        return <Moon className="w-5 h-5 text-violet-400" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-stone-300 mb-1.5">This book is…</legend>
        <div className="grid grid-cols-3 gap-2">
          {([['want', 'Want to read'], ['reading', 'Still reading'], ['finished', 'Finished']] as const).filter(([v]) => v !== 'want' || onWantToRead).map(([v, label]) => (
            <label key={v} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm cursor-pointer select-none transition-colors ${status === v ? 'border-amber-500/60 bg-amber-500/10 text-amber-200' : 'border-stone-800 text-stone-400 hover:text-stone-200'}`}>
              <input type="radio" name="book-status" value={v} checked={status === v} onChange={() => setStatus(v)} className="w-4 h-4 accent-amber-500" />
              {label}
            </label>
          ))}
        </div>
        <p className="text-[11px] text-stone-500">Switching keeps everything you've typed.</p>
      </fieldset>

      {/* Auto-Fill Banner Indicator with Cover Art and API Attribution */}
      {autoFilledBadge && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            {autoFilledBadge.coverUrl ? (
              <img
                src={autoFilledBadge.coverUrl}
                alt={autoFilledBadge.bookTitle}
                className="w-10 h-14 object-cover rounded shadow-md border border-stone-700 shrink-0"
              />
            ) : (
              <div className="w-10 h-14 bg-stone-800 rounded border border-stone-700 flex items-center justify-center shrink-0 text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-300">
                  Auto-Filled via {autoFilledBadge.source}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  Verified Library Metadata
                </span>
              </div>
              <p className="text-stone-300 font-mono text-xs">
                {autoFilledBadge.bookTitle} by {autoFilledBadge.author} ·{' '}
                {autoFilledBadge.isCustomPagesUsed ? (
                  <span className="text-amber-300 font-bold">
                    Custom {totalPages} pages (overriding standard {autoFilledBadge.standardPages} pages)
                  </span>
                ) : (
                  <span>{autoFilledBadge.standardPages} pages (standard edition)</span>
                )}{' '}
                · {autoFilledBadge.genre}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoFilledBadge(null)}
            className="text-stone-400 hover:text-stone-200 p-1"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Book Metadata Fields with Google Books & Open Library Dropdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Title / ISBN with Live Auto-Complete Dropdown */}
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
              <span className="whitespace-nowrap">Book Title or ISBN <span className="text-amber-500">*</span></span>
              {isSearchingApi && (
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
              )}
            </label>
            <span className="hidden lg:flex text-[10px] text-amber-400/90 font-mono items-center gap-1 whitespace-nowrap" title="Google Books &amp; Open Library">
              <Globe className="w-3 h-3" />
              Smart search
            </span>
          </div>

          <div className="relative">
            <input
              ref={titleInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onFocus={() => {
                if (title.trim().length >= 2 && combinedSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={handleTitleBlur}
              placeholder="e.g. Fourth Wing, Dune, or ISBN 9780593135204"
              className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
            />
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-amber-400 hover:bg-amber-500/10"
              title="Scan the barcode with your camera"
              aria-label="Scan book barcode"
            >
              <ScanBarcode className="w-4 h-4" />
            </button>
          </div>
          <BarcodeScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onDetected={(isbn) => {
              handleTitleChange(isbn);
              titleInputRef.current?.focus();
            }}
          />

          {/* Instant Auto-Complete Dropdown */}
          {showSuggestions && combinedSuggestions.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-stone-800 max-h-80 overflow-y-auto"
            >
              <div className="px-3 py-1.5 bg-stone-950 text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center justify-between sticky top-0 z-10 border-b border-stone-800">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3" />
                  Google Books & Open Library Results
                </span>
                <span>Click to Auto-Fill</span>
              </div>
              {combinedSuggestions.map((bk, i) => (
                <div
                  key={`${bk.title}-${bk.author}-${i}`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur before click
                    applyBookMetadata(bk, hasUserCustomizedPages);
                  }}
                  className="p-3 hover:bg-stone-800/90 cursor-pointer transition-colors flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {bk.coverUrl ? (
                      <img
                        src={bk.coverUrl}
                        alt={bk.title}
                        className="w-9 h-12 object-cover rounded shadow-sm border border-stone-700 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-12 bg-stone-800 rounded border border-stone-700 flex items-center justify-center shrink-0 text-stone-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-serif font-bold text-stone-100 truncate">
                        {bk.title}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5 truncate">
                        by {bk.author}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                        <span className="text-amber-400/90">{bk.totalPages} pages</span>
                        <span> · {bk.genre}</span>
                        {bk.publisher && <span> · {bk.publisher}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-400 shrink-0 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    Auto-Fill
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Author Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-300">Author</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Rebecca Yarros, Andy Weir"
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Progress Unit Selector for Still Reading */}
      {isReading && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-300">Track progress by</label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-stone-900 border border-stone-800 rounded-xl" role="group" aria-label="Track progress by">
            {([['pages', 'Pages'], ['percent', '% Percent'], ['audiobook', 'Hours & Mins']] as const).map(([u, label]) => (
              <button
                key={u}
                type="button"
                onClick={() => { setProgressUnit(u); setDurationError(''); }}
                className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  progressUnit === u
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    : 'text-stone-400 hover:text-stone-200 border border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pages & Dates (The Core Logic Formula Inputs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isReading && progressUnit === 'audiobook' ? (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-300">
              Total Length <span className="text-amber-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                max={500}
                aria-label="Total hours"
                value={totalHours}
                onChange={(e) => { setTotalHours(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0)); setDurationError(''); }}
                placeholder="11 hrs"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500/60"
              />
              <input
                type="number"
                min={0}
                max={59}
                aria-label="Total minutes"
                value={totalMins}
                onChange={(e) => { setTotalMins(e.target.value === '' ? '' : Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0))); setDurationError(''); }}
                placeholder="30 mins"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500/60"
              />
            </div>
            {durationError && <p role="alert" className="text-[11px] text-rose-400">{durationError}</p>}
          </div>
        ) : (
          /* Total Page Count (With Custom Override Enforcement) */
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-stone-300">
                Total Pages <span className="text-amber-500">*</span>
              </label>
              {hasUserCustomizedPages && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  User Custom Override
                </span>
              )}
            </div>
            <input
              type="number"
              required
              min={1}
              max={20000}
              value={totalPages}
              onChange={(e) => handlePageCountChange(e.target.value)}
              placeholder="512"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border text-stone-100 font-mono text-sm focus:outline-none transition-colors ${
                hasUserCustomizedPages
                  ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30'
                  : 'border-stone-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30'
              }`}
            />
            <div className="text-[11px] text-stone-500">
              {hasUserCustomizedPages
                ? 'Your exact input overrides standard edition pages.'
                : 'Auto-fills standard paperback/hardcover edition.'}
            </div>
          </div>
        )}

        {!isWant && <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            Start Date <span className="text-amber-500">*</span>
          </label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
          />
        </div>}

        {isWant ? null : isReading ? (
          progressUnit === 'audiobook' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Current Progress</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  max={500}
                  aria-label="Current hours"
                  value={currentHours}
                  onChange={(e) => setCurrentHours(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0 hrs"
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500/60"
                />
                <input
                  type="number"
                  min={0}
                  max={59}
                  aria-label="Current minutes"
                  value={currentMins}
                  onChange={(e) => setCurrentMins(e.target.value === '' ? '' : Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  placeholder="0 mins"
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>
          ) : progressUnit === 'percent' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Current Progress (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  aria-label="Current percent"
                  value={percentRead}
                  onChange={(e) => setPercentRead(e.target.value === '' ? '' : Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  placeholder="0"
                  className="w-20 px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500/60"
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  aria-label="Progress percentage slider"
                  value={Number(percentRead) || 0}
                  onChange={(e) => setPercentRead(parseInt(e.target.value, 10) || 0)}
                  className="flex-1 accent-amber-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Current Page</label>
              <input
                type="number"
                min={0}
                max={safePages}
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 font-mono text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
              />
            </div>
          )
        ) : (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            Finish Date <span className="text-amber-500">*</span>
          </label>
          <input
            type="date"
            required
            value={finishDate}
            onChange={(e) => setFinishDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
          />
        </div>
        )}
      </div>

      {/* Live 7-Tier Velocity Telemetry Bar */}
      {isFinished && <VelocityTelemetryBar
        ppd={livePpd}
        elapsedDays={elapsedDays}
        totalPages={safePages}
      />}

      {/* Rating Scale: 0.1 Precision */}
      {isFinished && (
        <RatingInput
          value={rating}
          onChange={setRating}
          label="Your Rating (Fine-Tuned 0.1 Precision)"
        />
      )}

      {/* Format & Genre row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-300">Reading Format</label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-stone-900 border border-stone-800 rounded-xl">
            {(['Physical', 'E-Reader', 'Audiobook', 'Hybrid'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => { setFormat(fmt); setProgressUnit(defaultUnitForFormat(fmt)); setDurationError(''); }}
                className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  format === fmt
                    ? 'bg-stone-800 text-stone-100 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-300">Primary Genre</label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 transition-colors"
          >
            {genresList.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Review / Opinion */}
      {isFinished && <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-stone-300">
            Review & Opinion (Short Review)
          </label>
          <span className="text-[11px] text-stone-500">Included in celebration & social card</span>
        </div>
        <textarea
          rows={3}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="What made this memorable? Plot twists, character arcs, prose style, or emotional resonance..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors leading-relaxed"
        />
      </div>}

      <div className="dark"><AlternativeTitleField value={alternativeTitle} onChange={setAlternativeTitle} /></div>
      {onOwn && <div className="dark space-y-3 text-foreground">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" aria-label="I own this book" checked={ownIt || !!ownedMatch || !!isOwned?.({ title, author, isbn, ...bookLink })} disabled={!!ownedMatch || !!isOwned?.({ title, author, isbn, ...bookLink })} onChange={(e) => setOwnIt(e.target.checked)} />
          I own this book <span className="text-muted-foreground text-xs">{ownedMatch ? `(${ownedMatch.title})` : '(adds it to My Library)'}</span>
        </label>
        {(ownIt || ownedMatch) && ownedBooks.length > 0 && <div className="space-y-2">
          <label className="block space-y-1 text-sm text-muted-foreground">
            <span>Link to a book in My Library</span>
            <input aria-label="Search My Library to link" value={ownedSearch} onChange={(e) => setOwnedSearch(e.target.value)} placeholder="Search your edition" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
          </label>
          <select aria-label="Link to a book in My Library" value={linkedOwnedId} onChange={(e) => setLinkedOwnedId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option value="">{ownedMatch ? `Automatic match: ${ownedMatch.title}` : 'Add as a new owned book'}</option>
            {ownedBooks.filter((b) => b.id === linkedOwnedId || !ownedSearch || [b.title, b.alternativeTitle, b.author].some((v) => v?.toLowerCase().includes(ownedSearch.toLowerCase()))).sort((a, b) => a.title.localeCompare(b.title)).map((b) => <option key={b.id} value={b.id}>{b.title} — {b.author}</option>)}
          </select>
        </div>}
      </div>}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer"
      >
        <Sparkles className="w-5 h-5" />
        {isWant ? 'Save to Want to read' : isReading ? 'Start Tracking This Book' : 'Complete Book & Generate Archetype Card'}
      </button>
    </form>
  );
};
