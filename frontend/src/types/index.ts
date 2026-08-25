export interface Skill {
  id: number;
  name: string;
  title?: string;
  repository_url: string;
  author?: string;
  description?: string;
  ai_summary?: string;
  category: string;
  tags: string[];
  runtimes: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  primary_language?: string;
  stars: number;
  forks: number;
  open_issues: number;
  star_velocity_7d: number;
  reddit_mentions: number;
  hackernews_mentions: number;
  quality_score: number;
  trending_score: number;
  relevance_score: number;
  is_featured: boolean;
  is_bookmarked: boolean;
  source_type: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryInfo {
  key: string;
  title: string;
  description: string;
  icon: string;
  count: number;
}

export interface RuntimeInfo {
  name: string;
  count: number;
}

export interface StatsData {
  total_skills: number;
  categories_count: Record<string, number>;
  runtimes_count: Record<string, number>;
  languages_count: Record<string, number>;
  total_stars: number;
  bookmarked_count: number;
}

export interface UserPreference {
  user_name: string;
  preferred_categories: string[];
  preferred_languages: string[];
  preferred_runtimes: string[];
  interested_tags: string[];
  min_stars: number;
  min_trending_score: number;
  only_recent_activity_days: number;
}

export interface DataSourceStatus {
  id: number;
  name: string;
  source_type: string;
  last_status: string;
  last_fetched_at?: string;
  items_collected_count: number;
}
