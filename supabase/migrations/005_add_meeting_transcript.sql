-- Add meeting_transcript field to pages table
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS meeting_transcript TEXT,
ADD COLUMN IF NOT EXISTS agent_config JSONB DEFAULT '{}';

-- The agent_config can store ElevenLabs agent settings specific to each page
COMMENT ON COLUMN pages.meeting_transcript IS 'Meeting transcript data for the AI agent to reference';
COMMENT ON COLUMN pages.agent_config IS 'Configuration for the ElevenLabs voice agent';