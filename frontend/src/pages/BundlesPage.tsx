import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  Bookmark, 
  Download, 
  Star 
} from 'lucide-react';
import { api } from '../api/client';
import { SkillBundle } from '../types';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { GridSkeleton } from '../components/Skeleton';
import { TechLogo } from '../components/TechLogo';

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

  const cleanTitle = (title: string) => {
    return title.replace(/^[^\w\s\(\)\[\]\.\-]+/u, '').trim();
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
      <div className="p-5 sm:p-6 rounded-3xl neu-flat flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                {t('bundles_title')}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono neu-inset-sm text-[var(--primary)] font-semibold whitespace-nowrap shrink-0 inline-flex items-center">
                {t('starter_packs')}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-2xl">
              {t('bundles_sub')}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <GridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 animate-fade-in">
          {bundles?.map((bundle) => (
            <div
              key={bundle.id}
              className="p-5 sm:p-6 rounded-3xl neu-flat flex flex-col justify-between space-y-5 transition-all duration-200 hover:-translate-y-1"
            >
              <div>
                {/* Top Badge & Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center shrink-0 mt-0.5">
                      <TechLogo name={bundle.slug || bundle.title || bundle.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full neu-inset-sm text-[var(--text-muted)] whitespace-nowrap shrink-0 inline-flex items-center">
                        {bundle.badge}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] mt-1 leading-snug line-clamp-2">
                        {cleanTitle(bundle.title)}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono font-medium text-amber-500 neu-inset-sm px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{Math.round(bundle.stars_total / 1000)}k+ stars</span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                  {bundle.description}
                </p>

                {/* Target Stack Tag */}
                <div className="p-3 rounded-2xl neu-inset text-xs font-mono text-[var(--text-main)] mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                  <span className="text-[var(--text-muted)] font-semibold shrink-0">{t('target_stack')}:</span>
                  <div className="flex items-center gap-2 font-bold text-[var(--primary)] min-w-0">
                    <TechLogo name={bundle.target_stack} className="w-4 h-4 shrink-0" />
                    <span className="truncate">{bundle.target_stack}</span>
                  </div>
                </div>

                {/* Included Skills List */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
                    {t('included_skills')} ({bundle.skills?.length || 0}):
                  </div>
                  <div className="space-y-2">
                    {bundle.skills?.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => onSelectSkillById && onSelectSkillById(s.id)}
                        className="p-2.5 rounded-2xl neu-btn flex items-center justify-between text-xs cursor-pointer transition-all gap-2"
                        title={cleanTitle(s.title)}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                          <TechLogo name={s.name || s.primary_language || s.title} className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-semibold text-[var(--text-main)] truncate min-w-0 flex-1">
                            {cleanTitle(s.title)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                          <span className="text-[var(--text-muted)] hidden sm:inline">{s.category}</span>
                          <span className="text-[var(--primary)] font-bold whitespace-nowrap">
                            {s.trending_score} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[var(--shadow-dark)]/20 grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleBookmarkBundle(bundle.slug)}
                  disabled={bookmarkingSlug === bundle.slug}
                  className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 rounded-2xl neu-btn text-[var(--text-main)] hover:text-[var(--primary)] text-xs font-semibold active:scale-[0.97] transition-all cursor-pointer min-w-0"
                >
                  <Bookmark className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t('btn_bookmark_bundle')}</span>
                </button>

                <button
                  onClick={() => handleExportBundle(bundle.slug)}
                  className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 rounded-2xl neu-primary text-white text-xs font-semibold active:scale-[0.97] transition-all cursor-pointer min-w-0"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t('btn_export_bundle')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
