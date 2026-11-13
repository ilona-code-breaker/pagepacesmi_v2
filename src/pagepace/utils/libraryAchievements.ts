export interface LibraryStats { owned: number; read: number; formats: Record<string, number> }
export interface LibraryAchievement { id: string; emoji: string; name: string; kind: 'size' | 'read' | 'format'; goal: string; earned: (s: LibraryStats) => boolean; progress: (s: LibraryStats) => [number, number] }

export const ACHIEVEMENTS_KEY = 'pagepace_library_achievements_v1';

const size = (n: number, emoji: string, name: string): LibraryAchievement => ({ id: `size-${n}`, emoji, name, kind: 'size', goal: `Own ${n} books`, earned: (s) => s.owned >= n, progress: (s) => [Math.min(s.owned, n), n] });
const readPct = (p: number, emoji: string, name: string, min = 10): LibraryAchievement => ({ id: `read-${p}`, emoji, name, kind: 'read', goal: `Read ${p}% of the books you own (at least ${min} books owned)`, earned: (s) => s.owned >= min && s.read / s.owned >= p / 100, progress: (s) => [Math.min(s.read, Math.ceil((Math.max(s.owned, min) * p) / 100)), Math.ceil((Math.max(s.owned, min) * p) / 100)] });
const fmt = (f: string, n: number, emoji: string, name: string, label: string): LibraryAchievement => ({ id: `fmt-${f}-${n}`, emoji, name, kind: 'format', goal: `Own ${n} ${label}`, earned: (s) => (s.formats[f] ?? 0) >= n, progress: (s) => [Math.min(s.formats[f] ?? 0, n), n] });

export const LIBRARY_ACHIEVEMENTS: LibraryAchievement[] = [
  size(10, '📚', 'First Shelf'),
  size(25, '🪑', 'Book Nook'),
  size(50, '🛋️', 'Reading Corner'),
  size(100, '🗄️', 'Full Bookcase'),
  size(250, '🏠', 'Home Library'),
  size(500, '🏛️', 'Grand Archive'),
  size(1000, '👑', 'Legendary Collector'),
  readPct(25, '🔖', 'Shelf Explorer'),
  readPct(50, '📖', 'Half the Shelf'),
  readPct(75, '🌟', 'Devoted Reader'),
  readPct(100, '🏆', 'Every Page Turned'),
  fmt('E-Reader', 1, '📱', 'Digital Debut', 'e-reader book'),
  fmt('Audiobook', 10, '🎧', 'Listening Ear', 'audiobooks'),
  fmt('Physical', 50, '📦', 'Paper Lover', 'physical books'),
  fmt('Hybrid', 5, '🔀', 'Best of Both', 'hybrid books'),
];

export const earnedAchievements = (s: LibraryStats) => LIBRARY_ACHIEVEMENTS.filter((a) => a.earned(s)).map((a) => a.id);

/** Next size milestone not yet reached, or undefined when all are earned. */
export const nextSizeMilestone = (s: LibraryStats) => LIBRARY_ACHIEVEMENTS.find((a) => a.kind === 'size' && !a.earned(s));
export const currentSizeMilestone = (s: LibraryStats) => [...LIBRARY_ACHIEVEMENTS].reverse().find((a) => a.kind === 'size' && a.earned(s));

export const loadEarned = (): string[] | null => { try { const v = localStorage.getItem(ACHIEVEMENTS_KEY); return v ? JSON.parse(v) : null; } catch { return null; } };
