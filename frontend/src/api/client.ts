import { Skill, CategoryInfo, RuntimeInfo, StatsData, UserPreference, DataSourceStatus } from '../types';

const API_BASE = '/api/v1';

export const api = {
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

    const res = await fetch(`${API_BASE}/skills/trending?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch trending skills');
    return res.json();
  },

  getPersonalizedSkills: async (limit: number = 30): Promise<Skill[]> => {
    const res = await fetch(`${API_BASE}/skills/personalized?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch personalized skills');
    return res.json();
  },

  getBookmarkedSkills: async (): Promise<Skill[]> => {
    const res = await fetch(`${API_BASE}/skills/bookmarked`);
    if (!res.ok) throw new Error('Failed to fetch bookmarks');
    return res.json();
  },

  toggleBookmark: async (skillId: number): Promise<Skill> => {
    const res = await fetch(`${API_BASE}/skills/${skillId}/bookmark`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to toggle bookmark');
    return res.json();
  },

  getSkillDetail: async (skillId: number): Promise<Skill> => {
    const res = await fetch(`${API_BASE}/skills/${skillId}`);
    if (!res.ok) throw new Error('Failed to fetch skill detail');
    return res.json();
  },

  getStats: async (): Promise<StatsData> => {
    const res = await fetch(`${API_BASE}/skills/stats`);
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
    const res = await fetch(`${API_BASE}/preferences`);
    if (!res.ok) throw new Error('Failed to fetch preferences');
    return res.json();
  },

  updatePreferences: async (pref: UserPreference): Promise<UserPreference> => {
    const res = await fetch(`${API_BASE}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pref),
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return res.json();
  },

  // Data Collection Trigger & Status
  triggerCollection: async (): Promise<{ status: string; message: string }> => {
    const res = await fetch(`${API_BASE}/collect/trigger`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to trigger collection');
    return res.json();
  },

  getSourcesStatus: async (): Promise<DataSourceStatus[]> => {
    const res = await fetch(`${API_BASE}/collect/status`);
    if (!res.ok) throw new Error('Failed to fetch sources status');
    return res.json();
  }
};
