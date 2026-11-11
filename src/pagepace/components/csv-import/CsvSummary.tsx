import React from 'react';
import { CsvAnalysisResult } from '../../utils/csvParser';

export const CsvSummary: React.FC<{ fileName?: string; analysis: CsvAnalysisResult; onChangeFile: () => void }> = ({
  fileName,
  analysis,
  onChangeFile,
}) => (
  <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex flex-wrap items-center justify-between gap-4">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-stone-100 font-serif">{fileName}</span>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          {analysis.validRows.length} Books Ready
        </span>
      </div>
      <div className="text-[11px] text-stone-400 font-mono flex items-center gap-3 flex-wrap">
        <span>Total rows: {analysis.totalRows}</span>
        <span>·</span>
        <span>'Read' shelf: {analysis.readCount}</span>
        {analysis.currentlyReadingCount > 0 && <span>· Currently reading: {analysis.currentlyReadingCount}</span>}
        {analysis.toReadCount > 0 && <span>· To read: {analysis.toReadCount}</span>}
      </div>
    </div>
    <button type="button" onClick={onChangeFile} className="text-xs text-stone-400 hover:text-stone-200 underline font-mono">
      Change File
    </button>
  </div>
);
