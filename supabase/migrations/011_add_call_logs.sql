-- Create table to store ElevenLabs call logs
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,

  -- ElevenLabs conversation data
  conversation_id TEXT NOT NULL,
  agent_id TEXT,

  -- Call metadata
  call_duration_seconds INTEGER,
  call_cost_usd DECIMAL(10, 4),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Transcript and analysis
  transcript JSONB,
  analysis JSONB,

  -- User information (from dynamic variables)
  user_email TEXT,
  company_name TEXT,

  -- Full webhook payload for reference
  webhook_payload JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_call_logs_page_id ON call_logs(page_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_conversation_id ON call_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);

-- RLS Policies
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all call logs for their organization's pages
CREATE POLICY "Admins can view call logs for their pages"
  ON call_logs
  FOR SELECT
  TO authenticated
  USING (
    page_id IN (
      SELECT id FROM pages WHERE organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
      )
    )
  );

-- Allow webhook endpoint to insert call logs (will be handled via service role)
CREATE POLICY "Service role can insert call logs"
  ON call_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);
