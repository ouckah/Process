// TypeScript types matching the FastAPI schemas

export interface User {
  id: number;
  email: string;
  username: string;
  discord_id?: string | null;
  discord_avatar?: string | null;
  google_id?: string | null;
  display_name?: string | null;
  is_anonymous?: boolean;
  comments_enabled?: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Process {
  id: number;
  company_name: string;
  position?: string | null;
  status: 'active' | 'completed' | 'rejected';
  is_public: boolean;
  share_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessDetail extends Process {
  stages: Stage[];
}

export interface Stage {
  id: number;
  process_id: number;
  stage_name: string;
  stage_date: string;
  notes?: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ProcessCreate {
  company_name: string;
  position?: string | null;
  status?: string;
}

export interface ProcessUpdate {
  company_name?: string | null;
  position?: string | null;
  status?: string | null;
}

export interface StageCreate {
  process_id: number;
  stage_name: string;
  stage_date: string; // YYYY-MM-DD format
  notes?: string | null;
  order?: number | null;
}

export interface StageUpdate {
  stage_name?: string | null;
  stage_date?: string | null;
  notes?: string | null;
  order?: number | null;
}

export interface Feedback {
  id: number;
  user_id?: number | null;
  name?: string | null;
  email?: string | null;
  message: string;
  created_at: string;
  username?: string | null;
  user_email?: string | null;
}

export interface FeedbackCreate {
  message: string;
  name?: string | null;
  email?: string | null;
}

export interface PublicProfileResponse {
  username: string;
  display_name?: string | null;
  discord_avatar?: string | null;
  discord_id?: string | null;
  is_anonymous: boolean;
  comments_enabled: boolean;
  account_created_at: string;
  processes: Process[];
  stats: {
    total_public_processes: number;
    offers_received: number;
    active_applications: number;
    rejected: number;
    success_rate: number;
    comment_count?: number;
  };
}

export interface ProfileComment {
  id: number;
  profile_user_id: number;
  author_id?: number | null;
  author_display_name?: string | null;
  author_username?: string | null;
  author_discord_avatar?: string | null;
  author_discord_id?: string | null;
  parent_comment_id?: number | null;
  content: string;
  is_question: boolean;
  is_answered: boolean;
  upvotes: number;
  user_has_upvoted: boolean;
  created_at: string;
  updated_at: string;
  replies: ProfileComment[];
}

export interface ProfileCommentCreate {
  content: string;
  is_question?: boolean;
  author_display_name?: string | null;
  parent_comment_id?: number | null;
}

export interface ProfileCommentUpdate {
  content?: string | null;
}

