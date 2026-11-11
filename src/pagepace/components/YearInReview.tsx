import React, { useMemo, useState } from 'react';
import { BookOpen, Calendar, Gauge, Loader2, Share2, Star, Trophy, User } from 'lucide-react';
import { BookEntry } from '../types/book';
import { ARCHETYPES } from '../constants/archetypes';
import { buildYearInReview, computeStreaks, yearsWithBooks } from '../utils/readingStats';
import { renderYearReviewImage, shareOrDownload } from '../utils/yearReviewCard';
import { StreakWidget } from './StreakWidget';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const YearInReview: React.FC<{ books: BookEntry[]; onSelectBook: (b: BookEntry) => void }> = ({ books, onSelectBook }) => {
  const years = useMemo(() => {
    const ys = yearsWithBooks(books);
    const now = new Date().getFullYear();
    return ys.includes(now) ? ys : [now, ...ys];
  }, [books]);
  const [year, setYear] = useState(years[0]);
  const review = useMemo(() => buildYearInReview(books, year), [books, year]);
  const streak = useMemo(() => computeStreaks(books), [books]);
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const [month, setMonth] = useState<number | null>(null);
  const monthBooks = month === null ? [] : review.books.filter((b) => parseInt(b.finishDate.slice(5, 7), 10) === month + 1);
  const maxMonth = Math.max(1, ...review.booksPerMonth);
  const arch = review.topArchetype ? ARCHETYPES[review.topArchetype.id] : null;

  const handleShare = async () => {
    setSharing(true);
    setShareNote('');
    try {
      const blob = await renderYearReviewImage(review, streak);
      const res = await shareOrDownload(
        blob,
        `pagepace-${year}-year-in-review.png`,
        `My ${year} in books: ${review.bookCount} books, ${review.pageCount.toLocaleString()} pages 📚`
      );
      if (res === 'downloaded') setShareNote('Image saved — post it anywhere!');
    } finally {
      setSharing(false);
    }
  };

  const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
      <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 mt-1">{value}</div>
    </div>
  );

  const Highlight = ({ label, book, detail }: { label: string; book: BookEntry | null; detail: string }) =>
    book ? (
      <button
        type="button"
        onClick={() => onSelectBook(book)}
        className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-amber-500/40 text-left flex items-center gap-3 transition-colors"
      >
        {book.coverUrl ? (
          <img src={book.coverUrl} alt="" className="w-10 h-14 object-cover rounded-md border border-stone-800" />
        ) : (
          <div className="w-10 h-14 rounded-md bg-stone-950 border border-stone-800 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-stone-600" />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">{label}</div>
          <div className="text-sm font-serif font-bold text-stone-100 truncate">{book.title}</div>
          <div className="text-[11px] text-stone-400">{detail}</div>
        </div>
      </button>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">Your Year in Review</h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">Streaks, highlights and a shareable image of your reading year.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-sm font-mono focus:outline-none focus:border-amber-500/50"
            aria-label="Choose year"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing || review.bookCount === 0}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center gap-1.5 disabled:opacity-40"
          >
            {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Share my year
          </button>
        </div>
      </div>
      {shareNote && <p className="text-xs text-emerald-300">{shareNote}</p>}

      <StreakWidget books={books} />

      {review.bookCount === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-stone-900/40 border border-stone-800 text-stone-400 text-sm">
          No finished books in {year} yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={<BookOpen className="w-3 h-3" />} label="Books" value={String(review.bookCount)} />
            <Stat icon={<Calendar className="w-3 h-3" />} label="Pages" value={review.pageCount.toLocaleString()} />
            <Stat icon={<Star className="w-3 h-3" />} label="Avg rating" value={review.averageRating ? review.averageRating.toFixed(1) : '–'} />
            <Stat icon={<Gauge className="w-3 h-3" />} label="Avg pace" value={`${review.averagePpd.toFixed(0)} PPD`} />
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500">Books per month</div>
            <div className="flex items-end gap-1.5 sm:gap-3 h-36">
              {review.booksPerMonth.map((n, i) => (
                <button
                  type="button"
                  key={i}
                  disabled={!n}
                  onClick={() => setMonth(month === i ? null : i)}
                  className={`flex-1 flex flex-col items-center gap-1.5 h-full justify-end ${n ? 'cursor-pointer' : 'cursor-default'} ${month === i ? 'opacity-100' : month !== null ? 'opacity-50' : ''}`}
                >
                  <span className="text-[10px] font-mono text-stone-400">{n || ''}</span>
                  <div
                    className={`w-full rounded-md ${n ? 'bg-amber-500' : 'bg-stone-800'}`}
                    style={{ height: `${Math.max(4, (n / maxMonth) * 100)}%` }}
                  />
                  <span className={`text-[10px] font-mono ${month === i ? 'text-amber-400' : 'text-stone-500'}`}>{MONTHS[i]}</span>
                </button>
              ))}
            </div>
            {month !== null && (
              <div className="pt-3 border-t border-stone-800 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                  {MONTHS[month]} {year} · {monthBooks.length} {monthBooks.length === 1 ? 'book' : 'books'}
                </div>
                {monthBooks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelectBook(b)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-stone-800/60 text-left transition-colors"
                  >
                    {b.coverUrl ? (
                      <img src={b.coverUrl} alt="" className="w-8 h-11 object-cover rounded border border-stone-800" />
                    ) : (
                      <div className="w-8 h-11 rounded bg-stone-950 border border-stone-800 flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5 text-stone-600" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-serif font-bold text-stone-100 truncate">{b.title}</div>
                      <div className="text-[11px] text-stone-400 truncate">{b.author} · {b.totalPages} pages</div>
                    </div>
                    {b.rating > 0 && <span className="text-[11px] font-mono text-amber-400">★ {b.rating.toFixed(1)}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Highlight label="Highest rated" book={review.highestRated} detail={`★ ${review.highestRated?.rating.toFixed(1)}`} />
            <Highlight label="Fastest read" book={review.fastest} detail={`${review.fastest?.ppd.toFixed(0)} pages per day`} />
            <Highlight label="Longest book" book={review.longest} detail={`${review.longest?.totalPages} pages`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500">Top genre</div>
              <div className="font-serif font-bold text-stone-100 mt-1">
                {review.topGenre ? `${review.topGenre.name} (${review.topGenre.count})` : '–'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <User className="w-3 h-3" /> Most-read author
              </div>
              <div className="font-serif font-bold text-stone-100 mt-1">
                {review.topAuthor ? `${review.topAuthor.name} (${review.topAuthor.count})` : '–'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Your archetype
              </div>
              <div className="font-serif font-bold text-stone-100 mt-1">{arch ? `${arch.badgeEmoji} ${arch.name}` : '–'}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
