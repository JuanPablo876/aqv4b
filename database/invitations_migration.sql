-- Create invitations table for invite-only registration
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
  token VARCHAR(128) NOT NULL UNIQUE,
  message TEXT,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);

-- Create RLS (Row Level Security) policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see invitations they created or are invited to
CREATE POLICY "Users can view their invitations" ON invitations
  FOR SELECT USING (
    auth.uid() = invited_by OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Only admins and managers can create invitations
CREATE POLICY "Admins and managers can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    (auth.jwt() ->> 'user_metadata' ->> 'role') IN ('admin', 'manager')
  );

-- Policy: Only the creator can update their invitations
CREATE POLICY "Users can update their invitations" ON invitations
  FOR UPDATE USING (auth.uid() = invited_by);

-- Policy: Only the creator can delete their invitations
CREATE POLICY "Users can delete their invitations" ON invitations
  FOR DELETE USING (auth.uid() = invited_by);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_invitations_updated_at();

-- Function to clean up expired invitations (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations 
  SET status = 'expired' 
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT ALL ON invitations TO authenticated;
GRANT ALL ON invitations TO service_role;
