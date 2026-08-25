import React from 'react';
import { Skill, UserPreference } from '../types';
import { SkillCard } from '../components/SkillCard';
import { GridSkeleton } from '../components/Skeleton';
import { Sparkles, Sliders, Zap } from 'lucide-react';

interface PersonalizedFeedProps {
  skills: Skill[];
  preference: UserPreference | null;
  loading: boolean;
  onToggleBookmark: (id: number) => void;
  onSelectSkill: (skill: Skill) => void;
  onGoToPreferences: () => void;
}

export const PersonalizedFeed: React.FC<PersonalizedFeedProps> = ({
  skills,
  preference,
  loading,
  onToggleBookmark,
  onSelectSkill,
  onGoToPreferences,
}) => {
  return (
    <div className="space-y-6">
      {/* Personalized Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Gợi Ý Thông Minh Cho {preference?.user_name || 'Hiếu'}
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  Personalized
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
                Thuật toán tự động tính điểm Độ Phù Hợp (Relevance Score) dựa trên các công nghệ và Runtimes bạn chọn.
              </p>
            </div>
          </div>

          <button
            onClick={onGoToPreferences}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm shrink-0"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Chỉnh sửa sở thích</span>
          </button>
        </div>

        {/* Current Active Filters Summary */}
        {preference && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Đang ưu tiên:</span>
            {preference.preferred_categories?.slice(0, 3).map((c) => (
              <span key={c} className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 font-mono text-[11px] hover:scale-105 transition-transform">
                {c}
              </span>
            ))}
            {preference.preferred_runtimes?.slice(0, 3).map((r) => (
              <span key={r} className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-mono text-[11px] hover:scale-105 transition-transform">
                {r}
              </span>
            ))}
            {preference.preferred_languages?.slice(0, 3).map((l) => (
              <span key={l} className="px-2.5 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40 font-mono text-[11px] hover:scale-105 transition-transform">
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <GridSkeleton count={6} />
      ) : skills.length === 0 ? (
        <div className="text-center py-20 p-8 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
          <Zap className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-float" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Chưa có đề xuất phù hợp</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Thử mở rộng các chuyên mục và Runtimes trong trang Cấu Hình Sở Thích.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onToggleBookmark={onToggleBookmark}
              onSelectSkill={onSelectSkill}
              showRelevance={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
