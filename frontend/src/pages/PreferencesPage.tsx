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
  X,
  Star 
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
    const tag = tagInput.trim().toLowerCase().slice(0, 40);
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
      <div className="space-y-5 animate-pulse">
        <div className="h-20 rounded-3xl neu-inset" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-4">
            <div className="h-44 rounded-3xl neu-inset" />
            <div className="h-44 rounded-3xl neu-inset" />
          </div>
          <div className="lg:col-span-7 space-y-4">
            <div className="h-56 rounded-3xl neu-inset" />
            <div className="h-44 rounded-3xl neu-inset" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1650px] mx-auto">
      {/* Top Banner & Action Header */}
      <div className="p-5 sm:p-6 rounded-3xl neu-flat flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)]">{t('pref_title')}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-2xl">
              {t('pref_sub')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl neu-inset-sm text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {t('pref_saved_success')}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold neu-primary text-white active:scale-95 disabled:opacity-50 transition-all shrink-0 cursor-pointer shadow-md"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{saving ? 'Đang lưu...' : t('pref_save_btn')}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Profile, Thresholds & Tags (5 Columns on Desktop) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: User Profile */}
          <div className="p-5 rounded-3xl neu-flat space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[var(--primary)]" /> {t('user_info')}
            </h3>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                {t('pref_display_name')}
              </label>
              <input
                type="text"
                value={formData.user_name}
                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                className="w-full px-4 py-2 text-xs neu-inset bg-transparent rounded-2xl text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none font-medium transition-all"
              />
            </div>
          </div>

          {/* Card 2: Filter Thresholds */}
          <div className="p-5 rounded-3xl neu-flat space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" /> {t('filter_thresholds')}
            </h3>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-medium text-[var(--text-muted)]">{t('pref_min_stars')}</span>
                  <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-xl neu-inset-sm text-amber-500 flex items-center gap-1 whitespace-nowrap shrink-0">
                    {formData.min_stars.toLocaleString()}
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={formData.min_stars}
                  onChange={(e) => setFormData({ ...formData, min_stars: Number(e.target.value) })}
                  className="w-full cursor-pointer"
                  style={{ '--range-progress': `${Math.min(100, Math.max(0, (formData.min_stars / 5000) * 100))}%` } as React.CSSProperties}
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] mt-1.5 px-0.5">
                  <span className={formData.min_stars === 0 ? 'text-[var(--primary)] font-bold' : ''}>0</span>
                  <span className={formData.min_stars >= 2000 && formData.min_stars <= 3000 ? 'text-[var(--primary)] font-bold' : ''}>2,500</span>
                  <span className={formData.min_stars >= 4800 ? 'text-[var(--primary)] font-bold' : ''}>5,000+ Stars</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-medium text-[var(--text-muted)]">{t('pref_min_score')}</span>
                  <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-xl neu-inset-sm text-[var(--primary)] whitespace-nowrap shrink-0 inline-flex items-center">
                    {formData.min_trending_score} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.min_trending_score}
                  onChange={(e) => setFormData({ ...formData, min_trending_score: Number(e.target.value) })}
                  className="w-full cursor-pointer"
                  style={{ '--range-progress': `${Math.min(100, Math.max(0, (formData.min_trending_score / 100) * 100))}%` } as React.CSSProperties}
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] mt-1.5 px-0.5">
                  <span className={formData.min_trending_score === 0 ? 'text-[var(--primary)] font-bold' : ''}>0 (Tất cả)</span>
                  <span className={formData.min_trending_score >= 40 && formData.min_trending_score <= 60 ? 'text-[var(--primary)] font-bold' : ''}>50 (Chọn lọc)</span>
                  <span className={formData.min_trending_score >= 90 ? 'text-[var(--primary)] font-bold' : ''}>100 (Hot)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Interested Tags */}
          <div className="p-5 rounded-3xl neu-flat space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[var(--primary)]" /> {t('pref_tags')}
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
                className="px-4 py-2 text-xs neu-inset bg-transparent rounded-2xl text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none w-full transition-all"
                maxLength={40}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 rounded-2xl text-xs font-semibold neu-btn text-[var(--text-main)] hover:text-[var(--primary)] flex items-center gap-1 shrink-0 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> {t('add')}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.interested_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full neu-inset-sm text-[var(--primary)] text-[11px] font-mono flex items-center gap-1.5 max-w-full font-semibold"
                >
                  <span className="truncate max-w-[180px] sm:max-w-[280px]">#{tag}</span>
                  <X
                    className="w-3 h-3 cursor-pointer text-[var(--text-muted)] hover:text-rose-500 transition-colors shrink-0"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Categories, Runtimes, Languages (7 Columns on Desktop) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 4: Categories */}
          <div className="p-5 rounded-3xl neu-flat space-y-3">
            <div>
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[var(--primary)]" /> {t('pref_categories')}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
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
                    className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'neu-inset text-[var(--primary)] font-bold'
                        : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span className="text-xs truncate mr-2">{cat.title}</span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                      isSelected
                        ? 'neu-primary text-white'
                        : 'neu-inset-sm'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 5: Tools & Runtimes */}
          <div className="p-5 rounded-3xl neu-flat space-y-3">
            <div>
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[var(--primary)]" /> {t('pref_runtimes')}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
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
                    className={`p-2.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'neu-inset text-[var(--primary)] font-bold'
                        : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span className="text-xs font-mono truncate mr-1.5">{rt.name}</span>
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'neu-primary text-white'
                        : 'neu-inset-sm'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 6: Languages */}
          <div className="p-5 rounded-3xl neu-flat space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
              <Code className="w-3.5 h-3.5 text-[var(--primary)]" /> {t('pref_languages')}
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {standardLanguages.map((lang) => {
                const isSelected = formData.preferred_languages?.includes(lang);
                return (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3.5 py-1.5 rounded-2xl text-xs font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'neu-inset text-[var(--primary)] font-bold'
                        : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
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
