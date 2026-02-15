-- Remote Procedure Call (RPC) to create a DM securely
-- This bypasses RLS on the conversation_members table for the creation step
-- ensuring atomicity and correct permission handling.

CREATE OR REPLACE FUNCTION create_dm(target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (admin)
AS $$
DECLARE
    new_convo_id UUID;
    existing_convo_id UUID;
BEGIN
    -- 1. Check if a DM already exists between these two users
    SELECT c.id INTO existing_convo_id
    FROM conversations c
    JOIN conversation_members cm1 ON c.id = cm1.conversation_id
    JOIN conversation_members cm2 ON c.id = cm2.conversation_id
    WHERE c.type = 'dm'
    AND cm1.user_id = auth.uid()
    AND cm2.user_id = target_user_id;

    IF existing_convo_id IS NOT NULL THEN
        RETURN existing_convo_id;
    END IF;

    -- 2. Create new conversation
    INSERT INTO conversations (type)
    VALUES ('dm')
    RETURNING id INTO new_convo_id;

    -- 3. Add both members
    INSERT INTO conversation_members (conversation_id, user_id)
    VALUES 
        (new_convo_id, auth.uid()),
        (new_convo_id, target_user_id);

    RETURN new_convo_id;
END;
$$;
