export interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  is_admin: boolean;
  created_at: string;
  last_login_at: string;
}

export interface Skill {
  id: number;
  name: string;
  title?: string;
  repository_url: string;
  author?: string;
  description?: string;
  ai_summary?: string;
  use_cases?: string[];
  comparison_notes?: string;
  target_audience?: string;
  readme_preview?: string;
  demo_url?: string;
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
  security_rating?: 'safe' | 'moderate' | 'caution';
  security_score?: number;
  security_flags?: Array<{ pattern: string; description: string; severity: string }>;
  permission_level?: string;
  is_featured: boolean;
  is_bookmarked: boolean;
  source_type: string;
  created_at: string;
  updated_at: string;
}

export interface ExportConfig {
  ide: string;
  file_path: string;
  file_name: string;
  syntax: string;
  content: string;
  cli_command: string;
}

export interface SecurityReport {
  skill_id: number;
  skill_name: string;
  security_rating: 'safe' | 'moderate' | 'caution';
  security_score: number;
  badge_text: string;
  badge_color: string;
  permission_level: string;
  flags_count: number;
  flags: Array<{ pattern: string; description: string; severity: string }>;
  sandbox_compliant: boolean;
  audit_passed: boolean;
  recommendation: string;
}

export interface SkillBundle {
  id: number;
  slug: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  badge: string;
  category: string;
  target_stack: string;
  tags: string[];
  skill_ids: number[];
  stars_total: number;
  created_at: string;
  skills: Array<{
    id: number;
    name: string;
    title: string;
    category: string;
    stars: number;
    trending_score: number;
    primary_language?: string;
  }>;
}

export interface PlaygroundSimResult {
  skill_name: string;
  target_ide: string;
  prompt: string;
  before_code: string;
  after_code: string;
  applied_rules: string[];
  improvements: string[];
  security_verdict: SecurityReport | Record<string, any>;
  latency_ms: number;
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
  description?: string;
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

export interface CollectionRun {
  id: number;
  triggered_by: string;
  started_at: string;
  finished_at?: string;
  status: string;
  total_new_skills: number;
  total_updated_skills: number;
  total_sources_scanned: number;
  sources_summary: Record<string, any>;
  summary?: string;
  error_detail?: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  username: string;
  action: string;
  target_type: string;
  target_id?: number;
  detail: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export type AuditLog = AuditLogItem;

// Studio & AI Video Interfaces
export interface VoiceOption {
  id: string;
  name: string;
  provider?: string;
  badge?: string;
  language: string;
  gender: 'female' | 'male';
  style: string;
  description?: string;
  preview_text: string;
  recommended_preset?: string;
}

export interface BlogPost {
  title: string;
  content: string;
  tags: string[];
  word_count: number;
  estimated_read_time: string;
  language: string;
  tone: string;
}

export interface VideoScene {
  scene_number: number;
  title: string;
  voiceover_text: string;
  visual_description: string;
  visual_prompt?: string;
  image_url?: string;
  duration_seconds: number;
  code_snippet?: string;
  scene_type?:
    | 'intro'
    | 'github'
    | 'pain'
    | 'architecture'
    | 'stat'
    | 'code'
    | 'terminal'
    | 'comparison'
    | 'features'
    | 'security'
    | 'content'
    | 'outro';
  stars_count?: number;
  forks_count?: number;
  contributors?: number;
  terminal_command?: string;
  terminal_output?: string[];
  before_text?: string;
  after_text?: string;
  feature_items?: { icon: string; title: string; desc: string }[];
  source_ref?: string;
  asset_type?: string;
  repository_url?: string;
  repository_name?: string;
  repository_owner?: string;
  readme_excerpt?: string;
  open_issues?: number;
  trending_score?: number;
  cursor_actions?: Array<{
    at: number;
    x: number;
    y: number;
    type: 'move' | 'click' | 'scroll' | 'highlight';
    frame_index?: number;
  }>;
  github_capture_frames?: string[];
  capture_status?: 'captured' | 'unavailable';
}


export interface VideoStoryboard {
  total_duration: number;
  aspect_ratio: string;
  scenes: VideoScene[];
}

export interface SubtitleEntry {
  text: string;
  start_ms: number;
  end_ms: number;
}

export interface TTSResult {
  audio_base64: string;
  duration_seconds: number;
  subtitle_entries: SubtitleEntry[];
  voice: string;
  status: string;
  message?: string;
  scene_segments?: Array<{
    scene_index: number;
    start_ms: number;
    end_ms: number;
    subtitle_start_index: number;
    subtitle_end_index: number;
  }>;
  timing_quality?: 'word' | 'estimated';
}

export interface BlogGenerateRequest {
  skill_id?: number;
  topic?: string;
  tone?: string;
  language?: string;
  custom_notes?: string;
}

export interface StoryboardRequest {
  skill_id?: number;
  content?: string;
  target_duration?: number;
  aspect_ratio?: string;
  language?: string;
}

export interface TTSRequest {
  text: string;
  scene_texts?: string[];
  voice?: string;
  rate?: string;
  pitch?: string;
  provider?: string;
}

export interface SceneImageResponse {
  scene_number: number;
  image_url: string;
  prompt: string;
  status: string;
  provider: string;
}
