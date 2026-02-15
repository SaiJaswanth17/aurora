-- Function to find or create a conversation between two users
CREATE OR REPLACE FUNCTION get_conversation_with_user(target_user_id UUID)
RETURNS TABLE (id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id
    FROM conversations c
    JOIN conversation_members cm1 ON c.id = cm1.conversation_id
    JOIN conversation_members cm2 ON c.id = cm2.conversation_id
    WHERE c.type = 'dm'
    AND cm1.user_id = auth.uid()
    AND cm2.user_id = target_user_id;
END;
$$;

-- Ensure RLS allows inserting into conversations and members during DM creation
CREATE POLICY "Users can create their own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can add themselves to conversations"
  ON conversation_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM conversation_members WHERE conversation_id = conversation_id AND user_id = auth.uid()
  ));
