import React from 'react';
import { Skill, CategoryInfo, RuntimeInfo } from '../types';
import { SkillCard } from '../components/SkillCard';
import { 
  Flame, 
  Filter, 
  ArrowUpDown, 
  Code, 
  Terminal
} from 'lucide-react';

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
  onToggleBookmark: (id: number) => void;
  onSelectSkill: (skill: Skill) => void;
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
  onToggleBookmark,
  onSelectSkill,
}) => {
  const languages = ["all", "Python", "TypeScript", "JavaScript", "Go", "Rust", "Markdown"];

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Top Trending AI Agent Skills</h2>
              <p className="text-xs text-slate-400">Tự động tổng hợp và xếp hạng từ GitHub, Reddit, HN</p>
            </div>
          </div>

          {/* Sort By Select */}
          <div className="flex items-center gap-2 self-end md:self-auto text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="trending_score">🔥 Điểm Trending cao nhất</option>
              <option value="stars">⭐ Nhiều Stars nhất</option>
              <option value="quality_score">🛡️ Chất lượng mã nguồn cao nhất</option>
              <option value="created_at">🆕 Mới cập nhật gần đây</option>
            </select>
          </div>
        </div>

        {/* Filters: Category & Runtime Pills */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          {/* Categories Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
              Chuyên mục:
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Tất cả ({skills.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.title} {cat.count > 0 && `(${cat.count})`}
              </button>
            ))}
          </div>

          {/* Runtime & Language Filter Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Runtimes */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-emerald-400" /> Runtime:
              </span>
              <button
                onClick={() => setSelectedRuntime('all')}
                className={`px-2.5 py-0.5 rounded-lg text-xs transition-all ${
                  selectedRuntime === 'all'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tất cả
              </button>
              {runtimes.slice(0, 6).map((rt) => (
                <button
                  key={rt.name}
                  onClick={() => setSelectedRuntime(rt.name)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-mono transition-all ${
                    selectedRuntime === rt.name
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rt.name}
                </button>
              ))}
            </div>

            {/* Language */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Code className="w-3 h-3 text-sky-400" /> Ngôn ngữ:
              </span>
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-mono transition-all ${
                    selectedLanguage === lang
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'all' ? 'Tất cả' : lang}
                </button>
              ))}
            </div>
          </div>
        </div>
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
          <Filter className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Không tìm thấy skill phù hợp</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Thử thay đổi bộ lọc hoặc bấm "Quét Dữ Liệu Mới" để thu thập thêm các dự án AI mới nhất.
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
