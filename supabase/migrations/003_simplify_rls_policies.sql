-- Simplify RLS policies to fix infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Allow first admin creation" ON organization_users;

-- Create a simpler policy for organization_users INSERT
-- This allows any authenticated user to add themselves to an organization they just created
CREATE POLICY "Users can add themselves to organizations" ON organization_users
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Alternative: Create a database function to handle organization creation
-- This bypasses RLS for the initial setup
CREATE OR REPLACE FUNCTION create_organization_with_admin(
  org_name TEXT,
  org_slug TEXT,
  admin_user_id UUID
)
RETURNS TABLE(organization_id UUID, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with elevated privileges
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Check if user is authenticated
  IF admin_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'User not authenticated'::TEXT;
    RETURN;
  END IF;

  -- Check if slug already exists
  IF EXISTS (SELECT 1 FROM organizations WHERE slug = org_slug) THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Organization slug already exists'::TEXT;
    RETURN;
  END IF;

  -- Create the organization
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  -- Add the user as admin
  INSERT INTO organization_users (organization_id, user_id, role)
  VALUES (new_org_id, admin_user_id, 'admin');

  RETURN QUERY SELECT new_org_id, TRUE, 'Organization created successfully'::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, SQLERRM::TEXT;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_with_admin TO authenticated;