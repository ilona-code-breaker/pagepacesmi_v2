import React from 'react';
import { Clock, Filter, Layers, Sliders, Sparkles } from 'lucide-react';
import { CsvAnalysisResult, CsvParseOptions } from '../../utils/csvParser';

interface Props {
  options: CsvParseOptions;
  analysis: CsvAnalysisResult;
  onChange: (patch: Partial<CsvParseOptions>) => void;
  autoEnrich: boolean;
  onToggleAutoEnrich: () => void;
}

const pill = (active: boolean) =>
  `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
    active ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-900 text-stone-400 hover:text-stone-200'
  }`;

export const CsvOptionsPanel: React.FC<Props> = ({ options, analysis, onChange, autoEnrich, onToggleAutoEnrich }) => (
  <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-4">
    <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
      <Sliders className="w-3.5 h-3.5" />
      Velocity & Reading Calculation Assumptions
    </span>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      <div className="space-y-1.5">
        <label className="text-stone-300 font-medium flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          When Start Date is Missing in CSV:
        </label>
        <select
          value={options.startDateStrategy}
          onChange={(e) => onChange({ startDateStrategy: e.target.value as any })}
          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-500/50"
        >
          <option value="infer_date_added">Infer duration from "Date Added" (if earlier)</option>
          <option value="same_day">Assume 1-day read (Finish Date = Start Date)</option>
          <option value="estimate_pace">Estimate duration by page count (~50 PPD)</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-stone-300 font-medium flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-stone-400" />
          Fallback Pages (When blank in CSV):
        </label>
        <input
          type="number"
          min={50}
          max={2000}
          value={options.defaultPageCountFallback}
          onChange={(e) => onChange({ defaultPageCountFallback: Math.max(10, parseInt(e.target.value, 10) || 350) })}
          className="w-24 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs font-mono focus:outline-none focus:border-amber-500/50"
        />
        <span className="text-[11px] text-stone-500 block">
          {analysis.missingPagesCount > 0
            ? `${analysis.missingPagesCount} books lacked page counts in CSV.`
            : 'All rows had valid page counts.'}
        </span>
      </div>
    </div>

    <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="text-stone-300 flex items-center gap-1.5">
        <Filter className="w-3.5 h-3.5 text-stone-400" />
        Import Filter:
      </span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange({ importShelfFilter: 'read_only' })} className={pill(options.importShelfFilter === 'read_only')}>
          Completed Books Only ('read' shelf)
        </button>
        <button type="button" onClick={() => onChange({ importShelfFilter: 'all' })} className={pill(options.importShelfFilter === 'all')}>
          All Shelves
        </button>
      </div>
    </div>

    <div className="pt-2 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
      <div className="space-y-0.5">
        <span className="text-stone-300 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Enrich Missing Genres:
        </span>
        <span className="text-[11px] text-stone-500 block">Looks up blank genres via Google Books & Open Library.</span>
      </div>
      <button
        type="button"
        onClick={onToggleAutoEnrich}
        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 border ${
          autoEnrich ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-stone-900 text-stone-400 border-stone-800'
        }`}
      >
        {autoEnrich ? 'Enabled' : 'Disabled (Use CSV Only)'}
      </button>
    </div>
  </div>
);
