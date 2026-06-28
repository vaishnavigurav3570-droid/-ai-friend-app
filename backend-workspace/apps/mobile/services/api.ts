// ============================================
// Antigravity — API Client (Mobile)
// ============================================

import { getAccessToken } from './supabase';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;

  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || 'Request failed',
      response.status,
      data.errors
    );
  }

  return data;
}

// ---- API Functions ----

export const api = {
  // Auth
  getProfile: () => request<any>('/auth/me'),
  updateProfile: (body: Record<string, unknown>) => request<any>('/auth/profile', { method: 'PUT', body }),
  completeOnboarding: (body: Record<string, unknown>) => request<any>('/auth/onboarding', { method: 'POST', body }),

  // Tasks
  getTasks: (params?: Record<string, string>) => request<any>('/tasks', { params }),
  getTask: (id: string) => request<any>(`/tasks/${id}`),
  createTask: (body: Record<string, unknown>) => request<any>('/tasks', { method: 'POST', body }),
  updateTask: (id: string, body: Record<string, unknown>) => request<any>(`/tasks/${id}`, { method: 'PUT', body }),
  completeTask: (id: string) => request<any>(`/tasks/${id}/complete`, { method: 'POST' }),
  deleteTask: (id: string) => request<any>(`/tasks/${id}`, { method: 'DELETE' }),

  // Tokens
  getBalance: () => request<any>('/tokens/balance'),
  getHistory: (params?: Record<string, string>) => request<any>('/tokens/history', { params }),
  unlockApp: (body: Record<string, unknown>) => request<any>('/tokens/unlock', { method: 'POST', body }),

  // Vault
  getLockedApps: () => request<any>('/vault/apps'),
  addLockedApp: (body: Record<string, unknown>) => request<any>('/vault/apps', { method: 'POST', body }),
  updateLockedApp: (id: string, body: Record<string, unknown>) => request<any>(`/vault/apps/${id}`, { method: 'PUT', body }),
  removeLockedApp: (id: string) => request<any>(`/vault/apps/${id}`, { method: 'DELETE' }),
  getActiveSessions: () => request<any>('/vault/sessions'),
  endSession: (id: string) => request<any>(`/vault/sessions/${id}/end`, { method: 'POST' }),

  // AI
  breakdownTask: (taskId: string) => request<any>('/ai/breakdown', { method: 'POST', body: { task_id: taskId } }),
  generateSchedule: (date: string) => request<any>('/ai/schedule', { method: 'POST', body: { date } }),
  parseVoice: (transcript: string) => request<any>('/ai/parse-voice', { method: 'POST', body: { transcript } }),

  // Habits
  getHabits: () => request<any>('/habits'),
  createHabit: (body: Record<string, unknown>) => request<any>('/habits', { method: 'POST', body }),
  logHabit: (id: string) => request<any>(`/habits/${id}/log`, { method: 'POST' }),
  getHabitHistory: (id: string, days?: number) => request<any>(`/habits/${id}/history`, { params: days ? { days: String(days) } : undefined }),

  // Calendar
  getCalendarBlocks: (startDate: string, endDate: string) =>
    request<any>('/calendar/blocks', { params: { start_date: startDate, end_date: endDate } }),
  createCalendarBlock: (body: Record<string, unknown>) => request<any>('/calendar/blocks', { method: 'POST', body }),

  // Voice
  createVoiceDump: (audioUrl: string) => request<any>('/voice/dump', { method: 'POST', body: { audio_url: audioUrl } }),
  processVoiceDump: (id: string, transcript: string) =>
    request<any>(`/voice/dumps/${id}/process`, { method: 'POST', body: { transcript } }),
  getVoiceDumps: () => request<any>('/voice/dumps'),
};
