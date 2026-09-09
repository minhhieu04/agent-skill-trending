import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  Send,
  Trash2,
  Lightbulb,
  ArrowRight,
  Cpu,
  Plus,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Clock
} from 'lucide-react';
import { api } from '../api/client';
import {
  Skill,
  AgentChatMessage,
  AgentChatSuggestion,
  AgentChatSession
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { AgentChatMessageItem } from '../components/AgentChatMessageItem';
import {
  loadChatSessions,
  saveChatSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  createNewSession,
  generateSessionTitle
} from '../utils/chatStorage';
import { copyToClipboard } from '../utils/clipboard';

interface AgentChatPageProps {
  onSelectSkill: (skill: Skill) => void;
  onToggleBookmark: (skillId: number) => void;
  onGoToPlayground?: (skill: Skill) => void;
  initialQuery?: string;
}

export const AgentChatPage: React.FC<AgentChatPageProps> = ({
  onSelectSkill,
  onToggleBookmark,
  onGoToPlayground,
  initialQuery = ''
}) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  // Multi-session state
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

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<AgentChatSuggestion[]>([]);
  const [copiedSkillId, setCopiedSkillId] = useState<number | null>(null);
  const [animatingMessageId, setAnimatingMessageId] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Active session helper
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || createNewSession();
  const messages = activeSession.messages;

  // Only non-empty sessions are considered saved historical sessions
  const savedSessions = sessions.filter((s) => s.messages && s.messages.length > 0);

  // Persist sessions to localStorage whenever sessions change
  useEffect(() => {
    saveChatSessions(sessions);
  }, [sessions]);

  // Persist active session ID
  useEffect(() => {
    if (activeSessionId) {
      saveActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  // Sync activeSessionId with sessions if needed
  useEffect(() => {
    if (sessions.length > 0 && !sessions.some((s) => s.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  // Load prompt suggestions
  useEffect(() => {
    let isMounted = true;
    api.getAgentChatSuggestions(language).then((data) => {
      if (isMounted) setSuggestions(data);
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [language]);

  // Handle initialQuery if passed from other views
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      if (activeSession.messages.length > 0) {
        const nonEmpties = sessions.filter((s) => s.messages && s.messages.length > 0);
        const fresh = createNewSession(t('agent_chat_untitled'));
        setSessions([fresh, ...nonEmpties]);
        setActiveSessionId(fresh.id);
      }
      handleSendMessage(initialQuery.trim());
    }
  }, [initialQuery]);

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

  const handleCreateNewSession = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    // If current session is already empty, just focus input without creating duplicate
    if (activeSession.messages.length === 0) {
      inputRef.current?.focus();
      return;
    }
    // Discard any unsent empty sessions, prepend fresh session
    const nonEmpties = sessions.filter((s) => s.messages && s.messages.length > 0);
    const fresh = createNewSession(t('agent_chat_untitled'));
    setSessions([fresh, ...nonEmpties]);
    setActiveSessionId(fresh.id);
    setAnimatingMessageId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSelectSession = (id: string) => {
    // If current active session was an empty draft, discard it when switching to a saved session
    setSessions((prev) => prev.filter((s) => s.id === id || (s.messages && s.messages.length > 0)));
    setActiveSessionId(id);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    setAnimatingMessageId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
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

  const handleClearAllSessions = () => {
    if (window.confirm(t('agent_chat_confirm_clear_all'))) {
      const fresh = createNewSession(t('agent_chat_untitled'));
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      setAnimatingMessageId(null);
      showToast(language === 'vi' ? 'Đã xóa toàn bộ lịch sử' : 'All chat history cleared', 'info');
    }
  };

  const handleSendMessage = async (queryText: string) => {
    const text = queryText.trim();
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

    // Optimistically update sessions
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
      const historyPayload = messages.slice(-6).map((m) => ({
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
      showToast(err.message || 'Lỗi khi kết nối tới Agent Chat', 'error');
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

  const handleCopyInstall = async (skill: Skill) => {
    const slug = skill.name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const cmd = `mkdir -p .gemini/config/skills/${slug} && curl -s http://localhost:8899/api/v1/skills/${skill.id}/export/antigravity/raw > .gemini/config/skills/${slug}/SKILL.md`;
    await copyToClipboard(cmd);
    setCopiedSkillId(skill.id);
    showToast(language === 'vi' ? `Đã sao chép lệnh cài đặt cho ${skill.name}` : `Copied install command for ${skill.name}`, 'success');
    setTimeout(() => setCopiedSkillId(null), 2500);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] rounded-3xl neu-flat overflow-hidden animate-fade-in text-[var(--text-main)] relative">
      {/* Mobile/Tablet Backdrop Overlay for History Sidebar */}
      {isSidebarOpen && (
        <div
          className="lg:hidden absolute inset-0 bg-black/40 backdrop-blur-xs z-30 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* LEFT SIDEBAR: Multiple Chat Sessions */}
      <div
        className={`
          ${isSidebarOpen ? 'translate-x-0 w-72 sm:w-80 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0 lg:w-0'}
          absolute lg:relative inset-y-0 left-0 z-40
          shrink-0 bg-[var(--bg)] flex flex-col transition-all duration-300 overflow-hidden
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between gap-2.5">
          <button
            onClick={handleCreateNewSession}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl neu-primary text-white text-xs font-bold active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('agent_chat_new_chat')}</span>
          </button>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] transition-all cursor-pointer"
            title="Đóng thanh lịch sử"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="neu-divider" />

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-none">
          <div className="px-2 py-1 text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 font-bold">
            <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{t('agent_chat_sessions_title')} ({savedSessions.length})</span>
          </div>

          {savedSessions.length === 0 ? (
            <div className="py-6 px-3 text-center text-xs text-[var(--text-muted)] space-y-1">
              <p>{t('agent_chat_no_sessions')}</p>
            </div>
          ) : (
            savedSessions.map((session) => {
              const isActive = session.id === activeSession.id;
              const messageCount = session.messages.length;
              const dateStr = new Date(session.updatedAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all text-left ${
                    isActive
                      ? 'neu-inset text-[var(--primary)] font-bold'
                      : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'neu-primary text-white font-bold'
                          : 'neu-inset-sm text-[var(--primary)]'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs truncate ${isActive ? 'font-bold text-[var(--text-main)]' : 'text-[var(--text-main)]'}`}>
                        {session.title}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                        {dateStr} • {messageCount} tin nhắn
                      </p>
                    </div>
                  </div>

                  {/* Delete session button */}
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg neu-btn text-rose-500 hover:text-rose-600 transition-all shrink-0 cursor-pointer"
                    title={t('agent_chat_delete_session')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        {savedSessions.length > 0 && (
          <>
            <div className="neu-divider" />
            <div className="p-3.5 bg-[var(--bg)]">
              <button
                onClick={handleClearAllSessions}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl neu-btn text-xs font-semibold text-[var(--text-muted)] hover:text-rose-500 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('agent_chat_clear_all')}</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="hidden lg:block w-[1px] bg-gradient-to-b from-transparent via-[var(--shadow-dark)] to-transparent shrink-0 opacity-40" />

      {/* RIGHT MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg)]">
        {/* Header Bar */}
        <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 bg-[var(--bg)]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] transition-all shrink-0 cursor-pointer"
                title="Mở thanh lịch sử"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            <div className="w-9 h-9 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center font-bold shrink-0">
              <Bot className="w-4.5 h-4.5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[var(--text-main)] truncate">
                  {activeSession.messages.length === 0 ? t('agent_chat_new_chat') : (activeSession.title || t('agent_chat_title'))}
                </h2>
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-xl text-[10px] font-mono neu-inset-sm text-[var(--primary)] font-bold items-center gap-1.5 whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t('agent_chat_badge')}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                {messages.length > 0 ? `${messages.length} tin nhắn trong đoạn chat này` : t('agent_chat_sub')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCreateNewSession}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold neu-btn text-[var(--primary)] transition-all shrink-0 cursor-pointer"
              title={t('agent_chat_new_chat')}
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">{t('agent_chat_new_chat')}</span>
            </button>

            {messages.length > 0 && (
              <button
                onClick={() => handleDeleteSession(activeSession.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold neu-btn text-[var(--text-muted)] hover:text-rose-500 transition-all shrink-0 cursor-pointer"
                title={t('agent_chat_clear')}
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{t('agent_chat_clear')}</span>
              </button>
            )}
          </div>
        </div>

        <div className="neu-divider" />

        {/* Chat Messages Body */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-none"
        >
          {messages.length === 0 ? (
            /* Welcome Empty State */
            <div className="max-w-2xl mx-auto py-8 sm:py-12 space-y-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-3xl neu-inset text-[var(--primary)] flex items-center justify-center mx-auto shadow-sm">
                <Bot className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-black text-[var(--text-main)]">
                  {t('agent_chat_welcome_title')}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                  {t('agent_chat_welcome_sub')}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-inset-sm text-[11px] font-mono font-bold text-[var(--primary)]">
                  <Cpu className="w-3.5 h-3.5" />
                  {t('agent_chat_scanned_badge')}
                </div>
              </div>

              {/* Prompt Suggestion Cards */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
                  <Lightbulb className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>{t('agent_chat_suggested_prompts')}</span>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.query)}
                      className="p-4 text-left rounded-2xl neu-btn transition-all group active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">
                          {item.title}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {item.query}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Message List with Typewriter and Markdown rendering */
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <AgentChatMessageItem
                  key={msg.id}
                  message={msg}
                  shouldAnimate={msg.id === animatingMessageId}
                  isDrawer={false}
                  onSelectSkill={onSelectSkill}
                  onToggleBookmark={handleToggleBookmarkInSession}
                  onGoToPlayground={onGoToPlayground}
                  onSendMessage={handleSendMessage}
                  onCopyInstall={handleCopyInstall}
                  copiedSkillId={copiedSkillId}
                  onTypingTick={handleTypingTick}
                  t={t}
                />
              ))}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex gap-3 items-center text-xs text-[var(--text-muted)] animate-fade-in font-medium">
                  <Bot className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  <span>{t('agent_chat_scanning')}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="neu-divider" />

        {/* Input Area */}
        <div className="p-4 bg-[var(--bg)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputQuery);
            }}
            className="max-w-4xl mx-auto flex items-center gap-3"
          >
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputQuery);
                  }
                }}
                placeholder={t('agent_chat_input_placeholder')}
                rows={1}
                disabled={loading}
                className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl neu-inset text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none max-h-32 transition-colors bg-transparent border-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-5 py-3 rounded-2xl neu-primary text-white hover:opacity-95 disabled:opacity-40 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
            >
              <span>{t('agent_chat_send')}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
