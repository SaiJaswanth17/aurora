-- Allow users to delete their own DM messages or messages in conversations they are part of
-- Actually, the requirement is "Clear Chat" which deletes ALL messages in the conversation.
-- So we need a policy that allows a member of the conversation to delete messages in it.

-- Policy for dm_messages
CREATE POLICY "Users can delete messages in conversations they are a member of"
ON public.dm_messages
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM public.conversation_members 
    WHERE conversation_id = dm_messages.conversation_id
  )
);

-- Policy for channel messages (restricted to admins/mods usually, but for now let's allow if they have permission)
-- checking server_members role is complex in RLS for every row, but let's try.
-- For now, let's just focus on DMs as that was the user's screenshot context.
-- But the code I wrote for channels checks for admin/mod role in the API handler.
-- So we just need the RLS to allow it.
-- Or, since I'm using `supabase-auth-helpers`, does it bypass RLS? NO. Service role does, but `createRouteHandlerClient` uses the user's session.

-- So we MUST have an RLS policy.

CREATE POLICY "Server admins and mods can delete channel messages"
ON public.messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.channels c
    JOIN public.server_members sm ON sm.server_id = c.server_id
    WHERE c.id = messages.channel_id
    AND sm.user_id = auth.uid()
    AND (sm.role = 'admin' OR sm.role = 'moderator')
  )
);
