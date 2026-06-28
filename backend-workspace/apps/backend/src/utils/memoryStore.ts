import { env } from '../config/env.js';

export const isMock = !env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_');

export interface MockTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'expired';
  estimated_minutes?: number;
  actual_minutes?: number;
  deadline?: string;
  tags: string[];
  created_at: string;
}

export interface MockCalendarBlock {
  id: string;
  user_id: string;
  task_id?: string;
  title: string;
  starts_at: string;
  ends_at: string;
  is_completed: boolean;
  source: 'ai' | 'manual';
  created_at: string;
}

export interface MockHabit {
  id: string;
  user_id: string;
  title: string;
  frequency: 'daily' | 'weekdays' | 'weekly' | 'custom';
  custom_days: number[];
  token_reward: number;
  is_active: boolean;
  streak: number;
  last_logged_date?: string;
}

export const memoryStore = {
  tasks: [
    { id: '1', user_id: '00000000-0000-0000-0000-000000000000', title: 'Design the new Antigravity web dashboard', priority: 5, status: 'in_progress', estimated_minutes: 60, tags: ['Design', 'Frontend'], created_at: new Date().toISOString() },
    { id: '2', user_id: '00000000-0000-0000-0000-000000000000', title: 'Clean up workspace & organize project files', priority: 3, status: 'pending', estimated_minutes: 20, tags: ['Admin'], created_at: new Date().toISOString() }
  ] as MockTask[],
  calendar_blocks: [] as MockCalendarBlock[],
  habits: [
    { id: '1', user_id: '00000000-0000-0000-0000-000000000000', title: 'Drink 3L of Water', frequency: 'daily', custom_days: [], token_reward: 5, is_active: true, streak: 4, last_logged_date: new Date().toISOString().split('T')[0] },
    { id: '2', user_id: '00000000-0000-0000-0000-000000000000', title: 'Exercise / Stretch', frequency: 'daily', custom_days: [], token_reward: 10, is_active: true, streak: 0 }
  ] as MockHabit[],
  profile: {
    id: '00000000-0000-0000-0000-000000000000',
    display_name: 'Developer Mode',
    timezone: 'Asia/Kolkata',
    token_balance: 150,
    streak_days: 2,
    longest_streak: 5,
    onboarding_complete: true
  }
};
