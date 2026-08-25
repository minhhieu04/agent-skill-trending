import React from 'react';
import { Flame, ShieldCheck, Zap } from 'lucide-react';

interface ScoreBadgeProps {
  score: number;
  type: 'trending' | 'quality' | 'relevance';
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, type, size = 'md' }) => {
  const rounded = Math.round(score);

  const getStyles = () => {
    switch (type) {
      case 'trending':
        if (rounded >= 90) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        if (rounded >= 70) return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'quality':
        if (rounded >= 90) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        if (rounded >= 70) return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'relevance':
        if (rounded >= 80) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
        if (rounded >= 60) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getIcon = () => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';
    switch (type) {
      case 'trending':
        return <Flame className={`${iconSize} text-amber-500 fill-amber-500/20`} />;
      case 'quality':
        return <ShieldCheck className={`${iconSize} text-emerald-400`} />;
      case 'relevance':
        return <Zap className={`${iconSize} text-indigo-400`} />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'trending':
        return 'Trending';
      case 'quality':
        return 'Quality';
      case 'relevance':
        return 'Match';
    }
  };

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <div className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${getStyles()} ${padding}`}>
      {getIcon()}
      <span className="font-mono font-semibold">{rounded}</span>
      <span className="opacity-75 font-normal text-[10px] uppercase tracking-wider">{getLabel()}</span>
    </div>
  );
};
