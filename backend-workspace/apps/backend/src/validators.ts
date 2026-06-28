// ============================================
// Antigravity — Zod Validators
// Shared input validation for both frontend & backend
// ============================================

import { z } from 'zod';

// ---- Task Validators ----

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional(),
  parent_task_id: z.string().uuid().optional(),
  goal_id: z.string().uuid().optional(),
  priority: z.number().int().min(1).max(5).default(3),
  estimated_minutes: z.number().int().min(1).max(120).optional(),
  deadline: z.string().datetime().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  source: z.enum(['manual', 'ai_breakdown', 'voice_dump', 'intercept']).default('manual'),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  estimated_minutes: z.number().int().min(1).max(120).optional(),
  deadline: z.string().datetime().nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped', 'expired']).optional(),
  order_index: z.number().int().min(0).optional(),
});

export const CompleteTaskSchema = z.object({
  actual_minutes: z.number().int().min(1).max(480).optional(),
});

export const TaskFilterSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped', 'expired']).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  parent_task_id: z.string().uuid().nullable().optional(),
  goal_id: z.string().uuid().optional(),
  is_micro_task: z.boolean().optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// ---- Goal Validators ----

export const CreateGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(2000).optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be hex color').default('#6C5CE7'),
});

export const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(['active', 'completed', 'abandoned']).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// ---- Vault Validators ----

export const LockAppSchema = z.object({
  package_name: z.string().min(1, 'Package name is required').max(300),
  app_label: z.string().min(1, 'App label is required').max(100),
  icon_url: z.string().url().optional(),
  unlock_cost: z.number().int().min(1).max(1000).default(50),
  daily_limit_minutes: z.number().int().min(5).max(480).default(60),
});

export const UpdateLockedAppSchema = z.object({
  unlock_cost: z.number().int().min(1).max(1000).optional(),
  is_active: z.boolean().optional(),
  daily_limit_minutes: z.number().int().min(5).max(480).optional(),
});

export const UnlockAppSchema = z.object({
  locked_app_id: z.string().uuid('Valid app ID required'),
  duration_minutes: z.number().int()
    .refine((v) => [15, 30, 60].includes(v), 'Duration must be 15, 30, or 60 minutes'),
});

// ---- Habit Validators ----

export const CreateHabitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  frequency: z.enum(['daily', 'weekdays', 'weekly', 'custom']).default('daily'),
  custom_days: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  token_reward: z.number().int().min(1).max(100).default(5),
  reminder_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Must be HH:MM format').optional(),
});

export const UpdateHabitSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  frequency: z.enum(['daily', 'weekdays', 'weekly', 'custom']).optional(),
  custom_days: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  token_reward: z.number().int().min(1).max(100).optional(),
  reminder_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  is_active: z.boolean().optional(),
});

export const LogHabitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
});

// ---- Calendar Validators ----

export const CreateCalendarBlockSchema = z.object({
  task_id: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  source: z.enum(['ai', 'manual']).default('manual'),
});

export const CalendarRangeSchema = z.object({
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
});

// ---- Voice Dump Validators ----

export const CreateVoiceDumpSchema = z.object({
  audio_url: z.string().min(1, 'Audio URL is required'),
});

// ---- AI Validators ----

export const BreakdownRequestSchema = z.object({
  task_id: z.string().uuid(),
});

export const ScheduleRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  task_ids: z.array(z.string().uuid()).min(1).max(20).optional(),
});

export const VoiceParseRequestSchema = z.object({
  transcript: z.string().min(1).max(10000),
});

// ---- Profile Validators ----

export const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().nullable().optional(),
  timezone: z.string().min(1).max(50).optional(),
  ai_preference: z.record(z.unknown()).optional(),
});

export const OnboardingSchema = z.object({
  display_name: z.string().min(1).max(100),
  timezone: z.string().min(1).max(50),
  locked_apps: z.array(LockAppSchema).min(1).max(20),
  goals: z.array(CreateGoalSchema).max(5).optional(),
});

// ---- Type Inference Helpers ----

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CompleteTaskInput = z.infer<typeof CompleteTaskSchema>;
export type TaskFilterInput = z.infer<typeof TaskFilterSchema>;
export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;
export type LockAppInput = z.infer<typeof LockAppSchema>;
export type UpdateLockedAppInput = z.infer<typeof UpdateLockedAppSchema>;
export type UnlockAppInput = z.infer<typeof UnlockAppSchema>;
export type CreateHabitInput = z.infer<typeof CreateHabitSchema>;
export type UpdateHabitInput = z.infer<typeof UpdateHabitSchema>;
export type LogHabitInput = z.infer<typeof LogHabitSchema>;
export type CreateCalendarBlockInput = z.infer<typeof CreateCalendarBlockSchema>;
export type CalendarRangeInput = z.infer<typeof CalendarRangeSchema>;
export type CreateVoiceDumpInput = z.infer<typeof CreateVoiceDumpSchema>;
export type BreakdownRequestInput = z.infer<typeof BreakdownRequestSchema>;
export type ScheduleRequestInput = z.infer<typeof ScheduleRequestSchema>;
export type VoiceParseRequestInput = z.infer<typeof VoiceParseRequestSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type OnboardingInput = z.infer<typeof OnboardingSchema>;
