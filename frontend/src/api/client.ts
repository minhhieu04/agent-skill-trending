import { 
  Skill, 
  CategoryInfo, 
  RuntimeInfo, 
  StatsData, 
  UserPreference, 
  DataSourceStatus, 
  User, 
  CollectionRun, 
  AuditLogItem,
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
  AIRecommendationResponse
} from '../types';

const rawBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
const API_BASE = rawBase ? `${rawBase}/api/v1` : '/api/v1';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('agent_trending_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Auth
  login: async (username: string, password: string): Promise<{ access_token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Đăng nhập thất bại' }));
      throw new Error(err.detail || 'Đăng nhập thất bại');
    }
    const data = await res.json();
    localStorage.setItem('agent_trending_token', data.access_token);
    return data;
  },

  register: async (username: string, password: string, displayName?: string): Promise<{ access_token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, display_name: displayName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Đăng ký thất bại' }));
      throw new Error(err.detail || 'Đăng ký thất bại');
    }
    const data = await res.json();
    localStorage.setItem('agent_trending_token', data.access_token);
    return data;
  },

  getMe: async (): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Unauthenticated');
    return res.json();
  },

  getAllUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  logout: () => {
    localStorage.removeItem('agent_trending_token');
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

    const res = await fetch(`${API_BASE}/skills/trending?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch trending skills');
    return res.json();
  },

  getPersonalizedSkills: async (limit: number = 30): Promise<Skill[]> => {
    const res = await fetch(`${API_BASE}/skills/personalized?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch personalized skills');
    return res.json();
  },

  compareSkills: async (skillIds: number[]): Promise<Skill[]> => {
    const res = await fetch(`${API_BASE}/skills/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ skill_ids: skillIds }),
    });
    if (!res.ok) throw new Error('Failed to compare skills');
    return res.json();
  },

  getBookmarkedSkills: async (): Promise<Skill[]> => {
    const res = await fetch(`${API_BASE}/skills/bookmarked`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch bookmarks');
    return res.json();
  },

  toggleBookmark: async (skillId: number): Promise<Skill> => {
    const res = await fetch(`${API_BASE}/skills/${skillId}/bookmark`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle bookmark');
    return res.json();
  },

  getSkillDetail: async (skillId: number): Promise<Skill> => {
    const res = await fetch(`${API_BASE}/skills/${skillId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch skill detail');
    return res.json();
  },

  getStats: async (): Promise<StatsData> => {
    const res = await fetch(`${API_BASE}/skills/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Categories & Runtimes
  getCategories: async (): Promise<CategoryInfo[]> => {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  getRuntimes: async (): Promise<RuntimeInfo[]> => {
    const res = await fetch(`${API_BASE}/runtimes`);
    if (!res.ok) throw new Error('Failed to fetch runtimes');
    return res.json();
  },

  // User Preferences
  getPreferences: async (): Promise<UserPreference> => {
    const res = await fetch(`${API_BASE}/preferences`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch preferences');
    return res.json();
  },

  updatePreferences: async (pref: UserPreference): Promise<UserPreference> => {
    const res = await fetch(`${API_BASE}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(pref),
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return res.json();
  },

  // Data Collection & History
  triggerCollection: async (): Promise<{ status: string; message: string }> => {
    const res = await fetch(`${API_BASE}/collect/trigger`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trigger collection');
    return res.json();
  },

  getSourcesStatus: async (): Promise<DataSourceStatus[]> => {
    const res = await fetch(`${API_BASE}/collect/status`);
    if (!res.ok) throw new Error('Failed to fetch sources status');
    return res.json();
  },

  getCollectionRuns: async (limit: number = 30): Promise<CollectionRun[]> => {
    const res = await fetch(`${API_BASE}/history/runs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch collection runs');
    return res.json();
  },

  getAuditLogs: async (params?: { action?: string; username?: string; limit?: number }): Promise<AuditLogItem[]> => {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.username) query.append('username', params.username);
    if (params?.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/history/audit-log?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // 1-Click Multi-IDE Exporter
  exportSkillConfig: async (skillId: number, ide: string): Promise<ExportConfig> => {
    const res = await fetch(`${API_BASE}/skills/${skillId}/export/${ide}`);
    if (!res.ok) throw new Error('Failed to export skill configuration');
    return res.json();
  },

  // Security Scanner
  getSkillSecurityReport: async (skillId: number): Promise<SecurityReport> => {
    const res = await fetch(`${API_BASE}/skills/${skillId}/security`);
    if (!res.ok) throw new Error('Failed to fetch security report');
    return res.json();
  },

  // Bundles & Starter Packs
  getBundles: async (): Promise<SkillBundle[]> => {
    const res = await fetch(`${API_BASE}/bundles`);
    if (!res.ok) throw new Error('Failed to fetch bundles');
    return res.json();
  },

  getBundleDetail: async (slug: string): Promise<SkillBundle> => {
    const res = await fetch(`${API_BASE}/bundles/${slug}`);
    if (!res.ok) throw new Error('Failed to fetch bundle detail');
    return res.json();
  },

  bookmarkBundle: async (slug: string): Promise<{ message: string; added_count: number }> => {
    const res = await fetch(`${API_BASE}/bundles/${slug}/bookmark-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to bookmark bundle');
    return res.json();
  },

  exportBundle: async (slug: string, ide: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/bundles/${slug}/export/${ide}`);
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
    const res = await fetch(`${API_BASE}/playground/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to simulate prompt in playground');
    return res.json();
  },

  // AI Video & Blog Studio APIs
  getVoices: async (): Promise<VoiceOption[]> => {
    const res = await fetch(`${API_BASE}/studio/tts/voices`);
    if (!res.ok) throw new Error('Failed to fetch AI voices');
    return res.json();
  },

  generateBlog: async (data: BlogGenerateRequest): Promise<BlogPost> => {
    const res = await fetch(`${API_BASE}/studio/blog/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to generate AI blog post');
    return res.json();
  },

  generateStoryboard: async (data: StoryboardRequest): Promise<VideoStoryboard> => {
    const res = await fetch(`${API_BASE}/studio/storyboard/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to generate video storyboard');
    return res.json();
  },

  synthesizeTTS: async (data: TTSRequest): Promise<TTSResult> => {
    const res = await fetch(`${API_BASE}/studio/tts/synthesize`, {
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
    const res = await fetch(`${API_BASE}/studio/scene/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ prompt, scene_number: sceneNumber, aspect_ratio: aspectRatio }),
    });
    if (!res.ok) throw new Error('Failed to generate scene visual');
    return res.json();
  },

  captureGitHubRepository: async (repositoryUrl: string): Promise<{
    github_capture_frames: string[];
    image_url: string;
    cursor_actions: Array<{ at: number; x: number; y: number; type: 'move' | 'click' | 'scroll' | 'highlight'; frame_index?: number; label?: string }>;
    github_capture_viewport: { width: number; height: number; deviceScaleFactor?: number };
    capture_status: 'captured';
  }> => {
    const res = await fetch(`${API_BASE}/studio/github/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ repository_url: repositoryUrl }),
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
    const res = await fetch(`${API_BASE}/studio/video/render`, {
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
    const res = await fetch(`${API_BASE}/skills/ai-recommend-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ goal_query, language, max_skills }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Không thể phân tích lộ trình AI' }));
      throw new Error(err.detail || 'Không thể phân tích lộ trình AI');
    }
    return res.json();
  }
};
