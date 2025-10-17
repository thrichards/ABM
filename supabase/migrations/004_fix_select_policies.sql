-- Fix SELECT policies for organization_users and organizations
-- The current policies have circular references that prevent reading

-- Drop the problematic SELECT policies
DROP POLICY IF EXISTS "Users can view organization members" ON organization_users;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;

-- Create a simpler SELECT policy for organization_users
CREATE POLICY "Users can view organization memberships" ON organization_users
  FOR SELECT USING (
    -- User can always see their own membership
    auth.uid() = user_id
    OR
    -- User can see other members in their organization
    organization_id IN (
      SELECT organization_id
      FROM organization_users AS ou2
      WHERE ou2.user_id = auth.uid()
    )
  );

-- Fix the organizations SELECT policy
-- Users can see organizations they belong to
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM organization_users
      WHERE organization_users.organization_id = organizations.id
        AND organization_users.user_id = auth.uid()
    )
  );