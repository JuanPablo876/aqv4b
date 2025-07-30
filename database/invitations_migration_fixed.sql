-- ============================================
-- INVITATION SYSTEM DATABASE SETUP (FIXED)
-- Run this in Supabase SQL Editor
-- ============================================

-- Create invitations table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (FIXED VERSION)

-- Policy: Users can view invitations they created or are invited to
CREATE POLICY "Users can view their invitations" ON invitations
  FOR SELECT USING (
    auth.uid() = invited_by OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Only authenticated users can create invitations (we'll handle role check in app)
CREATE POLICY "Authenticated users can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Policy: Only the creator can update their invitations
CREATE POLICY "Users can update their invitations" ON invitations
  FOR UPDATE USING (auth.uid() = invited_by);

-- Policy: Only the creator can delete their invitations
CREATE POLICY "Users can delete their invitations" ON invitations
  FOR DELETE USING (auth.uid() = invited_by);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-update
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_invitations_updated_at();

-- Cleanup expired invitations function
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations 
  SET status = 'expired' 
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Grant permissions
GRANT ALL ON invitations TO authenticated;
GRANT ALL ON invitations TO service_role;

-- ============================================
-- Helper function to check user roles
-- ============================================
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT COALESCE(raw_user_meta_data ->> 'role', 'user') 
  INTO user_role
  FROM auth.users 
  WHERE id = user_id;
  
  RETURN user_role;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
