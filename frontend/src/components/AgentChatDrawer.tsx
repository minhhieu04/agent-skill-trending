import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  Send,
  X,
  Maximize2,
  Plus,
  ArrowRight,
  MessageSquare,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { api } from '../api/client';
import { Skill, AgentChatMessage, AgentChatSuggestion, AgentChatSession } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { AgentChatMessageItem } from './AgentChatMessageItem';
import {
  loadChatSessions,
  saveChatSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  createNewSession,
  generateSessionTitle
} from '../utils/chatStorage';

interface AgentChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExpandToFullPage: () => void;
  onSelectSkill: (skill: Skill) => void;
  onToggleBookmark: (skillId: number) => void;
}

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  isOpen,
  onClose,
  onExpandToFullPage,
  onSelectSkill,
  onToggleBookmark
}) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState<AgentChatSession[]>(() => {
    const loaded = loadChatSessions();
    if (loaded.length > 0) {
      return loaded;
    }
    return [createNewSession()];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const savedActiveId = loadActiveSessionId();
    const found = sessions.find((s) => s.id === savedActiveId);
    return found ? found.id : sessions[0]?.id || '';
  });

  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<AgentChatSuggestion[]>([]);
  const [animatingMessageId, setAnimatingMessageId] = useState<string | null>(null);
  const [showSessionDropdown, setShowSessionDropdown] = useState<boolean>(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reload sessions when drawer opens to stay synced with page
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      const reloaded = loadChatSessions();
      const activeId = loadActiveSessionId();
      if (reloaded.length > 0) {
        if (activeId && reloaded.some((s) => s.id === activeId)) {
          setSessions(reloaded);
          setActiveSessionId(activeId);
        } else {
          setSessions((prev) => {
            const currentActive = prev.find((s) => s.id === activeSessionId);
            if (currentActive && currentActive.messages.length === 0) {
              return [currentActive, ...reloaded];
            }
            return reloaded;
          });
        }
      } else {
        setSessions((prev) => {
          if (prev.length > 0 && prev[0].messages.length === 0) return prev;
          const fresh = createNewSession(t('agent_chat_untitled'));
          setActiveSessionId(fresh.id);
          return [fresh];
        });
      }
    }
  }, [isOpen]);

  // Handle ESC key to dismiss drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Persist sessions
  useEffect(() => {
    saveChatSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
      saveActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  // Sync activeSessionId with available sessions
  useEffect(() => {
    if (sessions.length > 0 && !sessions.some((s) => s.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    let isMounted = true;
    api.getAgentChatSuggestions(language).then((data) => {
      if (isMounted) setSuggestions(data.slice(0, 3));
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [language]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || createNewSession();
  const messages = activeSession.messages;
  const savedSessions = sessions.filter((s) => s.messages && s.messages.length > 0);

  // Auto scroll on new messages or loading
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, loading]);

  const scrollRafRef = useRef<number | null>(null);

  const handleTypingTick = useCallback(() => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        const el = messagesContainerRef.current;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
        if (isNearBottom) {
          el.scrollTop = el.scrollHeight;
        }
      }
      scrollRafRef.current = null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  const handleToggleBookmarkInSession = (skillId: number) => {
    onToggleBookmark(skillId);
    setSessions((prevSessions) =>
      prevSessions.map((session) => ({
        ...session,
        messages: session.messages.map((msg) => {
          if (!msg.recommended_skills) return msg;
          return {
            ...msg,
            recommended_skills: msg.recommended_skills.map((rec) => {
              if (rec.skill.id === skillId) {
                return {
                  ...rec,
                  skill: {
                    ...rec.skill,
                    is_bookmarked: !rec.skill.is_bookmarked
                  }
                };
              }
              return rec;
            })
          };
        })
      }))
    );
  };

  const handleDeleteSession = (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== sessionId);
    const remainingSaved = remaining.filter((s) => s.messages && s.messages.length > 0);

    if (remainingSaved.length === 0) {
      const fresh = createNewSession(t('agent_chat_untitled'));
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      setAnimatingMessageId(null);
      showToast(language === 'vi' ? 'Đã làm mới cuộc trò chuyện' : 'Chat session refreshed', 'info');
      return;
    }

    setSessions(remaining);
    if (activeSessionId === sessionId) {
      setActiveSessionId(remainingSaved[0].id);
      setAnimatingMessageId(null);
    }
    showToast(language === 'vi' ? 'Đã xóa cuộc trò chuyện' : 'Chat deleted', 'info');
  };

  if (!isOpen) return null;

  const handleCreateNewSession = () => {
    if (activeSession.messages.length === 0) {
      setShowSessionDropdown(false);
      inputRef.current?.focus();
      return;
    }
    const nonEmpties = sessions.filter((s) => s.messages && s.messages.length > 0);
    const fresh = createNewSession(t('agent_chat_untitled'));
    setSessions([fresh, ...nonEmpties]);
    setActiveSessionId(fresh.id);
    setAnimatingMessageId(null);
    setShowSessionDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const userMsg: AgentChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const isFirstMessage = messages.length === 0;
    const sessionTitle = isFirstMessage
      ? generateSessionTitle(text, t('agent_chat_untitled'))
      : activeSession.title;

    const updatedMessages = [...messages, userMsg];

    const nextSessions = sessions.map((s) => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          title: sessionTitle,
          updatedAt: Date.now(),
          messages: updatedMessages
        };
      }
      return s;
    });

    setSessions(nextSessions);
    setInputQuery('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.sendAgentChatMessage(text, historyPayload, language);

      const assistantMsg: AgentChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommended_skills: res.recommended_skills,
        suggested_followups: res.suggested_followups,
        model_used: res.model_used,
        is_ai_powered: res.is_ai_powered
      };

      setAnimatingMessageId(assistantMsg.id);

      const finalSessions = nextSessions.map((s) => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: [...updatedMessages, assistantMsg]
          };
        }
        return s;
      });

      setSessions(finalSessions);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi gửi yêu cầu', 'error');
      const errorMsg: AgentChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: language === 'vi'
          ? 'Rất tiếc, đã có sự cố kết nối tới hệ thống RAG. Vui lòng thử lại sau giây lát.'
          : 'Apologies, a network error occurred while connecting to the RAG engine. Please try again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const withErrorSessions = nextSessions.map((s) => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: [...updatedMessages, errorMsg]
          };
        }
        return s;
      });
      setSessions(withErrorSessions);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <>
      {/* Backdrop overlay for outside click & iOS scrollchain prevention */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-fade-in transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[var(--bg)] shadow-[-10px_0_30px_var(--shadow-dark)] z-50 flex flex-col animate-slide-left text-[var(--text-main)]">
      {/* Header */}
      <div className="p-4 shadow-[0_4px_10px_var(--shadow-dark)] flex items-center justify-between bg-[var(--bg)] relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center font-bold shrink-0">
            <Bot className="w-4 h-4" />
          </div>

          <div className="min-w-0 relative">
            <button
              onClick={() => setShowSessionDropdown(!showSessionDropdown)}
              className="flex items-center gap-1.5 text-left text-xs sm:text-sm font-semibold text-[var(--text-main)] hover:text-[var(--primary)] transition-colors truncate max-w-[210px] sm:max-w-[240px]"
            >
              <span className="truncate">
                {activeSession.messages.length === 0
                  ? t('agent_chat_new_chat')
                  : activeSession.title || t('agent_chat_title')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
            </button>
            <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
              {savedSessions.length} {t('agent_chat_sessions_title').toLowerCase()}
            </p>

            {/* Session Dropdown Menu */}
            {showSessionDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSessionDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-72 max-h-72 overflow-y-auto rounded-2xl neu-modal z-50 p-2.5 space-y-1.5 scrollbar-thin animate-scale-in">
                  <button
                    onClick={handleCreateNewSession}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl neu-primary text-white transition-opacity cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('agent_chat_new_chat')}</span>
                  </button>
                  <div className="my-1.5" />
                  {savedSessions.length === 0 ? (
                    <div className="py-3 px-2 text-center text-xs text-[var(--text-muted)]">
                      {t('agent_chat_no_sessions')}
                    </div>
                  ) : (
                    savedSessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSessions((prev) => prev.filter((item) => item.id === s.id || (item.messages && item.messages.length > 0)));
                          setActiveSessionId(s.id);
                          setShowSessionDropdown(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all cursor-pointer group ${
                          s.id === activeSession.id
                            ? 'neu-inset text-[var(--primary)] font-semibold'
                            : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[var(--primary)]" />
                          <span className="truncate">{s.title}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-all shrink-0"
                          title={t('agent_chat_delete_session')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {messages.length > 0 && (
            <button
              onClick={() => handleDeleteSession(activeSession.id)}
              className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-rose-500 transition-all"
              title={t('agent_chat_clear')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleCreateNewSession}
            className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            title={t('agent_chat_new_chat')}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onExpandToFullPage}
            className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            title={t('agent_chat_open_full')}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
            title={t('agent_chat_close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="py-8 text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl neu-inset text-[var(--primary)] mx-auto flex items-center justify-center">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-main)]">
                {t('agent_chat_welcome_title')}
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto mt-1 leading-relaxed">
                {t('agent_chat_sub')}
              </p>
            </div>

            {/* Quick suggestions */}
            <div className="space-y-2 pt-2 text-left">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                {t('agent_chat_suggested_prompts')}:
              </span>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.query)}
                  className="w-full p-3 rounded-2xl neu-btn text-left transition-all text-xs font-medium text-[var(--text-main)] flex items-center justify-between group active:scale-[0.99]"
                >
                  <span className="truncate pr-2">{s.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <AgentChatMessageItem
              key={msg.id}
              message={msg}
              shouldAnimate={msg.id === animatingMessageId}
              isDrawer={true}
              onSelectSkill={onSelectSkill}
              onToggleBookmark={handleToggleBookmarkInSession}
              onSendMessage={handleSendMessage}
              onTypingTick={handleTypingTick}
              t={t}
            />
          ))
        )}

        {loading && (
          <div className="flex gap-2.5 items-center text-xs text-[var(--text-muted)] animate-fade-in">
            <Bot className="w-4 h-4 animate-spin text-[var(--primary)]" />
            <span>{t('agent_chat_scanning')}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3.5 shadow-[0_-4px_10px_var(--shadow-dark)] bg-[var(--bg)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputQuery);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={t('agent_chat_drawer_placeholder')}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-2xl neu-inset bg-transparent text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="p-2.5 px-3.5 rounded-2xl neu-primary text-white font-medium transition-all disabled:opacity-40 shrink-0 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
    </>
  );
};
