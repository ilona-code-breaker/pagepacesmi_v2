import React from 'react';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  label: string;
  progress: number;
  onUndo: () => void;
  onDismiss: () => void;
  onHoverChange: (hovered: boolean) => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ label, progress, onUndo, onDismiss, onHoverChange }) => (
  <div
    onMouseEnter={() => onHoverChange(true)}
    onMouseLeave={() => onHoverChange(false)}
    className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-[calc(100%-3rem)] sm:w-auto p-4 rounded-2xl bg-stone-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-md flex flex-col gap-2.5"
    role="alert"
    aria-live="assertive"
  >
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 shrink-0">
          <RotateCcw className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-stone-200 truncate">{label}</p>
          <p className="text-[10px] text-stone-400">Click Undo within 10s to restore</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onUndo}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>
        <button type="button" onClick={onDismiss} className="p-1 rounded-lg text-stone-500 hover:text-stone-300" aria-label="Dismiss notification">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
    <div className="w-full bg-stone-800/80 rounded-full h-1 overflow-hidden">
      <div className="bg-amber-400 h-1 transition-all duration-100 ease-linear rounded-full" style={{ width: `${progress}%` }} />
    </div>
  </div>
);
