import React from 'react';
import { 
  Star, 
  GitFork, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  Terminal
} from 'lucide-react';
import { Skill } from '../types';
import { ScoreBadge } from './ScoreBadge';

interface SkillCardProps {
  skill: Skill;
  onToggleBookmark: (id: number) => void;
  onSelectSkill: (skill: Skill) => void;
  showRelevance?: boolean;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  onToggleBookmark,
  onSelectSkill,
  showRelevance = false,
}) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'beginner':
        return <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Beginner</span>;
      case 'advanced':
        return <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Advanced</span>;
      default:
        return <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">Intermediate</span>;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="group relative rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 flex flex-col justify-between">
      {/* Top Bar: Title, Author, Bookmark */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                {skill.category}
              </span>
              {getDifficultyBadge(skill.difficulty)}
              {skill.primary_language && (
                <span className="text-xs font-medium text-slate-400">
                  • {skill.primary_language}
                </span>
              )}
            </div>

            <h3 
              onClick={() => onSelectSkill(skill)}
              className="text-lg font-bold text-slate-100 hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1 group-hover:underline"
            >
              {skill.title || skill.name}
            </h3>
            
            <p className="text-xs text-slate-500 font-mono truncate">
              {skill.name}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(skill.id);
            }}
            className={`p-2 rounded-xl border transition-all ${
              skill.is_bookmarked
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={skill.is_bookmarked ? 'Remove bookmark' : 'Bookmark this skill'}
          >
            {skill.is_bookmarked ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* AI Vietnamese Summary or Description */}
        <p className="text-sm text-slate-300 line-clamp-2 mb-4 leading-relaxed font-normal">
          {skill.ai_summary || skill.description || 'No description provided.'}
        </p>

        {/* Compatible Runtimes */}
        {skill.runtimes && skill.runtimes.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-slate-400" /> Runtime:
              </span>
              {skill.runtimes.slice(0, 4).map((rt) => (
                <span
                  key={rt}
                  className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                >
                  {rt}
                </span>
              ))}
              {skill.runtimes.length > 4 && (
                <span className="text-[10px] text-slate-400">+{skill.runtimes.length - 4} more</span>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {skill.tags && skill.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {skill.tags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="text-[10px] font-mono text-slate-400 bg-slate-800/60 hover:bg-slate-700/60 px-2 py-0.5 rounded transition-colors"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Scores and Stats */}
      <div className="pt-3 border-t border-slate-800/80 mt-auto">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <ScoreBadge score={skill.trending_score} type="trending" size="sm" />
            <ScoreBadge score={skill.quality_score} type="quality" size="sm" />
            {showRelevance && (
              <ScoreBadge score={skill.relevance_score} type="relevance" size="sm" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 hover:text-amber-300 transition-colors" title="GitHub Stars">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span className="font-mono font-medium">{formatNumber(skill.stars)}</span>
            </span>
            <span className="flex items-center gap-1 hover:text-slate-200 transition-colors" title="Forks">
              <GitFork className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">{formatNumber(skill.forks)}</span>
            </span>
            {skill.reddit_mentions > 0 && (
              <span className="text-[11px] text-orange-400 font-medium" title="Reddit Mentions">
                Reddit: {skill.reddit_mentions}
              </span>
            )}
            {skill.hackernews_mentions > 0 && (
              <span className="text-[11px] text-amber-400 font-medium" title="HN Mentions">
                HN: {skill.hackernews_mentions}
              </span>
            )}
          </div>

          <a
            href={skill.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors font-medium text-xs bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/50"
          >
            GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
