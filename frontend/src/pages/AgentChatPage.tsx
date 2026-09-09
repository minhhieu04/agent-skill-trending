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
  Clock,
  Lock,
  Sparkles,
  LogIn
} from 'lucide-react';
import { api } from '../api/client';
import {
  Skill,
  AgentChatMessage,
  AgentChatSuggestion,
  AgentChatSession
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { AgentChatMessageItem } from '../components/AgentChatMessageItem';
import {
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
  onOpenLogin?: () => void;
  initialQuery?: string;
}

export const AgentChatPage: React.FC<AgentChatPageProps> = ({
  onSelectSkill,
  onToggleBookmark,
  onGoToPlayground,
  onOpenLogin,
  initialQuery = ''
}) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  // Multi-session state backed by database
  const [sessions, setSessions] = useState<AgentChatSession[]>([createNewSession()]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
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
  const messages = activeSession.messages || [];

  // Saved sessions that have at least 1 message
  const savedSessions = sessions.filter((s) => s.messages && s.messages.length > 0);

  // Load sessions from Backend DB when user logs in
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

        // Fetch detail for target active session
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
          console.error('Failed to load active session detail', e);
        }
      } else {
        const fresh = createNewSession(t('agent_chat_untitled'));
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
      }
    } catch (e) {
      console.error('Failed to fetch chat sessions from DB', e);
    }
  }, [user, t]);

  useEffect(() => {
    if (user) {
      fetchSessionsFromDb();
    }
  }, [user, fetchSessionsFromDb]);

  // Persist active session ID
  useEffect(() => {
    if (activeSessionId) {
      saveActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  // Load prompt suggestions (public endpoint)
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
      setInputQuery(initialQuery);
      setTimeout(() => {
        handleSendMessage(initialQuery);
      }, 300);
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
    // If current session is already empty draft, just focus input
    if (activeSession.messages.length === 0) {
      inputRef.current?.focus();
      return;
    }
    const nonEmpties = sessions.filter((s) => s.messages && s.messages.length > 0);
    const fresh = createNewSession(t('agent_chat_untitled'));
    setSessions([fresh, ...nonEmpties]);
    setActiveSessionId(fresh.id);
    setAnimatingMessageId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSelectSession = async (id: string) => {
    setActiveSessionId(id);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
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
        console.error('Failed to load session messages from DB', err);
      }
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await api.deleteAgentChatSession(sessionId);
    } catch (err) {
      console.warn('Delete session error:', err);
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
    showToast(language === 'vi' ? 'Đã xóa đoạn chat khỏi Database' : 'Chat deleted from database', 'info');
  };

  const handleClearAllSessions = async () => {
    if (window.confirm(t('agent_chat_confirm_clear_all'))) {
      for (const s of savedSessions) {
        try {
          await api.deleteAgentChatSession(s.id);
        } catch {}
      }
      const fresh = createNewSession(t('agent_chat_untitled'));
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      setAnimatingMessageId(null);
      showToast(language === 'vi' ? 'Đã xóa toàn bộ lịch sử trên Database' : 'All chat history cleared from DB', 'info');
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

      // Send to Backend API with session_id
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

  // If user is not authenticated, show elegant Login Gate screen
  if (!user) {
    return (
      <div className="w-full h-[calc(100vh-140px)] min-h-[500px] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div className="max-w-md w-full p-8 rounded-3xl neu-flat text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-3xl neu-inset flex items-center justify-center text-[var(--primary)]">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[var(--text-main)]">
              {t('agent_chat_login_required_title')}
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t('agent_chat_login_required_desc')}
            </p>
          </div>

          <div className="p-4 rounded-2xl neu-inset-sm text-left space-y-2 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2 text-[var(--text-main)] font-semibold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{language === 'vi' ? 'Đặc quyền khi đăng nhập:' : 'Sign-in benefits:'}</span>
            </div>
            <p>• {language === 'vi' ? 'Lưu trữ vĩnh viễn lịch sử hỏi đáp vào Database' : 'Persist complete conversation history to Database'}</p>
            <p>• {language === 'vi' ? 'Đồng bộ phiên trò chuyện tức thì giữa các thiết bị' : 'Sync chat sessions across multiple devices'}</p>
            <p>• {language === 'vi' ? 'Phân tích RAG chuyên sâu trên 450+ kỹ năng AI Agent' : 'Deep RAG insights on 450+ AI Agent skills'}</p>
          </div>

          <button
            onClick={onOpenLogin}
            className="w-full py-3 px-6 rounded-2xl neu-primary text-white font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('agent_chat_login_btn')}</span>
          </button>
        </div>
      </div>
    );
  }

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

      {/* LEFT CHAT SESSIONS SIDEBAR */}
      <div
        className={`${
          isSidebarOpen ? 'translate-x-0 w-72 sm:w-80' : '-translate-x-full lg:translate-x-0 lg:w-0'
        } transition-all duration-300 ease-in-out absolute lg:relative z-40 lg:z-auto h-full bg-[var(--bg)] flex flex-col shrink-0 border-r border-slate-200/50 dark:border-zinc-800/50`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 flex items-center justify-between gap-2 border-b border-slate-200/40 dark:border-zinc-800/40">
          <button
            onClick={handleCreateNewSession}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl neu-btn text-xs font-bold text-[var(--primary)] hover:opacity-90 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('agent_chat_new_chat')}</span>
          </button>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-xl neu-btn text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all shrink-0 cursor-pointer"
            title="Thu gọn lịch sử"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

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
              const messageCount = session.messages ? session.messages.length : 0;
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
                        {dateStr} {messageCount > 0 ? `• ${messageCount} tin nhắn` : ''}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-btn text-xs font-semibold text-[var(--primary)] transition-all cursor-pointer active:scale-95"
              title={t('agent_chat_new_chat')}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('agent_chat_new_chat')}</span>
            </button>

            {messages.length > 0 && (
              <button
                onClick={() => handleDeleteSession(activeSession.id)}
                className="p-2 rounded-xl neu-btn text-rose-500 hover:text-rose-600 transition-all cursor-pointer active:scale-95"
                title={t('agent_chat_clear')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="neu-divider" />

        {/* Messages Scroll Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scrollbar-none"
        >
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-8 text-center space-y-6 animate-scale-in">
              <div className="w-14 h-14 mx-auto rounded-3xl neu-inset flex items-center justify-center text-[var(--primary)]">
                <Cpu className="w-7 h-7 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)]">
                  {t('agent_chat_welcome_title')}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
                  {t('agent_chat_welcome_sub')}
                </p>
              </div>

              {/* Suggestions Grid */}
              {suggestions.length > 0 && (
                <div className="pt-2 text-left">
                  <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('agent_chat_suggested_prompts')}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(item.query)}
                        className="p-3.5 rounded-2xl neu-btn text-left transition-all hover:scale-[1.01] active:scale-95 group cursor-pointer flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors flex items-center justify-between">
                            <span>{item.title}</span>
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                            {item.query}
                          </p>
                        </div>
                        <span className="mt-2 text-[10px] font-mono font-semibold text-[var(--primary)] opacity-80">
                          #{item.category}
                        </span>
                      </button>
                    ))}
                  </div>
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
                  isDrawer={false}
                  onTypingTick={handleTypingTick}
                  onSelectSkill={onSelectSkill}
                  onToggleBookmark={handleToggleBookmarkInSession}
                  onGoToPlayground={onGoToPlayground}
                  onCopyInstall={handleCopyInstall}
                  copiedSkillId={copiedSkillId}
                  onSendMessage={(query: string) => handleSendMessage(query)}
                  t={t}
                />
              ))}

              {loading && (
                <div className="flex items-start gap-3 text-left animate-fade-in">
                  <div className="w-8 h-8 rounded-2xl neu-inset text-[var(--primary)] flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="p-4 rounded-3xl neu-flat max-w-lg space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--primary)] font-semibold">
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-ping" />
                      <span>{t('agent_chat_scanning')}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-slate-300/40 dark:bg-zinc-700/40 rounded-full w-48 animate-pulse" />
                      <div className="h-2.5 bg-slate-300/30 dark:bg-zinc-700/30 rounded-full w-36 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="neu-divider" />

        {/* Input Composer */}
        <div className="p-3 sm:p-4 bg-[var(--bg)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputQuery);
            }}
            className="max-w-4xl mx-auto flex items-end gap-2 p-2 rounded-3xl neu-inset bg-transparent transition-all"
          >
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
              className="flex-1 max-h-32 min-h-[44px] py-2.5 px-3 bg-transparent text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none resize-none scrollbar-none"
            />

            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="p-3 rounded-2xl neu-primary text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              title={t('agent_chat_send')}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
