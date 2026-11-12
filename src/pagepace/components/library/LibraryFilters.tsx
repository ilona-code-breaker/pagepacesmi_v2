import React from 'react';
import { ArrowUpDown, CheckSquare, Filter, Library, Search, Square, Tag, X } from 'lucide-react';
import { ARCHETYPES } from '../../constants/archetypes';
import { GENRE_METADATA, MASTER_GENRES, MasterGenre } from '../../utils/genreMapper';
import { LibraryFilterState, SORT_OPTIONS, SortKey } from '../../utils/libraryFilters';

interface LibraryFiltersProps {
  filters: LibraryFilterState;
  onChange: (patch: Partial<LibraryFilterState>) => void;
  libraryGenres: [string, number][];
  shelves: [string, number][];
  visibleCount: number;
  selectedCount: number;
  onSelectAllToggle: () => void;
}

const selectCls =
  'w-full min-w-0 sm:w-auto px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 text-xs focus:outline-none focus:border-amber-500/50';

export const LibraryFilters: React.FC<LibraryFiltersProps> = ({
  filters,
  onChange,
  libraryGenres,
  shelves,
  visibleCount,
  selectedCount,
  onSelectAllToggle,
}) => {
  const allSelected = selectedCount === visibleCount && visibleCount > 0;

  return (
    <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-800 space-y-3">
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search books, authors, notes..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:flex-wrap">
          <label className="flex flex-col items-start gap-1 min-w-0 sm:flex-row sm:items-center sm:gap-1.5 text-xs text-stone-500"><span className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3 h-3" />
            Sort:</span>
            <select value={filters.sortBy} onChange={(e) => onChange({ sortBy: e.target.value as SortKey })} className={selectCls}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col items-start gap-1 min-w-0 sm:flex-row sm:items-center sm:gap-1.5 text-xs text-stone-500"><span className="flex items-center gap-1.5">
            <Library className="w-3 h-3" />
            Shelf:</span>
            <select value={filters.shelf} onChange={(e) => onChange({ shelf: e.target.value })} className={selectCls}>
              <option value="all">All shelves</option>
              {shelves.map(([s, n]) => (
                <option key={s} value={s}>
                  {s} ({n})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col items-start gap-1 min-w-0 sm:flex-row sm:items-center sm:gap-1.5 text-xs text-stone-500"><span className="flex items-center gap-1.5">
            <Tag className="w-3 h-3" />
            Genre:</span>
            <select value={filters.genre} onChange={(e) => onChange({ genre: e.target.value })} className={selectCls}>
              <option value="all">All genres</option>
              {libraryGenres.length > 0 && (
                <optgroup label="In your library">
                  {libraryGenres.map(([g, count]) => (
                    <option key={g} value={g}>
                      {g} ({count})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Standard categories">
                {MASTER_GENRES.map((mg) => (
                  <option key={mg} value={mg}>
                    {mg}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <label className="flex flex-col items-start gap-1 min-w-0 sm:flex-row sm:items-center sm:gap-1.5 text-xs text-stone-500"><span className="flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            Archetype:</span>
            <select value={filters.archetype} onChange={(e) => onChange({ archetype: e.target.value as any })} className={selectCls}>
              <option value="all">All archetypes</option>
              {Object.values(ARCHETYPES).map((arch) => (
                <option key={arch.id} value={arch.id}>
                  {arch.name} ({arch.ppdRange} PPD)
                </option>
              ))}
            </select>
          </label>

          {visibleCount > 0 && (
            <button
              type="button"
              onClick={onSelectAllToggle}
              className={`col-span-2 justify-center sm:justify-start px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                selectedCount > 0
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-amber-400" /> : <Square className="w-3.5 h-3.5 text-stone-500" />}
              <span>{allSelected ? 'Deselect All' : `Select All (${visibleCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick shelf pills */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-stone-800/40 text-xs custom-scrollbar pb-0.5">
        <span className="text-[11px] text-stone-500 uppercase font-mono tracking-wider mr-1 shrink-0 flex items-center gap-1">
          <Library className="w-3 h-3" />
          Shelves:
        </span>
        {shelves.map(([s, n]) => {
          const active = filters.shelf === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ shelf: active ? 'all' : s })}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                active
                  ? 'bg-sky-500/20 text-sky-200 border-sky-500/50 ring-1 ring-sky-400'
                  : 'bg-stone-950/70 text-stone-400 hover:text-stone-200 border-stone-800/80'
              }`}
            >
              <span>{s}</span>
              <span className="text-[10px] font-mono text-stone-500">({n})</span>
            </button>
          );
        })}
      </div>

      {/* Quick genre pills */}
      {libraryGenres.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs custom-scrollbar pb-0.5">
          <span className="text-[11px] text-stone-500 uppercase font-mono tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Genres:
          </span>
          {libraryGenres.map(([g, count]) => {
            const active = filters.genre === g;
            const meta = GENRE_METADATA[g as MasterGenre] || GENRE_METADATA['Unassigned'];
            return (
              <button
                key={g}
                type="button"
                onClick={() => onChange({ genre: active ? 'all' : g })}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  active
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-400 font-semibold'
                    : 'bg-stone-950/70 text-stone-400 hover:text-stone-200 border-stone-800/80'
                }`}
              >
                {meta?.emoji && <span className="text-[11px]">{meta.emoji}</span>}
                <span>{g}</span>
                <span className="text-[10px] font-mono text-stone-500">({count})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
