import React, { useState, useEffect } from 'react';
import { UserPreference, CategoryInfo, RuntimeInfo } from '../types';
import { 
  Sliders, 
  Save, 
  CheckCircle2, 
  User, 
  Terminal, 
  Code, 
  Layers, 
  Sparkles, 
  Tag, 
  Plus, 
  X 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PreferencesPageProps {
  preference: UserPreference | null;
  categories: CategoryInfo[];
  runtimes: RuntimeInfo[];
  onSavePreference: (pref: UserPreference) => Promise<void>;
  loading?: boolean;
}

export const PreferencesPage: React.FC<PreferencesPageProps> = ({
  preference,
  categories,
  runtimes,
  onSavePreference,
  loading = false,
}) => {
  const { t } = useLanguage();

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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1650px] mx-auto">
      {/* Top Banner & Action Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{t('pref_title')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
              {t('pref_sub')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {t('pref_saved_success')}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50 transition-all shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : t('pref_save_btn')}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile, Thresholds & Tags (4 Columns on Desktop) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: User Profile */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" /> {t('user_info')}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                {t('pref_display_name')}
              </label>
              <input
                type="text"
                value={formData.user_name}
                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                className="w-full px-4 py-2 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:border-emerald-500 outline-none font-medium"
              />
            </div>
          </div>

          {/* Card 2: Filter Thresholds */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> {t('filter_thresholds')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                  <span>{t('pref_min_stars')}</span>
                  <span className="font-mono font-bold text-amber-500">{formData.min_stars} ★</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={formData.min_stars}
                  onChange={(e) => setFormData({ ...formData, min_stars: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                  <span>{t('pref_min_score')}</span>
                  <span className="font-mono font-bold text-emerald-500">{formData.min_trending_score}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.min_trending_score}
                  onChange={(e) => setFormData({ ...formData, min_trending_score: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Interested Tags */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500" /> {t('pref_tags')}
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={t('pref_tags_placeholder')}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:border-emerald-500 outline-none w-full"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> {t('add')}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.interested_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono flex items-center gap-1.5 hover:scale-105 transition-transform"
                >
                  #{tag}
                  <X
                    className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500 transition-colors"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Categories, Runtimes, Languages (7 Columns on Desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 4: Categories */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" /> {t('pref_categories')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {t('pref_categories_sub')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {categories.map((cat) => {
                const isSelected = formData.preferred_categories?.includes(cat.key);
                return (
                  <div
                    key={cat.key}
                    onClick={() => toggleCategory(cat.key)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/50 text-indigo-900 dark:text-indigo-200 shadow-sm font-bold'
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs truncate mr-2">{cat.title}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-transform ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white scale-110'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 5: Tools & Runtimes */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500" /> {t('pref_runtimes')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {t('pref_runtimes_sub')}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {runtimes.map((rt) => {
                const isSelected = formData.preferred_runtimes?.includes(rt.name);
                return (
                  <div
                    key={rt.name}
                    onClick={() => toggleRuntime(rt.name)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-mono truncate mr-1.5">{rt.name}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-transform ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white scale-110'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 6: Languages */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-sky-500" /> {t('pref_languages')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {standardLanguages.map((lang) => {
                const isSelected = formData.preferred_languages?.includes(lang);
                return (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all duration-200 hover:scale-105 active:scale-95 ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-sm font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
