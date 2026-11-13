import React from 'react';
import { BookOpen, Check, Edit3, Quote, StickyNote, Trash2 } from 'lucide-react';
import { BookEntry } from '../../types/book';
import { ARCHETYPES } from '../../constants/archetypes';
import { GenreBadge } from '../GenreBadge';
import { ArchetypeIcon } from './ArchetypeIcon';
import { Highlight } from './Highlight';

interface BookCardProps {
  book: BookEntry;
  search: string;
  isSelected: boolean;
  onOpen: () => void;
  onToggleSelect: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onGenreChange?: (genre: string) => void;
  onShelfClick?: (shelf: string) => void;
  owned?: boolean;
  onToggleOwned?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  search,
  isSelected,
  onOpen,
  onToggleSelect,
  onEdit,
  onDelete,
  onGenreChange,
  onShelfClick,
  owned,
  onToggleOwned,
}) => {
  const arch = ARCHETYPES[book.archetypeId] || ARCHETYPES['steady-cruiser'];
  const firstQuote = book.quotes?.find((q) => q.trim());

  return (
    <div
      onClick={onOpen}
      className={`group p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative shadow-md ${
        isSelected
          ? 'bg-stone-900 border-amber-500/60 ring-2 ring-amber-500/40 shadow-xl'
          : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
      }`}
    >
      <div className="flex items-center justify-between text-xs text-stone-400">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onToggleSelect}
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
              isSelected
                ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-400 font-bold shadow-sm'
                : 'bg-stone-950/80 border border-stone-700 text-transparent hover:border-amber-400 hover:text-stone-400'
            }`}
            aria-label={isSelected ? 'Deselect book' : 'Select book'}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
          <span className="font-semibold text-stone-300 flex items-center gap-1.5">
            <ArchetypeIcon id={book.archetypeId} />
            {arch.shortName}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">{book.ppd.toFixed(1)} PPD</span>
          <span aria-hidden="true">·</span>
          <GenreBadge currentGenre={book.genre || 'Unassigned'} onGenreChange={(g) => onGenreChange?.(g)} />
        </div>
        <div className="flex items-center gap-1.5 text-stone-400 shrink-0">
          <span className="font-mono text-amber-400 font-bold">★ {book.rating.toFixed(1)}</span>
          <span className="text-[10px] text-stone-500">/ 5.0</span>
        </div>
      </div>

      <div className="flex items-start gap-3.5">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            loading="lazy"
            className="w-12 h-16 object-cover rounded-lg shadow-md border border-stone-800 shrink-0 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-12 h-16 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-stone-600" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-base sm:text-lg font-serif font-bold text-stone-100 group-hover:text-amber-300 transition-colors line-clamp-1">
            <Highlight text={book.title} query={search} />
            {book.rereadDates?.length ? <span className="ml-1.5 align-middle text-[10px] font-mono text-amber-300 border border-amber-500/30 rounded px-1">×{book.rereadDates.length + 1}</span> : null}
          </h4>
          {book.author && (
            <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
              by <Highlight text={book.author} query={search} />
            </p>
          )}
          <p className="text-xs font-serif italic text-stone-400 line-clamp-1 mt-1">“{arch.tagline}”</p>
        </div>
      </div>

      {book.shelves && book.shelves.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {book.shelves.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShelfClick?.(s);
              }}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {book.review && (
        <p className="text-xs text-stone-300 italic line-clamp-2 pl-2 border-l-2 border-stone-800">"{book.review}"</p>
      )}

      {firstQuote && (
        <p className="text-xs text-amber-200/90 font-serif italic line-clamp-2 pl-2 border-l-2 border-amber-500/40 flex gap-1.5">
          <Quote className="w-3 h-3 shrink-0 mt-0.5 text-amber-400" />
          <span>{firstQuote}</span>
        </p>
      )}

      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500">
        <span className="flex items-center gap-2">
          <span>
            {book.totalPages} pages · {book.elapsedDays} {book.elapsedDays === 1 ? 'day' : 'days'}
          </span>
          {(book.notes?.trim() || (book.quotes && book.quotes.length > 0)) && (
            <span className="flex items-center gap-1 text-stone-400" title="Has notes or quotes">
              <StickyNote className="w-3 h-3" />
              {book.quotes?.length ? `${book.quotes.length} quote${book.quotes.length === 1 ? '' : 's'}` : 'notes'}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 text-xs font-medium transition-colors flex items-center gap-1"
            title="Edit details, shelves, notes and quotes"
          >
            <Edit3 className="w-3 h-3 text-amber-400" />
            <span>Edit</span>
          </button>
          {onToggleOwned && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleOwned(); }}
              aria-pressed={owned}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${owned ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}
              title={owned ? 'You own this book — tap to remove from My Library' : 'Mark as owned (adds to My Library)'}
            >
              {owned ? '✓ Owned' : 'I own this'}
            </button>
          )}
          <span className="text-amber-400 group-hover:underline font-medium">Certificate →</span>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded-lg text-stone-600 hover:text-rose-400 transition-colors"
            title="Delete book (undo available)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
