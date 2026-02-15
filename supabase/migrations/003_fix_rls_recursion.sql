-- Fix for infinite recursion in RLS policies

-- 1. Fix server_members policy
DROP POLICY IF EXISTS "Users can view members of their servers" ON server_members;
DROP POLICY IF EXISTS "Users can view server members" ON server_members;

CREATE POLICY "Users can view server members"
  ON server_members FOR SELECT
  TO authenticated
  USING (
    server_id = '00000000-0000-0000-0000-000000000001' OR  -- Public server
    user_id = auth.uid() OR                                -- Own membership
    server_id IN (
      SELECT s.id FROM servers s
      WHERE s.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM server_members sm_check
      WHERE sm_check.server_id = server_members.server_id
      AND sm_check.user_id = auth.uid()
    )
  );

-- 2. Fix servers policy
DROP POLICY IF EXISTS "Users can view servers they are members of" ON servers;
DROP POLICY IF EXISTS "Users can view servers" ON servers;

CREATE POLICY "Users can view servers"
  ON servers FOR SELECT
  TO authenticated
  USING (
    id = '00000000-0000-0000-0000-000000000001' OR  -- Public server
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = servers.id
      AND sm.user_id = auth.uid()
    )
  );
