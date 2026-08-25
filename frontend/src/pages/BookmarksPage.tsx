import React from 'react';
import { Skill } from '../types';
import { SkillCard } from '../components/SkillCard';
import { BookmarkCheck, Bookmark, ArrowLeft } from 'lucide-react';

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
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Skills Đã Đánh Dấu</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Danh sách các giải pháp bạn đã lưu để nghiên cứu hoặc ứng dụng vào dự án.
            </p>
          </div>
        </div>

        <button
          onClick={onBackToFeed}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Về trang chủ
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-20 p-8 rounded-2xl bg-slate-900/40 border border-slate-800">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Chưa có skill nào được lưu</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Nhấn vào biểu tượng bookmark trên mỗi thẻ skill để lưu lại vào danh sách này.
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
            />
          ))}
        </div>
      )}
    </div>
  );
};
