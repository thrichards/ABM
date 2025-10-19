-- AI Prompts table
-- Stores reusable prompt templates for AI operations
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Prompt identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_type VARCHAR(50) NOT NULL, -- 'meeting_summary', 'transcript_condense', 'custom'

  -- Prompt content
  system_prompt TEXT,
  user_prompt_template TEXT NOT NULL,

  -- Configuration
  model VARCHAR(100) DEFAULT 'claude-sonnet-4-5-20250929', -- AI model to use (Claude Sonnet 4.5)
  temperature DECIMAL(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4000,

  -- Metadata
  is_default BOOLEAN DEFAULT false, -- Is this a default prompt for the type?
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique index to ensure only one default per type per organization
CREATE UNIQUE INDEX unique_default_prompt_type
  ON ai_prompts(organization_id, prompt_type)
  WHERE is_default = true;

-- AI Generations table
-- Stores history of AI generations
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Relationships
  prompt_id UUID REFERENCES ai_prompts(id) ON DELETE SET NULL,
  call_log_id UUID REFERENCES call_logs(id) ON DELETE CASCADE, -- Optional: link to call if summarizing

  -- Generation context
  generation_type VARCHAR(50) NOT NULL, -- 'meeting_summary', 'transcript_condense', 'custom'

  -- Input/Output
  input_text TEXT NOT NULL, -- The transcript or text being processed
  input_length INTEGER, -- Character count of input
  prompt_used TEXT NOT NULL, -- The actual prompt sent to AI (after template rendering)
  output_text TEXT, -- AI-generated output
  output_length INTEGER, -- Character count of output

  -- AI Configuration used
  model VARCHAR(100),
  temperature DECIMAL(3, 2),
  max_tokens INTEGER,

  -- Execution details
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  tokens_used INTEGER, -- Total tokens consumed
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cost_usd DECIMAL(10, 6), -- Cost of generation
  processing_time_ms INTEGER, -- Time taken to generate

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ai_prompts
CREATE INDEX idx_ai_prompts_organization ON ai_prompts(organization_id);
CREATE INDEX idx_ai_prompts_type ON ai_prompts(prompt_type);
CREATE INDEX idx_ai_prompts_active ON ai_prompts(is_active) WHERE is_active = true;
CREATE INDEX idx_ai_prompts_default ON ai_prompts(is_default) WHERE is_default = true;

-- Indexes for ai_generations
CREATE INDEX idx_ai_generations_organization ON ai_generations(organization_id);
CREATE INDEX idx_ai_generations_prompt ON ai_generations(prompt_id);
CREATE INDEX idx_ai_generations_call_log ON ai_generations(call_log_id);
CREATE INDEX idx_ai_generations_created_at ON ai_generations(created_at DESC);
CREATE INDEX idx_ai_generations_status ON ai_generations(status);
CREATE INDEX idx_ai_generations_type ON ai_generations(generation_type);

-- Updated at trigger for ai_prompts
CREATE OR REPLACE FUNCTION update_ai_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_prompts_updated_at();

-- Updated at trigger for ai_generations
CREATE OR REPLACE FUNCTION update_ai_generations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_generations_updated_at
  BEFORE UPDATE ON ai_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_generations_updated_at();

-- Insert default prompts for meeting summaries
-- These will be available to all organizations
INSERT INTO ai_prompts (
  organization_id,
  name,
  description,
  prompt_type,
  system_prompt,
  user_prompt_template,
  model,
  temperature,
  max_tokens,
  is_default,
  is_active
)
SELECT
  o.id as organization_id,
  'Default Meeting Summary',
  'Generates a comprehensive, detailed summary of a meeting transcript',
  'meeting_summary',
  'You are an expert meeting analyst. Create detailed, professional meeting summaries that capture all important information, decisions, action items, and insights.',
  'Please create a very detailed meeting summary from the following transcript. Include:

1. **Executive Summary** - A brief 2-3 sentence overview
2. **Key Discussion Points** - Main topics discussed
3. **Decisions Made** - Any conclusions or decisions reached
4. **Action Items** - Tasks and next steps identified
5. **Important Insights** - Notable observations or revelations
6. **Follow-up Required** - Areas needing additional attention

Transcript:
{{transcript}}',
  'claude-sonnet-4-5-20250929',
  0.3,
  4000,
  true,
  true
FROM organizations o;

-- Insert default prompt for transcript condensing
INSERT INTO ai_prompts (
  organization_id,
  name,
  description,
  prompt_type,
  system_prompt,
  user_prompt_template,
  model,
  temperature,
  max_tokens,
  is_default,
  is_active
)
SELECT
  o.id as organization_id,
  'Condense Transcript',
  'Condenses a long transcript into a shorter version while preserving key information',
  'transcript_condense',
  'You are an expert at condensing conversations while preserving all critical information. Your goal is to reduce length while maintaining clarity and completeness.',
  'Please condense the following transcript to approximately 50% of its original length while preserving all important information, context, and meaning:

{{transcript}}',
  'claude-sonnet-4-5-20250929',
  0.2,
  3000,
  true,
  true
FROM organizations o;

-- Insert default prompt for page content generation
INSERT INTO ai_prompts (
  organization_id,
  name,
  description,
  prompt_type,
  system_prompt,
  user_prompt_template,
  model,
  temperature,
  max_tokens,
  is_default,
  is_active
)
SELECT
  o.id as organization_id,
  'Generate Page Content',
  'Generates engaging ABM page content based on company information',
  'page_content',
  'You are an expert B2B marketing copywriter. Create compelling, personalized ABM landing page content in markdown format.',
  'Create engaging ABM landing page content for {{company_name}}.

Company context:
{{context}}

Create markdown content that includes:
- A compelling introduction paragraph
- 2-3 key value propositions with headers
- Specific benefits relevant to their industry/use case
- A call-to-action section

Use markdown formatting (headers, bold, lists, etc.). Be specific and personalized.',
  'claude-sonnet-4-5-20250929',
  0.7,
  2000,
  true,
  true
FROM organizations o;

-- RLS Policies

-- ai_prompts policies
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- Users can view prompts in their organization
CREATE POLICY "Users can view organization prompts"
  ON ai_prompts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Admin users can insert prompts
CREATE POLICY "Admins can insert prompts"
  ON ai_prompts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admin users can update prompts
CREATE POLICY "Admins can update prompts"
  ON ai_prompts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admin users can delete prompts
CREATE POLICY "Admins can delete prompts"
  ON ai_prompts FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ai_generations policies
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Users can view generations in their organization
CREATE POLICY "Users can view organization generations"
  ON ai_generations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert generations in their organization
CREATE POLICY "Users can insert generations"
  ON ai_generations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Users can update their own generations
CREATE POLICY "Users can update generations"
  ON ai_generations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE ai_prompts IS 'Stores reusable AI prompt templates for various operations';
COMMENT ON TABLE ai_generations IS 'Stores history and results of AI generations';
COMMENT ON COLUMN ai_prompts.user_prompt_template IS 'Template string with {{variable}} placeholders';
COMMENT ON COLUMN ai_generations.input_text IS 'The full input text (transcript) sent to AI';
COMMENT ON COLUMN ai_generations.prompt_used IS 'The rendered prompt after template variable substitution';
