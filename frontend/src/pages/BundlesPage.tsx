import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  Sparkles, 
  Terminal, 
  Palette, 
  Cpu, 
  Bookmark, 
  Download, 
  Star, 
  CheckCircle2 
} from 'lucide-react';
import { api } from '../api/client';
import { SkillBundle } from '../types';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { GridSkeleton } from '../components/Skeleton';

interface BundlesPageProps {
  onSelectSkillById?: (skillId: number) => void;
}

export const BundlesPage: React.FC<BundlesPageProps> = ({ onSelectSkillById }) => {
  const { data: bundles, isLoading } = useQuery<SkillBundle[]>({
    queryKey: ['bundles'],
    queryFn: api.getBundles,
  });

  const { showToast } = useToast();
  const { t } = useLanguage();
  const [bookmarkingSlug, setBookmarkingSlug] = useState<string | null>(null);

  const getBundleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Terminal': return <Terminal className="w-6 h-6 text-cyan-500" />;
      case 'Palette': return <Palette className="w-6 h-6 text-pink-500" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-indigo-500" />;
      default: return <Sparkles className="w-6 h-6 text-amber-500" />;
    }
  };

  const handleBookmarkBundle = async (slug: string) => {
    setBookmarkingSlug(slug);
    try {
      const res = await api.bookmarkBundle(slug);
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu bundle', 'error');
    } finally {
      setBookmarkingSlug(null);
    }
  };

  const handleExportBundle = async (slug: string) => {
    try {
      const res = await api.exportBundle(slug, 'antigravity');
      const blob = new Blob([res.combined_content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slug}-bundle.md`;
      link.click();
      URL.revokeObjectURL(url);
      showToast(`${t('downloaded_file')} ${slug}-bundle.md`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xuất bundle', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {t('bundles_title')}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold">
                {t('starter_packs')}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {t('bundles_sub')}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <GridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {bundles?.map((bundle) => (
            <div
              key={bundle.id}
              className="group p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1.5 transition-all duration-300 ease-spring flex flex-col justify-between space-y-5"
            >
              <div>
                {/* Top Badge & Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform">
                      {getBundleIcon(bundle.icon)}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                        {bundle.badge}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                        {bundle.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-500 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{Math.round(bundle.stars_total / 1000)}k+ stars</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {bundle.description}
                </p>

                {/* Target Stack Tag */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs font-mono text-slate-600 dark:text-slate-300 mb-4 flex items-center justify-between">
                  <span className="text-slate-400">{t('target_stack')}:</span>
                  <strong className="text-slate-800 dark:text-slate-100">{bundle.target_stack}</strong>
                </div>

                {/* Included Skills List */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    {t('included_skills')} ({bundle.skills?.length || 0}):
                  </div>
                  <div className="space-y-1.5">
                    {bundle.skills?.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => onSelectSkillById && onSelectSkillById(s.id)}
                        className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs cursor-pointer hover:border-emerald-500 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate mr-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {s.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                          <span className="text-slate-400">{s.category}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {s.trending_score} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleBookmarkBundle(bundle.slug)}
                  disabled={bookmarkingSlug === bundle.slug}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{t('btn_bookmark_bundle')}</span>
                </button>

                <button
                  onClick={() => handleExportBundle(bundle.slug)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-emerald-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('btn_export_bundle')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
