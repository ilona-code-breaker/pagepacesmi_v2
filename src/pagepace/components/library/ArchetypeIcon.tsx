import React from 'react';
import { Armchair, Compass, Flame, Moon, Rocket, Wine, Zap } from 'lucide-react';
import { ArchetypeId } from '../../types/book';

export const ArchetypeIcon: React.FC<{ id: ArchetypeId; className?: string }> = ({ id, className = 'w-4 h-4' }) => {
  switch (id) {
    case 'narrative-comet':
      return <Flame className={`${className} text-rose-400`} />;
    case 'speed-reader':
      return <Zap className={`${className} text-amber-400`} />;
    case 'momentum-builder':
      return <Rocket className={`${className} text-emerald-400`} />;
    case 'steady-cruiser':
      return <Compass className={`${className} text-cyan-400`} />;
    case 'cozy-lounge-reader':
      return <Armchair className={`${className} text-blue-400`} />;
    case 'book-sommelier':
      return <Wine className={`${className} text-pink-400`} />;
    case 'bedtime-taster':
      return <Moon className={`${className} text-violet-400`} />;
    default:
      return null;
  }
};
