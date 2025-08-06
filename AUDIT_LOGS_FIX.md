# Audit Logs User ID Constraint Fix

## Problem
The application was encountering a database constraint violation error when trying to create audit logs:

```
Error creating audit log: 
{code: '23503', details: 'Key is not present in table "employees".', hint: null, message: 'insert or update on table "audit_logs" violates foreign key constraint "audit_logs_user_id_fkey"'}
```

## Root Cause
The `audit_logs` table had a foreign key constraint that required `user_id` to reference an existing record in the `employees` table:

```sql
user_id UUID REFERENCES employees(id)
```

However, the audit service was using the Supabase Auth user ID (`auth.uid()`) which doesn't necessarily correspond to an employee record. Users can authenticate via Supabase Auth but may not have a corresponding employee record in the database.

## Solution

### 1. Database Schema Changes
- Made `user_id` field nullable in the `audit_logs` table
- Updated the foreign key constraint to use `ON DELETE SET NULL`
- Updated RLS policies to handle null `user_id` values

### 2. Audit Service Updates
- Modified `initializeUser()` method to:
  - Try to find a corresponding employee record by email
  - Use the employee ID if found, otherwise set `user_id` to null
  - Keep both the employee ID and auth ID for reference
- Enhanced error handling and logging
- Added fallback mechanisms for when no employee record exists

### 3. Migration Applied
- Created `fix_audit_logs_user_id.sql` migration
- Added it to the master migration script
- Updated audit log creation to handle null user IDs gracefully

## Benefits
1. **Resilient Audit Logging**: Audit logs can now be created even for users without employee records
2. **Backwards Compatible**: Existing audit logs with valid employee IDs continue to work
3. **Better Error Handling**: No more constraint violations that break the main application flow
4. **Flexible User Management**: Supports both employee users and non-employee authenticated users

## Files Modified
- `src/services/auditService.js` - Enhanced user initialization and error handling
- `database/audit_logs_schema.sql` - Updated constraint definition
- `database/fix_audit_logs_user_id.sql` - Migration script (new)
- `database/99_master_migration.sql` - Added migration to master script

## Testing
The application now compiles successfully and audit logging should work without throwing constraint violations. The audit service will:
- Use employee ID when a matching employee record is found
- Use null user_id when no employee record exists
- Continue logging user_email and auth_user_id in metadata for tracking
