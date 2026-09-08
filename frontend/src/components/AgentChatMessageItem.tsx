import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Bookmark,
  Check,
  Copy,
  Play,
  ExternalLink,
  Zap,
  CheckCircle2,
  FastForward,
  Star,
  MessageSquare
} from 'lucide-react';
import { AgentChatMessage, Skill } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TechLogo } from './TechLogo';
import { useTypewriter } from '../hooks/useTypewriter';

interface AgentChatMessageItemProps {
  message: AgentChatMessage;
  isLatest?: boolean;
  shouldAnimate?: boolean;
  isDrawer?: boolean;
  onSelectSkill: (skill: Skill) => void;
  onToggleBookmark: (skillId: number) => void;
  onGoToPlayground?: (skill: Skill) => void;
  onSendMessage: (query: string) => void;
  onCopyInstall?: (skill: Skill) => void;
  copiedSkillId?: number | null;
  onTypingTick?: () => void;
  t: (key: any) => string;
}

export const AgentChatMessageItem: React.FC<AgentChatMessageItemProps> = ({
  message,
  shouldAnimate = false,
  isDrawer = false,
  onSelectSkill,
  onToggleBookmark,
  onGoToPlayground,
  onSendMessage,
  onCopyInstall,
  copiedSkillId,
  onTypingTick,
  t
}) => {
  const [hasFinishedTyping, setHasFinishedTyping] = useState(!shouldAnimate);

  React.useEffect(() => {
    if (!shouldAnimate) {
      setHasFinishedTyping(true);
    }
  }, [shouldAnimate]);

  const { displayedText, isTyping, skip } = useTypewriter({
    text: message.content,
    enabled: shouldAnimate && !hasFinishedTyping,
    speedMs: 24,
    charsPerTick: 6,
    onTick: onTypingTick,
    onComplete: () => {
      setHasFinishedTyping(true);
    }
  });

  const handleSkip = () => {
    skip();
    setHasFinishedTyping(true);
  };

  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex gap-2.5 sm:gap-3 justify-end animate-slide-up">
        <div className="max-w-[85%] sm:max-w-[75%] space-y-1 flex flex-col items-end">
          <div className="p-3.5 sm:p-4 rounded-3xl rounded-tr-md neu-primary text-white text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1 font-mono">
            {message.timestamp}
          </span>
        </div>
        <div className="w-8 h-8 rounded-2xl neu-inset text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
          U
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-2.5 sm:gap-3 justify-start animate-slide-up">
      <div className="w-8 h-8 rounded-2xl neu-inset text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
        <Bot className="w-4.5 h-4.5" />
      </div>

      <div className={`flex-1 ${isDrawer ? 'max-w-[88%]' : 'max-w-[90%]'} space-y-3`}>
        {/* Assistant Bubble */}
        <div className="p-4 sm:p-5 rounded-3xl rounded-tl-md neu-flat text-slate-800 dark:text-slate-100 relative group">
          {/* Skip typing button */}
          {isTyping && (
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 px-2.5 py-1 rounded-xl neu-btn text-[10px] font-bold text-blue-600 flex items-center gap-1 transition-all"
              title={t('agent_chat_skip_typing')}
            >
              <FastForward className="w-3 h-3 text-blue-500" />
              <span>{t('agent_chat_skip_typing')}</span>
            </button>
          )}

          {/* Render parsed rich markdown with typewriter stream */}
          <MarkdownRenderer
            content={displayedText}
            isTyping={isTyping}
          />

          <div className="neu-divider mt-3 mb-2" />
          <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 dark:text-slate-500">
            <span>{message.timestamp}</span>
            {message.model_used && (
              <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg neu-inset-sm text-blue-600 font-bold">
                {message.model_used}
              </span>
            )}
          </div>
        </div>

        {/* Embedded RAG Recommended Skills Cards */}
        {hasFinishedTyping && message.recommended_skills && message.recommended_skills.length > 0 && (
          <div className="space-y-2.5 pt-1 animate-fade-in">
            <div className="flex items-center gap-2 px-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>{t('agent_chat_recommended_title')} ({message.recommended_skills.length})</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {message.recommended_skills.map((rec, rIdx) => {
                const skill = rec.skill;

                if (isDrawer) {
                  // Drawer Compact Card
                  return (
                    <div
                      key={rIdx}
                      className="p-4 rounded-2xl neu-flat space-y-2.5 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {skill.title || skill.name}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-mono font-bold neu-inset-sm text-blue-600 dark:text-blue-400 shrink-0">
                          {rec.relevance_score}% {t('agent_chat_match')}
                        </span>
                      </div>

                      {rec.match_reasons && rec.match_reasons.length > 0 && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 inline" />
                          <span>{rec.match_reasons[0]}</span>
                        </p>
                      )}

                      <div className="neu-divider my-2" />
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => onToggleBookmark(skill.id)}
                          className={`text-[11px] font-bold p-1.5 rounded-xl transition-all flex items-center gap-1 ${skill.is_bookmarked ? 'neu-inset text-amber-500' : 'neu-btn text-slate-500'}`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${skill.is_bookmarked ? 'fill-current text-amber-500' : ''}`} />
                          <span>{skill.is_bookmarked ? t('agent_chat_bookmarked') : t('agent_chat_bookmark')}</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {skill.repository_url && (
                            <a
                              href={skill.repository_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-xl neu-btn"
                              title="Mở GitHub Repository"
                            >
                              <span>GitHub</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          <button
                            onClick={() => onSelectSkill(skill)}
                            className="text-[11px] font-bold neu-primary px-3 py-1 rounded-xl text-white flex items-center gap-1 transition-all"
                          >
                            <span>{t('agent_chat_view_detail')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Full Page Detailed Card
                return (
                  <div
                    key={rIdx}
                    className="p-5 rounded-3xl neu-flat transition-all space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <TechLogo
                          name={skill.primary_language || skill.name}
                          className="w-11 h-11 p-2 rounded-2xl neu-inset shrink-0"
                        />
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                            <span>{skill.title || skill.name}</span>
                            <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-mono font-bold neu-inset-sm text-blue-600 dark:text-blue-400">
                              {rec.relevance_score}% {t('agent_chat_match')}
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                            <span>{skill.name}</span>
                            <span>•</span>
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                            <span>{skill.stars.toLocaleString()}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => onToggleBookmark(skill.id)}
                          className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                            skill.is_bookmarked
                              ? 'neu-inset text-amber-500 font-bold'
                              : 'neu-btn text-slate-500 hover:text-amber-500'
                          }`}
                          title={skill.is_bookmarked ? t('agent_chat_bookmarked') : t('agent_chat_bookmark')}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${skill.is_bookmarked ? 'fill-current text-amber-500' : ''}`} />
                        </button>

                        {onCopyInstall && (
                          <button
                            onClick={() => onCopyInstall(skill)}
                            className="p-2 rounded-xl text-xs font-semibold neu-btn text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-all"
                            title="Copy install command"
                          >
                            {copiedSkillId === skill.id ? (
                              <Check className="w-3.5 h-3.5 text-blue-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {onGoToPlayground && (
                          <button
                            onClick={() => onGoToPlayground(skill)}
                            className="p-2 rounded-xl text-xs font-semibold neu-btn text-blue-600 transition-all"
                            title={t('agent_chat_try_playground')}
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {skill.repository_url && (
                          <a
                            href={skill.repository_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold neu-btn text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-all"
                            title="Mở trên GitHub"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">GitHub</span>
                          </a>
                        )}

                        <button
                          onClick={() => onSelectSkill(skill)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl neu-primary text-white text-xs font-bold transition-all active:scale-95"
                        >
                          <span>{t('agent_chat_view_detail')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Match Reasons */}
                    {rec.match_reasons && rec.match_reasons.length > 0 && (
                      <div className="p-3.5 rounded-2xl neu-inset space-y-1.5">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('agent_chat_key_points')}
                        </span>
                        <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 ml-4 list-disc leading-relaxed">
                          {rec.match_reasons.map((mr, mrIdx) => (
                            <li key={mrIdx}>{mr}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Quick tip */}
                    {rec.quick_tip && (
                      <div className="text-xs text-blue-700 dark:text-blue-300 neu-inset-sm px-3.5 py-2.5 rounded-2xl flex items-center gap-2 font-medium">
                        <Zap className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                        <span className="leading-relaxed">{rec.quick_tip}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Follow-up Question Chips */}
        {hasFinishedTyping && message.suggested_followups && message.suggested_followups.length > 0 && (
          <div className="space-y-1.5 pt-1 animate-fade-in">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {t('agent_chat_followups_title')}
            </span>
            <div className="flex flex-wrap gap-2">
              {message.suggested_followups.map((fu, fuIdx) => (
                <button
                  key={fuIdx}
                  onClick={() => onSendMessage(fu)}
                  className="px-3 py-1.5 rounded-xl neu-btn text-xs font-semibold text-[var(--text-main)] hover:text-[var(--primary)] transition-all text-left flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>{fu}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
