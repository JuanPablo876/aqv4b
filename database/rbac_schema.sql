-- ============================================================================
-- ROLES AND PERMISSIONS TABLE - For Role-Based Access Control (RBAC)
-- ============================================================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL CHECK (name IN ('admin', 'manager', 'staff', 'viewer')),
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- Permission definitions (for reference and dynamic permissions)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module VARCHAR(50) NOT NULL, -- clients, products, orders, etc.
  action VARCHAR(20) NOT NULL, -- read, create, update, delete
  resource VARCHAR(100), -- specific resource or '*' for all
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles
CREATE POLICY "Roles viewable by authenticated users" ON roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Roles manageable by admins" ON roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
      AND ur.is_active = true
    )
  );

-- RLS Policies for user_roles
CREATE POLICY "User roles viewable by authenticated users" ON user_roles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'manager')
      AND ur.is_active = true
    )
  );

CREATE POLICY "User roles manageable by admins" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
      AND ur.is_active = true
    )
  );

-- RLS Policies for permissions
CREATE POLICY "Permissions viewable by authenticated users" ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permissions manageable by admins" ON permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
      AND ur.is_active = true
    )
  );

-- Insert default roles
INSERT INTO roles (name, display_name, description, permissions) VALUES
('admin', 'Administrador', 'Acceso completo a todo el sistema', '{
  "clients": ["read", "create", "update", "delete"],
  "products": ["read", "create", "update", "delete"],
  "orders": ["read", "create", "update", "delete"],
  "quotes": ["read", "create", "update", "delete"],
  "inventory": ["read", "create", "update", "delete"],
  "employees": ["read", "create", "update", "delete"],
  "maintenances": ["read", "create", "update", "delete"],
  "finance": ["read", "create", "update", "delete"],
  "reviews": ["read", "create", "update", "delete"],
  "audit": ["read"],
  "settings": ["read", "update"],
  "users": ["read", "create", "update", "delete"]
}'),
('manager', 'Gerente', 'Acceso de gestión con algunas restricciones', '{
  "clients": ["read", "create", "update"],
  "products": ["read", "create", "update"],
  "orders": ["read", "create", "update"],
  "quotes": ["read", "create", "update"],
  "inventory": ["read", "create", "update"],
  "employees": ["read", "update"],
  "maintenances": ["read", "create", "update"],
  "finance": ["read", "create", "update"],
  "reviews": ["read", "create", "update"],
  "audit": ["read"],
  "settings": ["read"]
}'),
('staff', 'Personal', 'Acceso operacional básico', '{
  "clients": ["read", "create", "update"],
  "products": ["read"],
  "orders": ["read", "create", "update"],
  "quotes": ["read", "create", "update"],
  "inventory": ["read", "update"],
  "maintenances": ["read", "create", "update"],
  "reviews": ["read", "create"]
}'),
('viewer', 'Visualizador', 'Solo lectura en la mayoría de módulos', '{
  "clients": ["read"],
  "products": ["read"],
  "orders": ["read"],
  "quotes": ["read"],
  "inventory": ["read"],
  "maintenances": ["read"],
  "reviews": ["read"]
}')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- Insert default permissions
INSERT INTO permissions (module, action, resource, description) VALUES
-- Client permissions
('clients', 'read', '*', 'Ver todos los clientes'),
('clients', 'create', '*', 'Crear nuevos clientes'),
('clients', 'update', '*', 'Actualizar información de clientes'),
('clients', 'delete', '*', 'Eliminar clientes'),

-- Product permissions
('products', 'read', '*', 'Ver todos los productos'),
('products', 'create', '*', 'Crear nuevos productos'),
('products', 'update', '*', 'Actualizar información de productos'),
('products', 'delete', '*', 'Eliminar productos'),

-- Order permissions
('orders', 'read', '*', 'Ver todos los pedidos'),
('orders', 'create', '*', 'Crear nuevos pedidos'),
('orders', 'update', '*', 'Actualizar pedidos'),
('orders', 'delete', '*', 'Eliminar pedidos'),

-- Quote permissions
('quotes', 'read', '*', 'Ver todas las cotizaciones'),
('quotes', 'create', '*', 'Crear nuevas cotizaciones'),
('quotes', 'update', '*', 'Actualizar cotizaciones'),
('quotes', 'delete', '*', 'Eliminar cotizaciones'),

-- Inventory permissions
('inventory', 'read', '*', 'Ver inventario'),
('inventory', 'create', '*', 'Agregar productos al inventario'),
('inventory', 'update', '*', 'Actualizar cantidades e información'),
('inventory', 'delete', '*', 'Eliminar del inventario'),

-- Employee permissions
('employees', 'read', '*', 'Ver empleados'),
('employees', 'create', '*', 'Crear nuevos empleados'),
('employees', 'update', '*', 'Actualizar información de empleados'),
('employees', 'delete', '*', 'Eliminar empleados'),

-- Maintenance permissions
('maintenances', 'read', '*', 'Ver mantenimientos'),
('maintenances', 'create', '*', 'Crear mantenimientos'),
('maintenances', 'update', '*', 'Actualizar mantenimientos'),
('maintenances', 'delete', '*', 'Eliminar mantenimientos'),

-- Finance permissions
('finance', 'read', '*', 'Ver información financiera'),
('finance', 'create', '*', 'Crear registros financieros'),
('finance', 'update', '*', 'Actualizar registros financieros'),
('finance', 'delete', '*', 'Eliminar registros financieros'),

-- Review permissions
('reviews', 'read', '*', 'Ver reseñas'),
('reviews', 'create', '*', 'Crear reseñas'),
('reviews', 'update', '*', 'Actualizar reseñas'),
('reviews', 'delete', '*', 'Eliminar reseñas'),

-- Audit permissions
('audit', 'read', '*', 'Ver logs de auditoría'),

-- Settings permissions
('settings', 'read', '*', 'Ver configuraciones'),
('settings', 'update', '*', 'Actualizar configuraciones'),

-- User management permissions
('users', 'read', '*', 'Ver usuarios'),
('users', 'create', '*', 'Crear usuarios'),
('users', 'update', '*', 'Actualizar usuarios'),
('users', 'delete', '*', 'Eliminar usuarios')

ON CONFLICT DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_roles_updated_at();

COMMENT ON TABLE roles IS 'System roles for role-based access control';
COMMENT ON TABLE user_roles IS 'User-role assignments for RBAC';
COMMENT ON TABLE permissions IS 'Permission definitions for fine-grained access control';
