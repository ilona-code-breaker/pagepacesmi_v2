import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DroppedRead } from '../utils/readingStatus';
import { formatStoppedProgress } from '../utils/currentReading';

export function DroppedBooks({ books, onRemove }: { books: DroppedRead[]; onRemove: (id: string) => void }) {
  return <section aria-label="Dropped books" className="dark space-y-3">
    <h3 className="font-serif text-lg text-foreground">Dropped</h3>
    {!books.length && <p className="text-sm text-muted-foreground">No dropped books.</p>}
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">{books.map((book) => <li key={book.id} className="flex gap-3 rounded-lg border border-border p-4">
      {book.coverUrl && <img src={book.coverUrl} alt="" className="h-16 w-11 shrink-0 object-cover rounded" />}
      <div className="min-w-0 flex-1"><p className="font-semibold text-foreground break-words">{book.title}</p><p className="text-xs text-muted-foreground">{book.author}</p><p className="mt-2 text-xs text-muted-foreground">{formatStoppedProgress(book)} · {book.droppedDate}</p></div>
      <Button variant="ghost" size="icon" title="Remove dropped book" aria-label={`Remove ${book.title} from Dropped`} onClick={() => onRemove(book.id)}><Trash2 /></Button>
    </li>)}</ul>
  </section>;
}