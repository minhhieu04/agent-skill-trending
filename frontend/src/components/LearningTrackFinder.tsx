import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { TechLogo } from './TechLogo';

interface LearningTrackFinderProps {
  onSelectTrack: (trackQuery: string, language?: string, category?: string) => void;
  onOpenAIAdvisor?: (goalQuery: string) => void;
  activeQuery?: string;
  onClearTrack?: () => void;
}

export const LearningTrackFinder: React.FC<LearningTrackFinderProps> = ({
  onSelectTrack,
  onOpenAIAdvisor,
  activeQuery,
  onClearTrack,
}) => {
  const { t } = useLanguage();
  const [customGoal, setCustomGoal] = useState('');

  useEffect(() => {
    if (!activeQuery) {
      setCustomGoal('');
    }
  }, [activeQuery]);

  const tracks = [
    {
      id: 'antigravity',
      title: t('track_antigravity_title'),
      logoName: 'antigravity',
      badge: 'Google Antigravity',
      query: 'antigravity',
      lang: 'all',
      cat: 'skill-file',
      description: t('track_antigravity_desc'),
    },
    {
      id: 'codex',
      title: t('track_codex_title'),
      logoName: 'codex',
      badge: 'OpenAI Codex',
      query: 'codex',
      lang: 'all',
      cat: 'skill-file',
      description: t('track_codex_desc'),
    },
    {
      id: 'golang',
      title: t('track_golang_title'),
      logoName: 'golang',
      badge: 'Go Gopher',
      query: 'Go',
      lang: 'Go',
      cat: 'all',
      description: t('track_golang_desc'),
    },
    {
      id: 'uiux',
      title: t('track_uiux_title'),
      logoName: 'tailwind',
      badge: 'UI/UX Pro Max',
      query: 'UI UX',
      lang: 'all',
      cat: 'skill-file',
      description: t('track_uiux_desc'),
    },
    {
      id: 'frontend',
      title: t('track_frontend_title'),
      logoName: 'nextjs',
      badge: 'React & Next.js',
      query: 'Next.js',
      lang: 'TypeScript',
      cat: 'all',
      description: t('track_frontend_desc'),
    },
    {
      id: 'ai-agents',
      title: t('track_agents_title'),
      logoName: 'mcp',
      badge: 'MCP Protocol',
      query: 'mcp-server',
      lang: 'all',
      cat: 'mcp-server',
      description: t('track_agents_desc'),
    },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoal.trim()) return;
    if (onOpenAIAdvisor) {
      onOpenAIAdvisor(customGoal.trim());
    } else {
      onSelectTrack(customGoal.trim(), 'all', 'all');
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl neu-flat space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-5">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)]">
                {t('track_title')}
              </h3>
              <span className="px-2.5 py-0.5 text-[10px] font-mono neu-inset-sm rounded-full text-[var(--primary)] font-semibold whitespace-nowrap shrink-0">
                {t('track_badge')}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              {t('track_sub')}
            </p>
          </div>
        </div>

        {/* Custom Goal Search Input with AI */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 sm:gap-2.5 w-full xl:w-auto xl:max-w-md shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder={t('track_search_placeholder')}
              className="w-full pl-3.5 pr-9 py-2.5 text-xs rounded-2xl neu-inset bg-transparent text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--primary)]/50 transition-all"
            />
            <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--primary)] pointer-events-none" />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2.5 neu-primary rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{t('track_search_btn')}</span>
          </button>
        </form>
      </div>

      {/* Track Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {tracks.map((track) => {
          const isCurrentActive = activeQuery === track.query;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track.query, track.lang, track.cat)}
              className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isCurrentActive
                  ? 'neu-inset ring-2 ring-[var(--primary)]/40'
                  : 'neu-btn'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full neu-inset-sm text-[var(--text-main)] flex items-center gap-1.5">
                    <TechLogo name={track.logoName} className="w-3 h-3 shrink-0" />
                    <span>{track.badge}</span>
                  </span>
                  <div className="w-7 h-7 rounded-xl neu-inset-sm flex items-center justify-center shrink-0">
                    <TechLogo name={track.logoName} className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h4 className="text-xs font-bold text-[var(--text-main)]">
                  {track.title}
                </h4>

                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
                  {track.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--shadow-dark)]/20 flex items-center justify-between text-[11px] font-semibold text-[var(--text-main)]">
                <div className="flex items-center gap-1 text-[var(--primary)]">
                  <span>{t('track_view_skills')}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>

                {onOpenAIAdvisor && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAIAdvisor(track.title + ': ' + track.description);
                    }}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-mono neu-btn-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-all flex items-center gap-1"
                    title="Mở Lộ Trình AI Chuyên Sâu"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-[var(--primary)]" />
                    <span>AI Roadmap</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeQuery && onClearTrack && (
        <div className="flex items-center justify-between pt-1 text-xs text-[var(--text-muted)]">
          <span>{t('track_filtering_by')} <strong className="text-[var(--text-main)] font-mono font-semibold">"{activeQuery}"</strong></span>
          <button
            onClick={() => {
              setCustomGoal('');
              onClearTrack();
            }}
            className="text-xs font-semibold text-rose-500 hover:underline"
          >
            {t('track_clear_filter')}
          </button>
        </div>
      )}
    </div>
  );
};
