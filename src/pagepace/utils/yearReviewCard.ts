import { ARCHETYPES } from '../constants/archetypes';
import { StreakInfo, YearInReview } from './readingStats';

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

/** Draws a 1080x1920 story-sized summary image and returns it as a PNG blob. */
export async function renderYearReviewImage(r: YearInReview, streak: StreakInfo): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  await document.fonts?.ready;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a1410');
  bg.addColorStop(0.55, '#0f1117');
  bg.addColorStop(1, '#241a0c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#f59e0b';
  ctx.font = '600 40px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAGEPACE · YEAR IN REVIEW', W / 2, 170);

  ctx.fillStyle = '#fafaf9';
  ctx.font = '700 260px Fraunces, Georgia, serif';
  ctx.fillText(String(r.year), W / 2, 440);

  const stat = (label: string, value: string, x: number, y: number) => {
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 110px Fraunces, Georgia, serif';
    ctx.fillText(value, x, y);
    ctx.fillStyle = '#a8a29e';
    ctx.font = '500 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label, x, y + 56);
  };
  stat('books finished', String(r.bookCount), W / 4, 680);
  stat('pages read', r.pageCount.toLocaleString(), (3 * W) / 4, 680);
  stat('avg rating', r.averageRating ? `★ ${r.averageRating.toFixed(1)}` : '–', W / 4, 920);
  stat('longest streak', `${r.longestStreakInYear}d`, (3 * W) / 4, 920);

  // Month bars
  const max = Math.max(1, ...r.booksPerMonth);
  const barW = 56;
  const gap = (W - 160 - barW * 12) / 11;
  const baseY = 1290;
  r.booksPerMonth.forEach((n, i) => {
    const x = 80 + i * (barW + gap);
    const h = (n / max) * 220;
    ctx.fillStyle = n ? '#f59e0b' : '#292524';
    ctx.beginPath();
    ctx.roundRect(x, baseY - Math.max(h, 8), barW, Math.max(h, 8), 12);
    ctx.fill();
    ctx.fillStyle = '#78716c';
    ctx.font = '500 28px "JetBrains Mono", monospace';
    ctx.fillText(MONTHS[i], x + barW / 2, baseY + 44);
  });

  const line = (label: string, value: string | undefined, y: number) => {
    if (!value) return;
    ctx.fillStyle = '#78716c';
    ctx.font = '600 28px "JetBrains Mono", monospace';
    ctx.fillText(label.toUpperCase(), W / 2, y);
    ctx.fillStyle = '#f5f5f4';
    ctx.font = 'italic 600 46px Fraunces, Georgia, serif';
    const text = value.length > 38 ? value.slice(0, 36) + '…' : value;
    ctx.fillText(text, W / 2, y + 58);
  };
  const arch = r.topArchetype ? ARCHETYPES[r.topArchetype.id] : null;
  line('Favourite book', r.highestRated?.title, 1450);
  line('Top genre', r.topGenre?.name, 1590);
  line('Reader archetype', arch ? `${arch.badgeEmoji} ${arch.name}` : undefined, 1730);

  ctx.fillStyle = '#57534e';
  ctx.font = '500 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Current streak: ${streak.current} day${streak.current === 1 ? '' : 's'}`, W / 2, 1860);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Image failed'))), 'image/png'));
}

/** Uses the phone share sheet when available, otherwise downloads the PNG. */
export async function shareOrDownload(blob: Blob, filename: string, text: string) {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text });
      return 'shared';
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
