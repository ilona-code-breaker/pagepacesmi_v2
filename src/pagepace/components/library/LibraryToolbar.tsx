import React from 'react';
import { BookOpen, ChevronDown, ChevronUp, PieChart as PieChartIcon, Share2, Trash2 } from 'lucide-react';
import { BookEntry, MonthlyGoal } from '../../types/book';
import { DataPortabilityToolbar } from '../DataPortabilityToolbar';

interface LibraryToolbarProps {
  books: BookEntry[];
  goals: Record<string, MonthlyGoal>;
  showGenreChart: boolean;
  onToggleGenreChart: () => void;
  onDataImported?: (data: { books: BookEntry[]; goals: Record<string, MonthlyGoal> }) => void;
  onOpenShareCard?: () => void;
  onClearLibraryClick: () => void;
}

export const LibraryToolbar: React.FC<LibraryToolbarProps> = ({
  books,
  goals,
  showGenreChart,
  onToggleGenreChart,
  onDataImported,
  onOpenShareCard,
  onClearLibraryClick,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-stone-900/60 border border-stone-800 backdrop-blur-sm">
    <div className="flex items-center gap-2 text-xs text-stone-400 flex-wrap">
      <span className="font-mono uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
        <BookOpen className="w-4 h-4 text-amber-400" />
        Library:
      </span>
      <span className="font-mono text-stone-200 font-bold">{books.length} Books</span>
      <button
        type="button"
        onClick={onToggleGenreChart}
        className="ml-2 px-2.5 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-800 text-stone-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
      >
        <PieChartIcon className="w-3.5 h-3.5 text-pink-400" />
        <span>{showGenreChart ? 'Hide Genre Chart' : 'Show Genre Chart'}</span>
        {showGenreChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
    </div>

    <div className="flex items-center gap-2 flex-wrap">
      {onDataImported && <DataPortabilityToolbar books={books} goals={goals} onDataImported={onDataImported} />}
      {onOpenShareCard && (
        <button
          type="button"
          onClick={onOpenShareCard}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Share Archetype Card</span>
        </button>
      )}
      {books.length > 0 && (
        <button
          type="button"
          onClick={onClearLibraryClick}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Clear Library</span>
        </button>
      )}
    </div>
  </div>
);
