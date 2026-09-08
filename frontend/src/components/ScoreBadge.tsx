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
        if (rounded >= 90) return 'neu-primary text-white font-bold';
        if (rounded >= 70) return 'neu-inset-sm text-blue-600 dark:text-blue-400 font-bold';
        return 'neu-inset-sm text-slate-600 dark:text-slate-400 font-semibold';
      case 'quality':
        if (rounded >= 90) return 'neu-inset-sm text-emerald-600 dark:text-emerald-400 font-bold';
        if (rounded >= 70) return 'neu-inset-sm text-teal-600 dark:text-teal-400 font-semibold';
        return 'neu-inset-sm text-slate-600 dark:text-slate-400 font-semibold';
      case 'relevance':
        if (rounded >= 80) return 'neu-inset-sm text-amber-600 dark:text-amber-400 font-bold';
        if (rounded >= 60) return 'neu-inset-sm text-blue-600 dark:text-blue-400 font-semibold';
        return 'neu-inset-sm text-slate-600 dark:text-slate-400 font-semibold';
    }
  };

  const getIcon = () => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';
    switch (type) {
      case 'trending':
        return <Flame className={`${iconSize} text-current`} />;
      case 'quality':
        return <ShieldCheck className={`${iconSize} text-current`} />;
      case 'relevance':
        return <Zap className={`${iconSize} text-current`} />;
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

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-xl text-xs ${getStyles()} ${padding}`}>
      {getIcon()}
      <span className="font-mono font-bold">{rounded}</span>
      <span className="opacity-80 font-normal text-[10px] uppercase tracking-wider">{getLabel()}</span>
    </div>
  );
};
