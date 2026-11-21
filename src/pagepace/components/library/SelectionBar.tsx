import React from 'react';
import { Trash2 } from 'lucide-react';

export const BULK_FORMATS = [['Physical', '📖'], ['E-Reader', '📱'], ['Audiobook', '🎧'], ['Hybrid', '🔀']] as const;

export const SelectionBar: React.FC<{ count: number; onCancel: () => void; onDelete: () => void; onSetFormat?: (f: (typeof BULK_FORMATS)[number][0]) => void }> = ({
  count,
  onCancel,
  onDelete,
  onSetFormat,
}) => (
  <div className="sticky top-20 z-30 mx-auto max-w-xl w-full p-3 rounded-2xl bg-stone-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
        {count}
      </span>
      <span className="text-xs text-stone-200 font-medium">{count === 1 ? 'book' : 'books'} selected</span>
    </div>
    <div className="flex items-center gap-2">
      <button type="button" onClick={onCancel} className="px-2.5 py-1.5 rounded-lg text-xs text-stone-400 hover:text-stone-200 hover:bg-stone-800">
        Cancel
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-stone-100 font-bold text-xs flex items-center gap-1.5 active:scale-95"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete Selected ({count})</span>
      </button>
    </div>
    {onSetFormat && (
      <div className="w-full flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-stone-400">Set format:</span>
        {BULK_FORMATS.map(([f, icon]) => (
          <button key={f} type="button" onClick={() => onSetFormat(f)} className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700">
            {icon} {f}
          </button>
        ))}
      </div>
    )}
  </div>
);
