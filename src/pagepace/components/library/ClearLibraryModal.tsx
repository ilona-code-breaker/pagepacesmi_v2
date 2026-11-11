import React from 'react';
import { Trash2 } from 'lucide-react';

export const ClearLibraryModal: React.FC<{ count: number; onCancel: () => void; onConfirm: () => void }> = ({
  count,
  onCancel,
  onConfirm,
}) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
    <div className="max-w-md w-full p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
      <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
        <Trash2 className="w-6 h-6" />
      </div>
      <div className="text-center space-y-1.5">
        <h3 className="text-lg font-serif font-bold text-stone-100">Clear Entire Reading Archive?</h3>
        <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
          This will remove all <span className="text-amber-400 font-mono font-bold">{count}</span> books from your library.
          You can immediately undo this action.
        </p>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs sm:text-sm">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-stone-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All ({count})</span>
        </button>
      </div>
    </div>
  </div>
);
