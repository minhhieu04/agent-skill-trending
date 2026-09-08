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

    let md = `# Lộ Trình Học & Đề Xuất Kỹ Năng AI: ${recommendation.goal_query}\n\n`;
    md += `> **Độ khó:** ${recommendation.difficulty_level} | **Thời gian dự kiến:** ${recommendation.estimated_time}\n`;
    md += `> **Công nghệ:** ${recommendation.target_technologies.join(', ')}\n\n`;
    md += `## Tổng quan định hướng\n${recommendation.summary}\n\n`;
    md += `## Lộ Trình Phát Triển Từng Giai Đoạn (Milestones)\n\n`;

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
      md += `## Bộ AI Agent Skills Tuyển Chọn Trong Hệ Thống\n\n`;
      recommendation.recommended_skills.forEach((item) => {
        md += `- **${item.skill.title || item.skill.name}** (Match: ${item.match_score}%)\n`;
        md += `  *Lý do:* ${item.reason}\n`;
        md += `  *Repository:* ${item.skill.repository_url}\n\n`;
      });
    }

    if (recommendation.ai_tips.length > 0) {
      md += `## Lời khuyên thực chiến từ AI Tech Lead\n\n`;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/50 dark:bg-black/70 backdrop-blur-md animate-modal-backdrop overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--bg)] rounded-3xl neu-modal flex flex-col overflow-hidden animate-modal-pop text-[var(--text-main)]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 shadow-[0_4px_10px_var(--shadow-dark)] bg-[var(--bg)] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[var(--text-main)]">
                  {t('ai_modal_title')}
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full neu-inset-sm text-[var(--primary)] whitespace-nowrap shrink-0 inline-flex items-center">
                  {recommendation?.is_ai_powered ? 'Gemini 2.5 AI' : t('track_ai_advisor_badge')}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t('ai_modal_sub')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {loading ? (
            /* Loading State */
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center mx-auto animate-pulse">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-main)]">
                  {t('ai_analyzing')}
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                  Đang phân tích ngữ nghĩa, xây dựng lộ trình học và truy vấn kho dữ liệu để tìm ra các bộ AI Skills tốt nhất...
                </p>
              </div>
            </div>
          ) : recommendation ? (
            <>
              {/* Target & Summary Overview Card */}
              <div className="p-4 sm:p-5 rounded-2xl neu-flat space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Mục tiêu:</span>
                    <span className="text-xs font-mono font-bold text-[var(--primary)]">"{recommendation.goal_query}"</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-[var(--text-main)]">
                      <GraduationCap className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <strong>{t('ai_difficulty')}</strong> {recommendation.difficulty_level}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--text-main)]">
                      <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <strong>{t('ai_est_time')}</strong> {recommendation.estimated_time}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {recommendation.summary}
                </p>

                {recommendation.target_technologies.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--shadow-dark)]/20">
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] mr-1">{t('ai_tech_stack')}</span>
                    {recommendation.target_technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-mono neu-inset-sm text-[var(--text-main)]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 1: Interactive Learning Roadmap */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5 uppercase tracking-wider">
                  <Compass className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>{t('ai_roadmap_title')}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recommendation.roadmap.map((stage) => (
                    <div
                      key={stage.stage_number}
                      className="p-4 rounded-2xl neu-flat flex flex-col justify-between space-y-2.5"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg neu-primary text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                            {stage.stage_number}
                          </span>
                          <h4 className="text-xs font-bold text-[var(--text-main)] line-clamp-1">
                            {stage.title}
                          </h4>
                        </div>

                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-3">
                          {stage.description}
                        </p>
                      </div>

                      {stage.key_takeaways.length > 0 && (
                        <div className="pt-2 border-t border-[var(--shadow-dark)]/20 space-y-1">
                          {stage.key_takeaways.map((k, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[10px] text-[var(--text-muted)]">
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
                <h3 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>{t('ai_skills_title')} ({recommendation.recommended_skills.length})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommendation.recommended_skills.map((item, idx) => {
                    const skill = item.skill;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl neu-flat flex flex-col justify-between space-y-2.5 transition-all"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <h4
                                onClick={() => onSelectSkill(skill)}
                                className="text-xs font-bold text-[var(--text-main)] hover:text-[var(--primary)] cursor-pointer transition-colors line-clamp-1"
                              >
                                {skill.title || skill.name}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono">
                                <span>by {skill.author || 'Community'}</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-[var(--text-main)] font-semibold">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                  {skill.stars.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <span className="px-2.5 py-0.5 rounded-full neu-inset-sm text-[var(--primary)] text-[10px] font-mono font-semibold shrink-0">
                              {item.match_score}% {t('ai_match_score')}
                            </span>
                          </div>

                          {/* Recommendation Reason Box */}
                          <div className="p-2.5 rounded-xl neu-inset-sm text-[11px] text-[var(--text-muted)] leading-relaxed">
                            <strong className="text-[var(--text-main)] font-medium">Lý do: </strong>
                            {item.reason}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[var(--shadow-dark)]/20 flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full neu-inset-sm text-[var(--text-muted)]">
                            {skill.category}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {onToggleBookmark && (
                              <button
                                onClick={() => onToggleBookmark(skill.id)}
                                className={`p-2 rounded-xl text-xs transition-all ${
                                  skill.is_bookmarked
                                    ? 'neu-inset text-amber-500'
                                    : 'neu-btn text-[var(--text-muted)] hover:text-amber-500'
                                }`}
                                title="Lưu Bookmark"
                              >
                                <Bookmark className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              onClick={() => onSelectSkill(skill)}
                              className="px-3 py-1.5 rounded-xl neu-btn text-[var(--text-main)] hover:text-[var(--primary)] text-xs font-semibold transition-all flex items-center gap-1"
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
                <div className="p-4 sm:p-5 rounded-2xl neu-flat space-y-2">
                  <h4 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('ai_tips_title')}</span>
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {recommendation.ai_tips.map((tip, idx) => (
                      <li key={idx} className="text-[11px] text-[var(--text-muted)] flex items-start gap-2 leading-relaxed">
                        <span className="text-[var(--primary)] font-bold">•</span>
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
          <div className="p-4 sm:p-5 shadow-[0_-4px_10px_var(--shadow-dark)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-3 relative z-10">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl neu-btn text-[var(--text-main)] hover:text-[var(--primary)] text-xs font-semibold transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép!' : t('ai_btn_copy_roadmap')}</span>
            </button>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-2xl text-xs font-semibold neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
              >
                Đóng
              </button>

              <button
                onClick={handleApplyFilter}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl neu-primary text-white text-xs font-semibold transition-all"
              >
                <Sparkles className="w-3 h-3" />
                <span>{t('ai_btn_apply_filter')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
