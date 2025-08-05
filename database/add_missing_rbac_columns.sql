-- Migration to add missing columns for RBAC functionality
-- This fixes the errors: column roles.is_active does not exist, column user_roles.is_active does not exist

-- Add is_active column to roles table
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active and assigned_at columns to user_roles table
ALTER TABLE user_roles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE user_roles 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have is_active = true
UPDATE roles SET is_active = true WHERE is_active IS NULL;
UPDATE user_roles SET is_active = true WHERE is_active IS NULL;
UPDATE user_roles SET assigned_at = created_at WHERE assigned_at IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_at ON user_roles(assigned_at);

-- Update the trigger to handle the new columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure trigger exists for roles table
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN roles.is_active IS 'Whether the role is active and can be assigned to users';
COMMENT ON COLUMN user_roles.is_active IS 'Whether the role assignment is active';
COMMENT ON COLUMN user_roles.assigned_at IS 'When the role was assigned to the user';
