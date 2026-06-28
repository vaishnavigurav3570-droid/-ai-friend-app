-- ============================================
-- Migration 007: Habits & Habit Log
-- Recurring habit tracking with check-in log
-- ============================================

CREATE TABLE habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  frequency text NOT NULL DEFAULT 'daily'
    CHECK (frequency IN ('daily', 'weekdays', 'weekly', 'custom')),
  custom_days integer[] DEFAULT '{}',
  token_reward integer NOT NULL DEFAULT 5,
  reminder_time time,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_habits_user_active ON habits(user_id) WHERE is_active = true;

CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own habits"
  ON habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Habit completion log
CREATE TABLE habit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_date date NOT NULL,
  completed boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_habit_log_unique ON habit_log(habit_id, logged_date);
CREATE INDEX idx_habit_log_user_date ON habit_log(user_id, logged_date DESC);

ALTER TABLE habit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own habit logs"
  ON habit_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
