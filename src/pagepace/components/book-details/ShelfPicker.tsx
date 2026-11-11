import React, { useState } from 'react';
import { Library, Plus } from 'lucide-react';
import { DEFAULT_SHELVES } from '../../utils/libraryFilters';

export const ShelfPicker: React.FC<{ value: string[]; onChange: (v: string[]) => void }> = ({ value, onChange }) => {
  const [custom, setCustom] = useState('');
  const all = Array.from(new Set([...DEFAULT_SHELVES, ...value]));
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  const addCustom = () => {
    const s = custom.trim();
    if (s && !value.includes(s)) onChange([...value, s]);
    setCustom('');
  };
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
        <Library className="w-3.5 h-3.5 text-sky-400" />
        Shelves
      </label>
      <div className="flex flex-wrap gap-1.5">
        {all.map((s) => {
          const on = value.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              aria-pressed={on}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                on ? 'bg-sky-500/20 text-sky-200 border-sky-500/50' : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              {on ? '✓ ' : ''}
              {s}
            </button>
          );
        })}
        <div className="flex items-center gap-1">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="New shelf"
            className="w-28 px-2.5 py-1 rounded-full bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-sky-500/60"
          />
          <button type="button" onClick={addCustom} className="p-1 rounded-full text-sky-300 hover:bg-sky-500/10" aria-label="Add shelf">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
