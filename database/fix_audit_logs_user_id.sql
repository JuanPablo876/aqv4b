-- ============================================================================
-- FIX AUDIT LOGS USER_ID CONSTRAINT
-- Make user_id nullable and update constraint to handle cases where
-- auth users don't have corresponding employee records
-- ============================================================================

-- Drop the existing foreign key constraint
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Make user_id nullable (it may already be nullable, but this ensures it)
ALTER TABLE audit_logs ALTER COLUMN user_id DROP NOT NULL;

-- Add the foreign key constraint back with ON DELETE SET NULL
-- This allows user_id to be null if no corresponding employee exists
ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Update RLS policies to handle null user_id
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;

-- New RLS Policy: Users can see their own audit logs by email or user_id
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (
    user_id = (
      SELECT id FROM employees WHERE email = auth.email()
    ) OR 
    user_email = auth.email() OR
    EXISTS (
      SELECT 1 FROM employees 
      WHERE email = auth.email()
      AND role IN ('admin', 'manager')
    )
  );

-- Ensure audit logs can be inserted even with null user_id
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Fix employees table RLS policies for audit service queries
-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Allow employee lookup by email for audit" ON employees;

-- More permissive policy for audit service - allow authenticated users to query employees
-- This is needed for the audit service to look up employee IDs by email
CREATE POLICY "Allow employee lookup by email for audit" ON employees
  FOR SELECT USING (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role'
  );

-- Alternative: If you want to be more restrictive, only allow reading specific fields
-- DROP POLICY IF EXISTS "Allow employee lookup by email for audit" ON employees;
-- CREATE POLICY "Allow employee lookup by email for audit" ON employees
--   FOR SELECT USING (true);  -- This allows all authenticated reads

-- Ensure audit logs table has proper access
-- Update the audit logs SELECT policy to be more permissive
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (
    -- Allow if user_id matches an employee record for this user's email
    user_id IN (
      SELECT id FROM employees WHERE email = auth.email()
    ) OR 
    -- Allow if user_email matches current user's email
    user_email = auth.email() OR
    -- Allow if user is admin/manager
    EXISTS (
      SELECT 1 FROM employees 
      WHERE email = auth.email()
      AND role IN ('admin', 'manager')
    ) OR
    -- Allow service role (for system operations)
    auth.role() = 'service_role'
  );
