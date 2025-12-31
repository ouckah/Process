// TypeScript types matching the FastAPI schemas

export interface User {
  id: number;
  email: string;
  username: string;
  discord_id?: string | null;
  google_id?: string | null;
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

