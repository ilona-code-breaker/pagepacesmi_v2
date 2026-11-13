import { useEffect, useState } from 'react';
import { CopyX } from 'lucide-react';
import { countDuplicates, removeDuplicates } from '../../sync/cloudSync';

/** Shows only when some book is saved twice; removes extra copies after a confirm tap. */
export function DuplicateCleaner() {
  const [count, setCount] = useState(0);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { setCount(countDuplicates()); }, []);
  if (!count) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <span className="text-stone-300">{count} duplicate {count === 1 ? 'copy' : 'copies'} found.</span>
      <button type="button"
        onClick={() => { if (!confirm) return setConfirm(true); removeDuplicates(); window.location.reload(); }}
        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 font-semibold text-stone-950 hover:bg-amber-400">
        <CopyX className="w-4 h-4" /> {confirm ? 'Tap again to remove' : 'Remove duplicates'}
      </button>
    </div>
  );
}
