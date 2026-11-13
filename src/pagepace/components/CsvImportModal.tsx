import { createPortal } from 'react-dom';
import React from 'react';
import { ArrowRight, FileSpreadsheet, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { BookEntry } from '../types/book';
import { useCsvImport } from '../hooks/useCsvImport';
import { CsvDropzone } from './csv-import/CsvDropzone';
import { CsvSummary } from './csv-import/CsvSummary';
import { CsvOptionsPanel } from './csv-import/CsvOptionsPanel';
import { CsvMergePanel } from './csv-import/CsvMergePanel';
import { CsvPreview } from './csv-import/CsvPreview';
import { CsvProgress } from './csv-import/CsvProgress';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBooks: BookEntry[];
  onImportComplete: (updatedBooks: BookEntry[], shelfRows: import('../utils/csvParser').NormalizedCsvRow[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, existingBooks, onImportComplete }) => {
  const csv = useCsvImport(existingBooks);
  if (!isOpen) return null;

  const handleImport = async () => {
    const result = await csv.runImport();
    if (result) {
      onImportComplete(result.library, result.shelfRows);
      onClose();
    }
  };

  return (
    createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl p-5 sm:p-7 flex flex-col max-h-[92vh] overflow-y-auto space-y-5">
        <div className="flex items-start justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">Import CSV Reading History</h3>
              <p className="text-xs text-stone-400 mt-0.5">Upload your Goodreads export or custom spreadsheet.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center gap-2.5 text-xs text-stone-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-stone-300">Private:</strong> your file is read on this device and never uploaded.
          </span>
        </div>

        {!csv.analysis ? (
          <CsvDropzone onFile={csv.processFile} error={csv.error} />
        ) : (
          <div className="space-y-5">
            <CsvSummary fileName={csv.file?.name} analysis={csv.analysis} onChangeFile={csv.reset} />
            <CsvOptionsPanel
              options={csv.options}
              analysis={csv.analysis}
              onChange={csv.changeOptions}
              autoEnrich={csv.autoEnrichGenres}
              onToggleAutoEnrich={() => csv.setAutoEnrichGenres(!csv.autoEnrichGenres)}
            />
            <CsvMergePanel
              value={csv.mergeStrategy}
              onChange={csv.setMergeStrategy}
              newCount={csv.duplicateStats.newBooks.length}
              duplicateCount={csv.duplicateStats.duplicates.length}
              totalCount={csv.analysis.validRows.length}
            />
            <CsvPreview rows={csv.analysis.validRows} />
            {csv.isImporting && csv.progress && (
              <CsvProgress stage={csv.progressStage} current={csv.progress.current} total={csv.progress.total} title={csv.progressTitle} />
            )}
            <div className="flex items-center justify-between pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={onClose}
                disabled={csv.isImporting}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-400 hover:text-stone-200 hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={csv.isImporting || csv.analysis.validRows.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {csv.isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{csv.isImporting ? 'Processing CSV...' : `Import ${csv.analysis.validRows.length} Books to Library`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  , document.body));
};
