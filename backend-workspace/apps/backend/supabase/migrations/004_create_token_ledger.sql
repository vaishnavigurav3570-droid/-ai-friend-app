-- ============================================
-- Migration 004: Token Ledger
-- Immutable audit log of every token earn/spend
-- ============================================

CREATE TABLE token_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  type text NOT NULL
    CHECK (type IN ('task_complete', 'streak_bonus', 'app_unlock', 'penalty', 'bonus', 'daily_challenge', 'habit_complete')),
  reference_id uuid,
  reference_type text CHECK (reference_type IN ('task', 'app_lock_session', 'habit', NULL)),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Ledger is append-only: no UPDATE or DELETE policies
CREATE INDEX idx_ledger_user_created ON token_ledger(user_id, created_at DESC);
CREATE INDEX idx_ledger_user_type ON token_ledger(user_id, type);

ALTER TABLE token_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger"
  ON token_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ledger entries"
  ON token_ledger FOR INSERT
  WITH CHECK (auth.uid() = user_id);
