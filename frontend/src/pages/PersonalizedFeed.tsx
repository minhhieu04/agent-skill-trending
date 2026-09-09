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
      <div className="p-5 sm:p-6 rounded-3xl neu-flat">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                  Gợi Ý Thông Minh Cho {preference?.user_name || 'Hiếu'}
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full neu-inset-sm text-[var(--primary)] whitespace-nowrap shrink-0">
                  Personalized
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 font-normal">
                Thuật toán tự động tính điểm Độ Phù Hợp (Relevance Score) dựa trên các công nghệ và Runtimes bạn chọn.
              </p>
            </div>
          </div>

          <button
            onClick={onGoToPreferences}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] transition-all cursor-pointer shrink-0"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Chỉnh sửa sở thích</span>
          </button>
        </div>

        {/* Current Active Filters Summary */}
        {preference && (
          <div className="mt-4 pt-3.5 border-t border-[var(--shadow-dark)]/20 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-main)]">Đang ưu tiên:</span>
            {preference.preferred_categories?.slice(0, 3).map((c) => (
              <span key={c} className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono neu-inset-sm text-[var(--text-muted)] whitespace-nowrap shrink-0 inline-flex items-center">
                {c}
              </span>
            ))}
            {preference.preferred_runtimes?.slice(0, 3).map((r) => (
              <span key={r} className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono neu-inset-sm text-[var(--text-muted)] whitespace-nowrap shrink-0 inline-flex items-center">
                {r}
              </span>
            ))}
            {preference.preferred_languages?.slice(0, 3).map((l) => (
              <span key={l} className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono neu-inset-sm text-[var(--text-muted)] whitespace-nowrap shrink-0 inline-flex items-center">
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
        <div className="text-center py-16 p-8 rounded-3xl neu-inset animate-fade-in">
          <Zap className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">Chưa có đề xuất phù hợp</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
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
