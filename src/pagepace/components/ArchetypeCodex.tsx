import React from 'react';
import { ARCHETYPES } from '../constants/archetypes';
import { ArchetypeId, BookEntry } from '../types/book';
import { collectedArchetypes, unlockHint } from '../utils/archetypeProgress';
import {
  Zap,
  Compass,
  Wine,
  Moon,
  Flame,
  Rocket,
  Armchair,
  Heart,
  Sparkles,
} from 'lucide-react';

export const ArchetypeCodex: React.FC<{ books?: BookEntry[] }> = ({ books = [] }) => {
  const collected = collectedArchetypes(books);

  const archetypeList = Object.values(ARCHETYPES);

  const getArchetypeIcon = (id: ArchetypeId) => {
    switch (id) {
      case 'narrative-comet':
        return <Flame className="w-6 h-6 text-rose-400" />;
      case 'speed-reader':
        return <Zap className="w-6 h-6 text-amber-400" />;
      case 'momentum-builder':
        return <Rocket className="w-6 h-6 text-emerald-400" />;
      case 'steady-cruiser':
        return <Compass className="w-6 h-6 text-cyan-400" />;
      case 'cozy-lounge-reader':
        return <Armchair className="w-6 h-6 text-blue-400" />;
      case 'book-sommelier':
        return <Wine className="w-6 h-6 text-pink-400" />;
      case 'bedtime-taster':
        return <Moon className="w-6 h-6 text-violet-400" />;
    }
  };


  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      {/* Intro Philosophy Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
          <Heart className="w-4 h-4 text-rose-400" />
          The PagePace Philosophy
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
          7 Reading Speed Archetypes • Every Pace is a Superpower
        </h2>
        <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
          Traditional book trackers obsess over raw page volume and arbitrary yearly quotas.
          PagePace reframes reading velocity into reader identity. We never shame slower readers—we celebrate
          Bedtime Tasters for restorative self-care and Book Sommeliers for deep literary aeration,
          honor Lounge Readers and Steady Cruisers for habit mastery, and applaud Momentum Builders,
          Speed Readers, and Narrative Comets for thrilling plotline velocity.
        </p>
      </div>

      {/* Collection progress */}
      <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-serif font-bold text-stone-100">Your collection</span>
          <span className="font-mono text-amber-400">{collected.size} / {archetypeList.length} unlocked</span>
        </div>
        <div className="h-2 rounded-full bg-stone-800 overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${(collected.size / archetypeList.length) * 100}%` }} /></div>
        <p className="text-xs text-stone-400">{collected.size === archetypeList.length ? 'You have collected every reader type!' : 'Each book you finish earns the type of its pace. Try a different pace to unlock the rest.'}</p>
      </div>

      {/* 7 Archetypes Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {archetypeList.map((arch) => { const count = collected.get(arch.id) ?? 0; const locked = count === 0; return (
          <div
            key={arch.id}
            className={`relative p-6 rounded-2xl bg-stone-900/80 border transition-all space-y-4 flex flex-col justify-between ${locked ? 'border-stone-800 opacity-60 grayscale' : 'border-stone-700'}`}
            style={locked ? undefined : { borderColor: arch.accentHex + '88' }}
          >
            <div className={`text-[11px] font-mono font-semibold ${locked ? 'text-stone-400' : ''}`} style={locked ? undefined : { color: arch.accentHex }}>
              {locked ? `🔒 Locked · ${unlockHint(arch)}` : `✓ Unlocked · ${count} ${count === 1 ? 'book' : 'books'}`}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 shadow-sm">
                    {getArchetypeIcon(arch.id)}
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-stone-100">{arch.name}</h3>
                    <span className="text-xs font-mono font-semibold" style={{ color: arch.accentHex }}>
                      {arch.ppdRange}
                    </span>
                  </div>
                </div>
                <span className="text-2xl">{arch.badgeEmoji}</span>
              </div>

              <p className="text-xs font-serif italic text-stone-300">
                “{arch.tagline}”
              </p>

              <p className="text-xs text-stone-400 leading-relaxed">
                {arch.description}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-800/80 space-y-2">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                Reading Philosophy:
              </div>
              <p className="text-[11px] text-stone-300 italic leading-snug">
                {arch.celebrationPhilosophy}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {arch.strengths.map((str) => (
                  <span
                    key={str}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-stone-300 font-mono"
                  >
                    {str}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ); })}
      </div>

    </div>
  );
};
