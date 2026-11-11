import React from 'react';

export const CsvProgress: React.FC<{
  stage: 'parsing' | 'enriching' | null;
  current: number;
  total: number;
  title: string;
}> = ({ stage, current, total, title }) => {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
      <div className="flex items-center justify-between text-xs text-amber-300 font-mono">
        <span>
          {stage === 'enriching' ? `Looking up genres (${current} / ${total})...` : `Importing row ${current} of ${total}...`}
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
      {title && (
        <div className="text-[11px] text-stone-400 truncate">
          Checking: <em className="text-stone-200">{title}</em>
        </div>
      )}
      <div className="h-2 w-full bg-stone-900 rounded-full overflow-hidden">
        <div className="h-full bg-amber-500 transition-all duration-150" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
