import React from 'react';
import { Flame, Star, Bookmark, Boxes } from 'lucide-react';
import { StatsData } from '../types';

interface StatsHeaderProps {
  stats: StatsData | null;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Tổng Số Skills & MCPs',
      value: stats ? stats.total_skills.toLocaleString() : '8+',
      icon: Boxes,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800/40',
      sub: 'Đang theo dõi tự động'
    },
    {
      title: 'Tổng Đánh Giá GitHub',
      value: stats ? `${(stats.total_stars / 1000).toFixed(1)}k+` : '190k+',
      icon: Star,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200 dark:border-amber-800/40',
      sub: 'Stars từ cộng đồng toàn cầu'
    },
    {
      title: 'Chuyên Mục Phân Loại',
      value: stats ? Object.keys(stats.categories_count).length : '9',
      icon: Flame,
      color: 'from-sky-500 to-indigo-600',
      textColor: 'text-sky-500',
      bgColor: 'bg-sky-50 dark:bg-sky-950/20',
      borderColor: 'border-sky-200 dark:border-sky-800/40',
      sub: 'MCP, Skill.md, Workflow...'
    },
    {
      title: 'Skills Bạn Đã Lưu',
      value: stats ? stats.bookmarked_count.toString() : '0',
      icon: Bookmark,
      color: 'from-purple-500 to-pink-600',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      borderColor: 'border-purple-200 dark:border-purple-800/40',
      sub: 'Bộ sưu tập cá nhân'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`group relative rounded-3xl p-5 border bg-white dark:bg-slate-900/80 ${card.borderColor} shadow-sm backdrop-blur-md overflow-hidden transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mr-2">
                {card.title}
              </span>
              <div className={`p-2 rounded-2xl ${card.bgColor} ${card.textColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight transition-transform duration-200 group-hover:translate-x-0.5">
              {card.value}
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
              {card.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
};
