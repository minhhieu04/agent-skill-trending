import React from 'react';
import { Skill, UserPreference } from '../types';
import { SkillCard } from '../components/SkillCard';
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
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-emerald-950/40 border border-indigo-500/20 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">
                  Gợi Ý Thông Minh Cho {preference?.user_name || 'Hiếu'}
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Personalized AI
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Thuật toán đối chiếu sở thích và phân tích ngữ cảnh để chọn ra những skills phù hợp nhất với workflow của bạn.
              </p>
            </div>
          </div>

          <button
            onClick={onGoToPreferences}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
          >
            <Sliders className="w-3.5 h-3.5" />
            Chỉnh sửa sở thích
          </button>
        </div>

        {/* Current Active Filters Summary */}
        {preference && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Đang ưu tiên:</span>
            {preference.preferred_categories?.slice(0, 3).map((c) => (
              <span key={c} className="px-2 py-0.5 rounded-md bg-indigo-950/50 text-indigo-300 border border-indigo-800/40">
                {c}
              </span>
            ))}
            {preference.preferred_runtimes?.slice(0, 3).map((r) => (
              <span key={r} className="px-2 py-0.5 rounded-md bg-emerald-950/50 text-emerald-300 border border-emerald-800/40">
                {r}
              </span>
            ))}
            {preference.preferred_languages?.slice(0, 3).map((l) => (
              <span key={l} className="px-2 py-0.5 rounded-md bg-sky-950/50 text-sky-300 border border-sky-800/40">
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-2xl bg-slate-900/40 border border-slate-800">
          <Zap className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Chưa có đề xuất phù hợp</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hãy điều chỉnh tiêu chí lọc trong phần Cài đặt sở thích hoặc kích hoạt Quét dữ liệu mới.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
