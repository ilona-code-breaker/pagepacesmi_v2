import { AccountButton } from './AccountButton';
import React from 'react';
import { BookOpen, Volume2, VolumeX, Plus, Compass, Share2, CalendarHeart, Library } from 'lucide-react';

interface NavbarProps {
  currentTab: 'track' | 'library' | 'year' | 'codex' | 'corner';
  onTabChange: (tab: 'track' | 'library' | 'year' | 'codex' | 'corner') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  libraryCount: number;
  onOpenShareCard?: () => void;
  onAddBook: () => void;
}

const tabClass = (active: boolean) =>
  `flex-1 lg:flex-initial min-w-0 px-1 sm:px-2 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
    active ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700' : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
  }`;

const AddBookButton: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = 'Add book' }) => (
  <button
    type="button"
    onClick={onClick}
    className="shrink-0 whitespace-nowrap px-2.5 lg:px-3.5 py-1.5 lg:py-2 text-xs lg:text-sm font-bold rounded-full transition-all flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/50 hover:bg-amber-500 hover:text-stone-950 shadow-sm shadow-amber-500/10"
  >
    <Plus className="w-4 h-4 stroke-[2.5]" />
    <span>{label}</span>
  </button>
);

export const Navbar: React.FC<NavbarProps> = ({
  currentTab, onTabChange, soundEnabled, onToggleSound, libraryCount, onOpenShareCard, onAddBook,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-[#0f1117]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 lg:py-0 lg:h-16 flex flex-col lg:flex-row lg:items-center gap-2.5 lg:gap-4">
        {/* Row 1: brand + actions (actions move right on desktop) */}
        <div className="flex items-center justify-between gap-3 w-full lg:w-auto min-w-0">
          <div onClick={() => onTabChange('track')} className="flex items-center gap-2.5 cursor-pointer select-none group min-w-0">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 text-stone-950 stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex items-center gap-1.5">
              <span className="font-serif font-black text-lg lg:text-xl tracking-tight text-stone-100 group-hover:text-amber-300 transition-colors">PagePace</span>
              <span className="hidden min-[400px]:inline text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 rounded font-semibold">Archetypes</span>
            </div>
          </div>
          <div className="lg:hidden flex items-center gap-1 shrink-0">
            <AddBookButton onClick={onAddBook} label="Book" />
            <AccountButton />
            <button type="button" onClick={onToggleSound} className="p-2 rounded-xl text-stone-400 hover:bg-stone-800/60 shrink-0"
              title={soundEnabled ? 'Mute celebratory sound' : 'Enable celebratory sound'}>
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
            </button>
          </div>
        </div>

        {/* Row 2 on phone/tablet: tabs; on desktop inline after Add book */}
        <nav className="grid grid-cols-4 lg:flex items-center gap-1 lg:gap-1.5 w-full lg:w-auto lg:flex-1 pt-1 lg:pt-0 border-t border-stone-800/60 lg:border-t-0">
          <div className="hidden lg:block shrink-0 mr-1">
            <AddBookButton onClick={onAddBook} />
          </div>
          <button type="button" onClick={() => onTabChange('library')} className={tabClass(currentTab === 'library')}>
            <BookOpen className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-stone-400 shrink-0" />
            <span>Archive</span>
            <span className="hidden sm:inline text-[10px] font-mono px-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400">{libraryCount}</span>
          </button>
          <button type="button" onClick={() => onTabChange('year')} aria-label="Progress" title="Progress: goals, streaks and year in review" className={tabClass(currentTab === 'year')}>
            <CalendarHeart className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-orange-400 shrink-0" />
            <span>Progress</span>
          </button>
          <button type="button" onClick={() => onTabChange('corner')} aria-label="My Library" title="My Library" className={tabClass(currentTab === 'corner')}>
            <Library className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-400 shrink-0" />
            <span>Library</span>
          </button>
          <button type="button" onClick={() => onTabChange('codex')} className={tabClass(currentTab === 'codex')}>
            <Compass className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-stone-400 shrink-0" />
            <span>Codex</span>
          </button>
          <div className="hidden lg:flex items-center gap-2 shrink-0 ml-auto">
            <AccountButton />
            {onOpenShareCard && (
              <button type="button" onClick={onOpenShareCard} title="Share your Reading Archetype card"
                className="shrink-0 whitespace-nowrap px-3.5 py-2 text-sm font-bold rounded-full transition-all flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/50 hover:bg-amber-500 hover:text-stone-950">
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>Share</span>
              </button>
            )}
            <button type="button" onClick={onToggleSound} className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 shrink-0"
              title={soundEnabled ? 'Mute celebratory sound' : 'Enable celebratory sound'}>
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
