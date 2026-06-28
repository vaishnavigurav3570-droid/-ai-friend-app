-- ============================================
-- Migration 006: App Lock Sessions
-- Tracks every unlock window purchased with tokens
-- ============================================

CREATE TABLE app_lock_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  locked_app_id uuid NOT NULL REFERENCES locked_apps(id) ON DELETE CASCADE,
  tokens_spent integer NOT NULL,
  duration_minutes integer NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  actual_end_at timestamptz,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'ended_early')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sessions_user_active ON app_lock_sessions(user_id, status)
  WHERE status = 'active';
CREATE INDEX idx_sessions_expires ON app_lock_sessions(expires_at)
  WHERE status = 'active';
CREATE INDEX idx_sessions_locked_app ON app_lock_sessions(locked_app_id);

ALTER TABLE app_lock_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
  ON app_lock_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
