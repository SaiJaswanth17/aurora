-- Migration: Create default public server with dynamic owner assignment
-- This makes the database fully automatic - no manual UUID copying needed!

-- Step 1: First, we need to handle the foreign key constraint
-- We'll allow NULL owner_id for system-owned servers temporarily

-- Drop existing constraint if exists
ALTER TABLE servers DROP CONSTRAINT IF EXISTS servers_owner_id_fkey;

-- Add a new constraint that allows NULL (for system-owned servers)
ALTER TABLE servers ADD CONSTRAINT servers_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Also make owner_id nullable if it's not already
ALTER TABLE servers ALTER COLUMN owner_id DROP NOT NULL;

-- Step 2: Insert the public server with NO owner initially (system-owned)
-- This will work even though no users exist yet
INSERT INTO servers (id, name, icon_url, owner_id, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Aurora Public',
  NULL,
  NULL,  -- No owner yet - will be assigned automatically
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Insert default "general" channel for the public server
INSERT INTO channels (id, server_id, name, type, position, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'general',
  'text',
  0,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create function to auto-join new users to the public server
CREATE OR REPLACE FUNCTION auto_join_public_server()
RETURNS TRIGGER AS $$
BEGIN
  -- Add user to the public server as a member
  INSERT INTO server_members (server_id, user_id, role, joined_at)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    NEW.id,
    'member',
    NOW()
  )
  ON CONFLICT (server_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger to auto-join users to public server on profile creation
DROP TRIGGER IF EXISTS auto_join_public_server_trigger ON profiles;
CREATE TRIGGER auto_join_public_server_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_join_public_server();

-- Step 6: Create function to auto-assign first user as owner of public server
CREATE OR REPLACE FUNCTION assign_public_server_owner()
RETURNS TRIGGER AS $$
DECLARE
  public_server_id UUID := '00000000-0000-0000-0000-000000000001';
  current_owner_id UUID;
BEGIN
  -- Check if public server exists and has no owner
  SELECT owner_id INTO current_owner_id
  FROM servers
  WHERE id = public_server_id;
  
  -- If no owner assigned yet, make this first user the owner
  IF current_owner_id IS NULL THEN
    UPDATE servers
    SET owner_id = NEW.id
    WHERE id = public_server_id;
    
    -- Also update their role to 'owner' in server_members
    UPDATE server_members
    SET role = 'owner'
    WHERE server_id = public_server_id AND user_id = NEW.id;
    
    RAISE NOTICE 'User % has been assigned as owner of the public server', NEW.username;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger to assign first user as owner
DROP TRIGGER IF EXISTS assign_public_server_owner_trigger ON profiles;
CREATE TRIGGER assign_public_server_owner_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_public_server_owner();

-- Step 8: Update Row Level Security policies for public server

-- Servers RLS - allow viewing public server
DROP POLICY IF EXISTS "Users can view servers" ON servers;
CREATE POLICY "Users can view servers"
  ON servers FOR SELECT
  TO authenticated
  USING (
    id = '00000000-0000-0000-0000-000000000001' OR  -- Public server (always visible)
    id IN (
      SELECT server_id FROM server_members WHERE user_id = auth.uid()
    ) OR 
    owner_id = auth.uid()
  );

-- Server Members RLS
DROP POLICY IF EXISTS "Users can view server members" ON server_members;
CREATE POLICY "Users can view server members"
  ON server_members FOR SELECT
  TO authenticated
  USING (
    server_id = '00000000-0000-0000-0000-000000000001' OR  -- Public server
    server_id IN (
      SELECT server_id FROM server_members WHERE user_id = auth.uid()
    )
  );

-- Channels RLS
DROP POLICY IF EXISTS "Users can view channels" ON channels;
CREATE POLICY "Users can view channels"
  ON channels FOR SELECT
  TO authenticated
  USING (
    server_id = '00000000-0000-0000-0000-000000000001' OR  -- Public server
    server_id IN (
      SELECT server_id FROM server_members WHERE user_id = auth.uid()
    )
  );

-- Messages RLS - allow sending in public channels
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    (
      channel_id IN (
        SELECT id FROM channels WHERE server_id = '00000000-0000-0000-0000-000000000001'
      ) OR  -- Public server channels
      channel_id IN (
        SELECT c.id FROM channels c
        JOIN server_members sm ON c.server_id = sm.server_id
        WHERE sm.user_id = auth.uid()
      )
    )
  );

-- Messages RLS - allow viewing in public channels
DROP POLICY IF EXISTS "Users can view messages" ON messages;
CREATE POLICY "Users can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    channel_id IN (
      SELECT id FROM channels WHERE server_id = '00000000-0000-0000-0000-000000000001'
    ) OR  -- Public server channels
    channel_id IN (
      SELECT c.id FROM channels c
      JOIN server_members sm ON c.server_id = sm.server_id
      WHERE sm.user_id = auth.uid()
    )
  );

-- Step 9: Create index for better performance on channel messages (if not exists)
-- Note: Partial indexes with subqueries are not supported in PostgreSQL
-- The regular index on messages(channel_id, created_at) from initial schema is sufficient
