import React, { useState } from 'react';
import { Plus, Quote, Trash2 } from 'lucide-react';

export const QuotesEditor: React.FC<{ value: string[]; onChange: (v: string[]) => void }> = ({ value, onChange }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const q = draft.trim();
    if (q) onChange([...value, q]);
    setDraft('');
  };
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
        <Quote className="w-3.5 h-3.5 text-amber-400" />
        Favourite Quotes
      </label>
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((q, i) => (
            <li key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-stone-950 border border-stone-800">
              <span className="flex-1 text-xs font-serif italic text-stone-200">“{q}”</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="p-0.5 text-stone-500 hover:text-rose-400"
                aria-label="Remove quote"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-start gap-2">
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste a line you loved..."
          className="flex-1 px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm placeholder-stone-600 focus:outline-none focus:border-amber-500/60"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="px-3 py-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
    </div>
  );
};
