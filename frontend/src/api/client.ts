import { 
  Skill, 
  CategoryInfo, 
  RuntimeInfo, 
  StatsData, 
  UserPreference, 
  DataSourceStatus, 
  User, 
  CollectionRun, 
  AuditLogPageResponse,
  AuditStatsSummary,
  ExportConfig,


  SecurityReport,
  SkillBundle,
  PlaygroundSimResult,
  VoiceOption,
  BlogPost,
  VideoStoryboard,
  TTSResult,
  BlogGenerateRequest,
  StoryboardRequest,
  TTSRequest,
  SceneImageResponse,
  AIRecommendationResponse,
  AgentChatResponse,
  AgentChatSuggestion,
  AgentChatSessionSummary,
  AgentChatSessionDetail,
  ReadmeData,
  TranslateReadmeResult,
  TranslationProviderOption
} from '../types';

const rawBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
const API_BASE = rawBase ? `${rawBase}/api/v1` : '/api/v1';

export const AUTH_TOKEN_KEY = 'agent_trending_token';

export const handleUnauthorized = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
};

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Global HTTP Interceptor for API requests:
 * 1. Automatically attaches Authorization header if token exists and not already provided.
 * 2. Catches HTTP 401 Unauthorized responses to purge token and broadcast a logout event.
 */
export const authFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers || {});
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    const urlStr = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
    if (!urlStr.includes('/auth/login')) {
      handleUnauthorized();
    }
  }

  return response;
};

export const api = {
  // Auth
  login: async (username: string, password: string): Promise<{ access_token: string; user: User }> => {
    const res = await authFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Đăng nhập thất bại' }));
      throw new Error(err.detail || 'Đăng nhập thất bại');
    }
    const data = await res.json();
    localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
    localStorage.setItem('agent_trending_user', JSON.stringify(data.user));
    return data;
  },

  register: async (username: string, password: string, displayName?: string): Promise<{ access_token: string; user: User }> => {
    const res = await authFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, display_name: displayName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Đăng ký thất bại' }));
      throw new Error(err.detail || 'Đăng ký thất bại');
    }
    const data = await res.json();
    localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
    localStorage.setItem('agent_trending_user', JSON.stringify(data.user));
    return data;
  },

  getMe: async (): Promise<User> => {
    const res = await authFetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err: any = new Error(res.status === 401 ? 'Unauthenticated' : 'Failed to fetch current user');
      err.status = res.status;
      throw err;
    }
    return res.json();
  },

  getAllUsers: async (): Promise<User[]> => {
    const res = await authFetch(`${API_BASE}/auth/users`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  logout: () => {
    localStorage.removeItem('agent_trending_user');
    handleUnauthorized();
  },

  // Skills
  getTrendingSkills: async (params?: {
    category?: string;
    runtime?: string;
    language?: string;
    search?: string;
    min_score?: number;
    sort_by?: string;
    limit?: number;
  }): Promise<Skill[]> => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.runtime) query.append('runtime', params.runtime);
    if (params?.language) query.append('language', params.language);
    if (params?.search) query.append('search', params.search);
    if (params?.min_score) query.append('min_score', params.min_score.toString());
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.limit) query.append('limit', params.limit.toString());

    const res = await authFetch(`${API_BASE}/skills/trending?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch trending skills');
    return res.json();
  },

  getPersonalizedSkills: async (limit: number = 30): Promise<Skill[]> => {
    const res = await authFetch(`${API_BASE}/skills/personalized?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch personalized skills');
    return res.json();
  },

  compareSkills: async (skillIds: number[]): Promise<Skill[]> => {
    const res = await authFetch(`${API_BASE}/skills/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ skill_ids: skillIds }),
    });
    if (!res.ok) throw new Error('Failed to compare skills');
    return res.json();
  },

  getBookmarkedSkills: async (): Promise<Skill[]> => {
    const res = await authFetch(`${API_BASE}/skills/bookmarked`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch bookmarks');
    return res.json();
  },

  toggleBookmark: async (skillId: number): Promise<Skill> => {
    const res = await authFetch(`${API_BASE}/skills/${skillId}/bookmark`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle bookmark');
    return res.json();
  },

  getSkillDetail: async (skillId: number): Promise<Skill> => {
    const res = await authFetch(`${API_BASE}/skills/${skillId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch skill detail');
    return res.json();
  },

  getTranslationProviders: async (): Promise<TranslationProviderOption[]> => {
    const res = await authFetch(`${API_BASE}/skills/translation-providers`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch translation providers');
    return res.json();
  },

  translateSkillSummary: async (skillId: number): Promise<{ skill_id: number; ai_summary: string }> => {
    const res = await authFetch(`${API_BASE}/skills/${skillId}/summary/translate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to translate skill summary');
    return res.json();
  },

  getSkillReadme: async (skillId: number): Promise<ReadmeData> => {
    const res = await authFetch(`${API_BASE}/skills/${skillId}/readme`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch repository README');
    return res.json();
  },

  refreshSkillReadme: async (skillId: number): Promise<ReadmeData> => {
    const res = await authFetch(`${API_BASE}/skills/${skillId}/readme/refresh`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to refresh repository README from GitHub');
    return res.json();
  },

  translateSkillReadme: async (
    skillId: number, 
    targetLanguage: string = 'vi', 
    forceRefresh: boolean = false,
    preferredProvider: string = 'auto'
  ): Promise<TranslateReadmeResult> => {
    const res = await authFetch(`${API_BASE}/skills/${skillId}/readme/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ 
        target_language: targetLanguage, 
        force_refresh: forceRefresh,
        preferred_provider: preferredProvider
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to translate README' }));
      throw new Error(err.detail || 'Failed to translate README');
    }
    return res.json();
  },

  getStats: async (): Promise<StatsData> => {
    const res = await authFetch(`${API_BASE}/skills/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Categories & Runtimes
  getCategories: async (): Promise<CategoryInfo[]> => {
    const res = await authFetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  getRuntimes: async (): Promise<RuntimeInfo[]> => {
    const res = await authFetch(`${API_BASE}/runtimes`);
    if (!res.ok) throw new Error('Failed to fetch runtimes');
    return res.json();
  },

  // User Preferences
  getPreferences: async (): Promise<UserPreference> => {
    const res = await authFetch(`${API_BASE}/preferences`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch preferences');
    return res.json();
  },

  updatePreferences: async (pref: UserPreference): Promise<UserPreference> => {
    const res = await authFetch(`${API_BASE}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(pref),
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return res.json();
  },

  // Data Collection & History
  triggerCollection: async (): Promise<{ status: string; message: string }> => {
    const res = await authFetch(`${API_BASE}/collect/trigger`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trigger collection');
    return res.json();
  },

  getSourcesStatus: async (): Promise<DataSourceStatus[]> => {
    const res = await authFetch(`${API_BASE}/collect/status`);
    if (!res.ok) throw new Error('Failed to fetch sources status');
    return res.json();
  },

  getCollectionRuns: async (limit: number = 30): Promise<CollectionRun[]> => {
    const res = await authFetch(`${API_BASE}/history/runs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch collection runs');
    return res.json();
  },

  getAuditLogs: async (params?: {
    action?: string;
    username?: string;
    user_id?: number;
    search?: string;
    source?: string;
    page?: number;
    page_size?: number;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogPageResponse> => {
    const query = new URLSearchParams();
    if (params?.action && params.action !== 'all') query.append('action', params.action);
    if (params?.username && params.username !== 'all') query.append('username', params.username);
    if (params?.user_id) query.append('user_id', params.user_id.toString());
    if (params?.search && params.search.trim()) query.append('search', params.search.trim());
    if (params?.source && params.source !== 'all') query.append('source', params.source);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.page_size) query.append('page_size', params.page_size.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());

    const res = await authFetch(`${API_BASE}/history/audit-log?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const data = await res.json();
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: 1,
        page_size: data.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      };
    }
    return data;
  },

  getAuditStats: async (days: number = 7): Promise<AuditStatsSummary> => {
    const res = await authFetch(`${API_BASE}/history/audit-log/stats?days=${days}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch audit stats');
    return res.json();
  },

  // 1-Click Multi-IDE Exporter
  exportSkillConfig: async (skillId: number, ide: string): Promise<ExportConfig> => {
    const res = await authFetch(`${API_BASE}/skills/${skillId}/export/${ide}`);
    if (!res.ok) throw new Error('Failed to export skill configuration');
    return res.json();
  },

  // Security Scanner
  getSkillSecurityReport: async (skillId: number): Promise<SecurityReport> => {
    const res = await authFetch(`${API_BASE}/skills/${skillId}/security`);
    if (!res.ok) throw new Error('Failed to fetch security report');
    return res.json();
  },

  // Bundles & Starter Packs
  getBundles: async (): Promise<SkillBundle[]> => {
    const res = await authFetch(`${API_BASE}/bundles`);
    if (!res.ok) throw new Error('Failed to fetch bundles');
    return res.json();
  },

  getBundleDetail: async (slug: string): Promise<SkillBundle> => {
    const res = await authFetch(`${API_BASE}/bundles/${slug}`);
    if (!res.ok) throw new Error('Failed to fetch bundle detail');
    return res.json();
  },

  bookmarkBundle: async (slug: string): Promise<{ message: string; added_count: number }> => {
    const res = await authFetch(`${API_BASE}/bundles/${slug}/bookmark-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to bookmark bundle');
    return res.json();
  },

  exportBundle: async (slug: string, ide: string): Promise<any> => {
    const res = await authFetch(`${API_BASE}/bundles/${slug}/export/${ide}`);
    if (!res.ok) throw new Error('Failed to export bundle');
    return res.json();
  },

  // Interactive Prompt Simulator Playground
  simulatePlayground: async (data: {
    prompt: string;
    target_ide?: string;
    skill_id?: number;
    skill_slug?: string;
  }): Promise<PlaygroundSimResult> => {
    const res = await authFetch(`${API_BASE}/playground/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to simulate prompt in playground');
    return res.json();
  },

  // AI Video & Blog Studio APIs
  getVoices: async (): Promise<VoiceOption[]> => {
    const res = await authFetch(`${API_BASE}/studio/tts/voices`);
    if (!res.ok) throw new Error('Failed to fetch AI voices');
    return res.json();
  },

  generateBlog: async (data: BlogGenerateRequest): Promise<BlogPost> => {
    const res = await authFetch(`${API_BASE}/studio/blog/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to generate AI blog post');
    return res.json();
  },

  generateStoryboard: async (data: StoryboardRequest): Promise<VideoStoryboard> => {
    const res = await authFetch(`${API_BASE}/studio/storyboard/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to generate video storyboard');
    return res.json();
  },

  synthesizeTTS: async (data: TTSRequest): Promise<TTSResult> => {
    const res = await authFetch(`${API_BASE}/studio/tts/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to synthesize AI voice audio');
    return res.json();
  },

  generateSceneImage: async (
    prompt: string,
    sceneNumber: number = 1,
    aspectRatio: '9:16' | '16:9' = '9:16',
  ): Promise<SceneImageResponse> => {
    const res = await authFetch(`${API_BASE}/studio/scene/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ prompt, scene_number: sceneNumber, aspect_ratio: aspectRatio }),
    });
    if (!res.ok) throw new Error('Failed to generate scene visual');
    return res.json();
  },

  captureGitHubRepository: async (
    repositoryUrl: string,
    aspectRatio: '9:16' | '16:9' = '9:16',
    durationSeconds: number = 8,
  ): Promise<{
    github_capture_frames: string[];
    github_capture_video?: string;
    github_capture_duration_seconds?: number;
    github_capture_fps?: number;
    github_capture_source_revision?: string;
    github_capture_captured_at?: string;
    image_url: string;
    cursor_actions: Array<{ at: number; x: number; y: number; type: 'move' | 'click' | 'scroll' | 'highlight'; frame_index?: number; label?: string }>;
    github_capture_viewport: { width: number; height: number; deviceScaleFactor?: number };
    capture_status: 'captured';
  }> => {
    const res = await authFetch(`${API_BASE}/studio/github/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        repository_url: repositoryUrl,
        aspect_ratio: aspectRatio,
        duration_seconds: durationSeconds,
      }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'GitHub capture failed' }));
      throw new Error(error.detail || 'GitHub capture failed');
    }
    return res.json();
  },

  renderSkillVideo: async (data: {
    storyboard: VideoStoryboard;
    tts_result: TTSResult;
    skill_title: string;
    skill_stats: { stars?: number; forks?: number; language?: string };
    show_captions: boolean;
  }): Promise<Blob> => {
    const res = await authFetch(`${API_BASE}/studio/video/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Failed to render MP4 video' }));
      throw new Error(error.detail || 'Failed to render MP4 video');
    }
    return res.blob();
  },

  // AI Learning Track & Goal Advisor
  getAIRecommendedTrack: async (goal_query: string, language: string = 'vi', max_skills: number = 8): Promise<AIRecommendationResponse> => {
    const res = await authFetch(`${API_BASE}/skills/ai-recommend-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ goal_query, language, max_skills }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Không thể phân tích lộ trình AI' }));
      throw new Error(err.detail || 'Không thể phân tích lộ trình AI');
    }
    return res.json();
  },

  // RAG Agent Chat
  getAgentChatSessions: async (): Promise<AgentChatSessionSummary[]> => {
    const res = await authFetch(`${API_BASE}/agent-chat/sessions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Không thể tải danh sách phiên chat' }));
      throw new Error(err.detail || 'Không thể tải danh sách phiên chat');
    }
    return res.json();
  },

  getAgentChatSessionDetail: async (sessionId: string): Promise<AgentChatSessionDetail> => {
    const res = await authFetch(`${API_BASE}/agent-chat/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Không thể tải chi tiết phiên chat' }));
      throw new Error(err.detail || 'Không thể tải chi tiết phiên chat');
    }
    return res.json();
  },

  createAgentChatSession: async (title?: string): Promise<AgentChatSessionDetail> => {
    const res = await authFetch(`${API_BASE}/agent-chat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ title: title || 'Cuộc trò chuyện mới' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Không thể tạo phiên chat mới' }));
      throw new Error(err.detail || 'Không thể tạo phiên chat mới');
    }
    return res.json();
  },

  updateAgentChatSession: async (sessionId: string, title: string): Promise<AgentChatSessionSummary> => {
    const res = await authFetch(`${API_BASE}/agent-chat/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Không thể cập nhật tên phiên chat' }));
      throw new Error(err.detail || 'Không thể cập nhật tên phiên chat');
    }
    return res.json();
  },

  deleteAgentChatSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const res = await authFetch(`${API_BASE}/agent-chat/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Không thể xóa phiên chat' }));
      throw new Error(err.detail || 'Không thể xóa phiên chat');
    }
    return res.json();
  },

  sendAgentChatMessage: async (
    query: string,
    history: Array<{ role: string; content: string }> = [],
    language: string = 'vi',
    sessionId?: string
  ): Promise<AgentChatResponse> => {
    const res = await authFetch(`${API_BASE}/agent-chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ query, history, language, session_id: sessionId || null }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Lỗi khi gửi tin nhắn tới Agent Chat' }));
      throw new Error(err.detail || 'Lỗi khi gửi tin nhắn tới Agent Chat');
    }
    return res.json();
  },

  getAgentChatSuggestions: async (language: string = 'vi'): Promise<AgentChatSuggestion[]> => {
    const res = await authFetch(`${API_BASE}/agent-chat/suggestions?language=${encodeURIComponent(language)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Không thể lấy danh sách gợi ý' }));
      throw new Error(err.detail || 'Không thể lấy danh sách gợi ý');
    }
    return res.json();
  },

  // Daily AI Podcast & Feed
  getDailyDigestDates: async (): Promise<{ dates: import('../types').DailyDigestDateInfo[] }> => {
    const res = await authFetch(`${API_BASE}/daily-digest/dates`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Không thể tải danh sách ngày bản tin');
    return res.json();
  },

  getDailyDigest: async (date: string): Promise<import('../types').DailyDigest> => {
    const res = await authFetch(`${API_BASE}/daily-digest/${encodeURIComponent(date)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Không thể tải bản tin ngày ${date}`);
    return res.json();
  },

  regenerateDailyDigest: async (
    date: string,
    language: string = 'vi',
    model: string = 'gemini-3.8-flash'
  ): Promise<import('../types').DailyDigest> => {
    const res = await authFetch(`${API_BASE}/daily-digest/${encodeURIComponent(date)}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ language, model }),
    });
    if (!res.ok) throw new Error(`Không thể sinh lại bản tin ngày ${date}`);
    return res.json();
  },

  translateDailyDigest: async (
    date: string,
    targetLanguage: string = 'en',
    model: string = 'gemini-3.8-flash'
  ): Promise<import('../types').DailyDigest> => {
    const res = await authFetch(`${API_BASE}/daily-digest/${encodeURIComponent(date)}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ target_language: targetLanguage, model }),
    });
    if (!res.ok) throw new Error(`Không thể dịch bản tin ngày ${date}`);
    return res.json();
  },

  synthesizeDailyPodcastAudio: async (
    date: string,
    voice: string = 'vi-VN-NamMinhNeural',
    rate: string = '+5%',
    forceRegenerate: boolean = false
  ): Promise<import('../types').DailyPodcastAudioResponse> => {
    const res = await authFetch(`${API_BASE}/daily-digest/${encodeURIComponent(date)}/audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ voice, rate, force_regenerate: forceRegenerate }),
    });
    if (!res.ok) throw new Error(`Không thể tạo âm thanh podcast ngày ${date}`);
    return res.json();
  },

  getPodcastVoices: async (): Promise<{ voices: import('../types').VoiceOption[] }> => {
    const res = await authFetch(`${API_BASE}/daily-digest/voices`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Không thể tải danh sách giọng đọc podcast');
    return res.json();
  },

  getPodcastAudioStreamUrl: (date: string, voice: string, force: boolean = false): string => {
    return `${API_BASE}/daily-digest/${encodeURIComponent(date)}/audio-stream?voice=${encodeURIComponent(voice)}${force ? '&force=true' : ''}`;
  }
};
