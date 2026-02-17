-- Migration: Prevent Duplicate DM Conversations
-- This migration adds a function to ensure only one DM conversation exists between any two users

-- 1. Create a function to get or create a DM conversation (atomic operation)
CREATE OR REPLACE FUNCTION get_or_create_dm_conversation(
  participant_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  existing_conversation_id UUID;
  new_conversation_id UUID;
  user_ids UUID[];
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF current_user_id = participant_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  -- Create sorted array of user IDs for consistent lookup
  user_ids := ARRAY[LEAST(current_user_id, participant_id), GREATEST(current_user_id, participant_id)];

  -- Try to find existing DM conversation between these two users
  SELECT c.id INTO existing_conversation_id
  FROM conversations c
  WHERE c.type = 'dm'
    AND c.id IN (
      SELECT cm1.conversation_id
      FROM conversation_members cm1
      WHERE cm1.user_id = current_user_id
      INTERSECT
      SELECT cm2.conversation_id
      FROM conversation_members cm2
      WHERE cm2.user_id = participant_id
    )
    -- Ensure it's exactly a 2-person conversation
    AND (
      SELECT COUNT(*)
      FROM conversation_members cm
      WHERE cm.conversation_id = c.id
    ) = 2
  LIMIT 1;

  -- If conversation exists, return it
  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (type)
  VALUES ('dm')
  RETURNING id INTO new_conversation_id;

  -- Add both members
  INSERT INTO conversation_members (conversation_id, user_id)
  VALUES 
    (new_conversation_id, current_user_id),
    (new_conversation_id, participant_id);

  RETURN new_conversation_id;
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_dm_conversation(UUID) TO authenticated;

-- 3. Add comment
COMMENT ON FUNCTION get_or_create_dm_conversation IS 
  'Atomically gets an existing DM conversation or creates a new one between the current user and the specified participant. Prevents duplicate conversations.';
