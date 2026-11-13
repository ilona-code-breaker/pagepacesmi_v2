import React from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { MergeStrategy } from '../../hooks/useCsvImport';

interface Props {
  value: MergeStrategy;
  onChange: (s: MergeStrategy) => void;
  newCount: number;
  duplicateCount: number;
  totalCount: number;
}

export const CsvMergePanel: React.FC<Props> = ({ value, onChange, newCount, duplicateCount, totalCount }) => {
  const options: { id: MergeStrategy; title: string; text: string; danger?: boolean }[] = [
    { id: 'merge_skip', title: 'Merge (Skip Duplicates)', text: `Adds only ${newCount} new books. Leaves your existing books unchanged.` },
    { id: 'merge_update', title: 'Merge & Update', text: 'Adds new books and updates matching ones. Your shelves, notes and quotes are kept.' },
    { id: 'replace', title: 'Replace Entire Archive', text: `Replaces current archive with all ${totalCount} books from this CSV.`, danger: true },
  ];
  return (
    <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-stone-300 font-semibold flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          Library Merging & Duplicates
        </span>
        <span className="text-xs font-mono">
          {duplicateCount > 0 ? (
            <strong className="text-amber-400">{duplicateCount} duplicate(s) detected</strong>
          ) : (
            <span className="text-emerald-400">0 duplicates found</span>
          )}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              type="button"
              key={o.id}
              onClick={() => onChange(o.id)}
              className={`p-3 rounded-xl border text-xs text-left transition-colors space-y-1 ${
                active
                  ? o.danger
                    ? 'bg-rose-500/10 border-rose-500/50 text-stone-100'
                    : 'bg-amber-500/10 border-amber-500/50 text-stone-100'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
              }`}
            >
              <div className={`font-bold flex items-center justify-between ${o.danger ? 'text-rose-300' : ''}`}>
                <span>{o.title}</span>
                {active && <CheckCircle2 className={`w-3.5 h-3.5 ${o.danger ? 'text-rose-400' : 'text-amber-400'}`} />}
              </div>
              <p className="text-[11px] text-stone-400 leading-normal">{o.text}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
