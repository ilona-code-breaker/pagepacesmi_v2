import React from 'react';
import { ARCHETYPES } from '../../constants/archetypes';
import { CsvAnalysisResult } from '../../utils/csvParser';

export const CsvPreview: React.FC<{ rows: CsvAnalysisResult['validRows'] }> = ({ rows }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-xs text-stone-400">
      <span className="font-mono uppercase tracking-wider font-semibold">Preview ({rows.length} records)</span>
      <span>Showing first 4</span>
    </div>
    <div className="divide-y divide-stone-800 rounded-xl border border-stone-800 bg-stone-950 overflow-hidden text-xs">
      {rows.slice(0, 4).map((r, i) => {
        const arch = ARCHETYPES[r.archetypeId] || ARCHETYPES['steady-cruiser'];
        return (
          <div key={i} className="p-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-serif font-bold text-stone-200 truncate">{r.title}</div>
              <div className="text-[11px] text-stone-400 mt-0.5 truncate">
                by {r.author} · {r.totalPages} pages {r.hasAutoFilledPages && '(auto-filled)'} · Finished {r.finishDate}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-amber-400 font-semibold">{r.ppd.toFixed(1)} PPD</div>
              <div className="text-[10px] text-stone-400">
                {arch.shortName} · ★ {r.rating.toFixed(1)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
