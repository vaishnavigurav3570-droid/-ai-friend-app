-- ============================================
-- Migration 008: Calendar Blocks
-- AI-scheduled and manual time blocks
-- ============================================

CREATE TABLE calendar_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'ai'
    CHECK (source IN ('ai', 'manual')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_calendar_user_date ON calendar_blocks(user_id, starts_at);
CREATE INDEX idx_calendar_task ON calendar_blocks(task_id);

ALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar blocks"
  ON calendar_blocks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
