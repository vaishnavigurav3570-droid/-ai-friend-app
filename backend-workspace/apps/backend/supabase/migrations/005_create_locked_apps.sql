-- ============================================
-- Migration 005: Locked Apps
-- User's configured list of distracting apps
-- ============================================

CREATE TABLE locked_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  package_name text NOT NULL,
  app_label text NOT NULL,
  icon_url text,
  unlock_cost integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  daily_limit_minutes integer DEFAULT 60,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_locked_apps_user_package ON locked_apps(user_id, package_name);
CREATE INDEX idx_locked_apps_user_active ON locked_apps(user_id) WHERE is_active = true;

ALTER TABLE locked_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own locked apps"
  ON locked_apps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
