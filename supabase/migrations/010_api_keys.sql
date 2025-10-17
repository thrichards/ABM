-- Create API keys table for external API access
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE, -- Store hashed version of the key
  key_prefix VARCHAR(10) NOT NULL, -- Store first few chars for identification (e.g., "trig_xxx...")
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_organization ON api_keys(organization_id);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
-- Users can view API keys for their organizations (but not the actual key)
CREATE POLICY "Users can view their organization API keys" ON api_keys
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Admins can create API keys for their organizations
CREATE POLICY "Admins can create API keys" ON api_keys
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update API keys (to deactivate them)
CREATE POLICY "Admins can update API keys" ON api_keys
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete API keys
CREATE POLICY "Admins can delete API keys" ON api_keys
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add comment for documentation
COMMENT ON TABLE api_keys IS 'API keys for external programmatic access to create and manage ABM pages';