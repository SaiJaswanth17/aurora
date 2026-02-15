-- Final fix for RLS recursion using SECURITY DEFINER functions

-- 1. Create a function to check membership without triggering RLS recursively
CREATE OR REPLACE FUNCTION is_server_member(server_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM server_members 
    WHERE server_id = server_uuid 
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update server_members policy
DROP POLICY IF EXISTS "Users can view server members" ON server_members;

CREATE POLICY "Users can view server members"
  ON server_members FOR SELECT
  TO authenticated
  USING (
    server_id = '00000000-0000-0000-0000-000000000001' OR  -- Public server
    user_id = auth.uid() OR                                -- Own membership
    is_server_member(server_id, auth.uid())               -- Member of that server
  );

-- 3. Update servers policy
DROP POLICY IF EXISTS "Users can view servers" ON servers;

CREATE POLICY "Users can view servers"
  ON servers FOR SELECT
  TO authenticated
  USING (
    id = '00000000-0000-0000-0000-000000000001' OR  -- Public server
    owner_id = auth.uid() OR                        -- Owner
    is_server_member(id, auth.uid())                -- Member
  );
