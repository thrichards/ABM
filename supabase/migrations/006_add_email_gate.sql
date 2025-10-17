-- Add email gate settings to pages table
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS email_gate_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_gate_type VARCHAR(20) CHECK (email_gate_type IN ('domain', 'allowlist', 'any')),
ADD COLUMN IF NOT EXISTS email_gate_domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_gate_allowlist TEXT[]; -- Array of allowed email addresses

-- Create table to store captured emails
CREATE TABLE IF NOT EXISTS page_email_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company VARCHAR(255),
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  UNIQUE(page_id, email)
);

-- Create indexes
CREATE INDEX idx_page_email_captures_page ON page_email_captures(page_id);
CREATE INDEX idx_page_email_captures_email ON page_email_captures(email);
CREATE INDEX idx_page_email_captures_captured_at ON page_email_captures(captured_at);

-- Enable RLS for page_email_captures
ALTER TABLE page_email_captures ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert their email (for the email gate)
CREATE POLICY "Anyone can submit email for gated pages" ON page_email_captures
  FOR INSERT WITH CHECK (true);

-- Policy: Organization members can view captured emails for their pages
CREATE POLICY "Organization members can view captured emails" ON page_email_captures
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM pages
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Add comments
COMMENT ON COLUMN pages.email_gate_enabled IS 'Whether email capture is required to view this page';
COMMENT ON COLUMN pages.email_gate_type IS 'Type of email restriction: domain (specific domain), allowlist (specific emails), any (any email)';
COMMENT ON COLUMN pages.email_gate_domain IS 'Required email domain if type is domain (e.g., company.com)';
COMMENT ON COLUMN pages.email_gate_allowlist IS 'Array of allowed email addresses if type is allowlist';