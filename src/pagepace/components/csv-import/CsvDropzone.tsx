import React, { useRef, useState } from 'react';
import { AlertTriangle, Upload } from 'lucide-react';

export const CsvDropzone: React.FC<{ onFile: (f: File) => void; error: string | null }> = ({ onFile, error }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) onFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`p-8 sm:p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragging ? 'border-amber-400 bg-amber-500/10 scale-[1.01]' : 'border-stone-800 hover:border-amber-500/50 bg-stone-950/60 hover:bg-stone-950'
        }`}
      >
        <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 mb-3">
          <Upload className="w-8 h-8" />
        </div>
        <h4 className="text-base font-semibold text-stone-100">Drag and drop your reading CSV file here</h4>
        <p className="text-xs text-stone-400 mt-1 max-w-sm">
          Compatible with standard Goodreads exports (<code className="text-amber-400 font-mono text-[11px]">goodreads_library_export.csv</code>) or custom spreadsheets with Title & Author columns.
        </p>
        <span className="mt-4 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700">
          Browse CSV File
        </span>
      </div>
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
