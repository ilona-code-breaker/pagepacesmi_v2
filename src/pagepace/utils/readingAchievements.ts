import type { BookEntry, MonthlyGoal } from '../types/book';
import { computeStreaks } from './readingStats';
import { normalizeTitle } from './recommendations';
import { coreTitle, isOwnedRead, volumeOf, type OwnedBook } from './ownedBooks';

export const READING_BADGES_KEY = 'pagepace_reading_badges_v1';
export const TBR_STARTED_KEY = 'pagepace_tbr_started_v1';
export const BIRTHDAY_KEY = 'pagepace_birthday_v1';

export interface ReadingContext {
  /** Finished books with dated re-reads expanded (statsBooks). */
  books: BookEntry[];
  /** Original finished books (re-reads not expanded). */
  originals: BookEntry[];
  goals: Record<string, MonthlyGoal>;
  yearlyGoals: Record<string, { books: number }>;
  tbrStarted: string[];
  droppedCount: number;
  owned: OwnedBook[];
  birthday?: string; // MM-DD
  today?: string; // YYYY-MM-DD
}
export type ReadingKind = 'ereader' | 'audio' | 'physical' | 'hybrid' | 'mixed' | 'genre' | 'length' | 'pace' | 'habit' | 'series' | 'notes' | 'season' | 'tbr';
export interface ReadingBadge { id: string; emoji: string; name: string; kind: ReadingKind; goal: string; earned: (c: ReadingContext) => boolean }

export const READING_GROUPS: [ReadingKind, string, string][] = [
  ['ereader', '📱 E-Reader', 'Finished books with the E-Reader format.'],
  ['audio', '🎧 Audiobooks', 'Finished books with the Audiobook format.'],
  ['physical', '📖 Physical books', 'Finished books with the Physical format (books without a format count as Physical).'],
  ['hybrid', '🔀 Hybrid', 'Finished books with the Hybrid format.'],
  ['mixed', '🎨 Mixing formats', 'Reading across different formats.'],
  ['genre', '🎭 Genres', 'Based on the genre of finished books.'],
  ['length', '📏 Book length', 'Based on page counts.'],
  ['pace', '⚡ Pace', 'Based on how many days a book took.'],
  ['habit', '🔥 Habits & goals', 'Streaks and your monthly and yearly goals.'],
  ['series', '📚 Series & re-reads', 'Re-reading and finishing series you own.'],
  ['notes', '✍️ Reviews & notes', 'Reviews, quotes and ratings.'],
  ['season', '🗓️ Seasons & dates', 'When you finish books.'],
  ['tbr', '🧹 Want to read', 'Your Want to read list and dropped books.'],
];

const fmtOf = (b: BookEntry) => b.format || 'Physical';
const ofFmt = (c: ReadingContext, f: string) => c.books.filter((b) => fmtOf(b) === f);
const pages = (b: BookEntry) => Number(b.totalPages) || 0;
const genresOf = (b: BookEntry) => (b.genres?.length ? b.genres.map(String) : b.genre ? b.genre.split(/[,/]/).map((g) => g.trim()) : []).filter((g) => g && !/unassigned/i.test(g));
const genreCounts = (c: ReadingContext) => { const m = new Map<string, number>(); c.books.forEach((b) => new Set(genresOf(b)).forEach((g) => m.set(g, (m.get(g) ?? 0) + 1))); return m; };
const days = (b: BookEntry) => Math.max(1, Number(b.elapsedDays) || 1);
const byFinish = (c: ReadingContext) => [...c.books].filter((b) => b.finishDate).sort((a, b) => a.finishDate.localeCompare(b.finishDate));
const month = (b: BookEntry) => b.finishDate?.slice(0, 7) ?? '';

const count = (kind: ReadingKind, f: string, n: number, emoji: string, name: string, label: string): ReadingBadge =>
  ({ id: `${kind}-${n}`, emoji, name, kind, goal: `Finish ${n} ${label}`, earned: (c) => ofFmt(c, f).length >= n });
const bigFmt = (kind: ReadingKind, f: string, p: number, emoji: string, name: string, label: string): ReadingBadge =>
  ({ id: `${kind}-big`, emoji, name, kind, goal: `Finish a ${p}+ page book ${label}`, earned: (c) => ofFmt(c, f).some((b) => pages(b) >= p) });

/** True when the month's books met that month's goal. */
export function monthGoalMet(c: ReadingContext, key: string): boolean {
  const g = c.goals[key];
  if (!g) return false;
  const mb = c.books.filter((b) => month(b) === key);
  const okB = g.targetType === 'pages' || mb.length >= (g.targetBooks || 0);
  const okP = g.targetType === 'books' || mb.reduce((s, b) => s + pages(b), 0) >= (g.targetPages || 0);
  return (g.targetBooks > 0 || g.targetPages > 0) && okB && okP;
}
const nextMonth = (k: string) => { const [y, m] = k.split('-').map(Number); return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`; };

/** Owned series (2+ volumes) where every owned volume has been read. */
export function finishedSeries(c: ReadingContext): number {
  const groups = new Map<string, OwnedBook[]>();
  c.owned.forEach((o) => { if (volumeOf(o.title) === undefined) return; const k = coreTitle(o.title); if (k) groups.set(k, [...(groups.get(k) ?? []), o]); });
  let n = 0;
  groups.forEach((vols) => { if (vols.length >= 2 && vols.every((o) => o.markedRead === true || (o.markedRead !== false && isOwnedRead(o, c.originals)))) n++; });
  return n;
}

export const READING_BADGES: ReadingBadge[] = [
  { id: 'ereader-1', emoji: '✨', name: 'Screen Glow', kind: 'ereader', goal: 'Finish your first e-reader book', earned: (c) => ofFmt(c, 'E-Reader').length >= 1 },
  count('ereader', 'E-Reader', 10, '🌿', 'Paperless Habit', 'e-reader books'),
  count('ereader', 'E-Reader', 25, '📱', 'Kindle Devotee', 'e-reader books'),
  count('ereader', 'E-Reader', 50, '🖋️', 'E-Ink Master', 'e-reader books'),
  bigFmt('ereader', 'E-Reader', 600, '🪶', 'Lightweight Epic', 'on an e-reader'),
  { id: 'audio-1', emoji: '🎧', name: 'First Listen', kind: 'audio', goal: 'Finish your first audiobook', earned: (c) => ofFmt(c, 'Audiobook').length >= 1 },
  count('audio', 'Audiobook', 5, '🚗', 'Commute Companion', 'audiobooks'),
  count('audio', 'Audiobook', 15, '👂', 'Ears Wide Open', 'audiobooks'),
  count('audio', 'Audiobook', 30, '🎙️', 'Audio Aficionado', 'audiobooks'),
  count('audio', 'Audiobook', 50, '🎭', "Narrator's Circle", 'audiobooks'),
  bigFmt('audio', 'Audiobook', 600, '🏃', 'Endurance Listener', 'as an audiobook'),
  { id: 'physical-1', emoji: '📄', name: 'Real Paper', kind: 'physical', goal: 'Finish your first physical book', earned: (c) => ofFmt(c, 'Physical').length >= 1 },
  count('physical', 'Physical', 10, '🖨️', 'Fresh Ink', 'physical books'),
  count('physical', 'Physical', 25, '📕', 'Spine Cracker', 'physical books'),
  count('physical', 'Physical', 50, '📜', 'Paper Purist', 'physical books'),
  bigFmt('physical', 'Physical', 700, '🏋️', 'Heavy Lifter', 'in print'),
  { id: 'hybrid-1', emoji: '🚪', name: 'Two Doors, One Story', kind: 'hybrid', goal: 'Finish your first hybrid read', earned: (c) => ofFmt(c, 'Hybrid').length >= 1 },
  count('hybrid', 'Hybrid', 5, '🔄', 'Seamless Switcher', 'hybrid books'),
  count('hybrid', 'Hybrid', 15, '🌐', 'Omnireader', 'hybrid books'),
  { id: 'mixed-trifecta', emoji: '🔺', name: 'The Trifecta', kind: 'mixed', goal: 'Finish a physical book, an e-reader book and an audiobook', earned: (c) => ['Physical', 'E-Reader', 'Audiobook'].every((f) => ofFmt(c, f).length > 0) },
  { id: 'mixed-every', emoji: '🦘', name: 'Format Collector', kind: 'mixed', goal: 'Finish a book in every format, Hybrid included', earned: (c) => ['Physical', 'E-Reader', 'Audiobook', 'Hybrid'].every((f) => ofFmt(c, f).length > 0) },
  { id: 'mixed-balanced', emoji: '⚖️', name: 'Balanced Diet', kind: 'mixed', goal: 'Finish 5 books each as physical, e-reader and audiobook', earned: (c) => ['Physical', 'E-Reader', 'Audiobook'].every((f) => ofFmt(c, f).length >= 5) },
  { id: 'mixed-hopper', emoji: '🐸', name: 'Format Hopper', kind: 'mixed', goal: 'Finish 3 books in a row, each in a different format', earned: (c) => byFinish(c).some((b, i, a) => i >= 2 && new Set([b, a[i - 1], a[i - 2]].map(fmtOf)).size === 3) },
  { id: 'mixed-onetrack', emoji: '🎯', name: 'One-Track Mind', kind: 'mixed', goal: 'Finish 4+ books in one month, all in the same format', earned: (c) => { const m = new Map<string, BookEntry[]>(); c.books.forEach((b) => month(b) && m.set(month(b), [...(m.get(month(b)) ?? []), b])); return [...m.values()].some((bs) => bs.length >= 4 && new Set(bs.map(fmtOf)).size === 1); } },

  { id: 'genre-5', emoji: '🧭', name: 'Genre Explorer', kind: 'genre', goal: 'Finish books in 5 different genres', earned: (c) => genreCounts(c).size >= 5 },
  { id: 'genre-10', emoji: '🗺️', name: 'Genre Voyager', kind: 'genre', goal: 'Finish books in 10 different genres', earned: (c) => genreCounts(c).size >= 10 },
  { id: 'genre-fantasy', emoji: '🐉', name: 'Fantasy Devotee', kind: 'genre', goal: 'Finish 20 fantasy books', earned: (c) => [...genreCounts(c)].some(([g, n]) => /fantasy/i.test(g) && n >= 20) },
  { id: 'genre-romance', emoji: '💘', name: 'Romance Heart', kind: 'genre', goal: 'Finish 20 romance books', earned: (c) => [...genreCounts(c)].some(([g, n]) => /romance/i.test(g) && n >= 20) },
  { id: 'genre-mystery', emoji: '🔍', name: 'Mystery Sleuth', kind: 'genre', goal: 'Finish 20 mystery or thriller books', earned: (c) => [...genreCounts(c)].some(([g, n]) => /mystery|thriller|crime/i.test(g) && n >= 20) },
  { id: 'genre-new', emoji: '🚀', name: 'Comfort Zone Breaker', kind: 'genre', goal: 'Finish a book in a genre you had never read, after 10 books', earned: (c) => { const seen = new Set<string>(); return byFinish(c).some((b, i) => { const gs = genresOf(b); const fresh = i >= 10 && gs.length > 0 && gs.some((g) => !seen.has(g)); gs.forEach((g) => seen.add(g)); return fresh; }); } },

  { id: 'length-brick', emoji: '🧱', name: 'Brick Breaker', kind: 'length', goal: 'Finish a 600+ page book', earned: (c) => c.books.some((b) => pages(b) >= 600) },
  { id: 'length-snack', emoji: '🍪', name: 'Snack Reader', kind: 'length', goal: 'Finish 10 books under 200 pages', earned: (c) => c.books.filter((b) => pages(b) > 0 && pages(b) < 200).length >= 10 },
  ...([10000, 50000, 100000] as const).map((n, i): ReadingBadge => ({ id: `length-pages-${n}`, emoji: ['⛰️', '🏔️', '🗻'][i], name: ['Page Hill', 'Page Mountain', 'Page Summit'][i], kind: 'length', goal: `Read ${n.toLocaleString('en')} pages in total`, earned: (c) => c.books.reduce((s, b) => s + pages(b), 0) >= n })),

  { id: 'pace-binge', emoji: '🍿', name: 'Weekend Binge', kind: 'pace', goal: 'Finish a 200+ page book within 2 days', earned: (c) => c.originals.some((b) => days(b) <= 2 && pages(b) >= 200) },
  { id: 'pace-slow', emoji: '🐢', name: 'Slow Burn', kind: 'pace', goal: 'Spend more than 30 days on one book', earned: (c) => c.originals.some((b) => days(b) > 30) },

  ...([7, 30, 100] as const).map((n, i): ReadingBadge => ({ id: `habit-streak-${n}`, emoji: ['🔥', '💪', '🌋'][i], name: ['Week Warrior', 'Month Marathoner', 'Hundred-Day Hero'][i], kind: 'habit', goal: `Reach a ${n}-day reading streak`, earned: (c) => computeStreaks(c.books, c.today).longest >= n })),
  { id: 'habit-goal3', emoji: '🎯', name: 'Goal Getter', kind: 'habit', goal: 'Hit your monthly goal 3 months in a row', earned: (c) => Object.keys(c.goals).some((k) => monthGoalMet(c, k) && monthGoalMet(c, nextMonth(k)) && monthGoalMet(c, nextMonth(nextMonth(k)))) },
  { id: 'habit-year', emoji: '🏆', name: 'Year Champion', kind: 'habit', goal: 'Reach your yearly book goal', earned: (c) => Object.entries(c.yearlyGoals).some(([y, g]) => g?.books > 0 && c.books.filter((b) => b.finishDate?.startsWith(y)).length >= g.books) },

  { id: 'series-reread', emoji: '🤝', name: 'Old Friend', kind: 'series', goal: 'Re-read a book', earned: (c) => c.originals.some((b) => (b.rereadDates?.length ?? 0) >= 1) },
  { id: 'series-3x', emoji: '🛋️', name: 'Comfort Classic', kind: 'series', goal: 'Read the same book 3 times', earned: (c) => c.originals.some((b) => (b.rereadDates?.length ?? 0) >= 2) },
  { id: 'series-finish', emoji: '🧩', name: 'Series Finisher', kind: 'series', goal: 'Read every volume you own of a series (2+ volumes in My Library)', earned: (c) => finishedSeries(c) >= 1 },

  { id: 'notes-critic', emoji: '📝', name: 'Critic', kind: 'notes', goal: 'Write 10 reviews', earned: (c) => c.originals.filter((b) => (b.review || '').trim().length >= 10).length >= 10 },
  { id: 'notes-quotes', emoji: '💬', name: 'Quote Collector', kind: 'notes', goal: 'Save 25 quotes', earned: (c) => c.originals.reduce((s, b) => s + (b.quotes?.length ?? 0), 0) >= 25 },
  { id: 'notes-tough', emoji: '🧐', name: 'Tough Judge', kind: 'notes', goal: 'Average rating below 3 (10+ rated books)', earned: (c) => { const r = c.originals.filter((b) => b.rating > 0); return r.length >= 10 && r.reduce((s, b) => s + b.rating, 0) / r.length < 3; } },
  { id: 'notes-generous', emoji: '💖', name: 'Generous Heart', kind: 'notes', goal: 'Average rating above 4.5 (10+ rated books)', earned: (c) => { const r = c.originals.filter((b) => b.rating > 0); return r.length >= 10 && r.reduce((s, b) => s + b.rating, 0) / r.length > 4.5; } },

  { id: 'season-summer', emoji: '☀️', name: 'Summer Reader', kind: 'season', goal: 'Finish 10 books between June and August of one year', earned: (c) => { const m = new Map<string, number>(); c.books.forEach((b) => { const mo = Number(b.finishDate?.slice(5, 7)); if (mo >= 6 && mo <= 8) { const y = b.finishDate.slice(0, 4); m.set(y, (m.get(y) ?? 0) + 1); } }); return [...m.values()].some((n) => n >= 10); } },
  { id: 'season-newyear', emoji: '🎆', name: 'New Year, New Book', kind: 'season', goal: 'Finish a book in the first week of January', earned: (c) => c.books.some((b) => /^\d{4}-01-0[1-7]/.test(b.finishDate || '')) },
  { id: 'season-birthday', emoji: '🎂', name: 'Birthday Book', kind: 'season', goal: 'Finish a book on your birthday (set it below)', earned: (c) => !!c.birthday && c.books.some((b) => b.finishDate?.slice(5) === c.birthday) },

  { id: 'tbr-tamer', emoji: '🧹', name: 'TBR Tamer', kind: 'tbr', goal: 'Finish 10 books you started from your Want to read list', earned: (c) => { const s = new Set(c.tbrStarted); return c.originals.filter((b) => s.has(normalizeTitle(b.title))).length >= 10; } },
  { id: 'tbr-honest', emoji: '🙌', name: 'Honest Reader', kind: 'tbr', goal: "Drop a book you weren't enjoying — quitting is allowed", earned: (c) => c.droppedCount >= 1 },
];

export const earnedReadingBadges = (c: ReadingContext) => READING_BADGES.filter((b) => b.earned(c)).map((b) => b.id);

const loadJson = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
export const loadReadingEarned = () => loadJson<string[] | null>(READING_BADGES_KEY, null);
export const loadTbrStarted = () => loadJson<string[]>(TBR_STARTED_KEY, []);
export function recordTbrStart(title: string) {
  const list = loadTbrStarted(); const t = normalizeTitle(title);
  if (t && !list.includes(t)) localStorage.setItem(TBR_STARTED_KEY, JSON.stringify([...list, t]));
}
export const loadBirthday = () => { try { return localStorage.getItem(BIRTHDAY_KEY) || undefined; } catch { return undefined; } };
export const loadYearlyGoals = () => loadJson<Record<string, { books: number }>>('pagepace_yearly_goals_v1', {});
