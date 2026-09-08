import React from 'react';
import { 
  Star, 
  GitFork, 
  TrendingUp, 
  Scale, 
  Bookmark, 
  BookmarkCheck, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  Terminal
} from 'lucide-react';
import { Skill } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { SecurityBadge } from './SecurityBadge';

interface SkillCardProps {
  skill: Skill;
  onSelectSkill: (skill: Skill) => void;
  onToggleBookmark: (id: number) => void;
  isCompared?: boolean;
  onToggleCompare?: (id: number) => void;
  showRelevance?: boolean;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  onSelectSkill,
  onToggleBookmark,
  isCompared = false,
  onToggleCompare,
  showRelevance = false,
}) => {
  const { t } = useLanguage();

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div 
      className={`group relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between neu-flat hover:shadow-[9px_9px_22px_var(--shadow-dark),_-9px_-9px_22px_var(--shadow-light)] hover:-translate-y-1 cursor-pointer overflow-hidden ${
        isCompared 
          ? 'ring-2 ring-[var(--primary)] shadow-[0_0_18px_rgba(0,132,255,0.35)]' 
          : ''
      }`}
      onClick={() => onSelectSkill(skill)}
    >
      {/* Top Bar: Badges + Action Buttons */}
      <div>
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-xl neu-inset-sm text-[var(--primary)] shrink-0">
              {skill.category}
            </span>
            <SecurityBadge rating={skill.security_rating || 'safe'} score={skill.security_score || 95} size="sm" />
            {skill.primary_language && (
              <span className="text-xs font-semibold text-[var(--text-muted)] truncate">
                • {skill.primary_language}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {onToggleCompare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(skill.id);
                }}
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isCompared
                    ? 'neu-inset text-[var(--primary)] font-bold'
                    : 'neu-btn text-[var(--text-muted)] hover:text-[var(--primary)]'
                }`}
                title={t('btn_compare')}
                aria-label={t('btn_compare')}
              >
                <Scale className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(skill.id);
              }}
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                skill.is_bookmarked
                  ? 'neu-inset text-amber-500 font-bold'
                  : 'neu-btn text-[var(--text-muted)] hover:text-amber-500'
              }`}
              title={t('btn_bookmark')}
              aria-label={t('btn_bookmark')}
            >
              {skill.is_bookmarked ? (
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
            </button>

            {skill.repository_url && (
              <a
                href={skill.repository_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center justify-center transition-colors"
                title="Mở repository trên GitHub"
                aria-label="Mở repository trên GitHub"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Title & Name */}
        <div className="mb-2">
          <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem] leading-snug">
            {skill.title || skill.name}
          </h3>
          <p className="text-[11px] sm:text-xs text-[var(--text-muted)] font-mono truncate mt-0.5">
            {skill.name}
          </p>
        </div>

        {/* Description / AI Summary */}
        <p className="text-xs sm:text-[13px] text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed min-h-[34px] sm:min-h-[38px]">
          {skill.ai_summary || skill.description || 'Không có mô tả chi tiết.'}
        </p>

        {/* Unified Clean Meta: Compatible Runtimes & Top Tags */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {skill.runtimes && skill.runtimes.length > 0 && (
            <div className="flex items-center gap-1 mr-1">
              <Terminal className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
              <span className="text-xs font-mono text-[var(--text-main)] font-semibold">
                {skill.runtimes.slice(0, 2).join(', ')}
                {skill.runtimes.length > 2 && ` +${skill.runtimes.length - 2}`}
              </span>
            </div>
          )}

          {skill.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-mono text-[var(--text-muted)] neu-inset-sm px-2.5 py-0.5 rounded-lg"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Tactile Divider */}
      <div className="neu-divider my-2.5" />

      {/* Footer Metrics & Scores */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap pt-0.5">
        {/* GitHub Stats */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono shrink-0">
          <div className="flex items-center gap-1 text-[var(--text-main)] font-bold neu-inset-sm px-2 py-0.5 rounded-lg shrink-0" title="GitHub Stars">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{formatNumber(skill.stars)}</span>
          </div>

          <div className="flex items-center gap-1 neu-inset-sm px-1.5 py-0.5 rounded-lg shrink-0" title="Forks">
            <GitFork className="w-3 h-3 text-[var(--text-muted)]" />
            <span>{formatNumber(skill.forks)}</span>
          </div>

          {skill.star_velocity_7d > 0 && (
            <div className="hidden sm:flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] neu-inset-sm px-1.5 py-0.5 rounded-lg shrink-0" title="7-day Star Growth">
              <TrendingUp className="w-3 h-3" />
              <span>+{Math.round(skill.star_velocity_7d)}/7d</span>
            </div>
          )}
        </div>

        {/* Composite Scores */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {showRelevance && skill.relevance_score > 0 ? (
            <div 
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg neu-inset-sm text-[var(--primary)] text-xs font-mono font-bold shrink-0"
              title="Personalized Relevance Score"
            >
              <Sparkles className="w-3 h-3 text-[var(--primary)]" />
              <span>{Math.round(skill.relevance_score)}% {t('score_match')}</span>
            </div>
          ) : (
            <>
              {/* Quality Score */}
              <div 
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg neu-inset-sm text-[var(--text-main)] text-xs font-mono font-bold shrink-0"
                title="Code Quality Score"
              >
                <ShieldCheck className="w-3 h-3 text-[var(--primary)]" />
                <span>{Math.round(skill.quality_score)}</span>
              </div>

              {/* Trending Score */}
              <div 
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg neu-primary text-xs font-mono font-extrabold text-white shrink-0"
                title="Trending Velocity Score"
              >
                <TrendingUp className="w-3 h-3" />
                <span>{Math.round(skill.trending_score)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
