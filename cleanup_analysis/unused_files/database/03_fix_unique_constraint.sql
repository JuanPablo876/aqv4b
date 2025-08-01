-- Migration: Fix unique constraint for invitations
-- This fixes the issue where cancelling invitations causes constraint violations

-- First, drop the existing constraint
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_email_status_key;

-- Add a new constraint that only prevents duplicate pending invitations
-- This allows the same email to have multiple invitations with different statuses
-- but prevents duplicate pending invitations
CREATE UNIQUE INDEX invitations_email_pending_unique 
ON invitations (email) 
WHERE status = 'pending';

-- Add a comment to explain the constraint
COMMENT ON INDEX invitations_email_pending_unique IS 
'Prevents duplicate pending invitations for the same email address';
