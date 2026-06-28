-- ============================================
-- Migration 009: Voice Dumps
-- Raw voice-to-task captures with AI parsing
-- ============================================

CREATE TABLE voice_dumps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  audio_url text NOT NULL,
  transcript text,
  extracted_tasks jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'parsed', 'failed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_voice_user_created ON voice_dumps(user_id, created_at DESC);

ALTER TABLE voice_dumps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own voice dumps"
  ON voice_dumps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
