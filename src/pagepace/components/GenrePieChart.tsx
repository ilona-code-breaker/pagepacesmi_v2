import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { BookEntry } from '../types/book';
import { PieChart as PieChartIcon, BookOpen, Layers } from 'lucide-react';
import { GENRE_METADATA, MASTER_GENRES, MasterGenre, extractPrimaryGenre, isMasterGenre } from '../utils/genreMapper';

import { Button } from "@/components/ui/button";

interface GenrePieChartProps {
  books: BookEntry[];
  className?: string;
  selectedGenre?: string | 'all';
  onSelectGenre?: (genre: string | 'all') => void;
}

interface GenreDataPoint {
  name: string;
  value: number; // book count
  percentage: number;
  totalPages: number;
  color: string;
  emoji?: string;
}

export const GenrePieChart: React.FC<GenrePieChartProps> = ({
  books,
  className = '',
  selectedGenre = 'all',
  onSelectGenre,
}) => {
  const { data, totalBooks, totalPages } = useMemo(() => {
    if (!books || books.length === 0) {
      return { data: [], totalBooks: 0, totalPages: 0 };
    }

    const genreMap: Record<string, { count: number; pages: number }> = {};
    let pagesSum = 0;

    books.forEach((b) => {
      const raw = b.genre && b.genre.trim() ? b.genre.trim() : '';
      const g = raw
        ? isMasterGenre(raw)
          ? raw
          : extractPrimaryGenre(raw)
        : null;
      if (g) {
        if (!genreMap[g]) {
          genreMap[g] = { count: 0, pages: 0 };
        }
        genreMap[g].count += 1;
        genreMap[g].pages += b.totalPages || 0;
        pagesSum += b.totalPages || 0;
      }
    });

    const total = books.length;
    const sorted: GenreDataPoint[] = Object.entries(genreMap)
      .map(([name, stats]) => {
        const meta = GENRE_METADATA[name as MasterGenre];
        return {
          name,
          value: stats.count,
          percentage: Math.round((stats.count / total) * 1000) / 10, // 1 decimal e.g. 33.3%
          totalPages: stats.pages,
          color: `var(--genre-${MASTER_GENRES.indexOf(name as MasterGenre)})`,
          emoji: meta?.emoji,
        };
      })
      .sort((a, b) => b.value - a.value);

    return { data: sorted, totalBooks: total, totalPages: pagesSum };
  }, [books]);

  if (data.length === 0) {
    return (
      <div className={`p-6 rounded-2xl bg-card/30 border border-border text-center ${className}`}>
        <PieChartIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-muted-foreground">No Genre Data Available</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Add or import books with genre tags to visualize your reading breakdown.
        </p>
      </div>
    );
  }

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: GenreDataPoint = payload[0].payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-sans space-y-1">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: payload[0].color }}
            />
            <span>
              {item.emoji ? `${item.emoji} ` : ''}
              {item.name}
            </span>
          </div>
          <div className="text-muted-foreground font-mono">
            {item.value} {item.value === 1 ? 'book' : 'books'} ({item.percentage}%)
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            {item.totalPages.toLocaleString()} total pages
          </div>
        </div>
      );
    }
    return null;
  };


  return (
    <div className={`dark p-4 sm:p-6 rounded-lg bg-card/30 border border-border space-y-4 ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5">
          <div className="p-2 rounded-xl bg-secondary text-chart-3">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-serif font-bold text-foreground flex flex-wrap items-center gap-2">
              Genre Distribution
              {selectedGenre !== 'all' && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary border border-border text-foreground font-normal">
                  Filtered: {selectedGenre}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Breakdown across {totalBooks} {totalBooks === 1 ? 'book' : 'books'} and {data.length} genres
              
            </p>
          </div>
        </div>

        {/* Top Genre Badge or Clear Filter CTA */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedGenre !== 'all' && onSelectGenre && (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => onSelectGenre('all')}
              className="text-xs font-mono"
            >
              <span>Clear Genre Filter</span>
              <span className="font-bold">✕</span>
            </Button>
          )}

          {data[0] && selectedGenre === 'all' && (
            <div className="text-xs px-2.5 py-1 rounded-lg bg-background border border-border text-muted-foreground grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 min-w-0">
              <span className="text-muted-foreground">Top Genre:</span>
              <strong className="text-foreground break-words">{data[0].name}</strong>
              <span className="text-muted-foreground font-normal">({data[0].percentage}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Donut Chart Visualization */}
      <div className="w-full h-52 sm:h-60 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              animationDuration={800}
              cursor={onSelectGenre ? 'pointer' : 'default'}
              onClick={(entryData) => {
                if (onSelectGenre && entryData && entryData.name) {
                  onSelectGenre(selectedGenre === entryData.name ? 'all' : entryData.name);
                }
              }}
            >
              {data.map((entry, index) => {
                const isSelected = selectedGenre === entry.name;
                const isDimmed = selectedGenre !== 'all' && !isSelected;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={isDimmed ? 0.3 : 1}
                    stroke={isSelected ? 'var(--foreground)' : 'var(--background)'}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />

          </PieChart>
        </ResponsiveContainer>
      </div>

      <div aria-label="Genre breakdown" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-0">
        {data.map((item) => (
          <Button key={item.name} variant="ghost" aria-pressed={selectedGenre === item.name}
            onClick={() => onSelectGenre?.(selectedGenre === item.name ? 'all' : item.name)}
            className={`h-auto min-h-0 w-full grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 py-1 text-left text-xs whitespace-normal ${selectedGenre === item.name ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="min-w-0 break-words">{item.name}</span>
            <span className="shrink-0 font-mono text-xs">{item.percentage}%</span>
          </Button>
        ))}
      </div>

      {/* Quick Summary Chips */}
      <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
          {totalBooks} logged volumes
        </span>
        <span className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          {totalPages.toLocaleString()} total pages
        </span>
      </div>
    </div>
  );
};
