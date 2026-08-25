import React from 'react';
import { 
  Star, 
  GitFork, 
  TrendingUp, 
  Terminal, 
  Users, 
  Zap, 
  Scale, 
  Bookmark, 
  BookmarkCheck, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles 
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

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'beginner':
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 font-medium">
            {t('diff_beginner')}
          </span>
        );
      case 'advanced':
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20 font-medium">
            {t('diff_advanced')}
          </span>
        );
      default:
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-500/20 font-medium">
            {t('diff_intermediate')}
          </span>
        );
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className={`group relative rounded-2xl bg-white dark:bg-slate-900/90 border p-5 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 flex flex-col justify-between ${
      isCompared 
        ? 'border-sky-500 ring-2 ring-sky-500/30 dark:border-sky-500/60 dark:ring-1 dark:ring-sky-500/30' 
        : 'border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/60 dark:hover:border-emerald-500/40 shadow-sm'
    }`}>
      {/* Top Bar: Title, Author, Bookmark, Compare toggle */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded">
                {skill.category}
              </span>
              <SecurityBadge rating={skill.security_rating || 'safe'} score={skill.security_score || 95} size="sm" />
              {getDifficultyBadge(skill.difficulty)}
              {skill.primary_language && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  • {skill.primary_language}
                </span>
              )}
            </div>

            <h3 
              onClick={() => onSelectSkill(skill)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSkill(skill);
                }
              }}
              role="button"
              tabIndex={0}
              className="text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1 group-hover:underline focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
            >
              {skill.title || skill.name}
            </h3>
            
            <p className="text-xs text-slate-500 font-mono truncate">
              {skill.name}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleCompare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(skill.id);
                }}
                className={`p-2 rounded-xl border transition-all ${
                  isCompared
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-600 dark:text-sky-400 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title={t('btn_compare')}
              >
                <Scale className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(skill.id);
              }}
              className={`p-2 rounded-xl border transition-all ${
                skill.is_bookmarked
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              title={t('btn_bookmark')}
            >
              {skill.is_bookmarked ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* AI Summary */}
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 leading-relaxed font-normal">
          {skill.ai_summary || skill.description || 'No description provided.'}
        </p>

        {/* Target Audience */}
        {skill.target_audience && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300/90 mb-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/30 px-2.5 py-1 rounded-lg">
            <Users className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span className="truncate">{t('target_fit')} <strong className="font-semibold text-indigo-900 dark:text-indigo-200">{skill.target_audience}</strong></span>
          </div>
        )}

        {/* Use Cases preview */}
        {skill.use_cases && skill.use_cases.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> {t('applications')}
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{skill.use_cases[0]}</span>
              </div>
            </div>
          </div>
        )}

        {/* Compatible Runtimes */}
        {skill.runtimes && skill.runtimes.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mr-1 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-slate-400" /> {t('runtime_label')}
              </span>
              {skill.runtimes.slice(0, 3).map((rt) => (
                <span
                  key={rt}
                  className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                >
                  {rt}
                </span>
              ))}
              {skill.runtimes.length > 3 && (
                <span className="text-[10px] font-mono text-slate-400">
                  +{skill.runtimes.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {skill.tags?.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/40"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Metrics & Scores */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        {/* GitHub Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-1 text-amber-500 font-semibold" title="GitHub Stars">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{formatNumber(skill.stars)}</span>
          </div>

          <div className="flex items-center gap-1" title="Forks">
            <GitFork className="w-3.5 h-3.5" />
            <span>{formatNumber(skill.forks)}</span>
          </div>

          {skill.star_velocity_7d > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-emerald-500 font-semibold" title="7-day Star Growth">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{Math.round(skill.star_velocity_7d)}/7d</span>
            </div>
          )}
        </div>

        {/* Dynamic Composite Scores */}
        <div className="flex items-center gap-2">
          {showRelevance && skill.relevance_score > 0 ? (
            <div 
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-mono font-bold"
              title="Personalized Relevance Score"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{Math.round(skill.relevance_score)}% {t('score_match')}</span>
            </div>
          ) : (
            <>
              {/* Quality Score */}
              <div 
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono"
                title="Code Quality Score"
              >
                <ShieldCheck className="w-3 h-3 text-sky-500" />
                <span>{Math.round(skill.quality_score)}</span>
              </div>

              {/* Trending Score */}
              <div 
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold"
                title="Trending Velocity Score"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{Math.round(skill.trending_score)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
