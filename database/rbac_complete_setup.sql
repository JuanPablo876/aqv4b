-- RBAC Complete Setup Script
-- This script creates the complete Role-Based Access Control system for Aqualiquim

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Create roles table
CREATE TABLE roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50),
    action VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'Full system administrator with all permissions'),
('manager', 'Business manager with operational permissions'),
('staff', 'Staff member with limited operational permissions'),
('viewer', 'Read-only access to most system data');

-- Insert permissions
INSERT INTO permissions (name, description, resource, action) VALUES
-- Employee management
('manage_employees', 'Create, edit, and delete employees', 'employees', 'manage'),
('view_employees', 'View employee information', 'employees', 'view'),

-- Financial management
('manage_finance', 'Access financial data and transactions', 'finance', 'manage'),
('view_finance', 'View financial reports and data', 'finance', 'view'),

-- Reports and analytics
('view_reports', 'Access analytics and reports', 'reports', 'view'),
('export_reports', 'Export reports and data', 'reports', 'export'),

-- Orders management
('manage_orders', 'Create, edit, and process orders', 'orders', 'manage'),
('view_orders', 'View order information', 'orders', 'view'),

-- Inventory management
('manage_inventory', 'Manage stock and inventory', 'inventory', 'manage'),
('view_inventory', 'View inventory levels', 'inventory', 'view'),

-- Products management
('manage_products', 'Create, edit, and delete products', 'products', 'manage'),
('view_products', 'View product information', 'products', 'view'),

-- Clients management
('manage_clients', 'Create, edit, and delete clients', 'clients', 'manage'),
('view_clients', 'View client information', 'clients', 'view'),

-- Maintenance management
('manage_maintenance', 'Schedule and manage maintenance tasks', 'maintenance', 'manage'),
('view_maintenance', 'View maintenance schedules', 'maintenance', 'view'),

-- Quotes management
('manage_quotes', 'Create and manage quotes', 'quotes', 'manage'),
('view_quotes', 'View quotes', 'quotes', 'view'),

-- System administration
('manage_roles', 'Assign and manage user roles', 'system', 'manage_roles'),
('view_audit_logs', 'View system audit logs', 'system', 'view_audit'),
('manage_system_settings', 'Configure system settings', 'system', 'manage_settings'),

-- Notifications
('manage_notifications', 'Send and manage notifications', 'notifications', 'manage'),
('view_notifications', 'View notifications', 'notifications', 'view');

-- Assign permissions to roles
-- Admin role gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin';

-- Manager role gets business operation permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager' AND p.name IN (
    'manage_employees', 'view_employees',
    'manage_finance', 'view_finance',
    'view_reports', 'export_reports',
    'manage_orders', 'view_orders',
    'manage_inventory', 'view_inventory',
    'manage_products', 'view_products',
    'manage_clients', 'view_clients',
    'manage_maintenance', 'view_maintenance',
    'manage_quotes', 'view_quotes',
    'view_notifications'
);

-- Staff role gets operational permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'staff' AND p.name IN (
    'view_employees',
    'view_orders', 'manage_orders',
    'view_inventory', 'manage_inventory',
    'view_products',
    'view_clients', 'manage_clients',
    'view_maintenance', 'manage_maintenance',
    'view_quotes', 'manage_quotes',
    'view_notifications'
);

-- Viewer role gets read-only permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer' AND p.name IN (
    'view_employees',
    'view_finance',
    'view_reports',
    'view_orders',
    'view_inventory',
    'view_products',
    'view_clients',
    'view_maintenance',
    'view_quotes',
    'view_notifications'
);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for roles table
CREATE POLICY "Users can view all roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage roles" ON roles FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
);

-- Policies for permissions table
CREATE POLICY "Users can view all permissions" ON permissions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage permissions" ON permissions FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
);

-- Policies for role_permissions table
CREATE POLICY "Users can view role permissions" ON role_permissions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage role permissions" ON role_permissions FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
);

-- Policies for user_roles table
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user roles" ON user_roles FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
);

CREATE POLICY "Only admins can manage user roles" ON user_roles FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
);

CREATE POLICY "Only admins can update user roles" ON user_roles FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
);

CREATE POLICY "Only admins can delete user roles" ON user_roles FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
);

-- Create helpful views for easier querying
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
    ur.user_id,
    u.email,
    r.name as role_name,
    p.name as permission_name,
    p.description as permission_description,
    p.resource,
    p.action
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
JOIN auth.users u ON ur.user_id = u.id;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_permissions up 
        WHERE up.user_id = $1 AND up.permission_name = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user roles
CREATE OR REPLACE FUNCTION has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = $1 AND r.name = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign admin role to first user (for initial setup)
CREATE OR REPLACE FUNCTION assign_admin_to_first_user()
RETURNS VOID AS $$
DECLARE
    first_user_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get the first user (assuming they should be admin)
    SELECT id INTO first_user_id 
    FROM auth.users 
    ORDER BY created_at 
    LIMIT 1;
    
    -- Get admin role id
    SELECT id INTO admin_role_id 
    FROM roles 
    WHERE name = 'admin';
    
    -- Assign admin role if user and role exist
    IF first_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES (first_user_id, admin_role_id, first_user_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to assign admin role to first user
SELECT assign_admin_to_first_user();

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Add update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE roles IS 'System roles for RBAC';
COMMENT ON TABLE permissions IS 'System permissions for RBAC';
COMMENT ON TABLE role_permissions IS 'Mapping of roles to permissions';
COMMENT ON TABLE user_roles IS 'Assignment of roles to users';

-- Grant necessary permissions to authenticated users
GRANT SELECT ON roles TO authenticated;
GRANT SELECT ON permissions TO authenticated;
GRANT SELECT ON role_permissions TO authenticated;
GRANT SELECT ON user_roles TO authenticated;
GRANT SELECT ON user_permissions TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION has_permission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(UUID, TEXT) TO authenticated;
