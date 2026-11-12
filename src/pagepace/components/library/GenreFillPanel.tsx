import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BookEntry } from '../../types/book';
import { ASSIGNABLE_GENRES, fetchGenres, isUnassigned } from '../../utils/genreFill';

interface Props {
  books: BookEntry[];
  onApply: (picks: Record<string, string>) => void;
}

export const GenreFillPanel: React.FC<Props> = ({ books, onApply }) => {
  const unassigned = books.filter(isUnassigned);
  const [picks, setPicks] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (unassigned.length === 0 && !picks) return null;

  const run = async () => {
    setLoading(true); setError('');
    try {
      const found = await fetchGenres(unassigned);
      if (Object.keys(found).length === 0) setError('No genres found. Try again in a moment.');
      else setPicks(found);
    } catch { setError('Could not look up genres. Try again in a moment.'); }
    setLoading(false);
  };

  const rows = picks ? unassigned.filter((b) => picks[b.id] !== undefined) : [];

  return (
    <div className="dark rounded-lg border border-border bg-card/30 p-4 space-y-3 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">{picks ? `Review ${rows.length} suggested genres` : `${unassigned.length} ${unassigned.length === 1 ? 'book has' : 'books have'} no genre`}</p>
        {!picks && <Button size="sm" onClick={run} disabled={loading}><Sparkles className="w-4 h-4" />{loading ? 'Looking up…' : 'Fill in missing genres'}</Button>}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {picks && (
        <>
          <ul className="max-h-80 overflow-y-auto divide-y divide-border">
            {rows.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0 text-sm"><strong>{b.title}</strong> <span className="text-muted-foreground">· {b.author}</span></span>
                <select aria-label={`Genre for ${b.title}`} value={picks[b.id]} onChange={(e) => setPicks({ ...picks, [b.id]: e.target.value })}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                  {ASSIGNABLE_GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                  <option value="Unassigned">Leave unassigned</option>
                </select>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setPicks(null)}>Cancel</Button>
            <Button size="sm" onClick={() => { onApply(picks); setPicks(null); }}>Save genres</Button>
          </div>
        </>
      )}
    </div>
  );
};
