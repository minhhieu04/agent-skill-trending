import React from 'react';
import { Skill, CategoryInfo, RuntimeInfo } from '../types';
import { SkillCard } from '../components/SkillCard';
import { GridSkeleton } from '../components/Skeleton';
import { LearningTrackFinder } from '../components/LearningTrackFinder';
import { 
  Flame, 
  Filter, 
  ArrowUpDown, 
  Code, 
  Terminal,
  Scale
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TrendingFeedProps {
  skills: Skill[];
  categories: CategoryInfo[];
  runtimes: RuntimeInfo[];
  loading: boolean;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedRuntime: string;
  setSelectedRuntime: (rt: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  comparedSkillIds: number[];
  onToggleCompare: (id: number) => void;
  onToggleBookmark: (id: number) => void;
  onSelectSkill: (skill: Skill) => void;
  onGoToCompare: () => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export const TrendingFeed: React.FC<TrendingFeedProps> = ({
  skills,
  categories,
  runtimes,
  loading,
  selectedCategory,
  setSelectedCategory,
  selectedRuntime,
  setSelectedRuntime,
  selectedLanguage,
  setSelectedLanguage,
  sortBy,
  setSortBy,
  comparedSkillIds,
  onToggleCompare,
  onToggleBookmark,
  onSelectSkill,
  onGoToCompare,
  searchTerm = '',
  setSearchTerm,
}) => {
  const { t } = useLanguage();
  const languages = ["all", "Python", "TypeScript", "JavaScript", "Go", "Rust", "Markdown"];

  const handleSelectLearningTrack = (trackQuery: string, lang?: string, cat?: string) => {
    if (setSearchTerm) {
      setSearchTerm(trackQuery);
    }
    if (lang && lang !== 'all') {
      setSelectedLanguage(lang);
    } else if (lang === 'all') {
      setSelectedLanguage('all');
    }
    if (cat && cat !== 'all') {
      setSelectedCategory(cat);
    } else if (cat === 'all') {
      setSelectedCategory('all');
    }
  };

  const handleClearLearningTrack = () => {
    if (setSearchTerm) {
      setSearchTerm('');
    }
    setSelectedLanguage('all');
    setSelectedCategory('all');
    setSelectedRuntime('all');
  };

  return (
    <div className="space-y-6">
      {/* Learning Goals & Skills Track Finder Widget */}
      <LearningTrackFinder
        onSelectTrack={handleSelectLearningTrack}
        activeQuery={searchTerm || (selectedLanguage !== 'all' ? selectedLanguage : (selectedCategory !== 'all' ? selectedCategory : undefined))}
        onClearTrack={handleClearLearningTrack}
      />

      {/* Header & Filter Controls Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {t('feed_title')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('feed_sub')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {comparedSkillIds.length > 0 && (
              <button
                onClick={onGoToCompare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-300 text-xs font-bold hover:bg-sky-500/20 transition-all"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>So sánh ({comparedSkillIds.length})</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 outline-none cursor-pointer focus:border-emerald-500 font-medium"
              >
                <option value="trending_score">{t('sort_trending')}</option>
                <option value="quality_score">{t('sort_quality')}</option>
                <option value="stars">{t('sort_stars')}</option>
                <option value="recent">{t('sort_recent')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills (Horizontal scrolling) */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Filter className="w-3 h-3" />
            <span>{t('category_label')}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs whitespace-nowrap transition-all duration-200 hover:scale-105 active:scale-95 ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('category_all')} ({categories.reduce((acc, c) => acc + c.count, 0)})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1 rounded-xl text-xs whitespace-nowrap transition-all duration-200 hover:scale-105 active:scale-95 ${
                  selectedCategory === cat.key
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {cat.title} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Runtime & Language Filter Rows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
          {/* Runtimes */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              <Terminal className="w-3 h-3" />
              <span>{t('runtime_label')}</span>
            </div>
            <button
              onClick={() => setSelectedRuntime('all')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-mono shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 ${
                selectedRuntime === 'all'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {t('category_all')}
            </button>
            {runtimes.map((rt) => (
              <button
                key={rt.name}
                onClick={() => setSelectedRuntime(rt.name)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-mono shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 ${
                  selectedRuntime === rt.name
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {rt.name}
              </button>
            ))}
          </div>

          {/* Languages */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              <Code className="w-3 h-3" />
              <span>{t('language_label')}</span>
            </div>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-mono shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 ${
                  selectedLanguage === lang
                    ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {lang === 'all' ? t('category_all') : lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid View or Skeleton Loading */}
      {loading ? (
        <GridSkeleton count={8} />
      ) : skills.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 animate-fade-in">
          <Filter className="w-12 h-12 text-slate-400 mx-auto animate-float" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{t('no_skills_found')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t('no_skills_hint')}
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedRuntime('all');
              setSelectedLanguage('all');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {t('category_all')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onToggleBookmark={onToggleBookmark}
              onSelectSkill={onSelectSkill}
              onToggleCompare={onToggleCompare}
              isCompared={comparedSkillIds.includes(skill.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
