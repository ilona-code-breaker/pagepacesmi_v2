import { useEffect, useState } from 'react';
import { BookEntry } from '../types/book';

export interface DeletionAction {
  id: string;
  books: BookEntry[];
  label: string;
}

/** 10-second undo window for deletions; pauses while hovered. */
export function useUndoDeletion() {
  const [activeUndo, setActiveUndo] = useState<DeletionAction | null>(null);
  const [progress, setProgress] = useState(100);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!activeUndo) {
      setProgress(100);
      return;
    }
    if (hovered) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveUndo(null);
          return 0;
        }
        return prev - 1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [activeUndo, hovered]);

  const start = (books: BookEntry[], label: string) => {
    setActiveUndo({ id: crypto.randomUUID(), books, label });
    setProgress(100);
  };

  return { activeUndo, progress, setHovered, start, dismiss: () => setActiveUndo(null) };
}
