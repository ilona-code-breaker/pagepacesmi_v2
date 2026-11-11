import React from 'react';
import { BookOpen } from 'lucide-react';
import { LibraryFilterState } from '../../utils/libraryFilters';

export const EmptyLibrary: React.FC<{
  filters: LibraryFilterState;
  onResetFilters: () => void;
  onAddBookClick: () => void;
}> = ({ filters, onResetFilters, onAddBookClick }) => {
  const filtered =
    !!filters.search || filters.genre !== 'all' || filters.archetype !== 'all' || filters.shelf !== 'all';
  return (
    <div className="p-12 text-center rounded-2xl bg-stone-900/40 border border-stone-800 space-y-4">
      <BookOpen className="w-10 h-10 text-stone-600 mx-auto" />
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-stone-200">
          {filters.search ? `No books matching "${filters.search}"` : filtered ? 'No books match these filters' : 'No books yet'}
        </h3>
        <p className="text-xs sm:text-sm text-stone-400 max-w-sm mx-auto">
          {filtered ? 'Try a broader search or clear the filters.' : 'Track your first completed book to get started.'}
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
        {filtered && (
          <button type="button" onClick={onResetFilters} className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs">
            Reset All Filters
          </button>
        )}
        <button type="button" onClick={onAddBookClick} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs">
          Track a New Book
        </button>
      </div>
    </div>
  );
};
