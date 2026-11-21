import { BookEntry, MonthlyGoal } from '../types/book';

export interface PagePaceExportPayload {
  appName: string;
  version: string;
  exportDate: string;
  books: BookEntry[];
  goals: Record<string, MonthlyGoal>;
  lists?: Record<string, unknown>;
}

// Reading lists beyond completed books that a full backup must carry.
export const BACKUP_LIST_KEYS = ['pagepace_current_reads', 'pagepace_want_to_read_v1', 'pagepace_dropped_reads_v1', 'pagepace_yearly_goals_v1'] as const;

function readLists(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of BACKUP_LIST_KEYS) {
    try { const v = localStorage.getItem(k); if (v !== null) out[k] = JSON.parse(v); } catch { /* skip */ }
  }
  return out;
}

export function restoreLists(lists?: Record<string, unknown>): boolean {
  if (!lists) return false;
  let wrote = false;
  for (const k of BACKUP_LIST_KEYS) {
    if (k in lists && lists[k] !== undefined) { localStorage.setItem(k, JSON.stringify(lists[k])); wrote = true; }
  }
  return wrote;
}

export function exportPagePaceData(
  books: BookEntry[],
  goals: Record<string, MonthlyGoal>
): void {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const payload: PagePaceExportPayload = {
    appName: 'PagePace',
    version: '2.0',
    exportDate: new Date().toISOString(),
    books,
    goals,
    lists: readLists(),
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `pagepace_data_${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: {
    books: BookEntry[];
    goals: Record<string, MonthlyGoal>;
    lists?: Record<string, unknown>;
  };
}

export function validateAndParseImport(jsonContent: string): ValidationResult {
  try {
    const parsed = JSON.parse(jsonContent);

    if (!parsed || typeof parsed !== 'object') {
      return {
        valid: false,
        error: 'Invalid file format. The file does not contain valid JSON data.',
      };
    }

    let booksArray: any[] = [];
    let goalsObj: Record<string, MonthlyGoal> = {};
    const lists: Record<string, unknown> | undefined = parsed && !Array.isArray(parsed) && parsed.lists && typeof parsed.lists === 'object' ? parsed.lists : undefined;

    // Support both full PagePace backup { books: [...], goals: {...} } and direct array of books [...]
    if (Array.isArray(parsed)) {
      booksArray = parsed;
    } else if (Array.isArray(parsed.books)) {
      booksArray = parsed.books;
      if (parsed.goals && typeof parsed.goals === 'object') {
        goalsObj = parsed.goals;
      }
    } else {
      return {
        valid: false,
        error: 'Unrecognized structure. The backup file must contain a "books" list or an array of books.',
      };
    }

    // Validate books schema
    if (booksArray.length === 0 && !lists) {
      return {
        valid: false,
        error: 'The imported file contains no books.',
      };
    }

    const validatedBooks: BookEntry[] = [];
    for (let i = 0; i < booksArray.length; i++) {
      const b = booksArray[i];
      if (!b || typeof b !== 'object') {
        return {
          valid: false,
          error: `Entry at index ${i} is not a valid book record.`,
        };
      }

      if (!b.title || typeof b.title !== 'string') {
        return {
          valid: false,
          error: `Book entry at index ${i} is missing a title.`,
        };
      }

      const totalPages = Number(b.totalPages);
      if (isNaN(totalPages) || totalPages <= 0) {
        return {
          valid: false,
          error: `Book "${b.title}" has an invalid total pages value.`,
        };
      }

      // Safe normalization
      validatedBooks.push({
        id: b.id || `imported-${Date.now()}-${i}`,
        title: b.title.trim(),
        author: b.author ? String(b.author).trim() : 'Unknown Author',
        totalPages,
        startDate: b.startDate || new Date().toISOString().split('T')[0],
        finishDate: b.finishDate || new Date().toISOString().split('T')[0],
        elapsedDays: Number(b.elapsedDays) || 1,
        ppd: Number(b.ppd) || (totalPages / Math.max(1, Number(b.elapsedDays) || 1)),
        archetypeId: b.archetypeId || 'steady-cruiser',
        rating: Number(b.rating) || 4.0,
        review: b.review || '',
        genre: b.genre || 'Fiction',
        format: b.format || 'Physical',
        coverUrl: b.coverUrl,
        isbn: b.isbn,
        publisher: b.publisher,
        publishedYear: b.publishedYear,
        celebrationMessage: b.celebrationMessage,
        createdAt: Number(b.createdAt) || Date.now(),
      });
    }

    return {
      valid: true,
      data: {
        books: validatedBooks,
        goals: goalsObj,
        ...(lists ? { lists } : {}),
      },
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Corrupted file or JSON syntax error: ${err.message || 'Unable to parse JSON'}`,
    };
  }
}
