-- Fix RLS recursion for conversations using SECURITY DEFINER functions

-- 1. Create a function to get user's conversation IDs without triggering RLS recursively
CREATE OR REPLACE FUNCTION get_user_conversation_ids(user_uuid UUID)
RETURNS TABLE (conversation_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT cm.conversation_id
  FROM conversation_members cm
  WHERE cm.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update conversation_members policy
DROP POLICY IF EXISTS "Users can view members of their conversations" ON conversation_members;

CREATE POLICY "Users can view members of their conversations"
  ON conversation_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR                                -- Own membership
    conversation_id IN (                                   -- Conversations I am a member of
      SELECT * FROM get_user_conversation_ids(auth.uid())
    )
  );

-- 3. Update conversations policy (optional, but good for consistency)
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT * FROM get_user_conversation_ids(auth.uid())
    )
  );

-- 4. Update DM messages policy to be safe
DROP POLICY IF EXISTS "Users can view DM messages in their conversations" ON dm_messages;

CREATE POLICY "Users can view DM messages in their conversations"
  ON dm_messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT * FROM get_user_conversation_ids(auth.uid())
    )
  );
