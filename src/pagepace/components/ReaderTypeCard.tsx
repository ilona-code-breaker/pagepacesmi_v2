import React from 'react';
import type { BookEntry } from '../types/book';
import { ARCHETYPES } from '../constants/archetypes';
import { ARCHETYPE_ORDER, collectedArchetypes, currentReaderType, unlockHint } from '../utils/archetypeProgress';

interface Props { books: BookEntry[]; today: string; onOpenCollection?: () => void }

/** Reader type badges, styled like the Reading and Library badge guides. */
export const ReaderTypeCard: React.FC<Props> = ({ books, today }) => {
  const type = currentReaderType(books, today);
  const collected = collectedArchetypes(books);
  return (
    <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-serif font-bold text-stone-100">Reader type badges</span>
        <span className="font-mono text-amber-400">{collected.size} / {ARCHETYPE_ORDER.length} earned</span>
      </div>
      <p className="text-xs text-stone-400">
        Earned by finishing a book at each reading pace.
        {type && <> Your current type: <span style={{ color: type.archetype.accentHex }}>{type.archetype.badgeEmoji} {type.archetype.name}</span> · {type.ppd} pages/day.</>}
      </p>
      <details className="group rounded-xl border border-stone-800 bg-stone-950/30 p-3 space-y-2">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <div><div className="text-xs font-mono uppercase tracking-wider text-stone-300">Reading paces</div><p className="text-xs text-stone-400">One badge for each of the 7 reader types.</p></div>
          <span className="flex shrink-0 items-center gap-2 text-xs font-mono text-amber-400">{collected.size}/{ARCHETYPE_ORDER.length}<span className="transition-transform group-open:rotate-180">▾</span></span>
        </summary>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {ARCHETYPE_ORDER.map((id) => { const a = ARCHETYPES[id]; const n = collected.get(id) ?? 0; const got = n > 0; return (
            <div key={id} className={`p-2.5 rounded-xl border border-stone-800 bg-stone-950/60 ${got ? '' : 'opacity-50 grayscale'}`}>
              <div className="text-sm font-bold text-stone-200">{got ? a.badgeEmoji : '🔒'} {a.name}</div>
              <div className="text-[11px] text-stone-400">{got ? `${n} ${n === 1 ? 'book' : 'books'} · ${a.ppdRange}` : unlockHint(a)}</div>
            </div>); })}
        </div>
      </details>
    </div>
  );
};
