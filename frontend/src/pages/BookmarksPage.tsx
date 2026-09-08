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
      <div className="p-5 sm:p-6 rounded-3xl neu-flat flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)]">{t('bookmarks_title')}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t('bookmarks_sub')}
            </p>
          </div>
        </div>

        <button
          onClick={onBackToFeed}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('tab_trending')}</span>
        </button>
      </div>

      {loading ? (
        <GridSkeleton count={4} />
      ) : skills.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl neu-inset">
          <Bookmark className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">{t('no_bookmarks')}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
            {t('no_bookmarks_hint')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 animate-fade-in">
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
