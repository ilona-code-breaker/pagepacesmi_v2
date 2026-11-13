import { useState } from 'react';
import { Bookmark, BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QueuedBook } from '../utils/readingQueue';

export function ReadingQueue({ queue, onStart, onRemove, fullShelf = false }: {
  queue: QueuedBook[];
  onStart: (book: QueuedBook) => void;
  onRemove: (id: string | string[]) => void;
  fullShelf?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<'sel' | 'all' | null>(null);
  const sel = queue.filter((b) => selected.has(b.id)).map((b) => b.id);
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const del = (kind: 'sel' | 'all') => {
    if (confirm !== kind) { setConfirm(kind); setTimeout(() => setConfirm(null), 4000); return; }
    onRemove(kind === 'all' ? queue.map((b) => b.id) : sel);
    setSelected(new Set()); setConfirm(null);
  };
  return (
    <section aria-label="Want to read" className="dark border-t border-border pt-4">
      <h3 className="flex items-center gap-2 font-serif text-lg text-foreground"><Bookmark className="h-4 w-4 text-chart-5" />Want to read <span className="text-xs font-sans text-muted-foreground">{queue.length}</span></h3>
      {queue.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1 text-muted-foreground"><input type="checkbox" checked={sel.length === queue.length} onChange={(e) => setSelected(new Set(e.target.checked ? queue.map((b) => b.id) : []))} />Select all</label>
          {sel.length > 0 && <Button variant="destructive" size="sm" onClick={() => del('sel')}><Trash2 />{confirm === 'sel' ? `Tap again to delete ${sel.length}` : `Delete selected (${sel.length})`}</Button>}
          <Button variant="outline" size="sm" onClick={() => del('all')}><Trash2 />{confirm === 'all' ? `Tap again to delete all ${queue.length}` : 'Delete all'}</Button>
        </div>
      )}
      {!queue.length && <p className="mt-2 text-xs text-muted-foreground">No saved books yet.</p>}
      <ul className={fullShelf ? 'mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6' : 'mt-3 max-h-80 overflow-y-auto divide-y divide-border'}>
        {queue.map((book) => (
          <li key={book.id} className="py-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2"><input type="checkbox" className="mt-1" aria-label={`Select ${book.title}`} checked={selected.has(book.id)} onChange={() => toggle(book.id)} /><div className="min-w-0"><p className="text-sm font-semibold text-foreground break-words">{book.title}</p><p className="text-xs text-muted-foreground break-words">{book.author}</p></div></div>
              <Button variant="ghost" size="icon" aria-label={`Remove ${book.title} from Want to read`} title="Remove from Want to read" onClick={() => onRemove(book.id)} className="shrink-0 text-muted-foreground"><Trash2 /></Button>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onStart(book)} aria-label={`Start reading ${book.title}`}><BookOpen />Start reading</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}