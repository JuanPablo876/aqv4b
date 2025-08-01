-- Migration: Add email_sent_at column to invitations table
-- This column tracks when invitation emails were successfully sent

-- Add the email_sent_at column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitations' 
        AND column_name = 'email_sent_at'
    ) THEN
        ALTER TABLE invitations 
        ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE;
        
        -- Add index for better performance
        CREATE INDEX idx_invitations_email_sent_at ON invitations(email_sent_at);
        
        RAISE NOTICE 'Added email_sent_at column to invitations table';
    ELSE
        RAISE NOTICE 'email_sent_at column already exists';
    END IF;
END $$;

-- Update RLS policy to allow updating email_sent_at
-- This ensures the service can mark emails as sent
CREATE POLICY "Service can update email_sent_at" ON invitations
  FOR UPDATE USING (true)
  WITH CHECK (true);
