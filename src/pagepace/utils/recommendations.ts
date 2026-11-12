export interface RecommendationBook {
  title: string;
  author?: string;
  genre?: string;
  rating?: number;
  finishDate?: string;
}

export interface Recommendation {
  title: string;
  author: string;
  genre?: string;
  reason: string;
  basedOn: 'year' | 'recent';
}

export const normalizeTitle = (title: string) => String(title || '').toLowerCase().split(/[:(]/)[0].replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]/g, '');

export function recommendationWindows(books: RecommendationBook[], today = new Date()) {
  const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const key = date.toISOString().slice(0, 10);
  const cutoff = (months: number) => {
    const start = new Date(date);
    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() - months);
    const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    start.setUTCDate(Math.min(date.getUTCDate(), lastDay));
    return start.toISOString().slice(0, 10);
  };
  const within = (months: number) => books.filter((b) => b.finishDate && b.finishDate >= cutoff(months) && b.finishDate <= key);
  return { year: within(12), recent: within(3) };
}

export function selectRecommendations(candidates: Recommendation[], excluded: RecommendationBook[]) {
  const seen = new Set(excluded.map((b) => normalizeTitle(b.title)));
  const picks: Recommendation[] = [];
  for (const group of ['year', 'recent'] as const) {
    const pick = candidates.find((r) => r.basedOn === group && r.title && r.author && !seen.has(normalizeTitle(r.title)));
    if (pick) {
      picks.push(pick);
      seen.add(normalizeTitle(pick.title));
    }
  }
  return picks;
}