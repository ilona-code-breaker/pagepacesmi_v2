import { useEffect, useState } from 'react';
import type { CurrentRead } from '../utils/currentReading';
import { dropReadingBook, type DroppedRead } from '../utils/readingStatus';
import { todayIso } from '../utils/readingStats';

const KEY = 'pagepace_current_reads';
const DROPPED_KEY = 'pagepace_dropped_reads_v1';
const EVT = 'pagepace-current-reads';
function load<T>(key: string): T[] {
  try { const data = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(data) ? data : []; } catch { return []; }
}
export function addCurrentRead(r: CurrentRead) {
  localStorage.setItem(KEY, JSON.stringify([r, ...load<CurrentRead>(KEY)]));
  window.dispatchEvent(new Event(EVT));
}
export function useReadingLists() {
  const [reads, setLocal] = useState<CurrentRead[]>([]);
  const [dropped, setDropped] = useState<DroppedRead[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => { setLocal(load(KEY)); setDropped(load(DROPPED_KEY)); };
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener('storage', sync); };
  }, []);
  const setReads = (fn: (rs: CurrentRead[]) => CurrentRead[]) => {
    localStorage.setItem(KEY, JSON.stringify(fn(load(KEY))));
    window.dispatchEvent(new Event(EVT));
  };
  const drop = (id: string) => {
    const oldDropped = localStorage.getItem(DROPPED_KEY);
    try {
      const next = dropReadingBook(load(KEY), load(DROPPED_KEY), id, todayIso());
      localStorage.setItem(DROPPED_KEY, JSON.stringify(next.dropped));
      try { localStorage.setItem(KEY, JSON.stringify(next.reads)); } catch (e) {
        if (oldDropped === null) localStorage.removeItem(DROPPED_KEY); else localStorage.setItem(DROPPED_KEY, oldDropped);
        throw e;
      }
      setError('');
      window.dispatchEvent(new Event(EVT));
    } catch { setError('Could not save the dropped status. Your book is still in progress.'); }
  };
  const removeDropped = (id: string) => {
    try { localStorage.setItem(DROPPED_KEY, JSON.stringify(load<DroppedRead>(DROPPED_KEY).filter((r) => r.id !== id))); window.dispatchEvent(new Event(EVT)); }
    catch { setError('Could not remove this book.'); }
  };
  return { reads, dropped, setReads, drop, removeDropped, error };
}