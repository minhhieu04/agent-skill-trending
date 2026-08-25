import React, { useState, useEffect } from 'react';
import { UserPreference, CategoryInfo, RuntimeInfo } from '../types';
import { Sliders, Save, CheckCircle2, User, Terminal, Code, Layers, Sparkles } from 'lucide-react';

interface PreferencesPageProps {
  preference: UserPreference | null;
  categories: CategoryInfo[];
  runtimes: RuntimeInfo[];
  onSavePreference: (pref: UserPreference) => Promise<void>;
}

export const PreferencesPage: React.FC<PreferencesPageProps> = ({
  preference,
  categories,
  runtimes,
  onSavePreference,
}) => {
  const [formData, setFormData] = useState<UserPreference>({
    user_name: 'Hiếu',
    preferred_categories: [],
    preferred_languages: [],
    preferred_runtimes: [],
    interested_tags: [],
    min_stars: 50,
    min_trending_score: 20,
    only_recent_activity_days: 90,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const standardLanguages = ["Python", "TypeScript", "JavaScript", "Go", "Rust", "C++", "Java", "Markdown"];

  useEffect(() => {
    if (preference) {
      setFormData(preference);
    }
  }, [preference]);

  const toggleCategory = (key: string) => {
    const list = formData.preferred_categories || [];
    const updated = list.includes(key)
      ? list.filter((k) => k !== key)
      : [...list, key];
    setFormData({ ...formData, preferred_categories: updated });
  };

  const toggleRuntime = (name: string) => {
    const list = formData.preferred_runtimes || [];
    const updated = list.includes(name)
      ? list.filter((r) => r !== name)
      : [...list, name];
    setFormData({ ...formData, preferred_runtimes: updated });
  };

  const toggleLanguage = (lang: string) => {
    const list = formData.preferred_languages || [];
    const updated = list.includes(lang)
      ? list.filter((l) => l !== lang)
      : [...list, lang];
    setFormData({ ...formData, preferred_languages: updated });
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const tag = tagInput.trim().toLowerCase();
    if (!formData.interested_tags.includes(tag)) {
      setFormData({
        ...formData,
        interested_tags: [...formData.interested_tags, tag],
      });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      interested_tags: formData.interested_tags.filter((t) => t !== tag),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSavePreference(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Cấu Hình Cá Nhân Hóa & Bộ Lọc</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hệ thống sẽ dựa vào cấu hình này để tính điểm và đề xuất các giải pháp AI phù hợp nhất cho bạn.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Đã lưu thành công!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: User Name & Basic Info */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" /> Thông Tin Người Dùng
          </h3>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={formData.user_name}
              onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
              className="w-full max-w-sm px-4 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Section 2: Preferred Categories */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Chuyên Mục Quan Tâm
          </h3>
          <p className="text-xs text-slate-400">Chọn các chuyên mục bạn muốn ưu tiên xuất hiện trong feed đề xuất:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const isSelected = formData.preferred_categories?.includes(cat.key);
              return (
                <div
                  key={cat.key}
                  onClick={() => toggleCategory(cat.key)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-semibold">{cat.title}</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                    isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-700'
                  }`}>
                    {isSelected && <span className="text-[10px]">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Runtimes & IDEs */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" /> AI Agent Runtimes & IDEs Bạn Thường Dùng
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {runtimes.map((rt) => {
              const isSelected = formData.preferred_runtimes?.includes(rt.name);
              return (
                <button
                  type="button"
                  key={rt.name}
                  onClick={() => toggleRuntime(rt.name)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {isSelected ? '✓ ' : ''}{rt.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Programming Languages */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Code className="w-4 h-4 text-sky-400" /> Ngôn Ngữ Lập Trình Ưu Tiên
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {standardLanguages.map((lang) => {
              const isSelected = formData.preferred_languages?.includes(lang);
              return (
                <button
                  type="button"
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {isSelected ? '✓ ' : ''}{lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 5: Custom Interested Tags */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Từ Khóa Quan Tâm (Tags)
          </h3>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="Thêm tag (ví dụ: mcp, bigquery, refactor)..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
              className="flex-1 px-4 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
            >
              Thêm
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.interested_tags?.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-800/40 font-mono text-xs"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-amber-100 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};
