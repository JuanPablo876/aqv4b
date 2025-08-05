-- Fix for infinite recursion in RLS policies and admin user setup
-- This resolves: infinite recursion detected in policy for relation "user_roles"

-- First, disable RLS temporarily to fix the policies
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can delete user roles" ON user_roles;

-- Drop existing role policies that might cause issues
DROP POLICY IF EXISTS "Users can view all roles" ON roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON roles;

-- Create a function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = user_uuid 
        AND r.name = 'admin' 
        AND ur.is_active = true
        AND r.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create new non-recursive policies for roles table
CREATE POLICY "Anyone can view active roles" ON roles 
FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage roles" ON roles 
FOR ALL USING (is_admin());

-- Create new non-recursive policies for user_roles table
CREATE POLICY "Users can view their own roles" ON user_roles 
FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage user roles" ON user_roles 
FOR ALL USING (is_admin());

-- Ensure test@example.com is an admin
-- First, let's make sure the admin role exists and is active
UPDATE roles SET is_active = true WHERE name = 'admin';

-- Add test@example.com as admin (if not already)
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
SELECT 
    u.id as user_id,
    r.id as role_id,
    u.id as assigned_by,
    true as is_active,
    NOW() as assigned_at
FROM auth.users u
CROSS JOIN roles r
WHERE u.email = 'test@example.com' 
    AND r.name = 'admin'
    AND NOT EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = u.id AND ur.role_id = r.id
    );

-- Create a function to get user permissions (for reports access)
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(permission_name VARCHAR, resource VARCHAR, action VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name, p.resource, p.action
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true 
    AND r.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions to authenticated users
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;

-- Add all permissions to admin role if not already assigned
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Verify the setup
SELECT 'Setup verification:' as status;
SELECT u.email, r.name as role, ur.is_active, ur.assigned_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'test@example.com';
