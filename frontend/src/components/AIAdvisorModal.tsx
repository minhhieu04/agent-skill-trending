import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Compass,
  Clock,
  GraduationCap,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Layers,
  Bookmark,
  Lightbulb,
  Cpu,
  Star
} from 'lucide-react';
import { AIRecommendationResponse, Skill } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: AIRecommendationResponse | null;
  loading: boolean;
  onSelectSkill: (skill: Skill) => void;
  onApplyFilter?: (queryText: string) => void;
  onToggleBookmark?: (skillId: number) => void;
}

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  isOpen,
  onClose,
  recommendation,
  loading,
  onSelectSkill,
  onApplyFilter,
  onToggleBookmark,
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyMarkdown = () => {
    if (!recommendation) return;

    let md = `# 🎯 Lộ Trình Học & Đề Xuất Kỹ Năng AI: ${recommendation.goal_query}\n\n`;
    md += `> **Độ khó:** ${recommendation.difficulty_level} | **Thời gian dự kiến:** ${recommendation.estimated_time}\n`;
    md += `> **Công nghệ:** ${recommendation.target_technologies.join(', ')}\n\n`;
    md += `## 📌 Tổng quan định hướng\n${recommendation.summary}\n\n`;
    md += `## 🚀 Lộ Trình Phát Triển Từng Giai Đoạn (Milestones)\n\n`;

    recommendation.roadmap.forEach((stage) => {
      md += `### ${stage.title}\n`;
      md += `${stage.description}\n\n`;
      if (stage.key_takeaways.length > 0) {
        md += `*Kiến thức trọng tâm:*\n`;
        stage.key_takeaways.forEach((k) => {
          md += `- ${k}\n`;
        });
        md += `\n`;
      }
    });

    if (recommendation.recommended_skills.length > 0) {
      md += `## ⚡ Bộ AI Agent Skills Tuyển Chọn Trong Hệ Thống\n\n`;
      recommendation.recommended_skills.forEach((item) => {
        md += `- **${item.skill.title || item.skill.name}** (Match: ${item.match_score}%)\n`;
        md += `  *Lý do:* ${item.reason}\n`;
        md += `  *Repository:* ${item.skill.repository_url}\n\n`;
      });
    }

    if (recommendation.ai_tips.length > 0) {
      md += `## 💡 Lời khuyên thực chiến từ AI Tech Lead\n\n`;
      recommendation.ai_tips.forEach((tip) => {
        md += `- ${tip}\n`;
      });
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(md);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = md;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showToast(t('ai_toast_copied'), 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Không thể sao chép tự động', 'error');
    }
  };

  const handleApplyFilter = () => {
    if (!recommendation) return;
    if (onApplyFilter) {
      onApplyFilter(recommendation.goal_query);
      showToast(t('ai_toast_applied'), 'success');
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-modal-backdrop overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-modal-pop"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  {t('ai_modal_title')}
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase bg-emerald-500 text-white rounded-full shadow-sm">
                  {recommendation?.is_ai_powered ? 'Gemini 2.5 AI' : t('track_ai_advisor_badge')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('ai_modal_sub')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            /* Loading State */
            <div className="py-16 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 animate-spin">
                  <Cpu className="w-8 h-8" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('ai_analyzing')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Đang phân tích ngữ nghĩa, xây dựng lộ trình học và truy vấn kho dữ liệu để tìm ra các bộ AI Skills tốt nhất...
                </p>
              </div>
            </div>
          ) : recommendation ? (
            <>
              {/* Target & Summary Overview Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mục tiêu:</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">"{recommendation.goal_query}"</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                      <strong>{t('ai_difficulty')}</strong> {recommendation.difficulty_level}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                      <Clock className="w-3.5 h-3.5 text-sky-500" />
                      <strong>{t('ai_est_time')}</strong> {recommendation.estimated_time}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {recommendation.summary}
                </p>

                {recommendation.target_technologies.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">{t('ai_tech_stack')}</span>
                    {recommendation.target_technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 1: Interactive Learning Roadmap */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span>{t('ai_roadmap_title')}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {recommendation.roadmap.map((stage) => (
                    <div
                      key={stage.stage_number}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {stage.stage_number}
                          </span>
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 line-clamp-1">
                            {stage.title}
                          </h4>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                          {stage.description}
                        </p>
                      </div>

                      {stage.key_takeaways.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                          {stage.key_takeaways.map((k, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{k}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Curated AI Skills Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-500" />
                    <span>{t('ai_skills_title')} ({recommendation.recommended_skills.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {recommendation.recommended_skills.map((item, idx) => {
                    const skill = item.skill;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <h4
                                onClick={() => onSelectSkill(skill)}
                                className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors line-clamp-1"
                              >
                                {skill.title || skill.name}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>by {skill.author || 'Community'}</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  {skill.stars.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold font-mono shrink-0">
                              ✨ {item.match_score}% {t('ai_match_score')}
                            </span>
                          </div>

                          {/* Recommendation Reason Box */}
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            <strong className="text-emerald-600 dark:text-emerald-400">Tại sao nên chọn: </strong>
                            {item.reason}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {skill.category}
                          </span>

                          <div className="flex items-center gap-2">
                            {onToggleBookmark && (
                              <button
                                onClick={() => onToggleBookmark(skill.id)}
                                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                  skill.is_bookmarked
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700'
                                }`}
                                title="Lưu Bookmark"
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => onSelectSkill(skill)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <span>{t('ai_btn_view_detail')}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: AI Tips & Best Practices */}
              {recommendation.ai_tips.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 space-y-2">
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>{t('ai_tips_title')}</span>
                  </h4>
                  <ul className="space-y-1 pl-1">
                    {recommendation.ai_tips.map((tip, idx) => (
                      <li key={idx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        {recommendation && !loading && (
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép!' : t('ai_btn_copy_roadmap')}</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              >
                Đóng
              </button>

              <button
                onClick={handleApplyFilter}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('ai_btn_apply_filter')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
