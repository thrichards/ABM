-- Simplified RLS policies for email capture
-- Since we're using INSERT instead of UPSERT, we only need INSERT permission for public

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can insert email captures" ON page_email_captures;
DROP POLICY IF EXISTS "Public can check their own email" ON page_email_captures;
DROP POLICY IF EXISTS "Organization members can manage captured emails" ON page_email_captures;
DROP POLICY IF EXISTS "Public can select email captures" ON page_email_captures;
DROP POLICY IF EXISTS "Public can update email captures" ON page_email_captures;
DROP POLICY IF EXISTS "Organization members can delete captured emails" ON page_email_captures;

-- 1. Allow public to INSERT new email captures
CREATE POLICY "Public can insert email captures" ON page_email_captures
  FOR INSERT
  WITH CHECK (true);

-- 2. Organization members can view captured emails for their pages
CREATE POLICY "Organization members can view captured emails" ON page_email_captures
  FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM pages
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- 3. Organization members can delete captured emails for their pages
CREATE POLICY "Organization members can delete captured emails" ON page_email_captures
  FOR DELETE
  USING (
    page_id IN (
      SELECT id FROM pages
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Ensure RLS is enabled
ALTER TABLE page_email_captures ENABLE ROW LEVEL SECURITY;