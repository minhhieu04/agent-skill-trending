import React from 'react';
import { StatsData } from '../types';
import { Sparkles, Star, Layers, Cpu, BookmarkCheck } from 'lucide-react';

interface StatsHeaderProps {
  stats: StatsData | null;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ stats }) => {
  if (!stats) return null;

  const statItems = [
    {
      label: 'Tổng số Skills / Solutions',
      value: stats.total_skills,
      icon: Sparkles,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      label: 'Tổng Stars GitHub',
      value: (stats.total_stars / 1000).toFixed(1) + 'k',
      icon: Star,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      label: 'Chuyên Mục AI',
      value: Object.keys(stats.categories_count).length,
      icon: Layers,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      label: 'Hỗ Trợ Runtimes',
      value: Object.keys(stats.runtimes_count).length,
      icon: Cpu,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20'
    },
    {
      label: 'Skills Đã Lưu',
      value: stats.bookmarked_count,
      icon: BookmarkCheck,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-3.5 transition-all hover:border-slate-700"
          >
            <div className={`p-2.5 rounded-xl border ${item.bg} ${item.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-100 font-mono">
                {item.value}
              </div>
              <div className="text-[11px] text-slate-400 font-medium line-clamp-1">
                {item.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
