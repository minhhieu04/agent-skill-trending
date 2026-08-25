import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  Code2, 
  Palette, 
  Terminal, 
  ArrowRight,
  Cpu
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LearningTrackFinderProps {
  onSelectTrack: (trackQuery: string, language?: string, category?: string) => void;
  activeQuery?: string;
  onClearTrack?: () => void;
}

export const LearningTrackFinder: React.FC<LearningTrackFinderProps> = ({
  onSelectTrack,
  activeQuery,
  onClearTrack,
}) => {
  const { t } = useLanguage();
  const [customGoal, setCustomGoal] = useState('');

  const tracks = [
    {
      id: 'antigravity',
      title: t('track_antigravity_title'),
      icon: Sparkles,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
      badge: '🪐 Antigravity',
      query: 'antigravity',
      lang: 'all',
      cat: 'skill-file',
      description: t('track_antigravity_desc'),
    },
    {
      id: 'codex',
      title: t('track_codex_title'),
      icon: Cpu,
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400',
      badge: '🧠 Codex / Copilot',
      query: 'codex',
      lang: 'all',
      cat: 'skill-file',
      description: t('track_codex_desc'),
    },
    {
      id: 'golang',
      title: t('track_golang_title'),
      icon: Terminal,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-400',
      badge: '🐹 Golang',
      query: 'Go',
      lang: 'Go',
      cat: 'all',
      description: t('track_golang_desc'),
    },
    {
      id: 'uiux',
      title: t('track_uiux_title'),
      icon: Palette,
      color: 'from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-700 dark:text-pink-400',
      badge: '🎨 UI/UX Pro',
      query: 'UI UX',
      lang: 'all',
      cat: 'skill-file',
      description: t('track_uiux_desc'),
    },
    {
      id: 'frontend',
      title: t('track_frontend_title'),
      icon: Code2,
      color: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30 text-sky-700 dark:text-sky-400',
      badge: '⚛️ React / Next.js',
      query: 'Next.js',
      lang: 'TypeScript',
      cat: 'all',
      description: t('track_frontend_desc'),
    },
    {
      id: 'ai-agents',
      title: t('track_agents_title'),
      icon: Sparkles,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
      badge: '🤖 MCP Servers',
      query: 'mcp-server',
      lang: 'all',
      cat: 'mcp-server',
      description: t('track_agents_desc'),
    },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoal.trim()) return;
    onSelectTrack(customGoal.trim());
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/5 via-sky-500/5 to-purple-500/5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {t('track_title')}
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-full font-bold">
                {t('track_badge')}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('track_sub')}
            </p>
          </div>
        </div>

        {/* Custom Goal Search Input */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder={t('track_search_placeholder')}
            className="px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 w-full md:w-64"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-colors"
          >
            {t('track_search_btn')}
          </button>
        </form>
      </div>

      {/* Track Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {tracks.map((track) => {
          const Icon = track.icon;
          const isCurrentActive = activeQuery === track.query;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track.query, track.lang, track.cat)}
              className={`p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border transition-all cursor-pointer group flex flex-col justify-between space-y-2.5 ${
                isCurrentActive
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-md'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border bg-gradient-to-r ${track.color}`}>
                    {track.badge}
                  </span>
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {track.title}
                </h4>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {track.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span>{t('track_view_skills')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {activeQuery && onClearTrack && (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-600 dark:text-slate-400">
          <span>{t('track_filtering_by')} <strong className="text-emerald-600 dark:text-emerald-400 font-mono">"{activeQuery}"</strong></span>
          <button
            onClick={onClearTrack}
            className="text-xs font-bold text-rose-500 hover:underline"
          >
            {t('track_clear_filter')}
          </button>
        </div>
      )}
    </div>
  );
};
