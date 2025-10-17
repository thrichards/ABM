-- Fix infinite recursion in RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can manage organization members" ON organization_users;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_users;

-- Create fixed policies for organizations
-- Allow authenticated users to create organizations (they become the admin)
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Admins can update their organizations (without circular reference)
CREATE POLICY "Admins can update their organizations" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE organization_users.organization_id = organizations.id
        AND organization_users.user_id = auth.uid()
        AND organization_users.role = 'admin'
    )
  );

-- Create fixed policies for organization_users
-- Allow viewing organization members if you're in the same org
CREATE POLICY "Users can view organization members" ON organization_users
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM organization_users AS ou2
      WHERE ou2.organization_id = organization_users.organization_id
    )
  );

-- Allow inserting the first admin when creating an organization
-- This happens in a transaction so we check if the org exists and has no users yet
CREATE POLICY "Allow first admin creation" ON organization_users
  FOR INSERT WITH CHECK (
    -- Either you're adding yourself as the first user to a new org
    (
      user_id = auth.uid()
      AND role = 'admin'
      AND NOT EXISTS (
        SELECT 1 FROM organization_users AS ou2
        WHERE ou2.organization_id = organization_users.organization_id
      )
    )
    OR
    -- Or you're an existing admin adding new members
    (
      EXISTS (
        SELECT 1 FROM organization_users AS ou2
        WHERE ou2.organization_id = organization_users.organization_id
          AND ou2.user_id = auth.uid()
          AND ou2.role = 'admin'
      )
    )
  );

-- Admins can update and delete organization members
CREATE POLICY "Admins can update organization members" ON organization_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_users AS ou2
      WHERE ou2.organization_id = organization_users.organization_id
        AND ou2.user_id = auth.uid()
        AND ou2.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete organization members" ON organization_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_users AS ou2
      WHERE ou2.organization_id = organization_users.organization_id
        AND ou2.user_id = auth.uid()
        AND ou2.role = 'admin'
    )
  );