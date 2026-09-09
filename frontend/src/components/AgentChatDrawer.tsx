import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  Send,
  X,
  Maximize2,
  Plus,
  ArrowRight,
  ChevronDown,
  Trash2,
  Lock,
  LogIn
} from 'lucide-react';
import { api } from '../api/client';
import { Skill, AgentChatMessage, AgentChatSuggestion, AgentChatSession } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { AgentChatMessageItem } from './AgentChatMessageItem';
import {
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
  onOpenLogin?: () => void;
}

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  isOpen,
  onClose,
  onExpandToFullPage,
  onSelectSkill,
  onToggleBookmark,
  onOpenLogin
}) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState<AgentChatSession[]>([createNewSession()]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<AgentChatSuggestion[]>([]);
  const [animatingMessageId, setAnimatingMessageId] = useState<string | null>(null);
  const [showSessionDropdown, setShowSessionDropdown] = useState<boolean>(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync sessions with DB when drawer opens
  const fetchSessionsFromDb = useCallback(async () => {
    if (!user) return;
    try {
      const summaries = await api.getAgentChatSessions();
      if (summaries && summaries.length > 0) {
        const loaded: AgentChatSession[] = summaries.map((s) => ({
          id: s.id,
          title: s.title,
          createdAt: new Date(s.created_at).getTime(),
          updatedAt: new Date(s.updated_at).getTime(),
          messages: []
        }));
        setSessions(loaded);

        const savedActiveId = loadActiveSessionId();
        const targetId = loaded.some((s) => s.id === savedActiveId) ? savedActiveId! : loaded[0].id;
        setActiveSessionId(targetId);

        try {
          const detail = await api.getAgentChatSessionDetail(targetId);
          setSessions((prev) =>
            prev.map((s) =>
              s.id === targetId
                ? {
                    ...s,
                    messages: (detail.messages || []).map((m) => ({
                      id: `msg-${m.id}`,
                      role: m.role as 'user' | 'assistant',
                      content: m.content,
                      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      recommended_skills: m.recommended_skills,
                      suggested_followups: m.suggested_followups || [],
                      model_used: m.model_used,
                      is_ai_powered: m.is_ai_powered
                    }))
                  }
                : s
            )
          );
        } catch (e) {
          console.error('Failed to load active session detail in drawer', e);
        }
      } else {
        const fresh = createNewSession(t('agent_chat_untitled'));
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
      }
    } catch (e) {
      console.error('Failed to fetch sessions from DB in drawer', e);
    }
  }, [user, t]);

  useEffect(() => {
    if (isOpen && user) {
      setTimeout(() => inputRef.current?.focus(), 150);
      fetchSessionsFromDb();
    }
  }, [isOpen, user, fetchSessionsFromDb]);

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

  // Persist active session ID
  useEffect(() => {
    if (activeSessionId) {
      saveActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

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
  const messages = activeSession.messages || [];
  const savedSessions = sessions.filter((s) => s.messages && s.messages.length > 0);

  // Auto scroll
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

  const handleDeleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await api.deleteAgentChatSession(sessionId);
    } catch (err) {
      console.warn('Delete session error in drawer:', err);
    }

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
      handleSelectSession(remainingSaved[0].id);
    }
    showToast(language === 'vi' ? 'Đã xóa đoạn chat' : 'Chat deleted', 'info');
  };

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

  const handleSelectSession = async (id: string) => {
    setActiveSessionId(id);
    setShowSessionDropdown(false);
    setAnimatingMessageId(null);

    const target = sessions.find((s) => s.id === id);
    if (target && target.messages.length === 0) {
      try {
        const detail = await api.getAgentChatSessionDetail(id);
        setSessions((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  messages: (detail.messages || []).map((m) => ({
                    id: `msg-${m.id}`,
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                    timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    recommended_skills: m.recommended_skills,
                    suggested_followups: m.suggested_followups || [],
                    model_used: m.model_used,
                    is_ai_powered: m.is_ai_powered
                  }))
                }
              : s
          )
        );
      } catch (err) {
        console.error('Failed to load session messages in drawer', err);
      }
    }
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

      const res = await api.sendAgentChatMessage(
        text,
        historyPayload,
        language,
        activeSession.id.startsWith('session-') ? activeSession.id : undefined
      );

      const serverSessionId = res.session_id || activeSession.id;

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
        if (s.id === activeSession.id || s.id === serverSessionId) {
          return {
            ...s,
            id: serverSessionId,
            updatedAt: Date.now(),
            messages: [...updatedMessages, assistantMsg]
          };
        }
        return s;
      });

      setSessions(finalSessions);
      setActiveSessionId(serverSessionId);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi gửi tin nhắn', 'error');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] md:w-[540px] flex flex-col bg-[var(--bg)] shadow-2xl transition-transform duration-300 ease-out border-l border-slate-200/50 dark:border-zinc-800/50 text-[var(--text-main)]"
        role="dialog"
        aria-label="Agent Chat Drawer"
      >
        {/* Drawer Header */}
        <div className="px-4 py-3 border-b border-slate-200/40 dark:border-zinc-800/40 flex items-center justify-between gap-2 shrink-0 bg-[var(--bg)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center font-bold shrink-0">
              <Bot className="w-4 h-4" />
            </div>

            {/* Session Selector Dropdown */}
            {user ? (
              <div className="relative min-w-0">
                <button
                  onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                  className="flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-xl neu-btn text-xs font-bold text-[var(--text-main)] truncate max-w-[200px] sm:max-w-[240px] cursor-pointer"
                  title={activeSession.title}
                >
                  <span className="truncate">
                    {activeSession.messages && activeSession.messages.length === 0
                      ? t('agent_chat_new_chat')
                      : (activeSession.title || t('agent_chat_title'))}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${showSessionDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showSessionDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowSessionDropdown(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl neu-flat bg-[var(--bg)] shadow-2xl p-2 z-40 border border-slate-200/50 dark:border-zinc-800/50 space-y-1 animate-scale-in">
                      <button
                        onClick={handleCreateNewSession}
                        className="w-full flex items-center gap-2 p-2 rounded-xl neu-btn text-xs font-bold text-[var(--primary)] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('agent_chat_new_chat')}</span>
                      </button>

                      <div className="neu-divider my-1" />

                      <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-none">
                        {savedSessions.length === 0 ? (
                          <p className="p-2 text-[11px] text-center text-[var(--text-muted)] font-mono">
                            {t('agent_chat_no_sessions')}
                          </p>
                        ) : (
                          savedSessions.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => handleSelectSession(s.id)}
                              className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                                s.id === activeSession.id
                                  ? 'neu-inset text-[var(--primary)] font-bold'
                                  : 'neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                              }`}
                            >
                              <span className="truncate pr-2">{s.title}</span>
                              <button
                                onClick={(e) => handleDeleteSession(s.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:text-rose-600 transition-opacity shrink-0"
                                title={t('agent_chat_delete_session')}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <h2 className="text-xs font-bold text-[var(--text-main)] truncate">
                {t('agent_chat_title')}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {user && (
              <button
                onClick={handleCreateNewSession}
                className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] transition-all cursor-pointer"
                title={t('agent_chat_new_chat')}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onExpandToFullPage}
              className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--primary)] transition-all cursor-pointer"
              title={t('agent_chat_open_full')}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-rose-500 transition-all cursor-pointer"
              title={t('agent_chat_close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        {!user ? (
          /* Login Gate inside Drawer */
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="max-w-xs w-full p-6 rounded-3xl neu-flat space-y-4">
              <div className="w-14 h-14 mx-auto rounded-3xl neu-inset flex items-center justify-center text-[var(--primary)]">
                <Lock className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  {t('agent_chat_login_required_title')}
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {t('agent_chat_login_required_desc')}
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenLogin?.();
                }}
                className="w-full py-2.5 px-4 rounded-2xl neu-primary text-white font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('agent_chat_login_btn')}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Scroll View */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none"
            >
              {messages.length === 0 ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl neu-inset flex items-center justify-center text-[var(--primary)]">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                      {t('agent_chat_welcome_title')}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
                      {t('agent_chat_sub')}
                    </p>
                  </div>

                  {suggestions.length > 0 && (
                    <div className="pt-2 space-y-2 text-left">
                      {suggestions.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(item.query)}
                          className="w-full p-2.5 rounded-2xl neu-btn text-left text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <span className="truncate">{item.title}</span>
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <AgentChatMessageItem
                      key={msg.id}
                      message={msg}
                      isLatest={idx === messages.length - 1}
                      shouldAnimate={msg.id === animatingMessageId}
                      isDrawer={true}
                      onTypingTick={handleTypingTick}
                      onSelectSkill={onSelectSkill}
                      onToggleBookmark={handleToggleBookmarkInSession}
                      onSendMessage={(query: string) => handleSendMessage(query)}
                      t={t}
                    />
                  ))}

                  {loading && (
                    <div className="flex items-start gap-2.5 text-left animate-fade-in">
                      <div className="w-7 h-7 rounded-xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                      <div className="p-3 rounded-2xl neu-flat text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--primary)] font-semibold">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-ping" />
                          <span>{t('agent_chat_scanning')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-slate-200/40 dark:border-zinc-800/40 bg-[var(--bg)] shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputQuery);
                }}
                className="flex items-center gap-2 p-1.5 rounded-2xl neu-inset bg-transparent"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={t('agent_chat_drawer_placeholder')}
                  className="flex-1 py-2 px-3 bg-transparent text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={loading || !inputQuery.trim()}
                  className="p-2.5 rounded-xl neu-primary text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                  title={t('agent_chat_send')}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
};
