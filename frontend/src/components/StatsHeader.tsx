import React, { useState } from 'react';
import { Flame, Star, Bookmark, Boxes, ChevronDown, ChevronUp } from 'lucide-react';
import { StatsData } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface StatsHeaderProps {
  stats: StatsData | null;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ stats }) => {
  const { t, language } = useLanguage();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('stats_header_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('stats_header_collapsed', String(next));
    } catch {
      // ignore
    }
  };

  const formatStars = (total: number) => {
    if (total >= 1000000) {
      return `${(total / 1000000).toFixed(1)}M+`;
    }
    if (total >= 1000) {
      return `${(total / 1000).toFixed(1)}k+`;
    }
    return total.toLocaleString();
  };

  const cards = [
    {
      title: t('stat_total_skills') || 'Skills & MCPs',
      value: stats ? stats.total_skills.toLocaleString() : '8+',
      icon: Boxes,
      sub: t('stat_total_skills_sub') || 'Giám sát tự động'
    },
    {
      title: t('stat_total_stars') || 'GitHub Stars',
      value: stats ? formatStars(stats.total_stars) : '190k+',
      icon: Star,
      sub: t('stat_total_stars_sub') || 'Cộng đồng toàn cầu'
    },
    {
      title: t('stat_categories') || 'Chuyên Mục',
      value: stats ? Object.keys(stats.categories_count).length.toString() : '9',
      icon: Flame,
      sub: t('stat_categories_sub') || 'MCP, Skill.md, Rules...'
    },
    {
      title: t('stat_bookmarks') || 'Đã Lưu Bookmark',
      value: stats ? stats.bookmarked_count.toString() : '0',
      icon: Bookmark,
      sub: t('stat_bookmarks_sub') || 'Bộ sưu tập cá nhân'
    }
  ];

  if (collapsed) {
    return (
      <div className="flex items-center justify-between px-4 py-2 rounded-2xl neu-flat-sm text-xs text-[var(--text-muted)] mb-4 animate-fade-in transition-all">
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-0.5">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="flex items-center gap-1.5 shrink-0">
                <Icon className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                <span className="font-bold text-[var(--text-main)] font-mono">{card.value}</span>
                <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">{card.title}</span>
              </div>
            );
          })}
        </div>
        <button
          onClick={handleToggle}
          className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline shrink-0 ml-3 cursor-pointer"
          title={language === 'vi' ? 'Mở rộng số liệu thống kê' : 'Expand metrics'}
        >
          <span>{language === 'vi' ? 'Xem chi tiết' : 'Expand'}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
          {language === 'vi' ? 'Chỉ số tổng quan hệ sinh thái' : 'Ecosystem Metrics'}
        </span>
        <button
          onClick={handleToggle}
          className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          title={language === 'vi' ? 'Thu gọn thanh chỉ số' : 'Collapse metrics'}
        >
          <span>{language === 'vi' ? 'Thu gọn' : 'Collapse'}</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl p-3 sm:py-2.5 sm:px-3.5 neu-flat flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[7px_7px_16px_var(--shadow-dark),_-7px_-7px_16px_var(--shadow-light)]"
            >
              <div className="w-8 h-8 rounded-xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-[var(--text-muted)] truncate">
                  {card.title}
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg sm:text-xl font-black text-[var(--text-main)] font-mono tracking-tight">
                    {card.value}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] truncate hidden xl:inline">
                    {card.sub}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
