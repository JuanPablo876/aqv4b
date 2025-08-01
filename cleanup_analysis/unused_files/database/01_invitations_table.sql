-- Invitations Table for AQV4 Application
-- This table manages user invitations sent by admins/managers

CREATE TABLE invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate invitations for same email
  UNIQUE(email, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for better query performance
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_invited_by ON invitations(invited_by);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Admins and managers can view all invitations
CREATE POLICY "Admins and managers can view invitations" ON invitations
  FOR SELECT USING (
    (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' 
     OR auth.jwt() ->> 'user_metadata' ->> 'role' = 'manager')
  );

-- 2. Admins and managers can create invitations
CREATE POLICY "Admins and managers can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' 
     OR auth.jwt() ->> 'user_metadata' ->> 'role' = 'manager')
  );

-- 3. Only admins can delete invitations
CREATE POLICY "Only admins can delete invitations" ON invitations
  FOR DELETE USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
  );

-- 4. Admins and managers can update invitations they created
CREATE POLICY "Users can update their own invitations" ON invitations
  FOR UPDATE USING (
    invited_by = auth.uid() 
    AND (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' 
         OR auth.jwt() ->> 'user_metadata' ->> 'role' = 'manager')
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_invitations_updated_at 
  BEFORE UPDATE ON invitations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' 
  AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Optional: Create a scheduled job to run expiration (if using pg_cron extension)
-- SELECT cron.schedule('expire-invitations', '0 */6 * * *', 'SELECT expire_old_invitations();');
