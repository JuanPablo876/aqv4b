-- Verify and fix admin permissions for test@example.com
-- This ensures all necessary permissions are assigned to admin role

-- Check current admin permissions
SELECT 'Current admin permissions:' as info;
SELECT p.name, p.resource, p.action, p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
ORDER BY p.resource, p.action;

-- Ensure admin role has ALL permissions (force assignment)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Verify admin user assignment
SELECT 'Admin user verification:' as info;
SELECT 
    u.email,
    u.id as user_id,
    r.name as role_name,
    ur.is_active,
    ur.assigned_at,
    COUNT(p.id) as permission_count
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'test@example.com'
GROUP BY u.email, u.id, r.name, ur.is_active, ur.assigned_at;

-- List all permissions the admin should have
SELECT 'All admin permissions after fix:' as info;
SELECT p.name, p.resource, p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
ORDER BY p.resource, p.name;

-- Test the permission checking function
SELECT 'Testing permission function:' as info;
SELECT get_user_permissions((SELECT id FROM auth.users WHERE email = 'test@example.com'));

-- Update roles to make sure they are active
UPDATE roles SET is_active = true WHERE name IN ('admin', 'manager', 'staff', 'viewer');

-- Verify the user can access reports
SELECT 'Reports permission check:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM get_user_permissions((SELECT id FROM auth.users WHERE email = 'test@example.com'))
            WHERE permission_name = 'view_reports'
        ) THEN 'GRANTED'
        ELSE 'DENIED'
    END as reports_access;
