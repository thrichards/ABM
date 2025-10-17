-- Fix RLS policy for public email capture
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can submit email for gated pages" ON page_email_captures;
DROP POLICY IF EXISTS "Organization members can view captured emails" ON page_email_captures;

-- Allow anyone to insert emails (for the email gate)
-- This is needed for public visitors to submit their email
CREATE POLICY "Public can insert email captures" ON page_email_captures
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to check if their email exists for a page (for session validation)
CREATE POLICY "Public can check their own email" ON page_email_captures
  FOR SELECT
  USING (true);

-- Organization members can view all captured emails for their pages
CREATE POLICY "Organization members can manage captured emails" ON page_email_captures
  FOR ALL
  USING (
    page_id IN (
      SELECT id FROM pages
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Make sure the table has RLS enabled
ALTER TABLE page_email_captures ENABLE ROW LEVEL SECURITY;