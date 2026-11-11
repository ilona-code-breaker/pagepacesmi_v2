import { useState } from 'react';
import { BookEntry } from '../types/book';
import {
  parseCsvRaw,
  analyzeAndNormalizeCsv,
  partitionDuplicates,
  convertRowToBookEntry,
  CsvParseOptions,
  CsvAnalysisResult,
} from '../utils/csvParser';
import { enrichCsvGenres } from '../utils/enrichCsvGenres';

export type MergeStrategy = 'merge_skip' | 'merge_update' | 'replace';

/** Merges converted CSV rows into the existing library according to the chosen strategy. */
export function mergeImportedRows(
  rows: CsvAnalysisResult['validRows'],
  existingBooks: BookEntry[],
  strategy: MergeStrategy
): BookEntry[] {
  if (strategy === 'replace') return rows.map((r, i) => convertRowToBookEntry(r, i));
  const { newBooks, duplicates } = partitionDuplicates(rows, existingBooks);
  if (strategy === 'merge_skip') {
    return [...newBooks.map((r, i) => convertRowToBookEntry(r, i)), ...existingBooks];
  }
  const map = new Map<string, BookEntry>();
  existingBooks.forEach((b) => map.set(b.id, b));
  duplicates.forEach(({ incoming, existingBook }, i) => {
    const updated = convertRowToBookEntry(incoming, i);
    // Keep the existing id and the user's own shelves, notes and quotes
    map.set(existingBook.id, {
      ...updated,
      id: existingBook.id,
      shelves: existingBook.shelves,
      notes: existingBook.notes,
      quotes: existingBook.quotes,
    });
  });
  newBooks.forEach((incoming, i) => {
    const added = convertRowToBookEntry(incoming, i);
    map.set(added.id, added);
  });
  return Array.from(map.values());
}

export function useCsvImport(existingBooks: BookEntry[]) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<CsvParseOptions>({
    startDateStrategy: 'infer_date_added',
    defaultPageCountFallback: 350,
    importShelfFilter: 'read_only',
  });
  const [rawRows, setRawRows] = useState<string[][] | null>(null);
  const [analysis, setAnalysis] = useState<CsvAnalysisResult | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('merge_skip');
  const [isImporting, setIsImporting] = useState(false);
  const [autoEnrichGenres, setAutoEnrichGenres] = useState(true);
  const [progressStage, setProgressStage] = useState<'parsing' | 'enriching' | null>(null);
  const [progressTitle, setProgressTitle] = useState('');
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const processFile = (selected: File) => {
    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid .csv file (e.g. goodreads_library_export.csv).');
      return;
    }
    setError(null);
    setFile(selected);
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || !text.trim()) return setError('The selected CSV file is empty.');
        const parsed = parseCsvRaw(text);
        if (parsed.length < 2) return setError('The CSV file does not contain enough rows or headers to import.');
        setRawRows(parsed);
        const result = analyzeAndNormalizeCsv(parsed, options);
        setAnalysis(result);
        if (result.validRows.length === 0) {
          setError('No matching book records found. Please ensure the CSV contains a Title column and book entries.');
        }
      } catch (err: any) {
        setError(`Failed to parse CSV file: ${err.message || 'Unknown error'}`);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setError('Error reading file from disk.');
      setIsParsing(false);
    };
    reader.readAsText(selected);
  };

  const changeOptions = (patch: Partial<CsvParseOptions>) => {
    const updated = { ...options, ...patch };
    setOptions(updated);
    if (rawRows) setAnalysis(analyzeAndNormalizeCsv(rawRows, updated));
  };

  const reset = () => {
    setAnalysis(null);
    setRawRows(null);
    setFile(null);
  };

  const runImport = async (): Promise<BookEntry[] | null> => {
    if (!analysis || analysis.validRows.length === 0) return null;
    setIsImporting(true);
    setProgressStage('parsing');
    const total = analysis.validRows.length;
    // Yield to the UI in chunks so large files don't freeze the page
    for (let i = 0; i < total; i += 40) {
      setProgress({ current: Math.min(i + 40, total), total });
      await new Promise((r) => setTimeout(r, 15));
    }
    let library = mergeImportedRows(analysis.validRows, existingBooks, mergeStrategy);
    if (autoEnrichGenres && library.length > 0) {
      setProgressStage('enriching');
      const { enrichedBooks } = await enrichCsvGenres(library, {
        batchSize: 4,
        onProgress: (p) => {
          setProgress({ current: p.processed, total: p.total });
          setProgressTitle(p.currentTitle || '');
        },
      });
      library = enrichedBooks;
    }
    setIsImporting(false);
    setProgressStage(null);
    setProgressTitle('');
    return library;
  };

  const duplicateStats = analysis
    ? partitionDuplicates(analysis.validRows, existingBooks)
    : { newBooks: [], duplicates: [] };

  return {
    file,
    isParsing,
    error,
    options,
    analysis,
    mergeStrategy,
    setMergeStrategy,
    isImporting,
    autoEnrichGenres,
    setAutoEnrichGenres,
    progressStage,
    progressTitle,
    progress,
    duplicateStats,
    processFile,
    changeOptions,
    reset,
    runImport,
  };
}
