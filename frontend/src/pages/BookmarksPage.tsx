import React from 'react';
import { Skill } from '../types';
import { SkillCard } from '../components/SkillCard';
import { GridSkeleton } from '../components/Skeleton';
import { BookmarkCheck, Bookmark, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BookmarksPageProps {
  skills: Skill[];
  loading: boolean;
  onToggleBookmark: (id: number) => void;
  onSelectSkill: (skill: Skill) => void;
  onBackToFeed: () => void;
}

export const BookmarksPage: React.FC<BookmarksPageProps> = ({
  skills,
  loading,
  onToggleBookmark,
  onSelectSkill,
  onBackToFeed,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{t('bookmarks_title')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('bookmarks_sub')}
            </p>
          </div>
        </div>

        <button
          onClick={onBackToFeed}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('tab_trending')}
        </button>
      </div>

      {loading ? (
        <GridSkeleton count={4} />
      ) : skills.length === 0 ? (
        <div className="text-center py-20 p-8 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Bookmark className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{t('no_bookmarks')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {t('no_bookmarks_hint')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onToggleBookmark={onToggleBookmark}
              onSelectSkill={onSelectSkill}
            />
          ))}
        </div>
      )}
    </div>
  );
};
