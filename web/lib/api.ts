import axios, { AxiosInstance } from 'axios';
import type { 
  User, 
  TokenResponse, 
  Process, 
  ProcessDetail, 
  ProcessCreate, 
  ProcessUpdate,
  Stage,
  StageCreate,
  StageUpdate,
  Feedback,
  FeedbackCreate,
  PublicProfileResponse,
  ProfileComment,
  ProfileCommentCreate,
  ProfileCommentUpdate,
  Notification,
  ExploreProcess,
  ExploreFilters,
  ExploreStats,
  ForumThread,
  ForumThreadCreate,
  ForumThreadUpdate,
  ForumReply,
  ForumReplyCreate,
  ForumReplyUpdate
} from '@/types';

// Ensure API URL uses HTTPS in production (browsers block mixed content)
let rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Force HTTPS for Railway/production URLs
if (rawApiUrl.includes('railway.app') || rawApiUrl.includes('railway.internal')) {
  rawApiUrl = rawApiUrl.replace('http://', 'https://');
  if (!rawApiUrl.startsWith('https://')) {
    rawApiUrl = `https://${rawApiUrl}`;
  }
}

const API_BASE_URL = rawApiUrl;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle rate limiting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle rate limiting (429 status code)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      let message = 'Too many requests. Please slow down.';
      
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (seconds < 60) {
          message = `Rate limit exceeded. Please wait ${seconds} second${seconds !== 1 ? 's' : ''} before trying again.`;
        } else {
          const minutes = Math.floor(seconds / 60);
          message = `Rate limit exceeded. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`;
        }
      } else {
        message = 'Rate limit exceeded. Please wait a moment before trying again.';
      }
      
      // Dispatch custom event for toast notification
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api-rate-limit', { detail: { message } }));
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper to update auth token
export const setAuthToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

// Auth API
export const authApi = {

  getMe: async (): Promise<User> => {
    // Ensure token is available
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token available');
    }
    const response = await apiClient.get<User>('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  logout: () => {
    setAuthToken(null);
  },

      checkAdmin: async (): Promise<{ is_admin: boolean }> => {
        const response = await apiClient.get<{ is_admin: boolean }>('/auth/is-admin');
        return response.data;
      },
      disconnectDiscord: async (): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>('/auth/discord/disconnect');
        return response.data;
      },
      updateProfile: async (data: { username?: string; display_name?: string | null; is_anonymous?: boolean; comments_enabled?: boolean }): Promise<User> => {
        const response = await apiClient.patch<User>('/auth/me', data);
        return response.data;
      },
    };

// Process API
export const processApi = {
  getAll: async (): Promise<Process[]> => {
    const response = await apiClient.get<Process[]>('/api/processes/');
    return response.data;
  },

  getById: async (id: number): Promise<Process> => {
    const response = await apiClient.get<Process>(`/api/processes/${id}`);
    return response.data;
  },

  getDetail: async (id: number): Promise<ProcessDetail> => {
    const response = await apiClient.get<ProcessDetail>(`/api/processes/${id}/detail`);
    return response.data;
  },

  create: async (data: ProcessCreate): Promise<Process> => {
    const response = await apiClient.post<Process>('/api/processes/', data);
    return response.data;
  },

  update: async (id: number, data: ProcessUpdate): Promise<Process> => {
    const response = await apiClient.patch<Process>(`/api/processes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<Process> => {
    const response = await apiClient.delete<Process>(`/api/processes/${id}`);
    return response.data;
  },

  toggleSharing: async (id: number, isPublic: boolean): Promise<Process> => {
    const response = await apiClient.patch<Process>(`/api/processes/${id}/share`, {
      is_public: isPublic,
    });
    return response.data;
  },

  getPublic: async (shareId: string): Promise<ProcessDetail> => {
    const response = await apiClient.get<ProcessDetail>(`/api/processes/share/${shareId}`);
    return response.data;
  },
};

// Stage API
export const stageApi = {
  getByProcess: async (processId: number): Promise<Stage[]> => {
    const response = await apiClient.get<Stage[]>(`/api/stages/process/${processId}`);
    return response.data;
  },

  create: async (data: StageCreate): Promise<Stage> => {
    const response = await apiClient.post<Stage>('/api/stages/', data);
    return response.data;
  },

  update: async (id: number, data: StageUpdate): Promise<Stage> => {
    const response = await apiClient.patch<Stage>(`/api/stages/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<Stage> => {
    const response = await apiClient.delete<Stage>(`/api/stages/${id}`);
    return response.data;
  },
};

// Feedback API
export const feedbackApi = {
  submit: async (data: FeedbackCreate): Promise<Feedback> => {
    const response = await apiClient.post<Feedback>('/api/feedback/', data);
    return response.data;
  },

  getAll: async (): Promise<Feedback[]> => {
    const response = await apiClient.get<Feedback[]>('/api/feedback/');
    return response.data;
  },
};

// Profile API
export const profileApi = {
  getPublicProfile: async (username: string): Promise<PublicProfileResponse> => {
    const response = await apiClient.get<PublicProfileResponse>(`/api/profiles/${username}`);
    return response.data;
  },
};

// Comment API
export const commentApi = {
  getComments: async (username: string): Promise<ProfileComment[]> => {
    const response = await apiClient.get<ProfileComment[]>(`/api/profiles/${username}/comments`);
    return response.data;
  },

  createComment: async (username: string, data: ProfileCommentCreate): Promise<ProfileComment> => {
    const response = await apiClient.post<ProfileComment>(`/api/profiles/${username}/comments`, data);
    return response.data;
  },

  updateComment: async (username: string, commentId: number, data: ProfileCommentUpdate): Promise<ProfileComment> => {
    const response = await apiClient.patch<ProfileComment>(`/api/profiles/${username}/comments/${commentId}`, data);
    return response.data;
  },

  deleteComment: async (username: string, commentId: number): Promise<void> => {
    await apiClient.delete(`/api/profiles/${username}/comments/${commentId}`);
  },

  replyToComment: async (username: string, commentId: number, data: ProfileCommentCreate): Promise<ProfileComment> => {
    const response = await apiClient.post<ProfileComment>(`/api/profiles/${username}/comments/${commentId}/reply`, data);
    return response.data;
  },

  markAsAnswered: async (username: string, commentId: number): Promise<ProfileComment> => {
    const response = await apiClient.patch<ProfileComment>(`/api/profiles/${username}/comments/${commentId}/answer`);
    return response.data;
  },

  upvoteComment: async (username: string, commentId: number): Promise<ProfileComment> => {
    const response = await apiClient.post<ProfileComment>(`/api/profiles/${username}/comments/${commentId}/upvote`);
    return response.data;
  },
};

// Analytics API
export interface PublicAnalyticsResponse {
  username: string;
  display_name: string | null;
  is_anonymous: boolean;
  processes: Process[];
  process_details: ProcessDetail[];
  stats: {
    total_public_processes: number;
    stage_counts: Record<string, number>;
  };
}

export const analyticsApi = {
  getPublicAnalytics: async (username: string): Promise<PublicAnalyticsResponse> => {
    // No auth token needed for public endpoint
    const response = await apiClient.get<PublicAnalyticsResponse>(
      `/api/analytics/${encodeURIComponent(username)}/public`,
      {
        headers: {
          Authorization: undefined, // Remove auth header for public endpoint
        },
      }
    );
    return response.data;
  },

  getSankeyImageUrl: (username: string): string => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    return `${appUrl}/api/analytics/${encodeURIComponent(username)}/sankey-image`;
  },
};

// Explore API
export const exploreApi = {
  getProcesses: async (params?: {
    search?: string;
    company?: string;
    stage?: string;
    position?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ExploreProcess[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.company) queryParams.append('company', params.company);
    if (params?.stage) queryParams.append('stage', params.stage);
    if (params?.position) queryParams.append('position', params.position);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get<ExploreProcess[]>(
      `/api/explore/processes?${queryParams.toString()}`
    );
    return response.data;
  },

  getCompanies: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/api/explore/companies');
    return response.data;
  },

  getStages: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/api/explore/stages');
    return response.data;
  },

  getStats: async (): Promise<ExploreStats> => {
    const response = await apiClient.get<ExploreStats>('/api/explore/stats');
    return response.data;
  },
};

// Forum API
export const forumApi = {
  getThreads: async (params?: {
    category?: string;
    company?: string;
    stage?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<ForumThread[]> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.company) queryParams.append('company', params.company);
    if (params?.stage) queryParams.append('stage', params.stage);
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await apiClient.get<ForumThread[]>(
      `/api/forum/threads?${queryParams.toString()}`
    );
    return response.data;
  },

  getThread: async (threadId: number): Promise<ForumThread> => {
    const response = await apiClient.get<ForumThread>(`/api/forum/threads/${threadId}`);
    return response.data;
  },

  createThread: async (data: ForumThreadCreate): Promise<ForumThread> => {
    const response = await apiClient.post<ForumThread>('/api/forum/threads', data);
    return response.data;
  },

  updateThread: async (threadId: number, data: ForumThreadUpdate): Promise<ForumThread> => {
    const response = await apiClient.patch<ForumThread>(`/api/forum/threads/${threadId}`, data);
    return response.data;
  },

  deleteThread: async (threadId: number): Promise<void> => {
    await apiClient.delete(`/api/forum/threads/${threadId}`);
  },

  createReply: async (threadId: number, data: ForumReplyCreate): Promise<ForumReply> => {
    const response = await apiClient.post<ForumReply>(`/api/forum/threads/${threadId}/replies`, data);
    return response.data;
  },

  updateReply: async (replyId: number, data: ForumReplyUpdate): Promise<ForumReply> => {
    const response = await apiClient.patch<ForumReply>(`/api/forum/replies/${replyId}`, data);
    return response.data;
  },

  deleteReply: async (replyId: number): Promise<void> => {
    await apiClient.delete(`/api/forum/replies/${replyId}`);
  },

  upvoteReply: async (replyId: number): Promise<void> => {
    await apiClient.post(`/api/forum/replies/${replyId}/upvote`);
  },

  removeUpvote: async (replyId: number): Promise<void> => {
    await apiClient.delete(`/api/forum/replies/${replyId}/upvote`);
  },
};

// Notification API
export const notificationApi = {
  getAll: async (): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>('/api/notifications');
    return response.data;
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await apiClient.get<{ unread_count: number }>('/api/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<Notification> => {
    const response = await apiClient.patch<Notification>(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>('/api/notifications/read-all');
    return response.data;
  },
};

export default apiClient;

