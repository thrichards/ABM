-- Rollback script for AI prompts and generations
-- Run this first if you need to re-run the migration

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view organization prompts" ON ai_prompts;
DROP POLICY IF EXISTS "Admins can insert prompts" ON ai_prompts;
DROP POLICY IF EXISTS "Admins can update prompts" ON ai_prompts;
DROP POLICY IF EXISTS "Admins can delete prompts" ON ai_prompts;
DROP POLICY IF EXISTS "Users can view organization generations" ON ai_generations;
DROP POLICY IF EXISTS "Users can insert generations" ON ai_generations;
DROP POLICY IF EXISTS "Users can update generations" ON ai_generations;

-- Drop triggers
DROP TRIGGER IF EXISTS ai_prompts_updated_at ON ai_prompts;
DROP TRIGGER IF EXISTS ai_generations_updated_at ON ai_generations;

-- Drop functions
DROP FUNCTION IF EXISTS update_ai_prompts_updated_at();
DROP FUNCTION IF EXISTS update_ai_generations_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS unique_default_prompt_type;
DROP INDEX IF EXISTS idx_ai_prompts_organization;
DROP INDEX IF EXISTS idx_ai_prompts_type;
DROP INDEX IF EXISTS idx_ai_prompts_active;
DROP INDEX IF EXISTS idx_ai_prompts_default;
DROP INDEX IF EXISTS idx_ai_generations_organization;
DROP INDEX IF EXISTS idx_ai_generations_prompt;
DROP INDEX IF EXISTS idx_ai_generations_call_log;
DROP INDEX IF EXISTS idx_ai_generations_created_at;
DROP INDEX IF EXISTS idx_ai_generations_status;
DROP INDEX IF EXISTS idx_ai_generations_type;

-- Drop tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS ai_generations CASCADE;
DROP TABLE IF EXISTS ai_prompts CASCADE;
