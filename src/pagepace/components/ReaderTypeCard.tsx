import React from 'react';
import type { BookEntry } from '../types/book';
import { ARCHETYPE_ORDER, collectedArchetypes, currentReaderType } from '../utils/archetypeProgress';

interface Props { books: BookEntry[]; today: string; onOpenCollection: () => void }

export const ReaderTypeCard: React.FC<Props> = ({ books, today, onOpenCollection }) => {
  const type = currentReaderType(books, today);
  const collected = collectedArchetypes(books).size;
  const total = ARCHETYPE_ORDER.length;
  return (
    <button type="button" onClick={onOpenCollection}
      className="w-full text-left p-4 sm:p-5 rounded-2xl bg-stone-900/60 border border-stone-800 hover:border-stone-700 transition-colors space-y-3"
      style={type ? { borderColor: type.archetype.accentHex + '55' } : undefined}>
      <div className="flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-wider text-stone-400">
        <span>Your reader type</span>
        <span>{collected}/{total} collected</span>
      </div>
      {type ? (
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden>{type.archetype.badgeEmoji}</span>
          <div className="min-w-0">
            <p className="font-serif text-lg font-bold" style={{ color: type.archetype.accentHex }}>{type.archetype.name}</p>
            <p className="text-xs text-stone-300 italic">“{type.archetype.tagline}”</p>
            <p className="text-[11px] text-stone-500 mt-0.5">{type.ppd} pages/day · {type.recent ? 'last 3 months' : 'all your books'}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-stone-300">Finish your first book to discover your reader type.</p>
      )}
      <div className="h-1.5 rounded-full bg-stone-800 overflow-hidden">
        <div className="h-full bg-amber-400" style={{ width: `${(collected / total) * 100}%` }} />
      </div>
    </button>
  );
};
