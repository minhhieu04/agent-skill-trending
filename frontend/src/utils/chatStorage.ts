import { AgentChatMessage, AgentChatSession } from '../types';

export const AGENT_CHAT_SESSIONS_KEY = 'agent_chat_sessions_v2';
export const AGENT_CHAT_ACTIVE_ID_KEY = 'agent_chat_active_session_id_v2';
export const AGENT_CHAT_LEGACY_KEY = 'agent_chat_history_v1';

export function generateSessionTitle(query: string, defaultTitle: string = 'Cuộc trò chuyện mới'): string {
  if (!query || !query.trim()) return defaultTitle;
  const clean = query.trim().replace(/\s+/g, ' ');
  if (clean.length <= 36) return clean;
  return clean.slice(0, 35) + '...';
}

export function createNewSession(title?: string): AgentChatSession {
  const now = Date.now();
  return {
    id: `session-${now}-${Math.random().toString(36).substring(2, 7)}`,
    title: title || 'Cuộc trò chuyện mới',
    createdAt: now,
    updatedAt: now,
    messages: []
  };
}

export function loadChatSessions(): AgentChatSession[] {
  try {
    const raw = localStorage.getItem(AGENT_CHAT_SESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Migrate from legacy single-chat history if available
    const legacyRaw = localStorage.getItem(AGENT_CHAT_LEGACY_KEY);
    if (legacyRaw) {
      const legacyMsgs = JSON.parse(legacyRaw);
      if (Array.isArray(legacyMsgs) && legacyMsgs.length > 0) {
        const firstUserMsg = legacyMsgs.find((m: AgentChatMessage) => m.role === 'user');
        const legacySession: AgentChatSession = {
          id: `session-legacy-${Date.now()}`,
          title: generateSessionTitle(firstUserMsg?.content || 'Cuộc trò chuyện đã lưu'),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: legacyMsgs
        };
        saveChatSessions([legacySession]);
        return [legacySession];
      }
    }
  } catch (e) {
    console.warn('Failed to parse chat sessions from localStorage', e);
  }

  // Fallback: create fresh session
  const initial = createNewSession();
  saveChatSessions([initial]);
  return [initial];
}

export function saveChatSessions(sessions: AgentChatSession[]): void {
  try {
    // Keep at most 50 sessions and at most 100 messages per session to prevent localStorage quota overflow
    const trimmed = (sessions || []).slice(0, 50).map((s) => ({
      ...s,
      messages: (s.messages || []).slice(-100)
    }));
    localStorage.setItem(AGENT_CHAT_SESSIONS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save chat sessions to localStorage', e);
  }
}

export function loadActiveSessionId(): string | null {
  try {
    return localStorage.getItem(AGENT_CHAT_ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

export function saveActiveSessionId(id: string): void {
  try {
    localStorage.setItem(AGENT_CHAT_ACTIVE_ID_KEY, id);
  } catch {}
}
