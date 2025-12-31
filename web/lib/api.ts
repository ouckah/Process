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
  FeedbackCreate
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  register: async (email: string, username: string, password: string): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', {
      email,
      username,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2PasswordRequestForm uses 'username' field
    formData.append('password', password);
    
    const response = await apiClient.post<TokenResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data.access_token) {
      setAuthToken(response.data.access_token);
      // Update the default header immediately
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
    } else {
      throw new Error('No access token received from login');
    }
    
    return response.data;
  },

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
    const response = await apiClient.post<Stage>('/api/stages', data);
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

export default apiClient;

