-- Fix call cost metrics to properly track ElevenLabs credits and LLM charges
-- The metadata.cost field contains total credits (call_charge + llm_charge), not USD

-- Add new columns for proper metric tracking
ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS elevenlabs_call_credits INTEGER,
  ADD COLUMN IF NOT EXISTS elevenlabs_llm_credits INTEGER,
  ADD COLUMN IF NOT EXISTS elevenlabs_total_credits INTEGER;

-- Rename call_cost_usd to reflect it actually stores total credits
ALTER TABLE call_logs
  RENAME COLUMN call_cost_usd TO call_cost_credits_legacy;

-- Update the comment to clarify the legacy field
COMMENT ON COLUMN call_logs.call_cost_credits_legacy IS 'Legacy field: stores metadata.cost (total ElevenLabs credits). Use elevenlabs_total_credits instead.';
