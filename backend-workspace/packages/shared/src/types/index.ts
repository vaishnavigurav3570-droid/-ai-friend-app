// ============================================
// Antigravity — Shared Types
// TypeScript interfaces mirroring the Supabase schema
// ============================================

// ---- Enums ----

export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Skipped = 'skipped',
  Expired = 'expired',
}

export enum TaskSource {
  Manual = 'manual',
  AIBreakdown = 'ai_breakdown',
  VoiceDump = 'voice_dump',
  Intercept = 'intercept',
}

export enum TaskPriority {
  Critical = 1,
  High = 2,
  Medium = 3,
  Low = 4,
  Minimal = 5,
}

export enum TokenTransactionType {
  TaskComplete = 'task_complete',
  StreakBonus = 'streak_bonus',
  AppUnlock = 'app_unlock',
  Penalty = 'penalty',
  Bonus = 'bonus',
  DailyChallenge = 'daily_challenge',
  HabitComplete = 'habit_complete',
}

export enum SessionStatus {
  Active = 'active',
  Expired = 'expired',
  EndedEarly = 'ended_early',
}

export enum GoalStatus {
  Active = 'active',
  Completed = 'completed',
  Abandoned = 'abandoned',
}

export enum HabitFrequency {
  Daily = 'daily',
  Weekdays = 'weekdays',
  Weekly = 'weekly',
  Custom = 'custom',
}

export enum VoiceDumpStatus {
  Processing = 'processing',
  Parsed = 'parsed',
  Failed = 'failed',
}

// ---- Database Row Types ----

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  token_balance: number;
  streak_days: number;
  longest_streak: number;
  onboarding_complete: boolean;
  ai_preference: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  parent_task_id: string | null;
  goal_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  token_reward: number;
  deadline: string | null;
  completed_at: string | null;
  source: TaskSource;
  ai_metadata: Record<string, unknown>;
  tags: string[];
  is_micro_task: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TaskWithSubtasks extends Task {
  subtasks: Task[];
}

export interface TokenLedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: TokenTransactionType;
  reference_id: string | null;
  reference_type: 'task' | 'app_lock_session' | 'habit' | null;
  description: string | null;
  created_at: string;
}

export interface LockedApp {
  id: string;
  user_id: string;
  package_name: string;
  app_label: string;
  icon_url: string | null;
  unlock_cost: number;
  is_active: boolean;
  daily_limit_minutes: number;
  created_at: string;
}

export interface AppLockSession {
  id: string;
  user_id: string;
  locked_app_id: string;
  tokens_spent: number;
  duration_minutes: number;
  started_at: string;
  expires_at: string;
  actual_end_at: string | null;
  status: SessionStatus;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  status: GoalStatus;
  progress_pct: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  frequency: HabitFrequency;
  custom_days: number[];
  token_reward: number;
  reminder_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  logged_date: string;
  completed: boolean;
  created_at: string;
}

export interface CalendarBlock {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  is_completed: boolean;
  source: 'ai' | 'manual';
  created_at: string;
}

export interface VoiceDump {
  id: string;
  user_id: string;
  audio_url: string;
  transcript: string | null;
  extracted_tasks: ExtractedVoiceTask[];
  status: VoiceDumpStatus;
  created_at: string;
}

// ---- Supporting Types ----

export interface ExtractedVoiceTask {
  title: string;
  priority: number;
  estimated_minutes: number;
  deadline: string | null;
  tags: string[];
}

export interface TaskCompletionResult {
  new_balance: number;
  reward: number;
  streak_bonus: number;
  total_earned: number;
  streak_days: number;
}

export interface UnlockSessionResult {
  session_id: string;
  tokens_spent: number;
  new_balance: number;
  expires_at: string;
  daily_used_minutes: number;
  daily_limit_minutes: number;
}

export interface HabitLogResult {
  new_balance: number;
  reward: number;
  log_id: string;
}

// ---- API Request/Response Types ----

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
