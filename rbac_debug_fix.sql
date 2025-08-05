-- RBAC Debug and Fix Script
-- Run this in your Supabase SQL editor to diagnose and fix RBAC issues

-- 1. Check if RBAC tables exist and have data
SELECT 'RBAC Tables Status:' as section;

SELECT 
    'roles' as table_name,
    COUNT(*) as record_count
FROM roles
UNION ALL
SELECT 
    'permissions' as table_name,
    COUNT(*) as record_count
FROM permissions
UNION ALL
SELECT 
    'role_permissions' as table_name,
    COUNT(*) as record_count
FROM role_permissions
UNION ALL
SELECT 
    'user_roles' as table_name,
    COUNT(*) as record_count
FROM user_roles;

-- 2. Check admin role permissions
SELECT 'Admin Role Permissions:' as section;
SELECT p.name, p.resource, p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
ORDER BY p.resource, p.name;

-- 3. Check test@example.com user assignments
SELECT 'Admin User Role Assignment:' as section;
SELECT 
    u.email,
    r.name as role_name,
    ur.is_active,
    ur.assigned_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'test@example.com';

-- 4. FORCE FIX: Ensure admin has all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. FORCE FIX: Ensure test@example.com has admin role
INSERT INTO user_roles (user_id, role_id, is_active, assigned_at)
SELECT 
    u.id as user_id,
    r.id as role_id,
    true as is_active,
    NOW() as assigned_at
FROM auth.users u
CROSS JOIN roles r
WHERE u.email = 'test@example.com' 
    AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO UPDATE SET 
    is_active = true,
    assigned_at = NOW();

-- 6. Verify the fix
SELECT 'Verification - Admin permissions after fix:' as section;
SELECT COUNT(*) as admin_permission_count
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name = 'admin';

SELECT 'Verification - User role assignment:' as section;
SELECT 
    u.email,
    r.name as role_name,
    ur.is_active,
    COUNT(p.id) as permission_count
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'test@example.com'
GROUP BY u.email, r.name, ur.is_active;

-- 7. Check specifically for view_reports permission
SELECT 'view_reports permission check:' as section;
SELECT 
    u.email,
    p.name as permission_name,
    p.resource,
    p.action
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'test@example.com' 
    AND p.name = 'view_reports'
    AND ur.is_active = true;
