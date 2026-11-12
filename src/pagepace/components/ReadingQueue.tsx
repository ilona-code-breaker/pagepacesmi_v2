import { Bookmark, BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QueuedBook } from '../utils/readingQueue';

export function ReadingQueue({ queue, onStart, onRemove }: {
  queue: QueuedBook[];
  onStart: (book: QueuedBook) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section aria-label="Want to read" className="dark border-t border-border pt-4">
      <h3 className="flex items-center gap-2 font-serif text-lg text-foreground"><Bookmark className="h-4 w-4 text-chart-5" />Want to read <span className="text-xs font-sans text-muted-foreground">{queue.length}</span></h3>
      {!queue.length && <p className="mt-2 text-xs text-muted-foreground">No saved books yet.</p>}
      <ul className="mt-3 max-h-80 overflow-y-auto divide-y divide-border">
        {queue.map((book) => (
          <li key={book.id} className="py-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0"><p className="text-sm font-semibold text-foreground break-words">{book.title}</p><p className="text-xs text-muted-foreground break-words">{book.author}</p></div>
              <Button variant="ghost" size="icon" aria-label={`Remove ${book.title} from Want to read`} title="Remove from Want to read" onClick={() => onRemove(book.id)} className="shrink-0 text-muted-foreground"><Trash2 /></Button>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onStart(book)} aria-label={`Start reading ${book.title}`}><BookOpen />Start reading</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}