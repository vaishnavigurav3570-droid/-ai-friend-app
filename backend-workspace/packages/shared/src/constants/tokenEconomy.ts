// ============================================
// Antigravity — Token Economy Constants
// Central configuration for the earn-to-play system
// ============================================

/** Base token reward for completing a standard task */
export const BASE_TASK_REWARD = 10;

/** Reward multipliers based on task priority (P1 = highest) */
export const PRIORITY_REWARD_MULTIPLIERS: Record<number, number> = {
  1: 3.0,   // Critical: 30 tokens
  2: 2.0,   // High: 20 tokens
  3: 1.0,   // Medium: 10 tokens (base)
  4: 0.7,   // Low: 7 tokens
  5: 0.5,   // Minimal: 5 tokens
};

/** Streak bonus: +10% per consecutive day, capped at +100% */
export const STREAK_BONUS_PERCENT_PER_DAY = 0.10;
export const STREAK_BONUS_MAX_MULTIPLIER = 1.0;

/** Default cost to unlock a distracting app (per 15 minutes) */
export const DEFAULT_UNLOCK_COST = 50;

/** Available unlock duration options */
export const UNLOCK_DURATION_OPTIONS = [
  { minutes: 15, label: '15 min', icon: '⏱️' },
  { minutes: 30, label: '30 min', icon: '⏳' },
  { minutes: 60, label: '1 hour', icon: '🕐' },
] as const;

/** Pro-rate formula: cost = (unlock_cost / 15) * duration_minutes */
export function calculateUnlockCost(baseCostPer15Min: number, durationMinutes: number): number {
  return Math.ceil(baseCostPer15Min * (durationMinutes / 15));
}

/** Calculate task reward based on priority */
export function calculateTaskReward(priority: number): number {
  const multiplier = PRIORITY_REWARD_MULTIPLIERS[priority] ?? 1.0;
  return Math.round(BASE_TASK_REWARD * multiplier);
}

/** Calculate streak bonus tokens */
export function calculateStreakBonus(baseReward: number, streakDays: number): number {
  if (streakDays <= 0) return 0;
  const bonusPercent = Math.min(streakDays * STREAK_BONUS_PERCENT_PER_DAY, STREAK_BONUS_MAX_MULTIPLIER);
  return Math.floor(baseReward * bonusPercent);
}

/** Max daily usage for any single locked app (minutes) */
export const MAX_DAILY_APP_MINUTES = 120;

/** Default daily limit per app (minutes) */
export const DEFAULT_DAILY_LIMIT_MINUTES = 60;

/** Inflation: cost multiplier for repeated unlocks in a day */
export const INFLATION_MULTIPLIERS = [
  1.0,    // 1st unlock: normal cost
  1.5,    // 2nd unlock: 50% more
  2.0,    // 3rd unlock: double cost
  3.0,    // 4th+: triple cost
] as const;

/** Get the inflation multiplier for the nth unlock today */
export function getInflationMultiplier(unlocksToday: number): number {
  const idx = Math.min(unlocksToday, INFLATION_MULTIPLIERS.length - 1);
  return INFLATION_MULTIPLIERS[idx];
}

/** Habit completion reward */
export const HABIT_COMPLETION_REWARD = 5;

/** Daily challenge bonus */
export const DAILY_CHALLENGE_BONUS = 25;

/** Minimum micro-task duration (minutes) */
export const MICRO_TASK_MIN_MINUTES = 5;

/** Maximum micro-task duration (minutes) */
export const MICRO_TASK_MAX_MINUTES = 15;

/** Target number of micro-tasks per breakdown */
export const MICRO_TASK_TARGET_COUNT = { min: 3, max: 7 };

/** Cooldown penalty multiplier for dismissing intercept overlays */
export const DISMISS_PENALTY_MULTIPLIER = 1.5;

/** Number of consecutive dismissals before penalty kicks in */
export const DISMISS_PENALTY_THRESHOLD = 3;
